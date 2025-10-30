# Quick Start Guide - Portfolio RAG System

## Installation

```bash
npm install @supabase/supabase-js dotenv tsx
```

## Configuration Steps

### 1. Set up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor
4. Run the contents of `supabase-setup.sql`
5. Copy credentials from Project Settings > API:
   - Project URL
   - Anon key
   - Service role key

### 2. Get OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy the key

### 3. Create .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-key
USE_SUPABASE=true
```

### 4. Update package.json

Add these scripts:

```json
"scripts": {
  "extract": "tsx app/scripts/extract-content.ts",
  "push": "tsx app/scripts/push-content.ts",
  "rag:update": "npm run extract && npm run push"
}
```

## Usage

### Extract and enhance content
```bash
npm run extract
```

### Push to Supabase
```bash
npm run push
```

### Do both
```bash
npm run rag:update
```

## What It Does

### Content Extraction
- Reads from `app/data/career.json`, `app/data/education.json`, `app/data/RAG/resume.json`
- Enhances experiences with AI-generated verbose descriptions
- Creates multiple content chunks per experience
- Saves to `output/extracted-content.json`

### Content Enhancement
For each experience, generates:
- Comprehensive summary
- Detailed description
- Key contributions
- Impact statement
- Technical context
- 5-7 variations for better retrieval

### Vector Database
- Generates embeddings using OpenAI
- Stores in Supabase with pgvector
- Enables semantic search
- Supports RAG for chatbot

## Integration with Chat

```typescript
// In your chat API route
import { generateEmbedding } from '@/app/lib/embeddings';
import { searchSimilarContent } from '@/app/lib/supabase';

// Get relevant context
const queryEmbedding = await generateEmbedding(userMessage);
const context = await searchSimilarContent(queryEmbedding, 0.7, 3);

// Use context in your LLM prompt
```

## File Structure

```
app/
├── lib/
│   ├── supabase.ts          # Supabase client & operations
│   ├── embeddings.ts        # OpenAI embedding utilities
│   └── content-enhancer.ts  # AI content enhancement
├── scripts/
│   ├── extract-content.ts   # Content extraction script
│   ├── push-content.ts      # Push to vector DB
│   └── content-types.ts     # TypeScript interfaces
└── data/
    ├── career.json          # Basic career data
    ├── education.json       # Education data
    └── RAG/
        └── resume.json      # Detailed experience data

supabase-setup.sql           # Database schema
RAG-SETUP.md                 # Full documentation
.env.example                 # Environment template
```

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### "Cannot find module 'tsx'"
```bash
npm install -D tsx
```

### OpenAI Rate Limits
- Use tier with higher limits
- Reduce batch size in `push-content.ts`
- Increase delays between batches

### Supabase Connection Failed
- Check credentials in `.env.local`
- Verify project is active
- Ensure SQL setup ran successfully

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up Supabase project
3. ✅ Configure `.env.local`
4. ✅ Run `npm run rag:update`
5. ✅ Integrate with chat API
6. 🚀 Deploy!

## Resources

- Full docs: `RAG-SETUP.md`
- SQL setup: `supabase-setup.sql`
- Env template: `.env.example`
