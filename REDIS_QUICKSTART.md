# Quick Start: Redis Caching

## 🚀 Quick Setup (2 minutes)

### For Production (Vercel/Netlify)

1. **Sign up for Upstash Redis** (Free tier available)
   - Go to https://upstash.com
   - Create a new database
   - Copy your Redis URL

2. **Add Environment Variable**
   ```bash
   # In Vercel/Netlify dashboard
   REDIS_URL=redis://:your-password@endpoint.upstash.io:6379
   ```

3. **Deploy**
   - That's it! Caching will work automatically

### For Local Development (Optional)

**Option 1: Skip Redis Locally**
- Don't set `REDIS_URL` - the system works fine without it
- Caching will just be disabled in development

**Option 2: Use Docker**
```bash
docker run -d -p 6379:6379 redis:alpine

# Then add to .env
REDIS_URL=redis://localhost:6379
```

**Option 3: Install Redis**
```bash
# macOS
brew install redis
brew services start redis

# Then add to .env
REDIS_URL=redis://localhost:6379
```

## 🧪 Test It

With dev server running (`npm run dev`):

```bash
npm run test:cache
```

You should see cache hits and speedup metrics!

## 📊 What You Get

- **⚡ Instant responses** for duplicate questions
- **💰 Cost savings** by reducing LLM API calls
- **🎯 Better UX** with lightning-fast cached responses
- **🔧 Zero config** - works out of the box in production

## 🎨 Visual Indicator

When a response is cached, users will see a ⚡ lightning bolt next to `[AI]` in the chat!

## 📚 Full Documentation

See `docs/REDIS_CACHING.md` for complete documentation.
