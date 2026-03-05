# Auto-Sync Content System

This system automatically detects changes to your portfolio content files and synchronizes them to the Supabase vector database when chat messages are sent.

## How It Works

### Automatic Sync on Chat
Every time a chat message is sent:
1. The system checks if content files have changed
2. If changes are detected, it extracts content and generates embeddings
3. Uploads the embeddings to Supabase
4. Uses the fresh embeddings for RAG context

### Watched Files
The system monitors these files for changes and extracts content from each:
- `app/data/career.json` — Career/work experience entries
- `app/data/education.json` — Education entries
- `app/data/projects.ts` — Project showcase data
- `app/data/RAG/resume.json` — Detailed resume with experience, education, and skills
- `public/*.pdf` — **PDF resume** (auto-detected; any file with "resume" in the name)

### PDF Resume → JSON (ATS-style parser)
When a change to the PDF in `/public` is detected, the system automatically:
1. Extracts raw text from the PDF using `pdf-parse`
2. Identifies sections (Experience, Education, Skills, Projects) like an ATS scanner
3. Parses structured entries with dates, bullet points, and technologies
4. **Merges** the data into `career.json`, `education.json`, and `resume.json` (preserving your manually-set logos, links, and hrefs)

You can also trigger this manually:

**Check if a PDF resume exists:**
```bash
curl http://localhost:3000/api/parse-resume
```

**Parse PDF and sync to JSON files:**
```bash
curl -X POST http://localhost:3000/api/parse-resume
```

**Preview parsed data without writing files:**
```bash
curl -X POST "http://localhost:3000/api/parse-resume?preview=true"
```

**Overwrite JSON files instead of merging:**
```bash
curl -X POST "http://localhost:3000/api/parse-resume?merge=false"
```

### Manual Sync API

**Check sync status:**
```bash
curl http://localhost:3000/api/sync-content
```

**Trigger manual sync:**
```bash
curl -X POST http://localhost:3000/api/sync-content
```

**Force sync (even if no changes):**
```bash
curl -X POST "http://localhost:3000/api/sync-content?force=true"
```

**Sync with AI enhancement:**
```bash
curl -X POST "http://localhost:3000/api/sync-content?useAI=true"
```

> **Debug routes** are also available at `/api/debug/sync-content`, `/api/debug/force-sync`, and `/api/debug/test-db`.

## Environment Variables Required

```env
# .env.local
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Features

✅ **No manual scripts needed** - Content syncs automatically when you chat
✅ **Change detection** - Only syncs when files actually change
✅ **Fast** - Processes content in batches to avoid rate limiting
✅ **Fallback** - If sync fails or vector DB is empty, falls back to static resume.json
✅ **Non-blocking** - Sync errors don't break the chat functionality
✅ **Status tracking** - Tracks last sync time and chunk count

## Sync Metadata

The system stores sync metadata in:
```
app/data/RAG/.sync-metadata.json
```

This file tracks:
- Last sync timestamp
- File hashes (to detect changes)
- Number of chunks processed

## How to Use

1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

2. **Drop your PDF resume into `/public`** (e.g., `public/Seth_DeWhitt_Resume.pdf`)

3. **Make changes to your content files** (e.g., update `resume.json` or replace the PDF)

4. **Send a chat message** - The system will automatically detect changes and sync!
   - If the PDF changed, it will be re-parsed into the JSON files first
   - Then the normal embedding sync runs

5. **Or trigger a manual PDF parse:**
   ```bash
   curl -X POST http://localhost:3000/api/parse-resume
   ```

6. **Check the console** - You'll see logs like:
   ```
   Content changes detected, triggering sync...
   Processing 15 chunks...
   ✓ Synced 15 chunks
   ```

## Troubleshooting

### Sync not triggering?
- Check that your environment variables are set in `.env.local`
- Verify the files you changed are in the watched files list
- Check the browser console or server logs for errors

### Want to force a sync?
Use the manual sync API:
```bash
curl -X POST "http://localhost:3000/api/sync-content?force=true"
```

### Want to clear sync history?
Delete the metadata file:
```bash
rm app/data/RAG/.sync-metadata.json
```

## Performance Notes

- **Batch size:** Processes 5 chunks at a time to avoid rate limits
- **Max chunks:** Limited to 50 chunks per sync (configurable)
- **Non-blocking:** Sync runs asynchronously and doesn't slow down chat
- **Caching:** Only syncs when files actually change
