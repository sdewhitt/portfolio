#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { ExtractedContent, ContentChunk } from "./content-types";
import { generateEnrichedEmbedding } from "../lib/embeddings";
import { batchUpsertContentEmbeddings, ContentEmbedding } from "../lib/supabase";

// Load environment variables following Next.js conventions
import { config } from "dotenv";

// Load environment variables from appropriate .env file
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
config({ path: envFile });

/**
 * Convert ContentChunk to ContentEmbedding with generated embeddings
 */
async function processContentChunk(chunk: ContentChunk): Promise<ContentEmbedding> {
  // Generate embedding from content and enrichment
  const enrichment = chunk.metadata?.enrichment || [];
  const embedding = await generateEnrichedEmbedding(chunk.content, enrichment);

  return {
    slug: chunk.slug,
    title: chunk.title,
    content: chunk.content,
    embedding,
    metadata: chunk.metadata,
  };
}

/**
 * Push extracted content to Supabase vector database
 */
async function pushToSupabase(): Promise<void> {
  try {
    // Read the extracted content
    const contentPath = path.join(
      process.cwd(),
      "output/extracted-content.json",
    );
    if (!fs.existsSync(contentPath)) {
      console.error(
        "Error: extracted-content.json not found. Run extract-content.ts first.",
      );
      process.exit(1);
    }

    const extractedContent: ExtractedContent = JSON.parse(
      fs.readFileSync(contentPath, "utf-8"),
    );

    console.log(
      `Processing ${extractedContent.content.length} content chunks...`,
    );

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Error: Supabase credentials not set");
      console.error("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
      process.exit(1);
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Error: OPENAI_API_KEY environment variable not set");
      process.exit(1);
    }

    // Process content chunks with embeddings
    console.log("Generating embeddings...");
    const contentEmbeddings: ContentEmbedding[] = [];

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < extractedContent.content.length; i += batchSize) {
      const batch = extractedContent.content.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(extractedContent.content.length / batchSize)}`);

      const batchPromises = batch.map((chunk) => processContentChunk(chunk));
      const batchResults = await Promise.all(batchPromises);
      contentEmbeddings.push(...batchResults);

      // Small delay to avoid rate limiting
      if (i + batchSize < extractedContent.content.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Generated ${contentEmbeddings.length} embeddings`);

    // Push to Supabase
    console.log("Pushing content to Supabase...");
    const result = await batchUpsertContentEmbeddings(contentEmbeddings);

    console.log("Content successfully pushed to Supabase");
    console.log(`Success: ${result.success} chunks`);
    if (result.failed > 0) {
      console.log(`Failed: ${result.failed} chunks`);
    }
  } catch (error) {
    console.error("Failed to push content to Supabase:", error);
    process.exit(1);
  }
}

/**
 * Push extracted content to TACOS backend API
 */
async function pushToTACOS(): Promise<void> {
  try {
    // Read the extracted content
    const contentPath = path.join(
      process.cwd(),
      "output/extracted-content.json",
    );
    if (!fs.existsSync(contentPath)) {
      console.error(
        "Error: extracted-content.json not found. Run extract-content.ts first.",
      );
      process.exit(1);
    }

    const extractedContent: ExtractedContent = JSON.parse(
      fs.readFileSync(contentPath, "utf-8"),
    );

    // Get API key from environment
    const apiKey = process.env.TACOS_API_KEY;
    if (!apiKey) {
      console.error("Error: TACOS_API_KEY environment variable not set");
      process.exit(1);
    }

    // Get backend URL from environment or use default
    const backendUrl = process.env.TACOS_API_URL || "http://localhost:8000";

    console.log(
      `Pushing ${extractedContent.content.length} content chunks to TACOS backend...`,
    );

    // Push content to backend
    const response = await fetch(`${backendUrl}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TACOS-Key": apiKey,
      },
      body: JSON.stringify(extractedContent),
    });

    if (!response.ok) {
      throw new Error(
        `TACOS responded with ${response.status}: ${response.statusText}`,
      );
    }

    const result = await response.json();
    console.log("Content successfully pushed to TACOS backend");
    console.log(
      `TACOS processed: ${result.processed || extractedContent.content.length} chunks`,
    );

    if (result.updated) {
      console.log(`Updated embeddings: ${result.updated} chunks`);
    }
    if (result.skipped) {
      console.log(`Skipped unchanged: ${result.skipped} chunks`);
    }
  } catch (error) {
    console.error("Failed to push content to TACOS backend:", error);
    process.exit(1);
  }
}

/**
 * Check if we should run content push
 */
function shouldRunPush(): boolean {
  // Only run in production environment or if explicitly enabled
  const isProduction = process.env.VERCEL_ENV === "production";
  const forceRun = process.env.FORCE_CONTENT_PUSH === "true";

  if (!isProduction && !forceRun) {
    console.log("Development/Preview build detected, skipping content push");
    console.log("Set VERCEL_ENV=production or FORCE_CONTENT_PUSH=true to enable");
    return false;
  }

  return true;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check if we should run push
    if (!shouldRunPush()) {
      process.exit(0);
    }

    // Determine which backend to use
    const useSupabase = process.env.USE_SUPABASE === "true";
    const useTACOS = process.env.USE_TACOS === "true";

    if (!useSupabase && !useTACOS) {
      console.log("No backend specified. Set USE_SUPABASE=true or USE_TACOS=true");
      console.log("Defaulting to Supabase...");
      await pushToSupabase();
    } else {
      if (useSupabase) {
        await pushToSupabase();
      }
      if (useTACOS) {
        await pushToTACOS();
      }
    }
  } catch (error) {
    console.error("Error during content push:", error);
    process.exit(1);
  }
}

// Run the script if called directly
main();
