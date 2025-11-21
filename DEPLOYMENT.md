# 🚀 Deploying to Vercel

Your portfolio is ready to be deployed with the Vector Database!

## ✅ What I've Configured for You
1. **Git Configuration**: I updated `.gitignore` to allow `data/vectordb` to be committed.
2. **Vercel Adapter**: I configured `astro.config.mjs` to include the database files in the serverless bundle.
3. **Path Resolution**: I updated the code to find the database files correctly in the cloud.

## 🛠️ Steps to Deploy

### 1. Commit Your Changes
You must commit the generated vector database files so Vercel can access them.

```bash
git add .
git commit -m "feat: add vector database for deployment"
git push
```

### 2. Set Environment Variables on Vercel
Go to your Vercel Project Settings > Environment Variables and add:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-proj-...` (Your actual API key) |

### 3. Deploy
Vercel will automatically deploy when you push.

## ⚠️ Important Notes

1. **Database Updates**: Since Vercel is read-only, if you add new blog posts or PDFs, you must:
   - Run `npm run build:vectordb` locally.
   - Commit the updated `data/vectordb` files.
   - Push to GitHub.

2. **File Size**: The vector database is currently ~2.3MB. Vercel's limit for serverless functions is 50MB, so you have plenty of space!

3. **Cost**: Every query calls OpenAI (Embedding + GPT-4o). Be mindful of your usage limits.
