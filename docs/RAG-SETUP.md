# Portfolio RAG System - Setup Guide

This guide explains how to set up and use the enhanced RAG (Retrieval-Augmented Generation) system for your portfolio website.

## Overview

The system consists of three main components:

1. **Content Extraction** (`extract-content.ts`) - Extracts and enhances content from your portfolio data
2. **Content Enhancement** (`content-enhancer.ts`) - Uses AI to create verbose, varied descriptions of experiences
3. **Content Pushing** (`push-content.ts`) - Stores content with embeddings in Supabase or TACOS backend

## Features

- **AI-Enhanced Experiences**: Uses GPT-4 to create detailed, varied descriptions of work experiences
- **Vector Search**: Stores content embeddings in Supabase for semantic search
- **Multiple Content Types**: Handles experiences, projects, education, skills, and more
- **Flexible Backend**: Supports both Supabase (vector DB) and TACOS backend
- **RAG-Optimized**: Creates multiple content chunks per experience for better retrieval coverage

## Prerequisites

1. **Node.js** and **npm** installed
2. **Supabase Account** (if using Supabase)
3. **OpenAI API Key** (for embeddings and content enhancement)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js dotenv
```

### 2. Set Up Supabase

#### A. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

#### B. Enable pgvector Extension
1. In your Supabase dashboard, go to the SQL Editor
2. Run the SQL script from `supabase-setup.sql`
3. This will:
   - Enable the pgvector extension
   - Create the `content_embeddings` table
   - Set up vector similarity search function
   - Configure Row Level Security (RLS) policies

#### C. Get Your Credentials
1. Go to Project Settings > API
2. Copy:
   - **Project URL** (your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (your `SUPABASE_SERVICE_ROLE_KEY`)

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration (for embeddings and content enhancement)
OPENAI_API_KEY=your_openai_api_key

# Backend Selection
USE_SUPABASE=true
# USE_TACOS=false

# Optional: TACOS Backend Configuration
# TACOS_API_URL=http://localhost:8000
# TACOS_API_KEY=your_tacos_api_key

# Optional: Force content push in development
# FORCE_CONTENT_PUSH=true
```

### 4. Update package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "extract": "tsx app/scripts/extract-content.ts",
    "push": "tsx app/scripts/push-content.ts",
    "rag:update": "npm run extract && npm run push"
  }
}
```

You'll need to install `tsx` for running TypeScript files:

```bash
npm install -D tsx
```

## Usage

### Extract Content

Extract content from your portfolio data files:

```bash
npm run extract
```

This will:
- Read data from `app/data/career.json`, `app/data/education.json`, `app/data/RAG/resume.json`
- Enhance experiences with AI (if `OPENAI_API_KEY` is set)
- Create multiple content chunks per experience for better RAG coverage
- Save results to `output/extracted-content.json`

### Push to Vector Database

Push the extracted content with embeddings to Supabase:

```bash
npm run push
```

This will:
- Generate embeddings for each content chunk using OpenAI
- Store content and embeddings in Supabase
- Enable semantic search across your portfolio content

### Update Everything

Run both extract and push in sequence:

```bash
npm run rag:update
```

## Content Enhancement

The system uses AI to enhance your resume experiences in several ways:

### Enhanced Content Types

For each experience, the system generates:

1. **Summary** - Comprehensive 2-3 sentence overview
2. **Detailed Description** - 4-5 sentences expanding on role and responsibilities
3. **Key Contributions** - 3-5 specific achievements with details
4. **Impact Statement** - Description of outcomes and results
5. **Technical Context** - Explanation of technologies and methodologies
6. **Variations** - 5-7 different phrasings for better retrieval

### Multiple Chunks Per Experience

Each experience is split into multiple chunks:

- **Main experience chunk** - Overview with metadata
- **Technical details chunk** - Technology-focused content
- **Contribution chunks** - Individual achievements

This approach improves RAG performance by:
- Providing more specific retrieval targets
- Reducing token usage per retrieval
- Offering varied phrasings for different query types

## Using the Vector Database in Your App

### Search for Similar Content

```typescript
import { generateEmbedding } from '@/app/lib/embeddings';
import { searchSimilarContent } from '@/app/lib/supabase';

async function searchPortfolio(query: string) {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Search for similar content
  const results = await searchSimilarContent(
    queryEmbedding,
    0.7, // similarity threshold
    5    // number of results
  );
  
  return results;
}
```

### Integrate with Chat API

In your `app/api/chat/route.ts`, you can use the vector database for RAG:

```typescript
import { generateEmbedding } from '@/app/lib/embeddings';
import { searchSimilarContent } from '@/app/lib/supabase';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content;
  
  // Search for relevant content
  const queryEmbedding = await generateEmbedding(userMessage);
  const relevantContent = await searchSimilarContent(queryEmbedding, 0.7, 3);
  
  // Build context for the LLM
  const context = relevantContent
    .map(item => `${item.title}: ${item.content}`)
    .join('\n\n');
  
  // Add context to system message
  const systemMessage = {
    role: 'system',
    content: `You are a helpful assistant for a portfolio website. Use this information to answer questions:\n\n${context}`
  };
  
  // ... rest of your chat logic
}
```

## TACOS Backend (Optional)

If you prefer to use a TACOS backend instead of Supabase:

1. Set up your TACOS backend server
2. Configure environment variables:
   ```env
   USE_TACOS=true
   TACOS_API_URL=http://your-backend-url
   TACOS_API_KEY=your_api_key
   ```
3. Run `npm run push` - it will automatically use TACOS backend

## Production Deployment

### Vercel Environment Variables

Add these to your Vercel project:

1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.local`
3. Set `VERCEL_ENV=production` for production builds

### Automated Updates

You can trigger content updates:

- Manually via `npm run rag:update`
- In a post-build script
- Via a cron job or GitHub Action
- Through a webhook endpoint

## Monitoring

### View Content Statistics

```sql
SELECT * FROM content_statistics;
```

This view shows:
- Total content count
- Counts by content type
- Last update timestamp

### Check Content Quality

```sql
SELECT 
  slug,
  title,
  LENGTH(content) as content_length,
  metadata->>'contentType' as type
FROM content_embeddings
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Rate Limiting

If you hit OpenAI rate limits:
- Reduce batch size in `push-content.ts`
- Increase delay between batches
- Use a tier with higher rate limits

### Missing Environment Variables

Ensure all required variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### Supabase Connection Issues

1. Check your Supabase project is active
2. Verify credentials are correct
3. Ensure pgvector extension is enabled
4. Check RLS policies allow your operations

## Cost Estimates

### OpenAI Costs
- **text-embedding-3-small**: ~$0.02 per 1M tokens
- **GPT-4o-mini** (for enhancement): ~$0.15 per 1M input tokens

For a typical portfolio with 10 experiences:
- Embeddings: ~$0.001
- Enhancement: ~$0.05
- **Total: ~$0.05 per full update**

### Supabase Costs
- Free tier: 500MB database, 1GB file storage
- Sufficient for most portfolios
- Vector operations are free in the free tier

## Next Steps

1. ✅ Set up Supabase project and run SQL setup
2. ✅ Configure environment variables
3. ✅ Install dependencies
4. ✅ Run content extraction and enhancement
5. ✅ Push content to vector database
6. ✅ Integrate with your chat API
7. 🔄 Test semantic search functionality
8. 🚀 Deploy to production

## Additional Resources

- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai/vector-columns)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
