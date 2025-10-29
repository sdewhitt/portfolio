# Setup Checklist - Portfolio RAG System

## ✅ Completed

- [x] Installed dependencies (`@supabase/supabase-js`, `dotenv`, `tsx`)
- [x] Created library files:
  - [x] `app/lib/supabase.ts` - Vector database client
  - [x] `app/lib/embeddings.ts` - OpenAI embedding utilities
  - [x] `app/lib/content-enhancer.ts` - AI content enhancement
  - [x] `app/lib/rag-integration-example.ts` - Integration examples
- [x] Updated script files:
  - [x] `app/scripts/extract-content.ts` - Adapted to your data structure
  - [x] `app/scripts/push-content.ts` - Supabase + TACOS support
  - [x] `app/scripts/content-types.ts` - Extended type definitions
- [x] Created database setup:
  - [x] `supabase-setup.sql` - Complete schema
- [x] Created documentation:
  - [x] `RAG-SETUP.md` - Full setup guide
  - [x] `QUICKSTART.md` - Quick reference
  - [x] `IMPLEMENTATION-SUMMARY.md` - What was built
  - [x] `.env.example` - Environment template
- [x] All TypeScript files compile without errors

## ⏭️ Next Steps (You Need to Do)

### 1. Update package.json

Add these scripts to your `package.json`:

```json
"scripts": {
  "extract": "tsx app/scripts/extract-content.ts",
  "push": "tsx app/scripts/push-content.ts",
  "rag:update": "npm run extract && npm run push"
}
```

**Current scripts section:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

**Should become:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "extract": "tsx app/scripts/extract-content.ts",
  "push": "tsx app/scripts/push-content.ts",
  "rag:update": "npm run extract && npm run push"
}
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Choose organization and enter:
   - **Name**: portfolio-rag (or whatever you prefer)
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
5. Wait for project to initialize (~2 minutes)

### 3. Set Up Database

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open `supabase-setup.sql` from your project
4. Copy ALL contents
5. Paste into Supabase SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. Should see "Success. No rows returned"

### 4. Get Supabase Credentials

1. In Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
4. In same API page, reveal and copy:
   - **service_role key** (also starts with `eyJ...` but longer)

### 5. Get OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Log in or create account
3. Click "Create new secret key"
4. Give it a name: "Portfolio RAG"
5. Copy the key (starts with `sk-`)
6. **IMPORTANT**: Save it somewhere - you can't view it again!

### 6. Create .env.local File

1. In your project root, create file named `.env.local`
2. Copy this content and fill in YOUR values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...

# Backend Selection
USE_SUPABASE=true
```

**Replace:**
- `https://your-project-id.supabase.co` → Your actual Supabase URL
- `eyJhbGciOi...` → Your actual keys (full keys, not truncated!)
- `sk-proj-...` → Your actual OpenAI API key

### 7. Test Content Extraction

```bash
npm run extract
```

**Expected output:**
```
Starting content extraction...
Enhancing experiences with AI...
Processing batch 1/1
Content extraction completed successfully!
Output saved to: C:\Users\...\output\extracted-content.json
Total content chunks extracted: [number]
```

**If errors:**
- "Cannot find module 'tsx'" → Run: `npm install tsx`
- "OPENAI_API_KEY not set" → Check `.env.local`
- File not found → Check paths in `extract-content.ts`

### 8. Test Content Push

```bash
npm run push
```

**Expected output:**
```
Processing [number] content chunks...
Generating embeddings...
Processing batch 1/[number]
Generated [number] embeddings
Pushing content to Supabase...
Content successfully pushed to Supabase
Success: [number] chunks
```

**If errors:**
- "Supabase credentials not set" → Check `.env.local`
- "Cannot find table content_embeddings" → Run SQL setup again
- Rate limit error → Wait a minute and retry

### 9. Verify in Supabase

1. Go to Supabase dashboard
2. Click **Table Editor** (left sidebar)
3. Select `content_embeddings` table
4. Should see rows with your content!
5. Check columns: id, slug, title, content, embedding, metadata

### 10. Integrate with Chat

See `app/lib/rag-integration-example.ts` for integration code.

Basic integration in `app/api/chat/route.ts`:

```typescript
import { generateEmbedding } from '@/app/lib/embeddings';
import { searchSimilarContent } from '@/app/lib/supabase';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content;
  
  // Get RAG context
  const queryEmbedding = await generateEmbedding(userMessage);
  const relevantContent = await searchSimilarContent(queryEmbedding, 0.7, 3);
  
  const context = relevantContent
    .map(item => `${item.title}: ${item.content}`)
    .join('\n\n');
  
  // Add to your AI prompt...
}
```

## 📝 Quick Commands Reference

```bash
# Extract content from your data files
npm run extract

# Push content with embeddings to Supabase
npm run push

# Do both in sequence
npm run rag:update

# Start development server
npm run dev

# Build for production
npm run build
```

## 🐛 Troubleshooting Quick Fixes

### Module errors
```bash
npm install @supabase/supabase-js dotenv tsx
```

### TypeScript errors
Check that `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

### Environment variables not loading
- File must be named exactly `.env.local`
- No spaces around `=` signs
- No quotes around values (unless needed)
- File must be in project root

### Supabase connection fails
1. Check URL format: `https://xxx.supabase.co` (no trailing slash)
2. Check keys are complete (very long strings)
3. Verify SQL setup completed successfully
4. Check project is not paused (free tier auto-pauses after inactivity)

### OpenAI rate limits
- Wait a minute and retry
- Or reduce batch size in `push-content.ts` line 79: `const batchSize = 5;`

## 📊 Cost Estimates

### One-time setup
- Supabase: FREE (free tier)
- OpenAI API: ~$0.05 for initial content enhancement

### Per content update
- OpenAI embeddings: ~$0.001 per update
- OpenAI enhancement: ~$0.05 per update
- Supabase: FREE (included in free tier)

**Total per update: ~$0.05** ✅

## 🎉 Success Criteria

You're done when:
- [x] Dependencies installed
- [ ] Scripts added to package.json
- [ ] Supabase project created
- [ ] SQL setup completed
- [ ] `.env.local` created with all keys
- [ ] `npm run extract` succeeds
- [ ] `npm run push` succeeds
- [ ] Content visible in Supabase table editor
- [ ] Chat integration tested
- [ ] Semantic search working

## 📚 Documentation Files

- 📖 **RAG-SETUP.md** - Comprehensive guide (read this for details)
- ⚡ **QUICKSTART.md** - Quick reference
- 📋 **IMPLEMENTATION-SUMMARY.md** - What was built
- ✅ **SETUP-CHECKLIST.md** - This file
- 💡 **app/lib/rag-integration-example.ts** - Code examples
- 🗄️ **supabase-setup.sql** - Database schema
- 🔐 **.env.example** - Environment template

## 🆘 Need Help?

1. Check **RAG-SETUP.md** troubleshooting section
2. Review **QUICKSTART.md** for common issues
3. Check Supabase logs (Dashboard > Database > Logs)
4. Verify `.env.local` values are correct
5. Test with `FORCE_CONTENT_PUSH=true` for development

---

**Ready to go! Follow the steps above and you'll have a working RAG system. 🚀**
