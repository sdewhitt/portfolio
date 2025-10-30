# 🔧 Troubleshooting: RAG Not Retrieving Data

## Current Issue
The database search returns 0 items even though sync appears to run.

## Quick Diagnosis

Run this in your browser while dev server is running:
```
http://localhost:3000/api/test-db
```

This will tell you exactly what's wrong!

## Common Issues & Fixes

### 1. Database Not Set Up in Supabase

**Symptom:** `function "match_content" does not exist` error

**Fix:**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the entire contents of `supabase-setup.sql`
5. Click "Run" or press Ctrl+Enter
6. You should see "Success. No rows returned"

### 2. Database is Empty

**Symptom:** Test shows table exists but rowCount is 0

**Fix:**
1. Start dev server: `npm run dev`
2. Send any chat message
3. Watch the server console for sync logs
4. Should see: "✓ Synced X chunks to Supabase"
5. If you see errors, check the error messages

### 3. Environment Variables Not Loaded

**Symptom:** "Supabase credentials not configured" error

**Fix:**
Verify your `.env.local` has:
```env
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Restart dev server after editing `.env.local`

### 4. Wrong Supabase Key

**Symptom:** Permission errors or "JWT expired"

**Fix:**
Make sure you're using the **SERVICE ROLE KEY**, not the anon key, for sync operations.

In Supabase Dashboard:
1. Go to Settings → API
2. Copy the **service_role** key (not the anon key)
3. Update `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

### 5. Match Content Function Missing

**Symptom:** "function match_content does not exist"

**Fix:**
Re-run the SQL setup (see Issue #1 above)

## Step-by-Step Verification

1. **Check database setup:**
   ```bash
   curl http://localhost:3000/api/test-db
   ```

2. **Check if you have content to sync:**
   - Verify `app/data/RAG/resume.json` exists and has data
   
3. **Manually force a sync:**
   ```bash
   curl -X POST "http://localhost:3000/api/sync-content?force=true"
   ```

4. **Check sync status:**
   ```bash
   curl http://localhost:3000/api/sync-content
   ```

5. **Test a search:**
   Send a chat message and watch the console logs

## Expected Console Output (Successful Sync)

```
🔄 Database empty or first run - initializing content sync...
✓ Environment variables verified
📄 Extracting content...
📦 Extracted 15 total chunks
⚙️  Processing 15 chunks (max: 50)...
   Processing batch 1/3...
   ✓ Processed 5/15 chunks
   Processing batch 2/3...
   ✓ Processed 10/15 chunks
   Processing batch 3/3...
   ✓ Processed 15/15 chunks
🚀 Uploading 15 embeddings to Supabase...
📊 Upload result: 15 succeeded, 0 failed
✓ Synced 15 chunks to Supabase
```

## Expected Console Output (Successful Search)

```
Generating embedding for query: what did seth do at chewy?
Embedding generated, searching Supabase...
   Searching with threshold 0.5, limit 5...
   📊 Raw search result: 3 items
   First item similarity: 0.82
Found 3 relevant items from Supabase
✓ Using RAG context (3 items)
```

## Still Not Working?

Check the browser DevTools console and server terminal for exact error messages, then:

1. Verify Supabase project is not paused (free tier pauses after inactivity)
2. Check Supabase dashboard → Database → Tables → content_embeddings to see if rows exist
3. Try the test endpoint: `http://localhost:3000/api/test-db`
4. Share the exact error message for more specific help
