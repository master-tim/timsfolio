# Redis Caching for Chat Queries

This implementation adds Redis caching to the chat API to improve response times and reduce API costs by caching responses for identical questions.

## Features

- ✅ **Automatic Caching**: Responses are automatically cached after first query
- ✅ **Smart Cache Keys**: Uses SHA-256 hashing of query + parameters for unique cache keys
- ✅ **Streaming UX**: Cached responses are streamed to maintain consistent user experience
- ✅ **Development Fallback**: Gracefully disables caching if Redis is not configured
- ✅ **TTL Support**: Cached responses expire after 1 hour by default
- ✅ **Cache Management**: Admin endpoint to clear cache when needed

## Setup

### Local Development

#### Option 1: Use Docker
```bash
# Run Redis in Docker
docker run -d -p 6379:6379 redis:alpine

# Add to your .env file
REDIS_URL=redis://localhost:6379
```

#### Option 2: Install Redis Locally (macOS)
```bash
# Install via Homebrew
brew install redis

# Start Redis
brew services start redis

# Add to your .env file
REDIS_URL=redis://localhost:6379
```

#### Option 3: Skip Redis in Development
If you don't configure `REDIS_URL`, caching will be disabled in development mode and the system will work normally.

### Production Deployment

For production, you'll need a Redis service. Here are some options:

#### Upstash Redis (Recommended for Vercel)
1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the Redis URL
4. Add to your Vercel environment variables:
   ```
   REDIS_URL=redis://:your-password@endpoint.upstash.io:6379
   ```

#### Redis Labs
1. Sign up at [redis.com](https://redis.com)
2. Create a free database
3. Get connection URL
4. Add to environment variables

#### AWS ElastiCache
1. Create an ElastiCache Redis cluster
2. Get the endpoint URL
3. Add to environment variables

## How It Works

1. **Cache Check**: When a query comes in, the system generates a cache key from the query and parameters
2. **Cache Hit**: If found, the cached response is streamed back to the user
3. **Cache Miss**: If not found, the system queries the LLM, streams the response, and caches it
4. **Cache Invalidation**: Responses automatically expire after 1 hour (configurable)

### Cache Key Generation

Cache keys are generated using SHA-256 hashing of:
- Normalized query (trimmed and lowercased)
- Parameters (`topK`, `temperature`)

Example:
```typescript
Query: "What is your experience?"
Params: { topK: 3, temperature: 0.7 }
Cache Key: "chat:a1b2c3d4e5f6..." // SHA-256 hash
```

## API Endpoints

### POST /api/stream
Main chat endpoint with caching support.

**Request:**
```json
{
  "query": "What is your experience with React?",
  "topK": 3,
  "temperature": 0.7
}
```

**Response (Cache Hit):**
```
data: {"cached": true}
data: {"chunk": "I have ex"}
data: {"chunk": "tensive e"}
...
data: [DONE]
```

**Response (Cache Miss):**
```
data: {"chunk": "I have ex"}
data: {"chunk": "tensive e"}
...
data: [DONE]
```

### POST /api/cache/clear
Admin endpoint to clear all cached responses.

**Request:**
```bash
curl -X POST http://localhost:4321/api/cache/clear
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

## Configuration

You can customize caching behavior in `src/lib/redis.ts`:

```typescript
// Change TTL (time to live)
await cacheResponse(query, response, params, 7200); // 2 hours instead of 1

// Change chunk size for streaming
const chunkSize = 20; // Larger chunks = faster streaming

// Change retry strategy
retryStrategy(times) {
  const delay = Math.min(times * 100, 5000); // More aggressive retries
  return delay;
}
```

## Monitoring

The system logs cache hits and misses:

```
Cache HIT for query: What is your experience...
Cache MISS for query: Tell me about your skills...
Cached response for query: Tell me about your skills...
```

## Cost Savings

Assuming:
- 1000 queries per day
- 30% are duplicate questions
- $0.002 per LLM query

**Savings:**
- Daily: 300 queries × $0.002 = $0.60
- Monthly: $18.00
- Yearly: $216.00

Plus significantly faster response times for cached queries!

## Troubleshooting

### Redis connection errors in production
- Verify `REDIS_URL` is set correctly
- Check Redis service status
- Ensure network connectivity

### Cache not working
- Check logs for Redis connection status
- Verify environment variables
- Try clearing cache: `POST /api/cache/clear`

### Development mode issues
- If you don't need caching locally, just don't set `REDIS_URL`
- The system will gracefully skip caching

## Best Practices

1. **Monitor Cache Hit Rate**: Track how often cache is being used
2. **Adjust TTL**: Longer for stable content, shorter for frequently changing content
3. **Size Limits**: Consider implementing max cache size if needed
4. **Security**: Protect admin endpoints in production
5. **Invalidation Strategy**: Clear cache when updating portfolio content

## Future Enhancements

- [ ] Add cache statistics endpoint
- [ ] Implement LRU eviction policy
- [ ] Add cache warming for common queries
- [ ] Implement partial matching for similar queries
- [ ] Add cache pre-loading during build
