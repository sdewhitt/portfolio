-- Supabase Vector Database Setup for Portfolio RAG System
-- This SQL script sets up the necessary tables and functions for storing and querying content embeddings

-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the content_embeddings table
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small produces 1536-dimensional vectors
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_embeddings_slug ON content_embeddings(slug);

-- Create an index on the embedding column for faster vector similarity searches
CREATE INDEX IF NOT EXISTS idx_content_embeddings_embedding ON content_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create a function to search for similar content using cosine similarity
CREATE OR REPLACE FUNCTION match_content (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    content_embeddings.id,
    content_embeddings.slug,
    content_embeddings.title,
    content_embeddings.content,
    content_embeddings.metadata,
    1 - (content_embeddings.embedding <=> query_embedding) AS similarity
  FROM content_embeddings
  WHERE 1 - (content_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY content_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_content_embeddings_updated_at
  BEFORE UPDATE ON content_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access (for the chatbot)
CREATE POLICY "Allow public read access" ON content_embeddings
  FOR SELECT
  USING (true);

-- Create a policy to allow authenticated write access (for the content push script)
CREATE POLICY "Allow authenticated write access" ON content_embeddings
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create a policy to allow service role full access
CREATE POLICY "Allow service role full access" ON content_embeddings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON content_embeddings TO anon, authenticated;
GRANT ALL ON content_embeddings TO service_role;

-- Create a view for content statistics
CREATE OR REPLACE VIEW content_statistics AS
SELECT
  COUNT(*) AS total_content,
  COUNT(DISTINCT metadata->>'contentType') AS content_types,
  COUNT(CASE WHEN metadata->>'contentType' = 'experience' THEN 1 END) AS experience_count,
  COUNT(CASE WHEN metadata->>'contentType' = 'project' THEN 1 END) AS project_count,
  COUNT(CASE WHEN metadata->>'contentType' = 'education' THEN 1 END) AS education_count,
  COUNT(CASE WHEN metadata->>'contentType' = 'skills' THEN 1 END) AS skills_count,
  MAX(updated_at) AS last_updated
FROM content_embeddings;

-- Grant access to the view
GRANT SELECT ON content_statistics TO anon, authenticated, service_role;
