import Redis from 'ioredis';
import crypto from 'crypto';

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis | null {
  // Skip Redis in development if not configured
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'development') {
    console.log('Redis not configured, caching disabled in development');
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        // Retry strategy
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        // Connection timeout
        connectTimeout: 10000,
        // Max retry attempts
        maxRetriesPerRequest: 3,
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
      });
    } catch (error) {
      console.error('Failed to create Redis client:', error);
      return null;
    }
  }

  return redisClient;
}

/**
 * Generate a cache key from query and parameters
 */
export function generateCacheKey(query: string, params?: Record<string, any>): string {
  const normalizedQuery = query.trim().toLowerCase();
  const paramsString = params ? JSON.stringify(params) : '';
  const hash = crypto
    .createHash('sha256')
    .update(`${normalizedQuery}${paramsString}`)
    .digest('hex');
  
  return `chat:${hash}`;
}

/**
 * Get cached response for a query
 */
export async function getCachedResponse(
  query: string,
  params?: Record<string, any>
): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cacheKey = generateCacheKey(query, params);
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log(`Cache HIT for query: ${query.substring(0, 50)}...`);
      return cached;
    }
    
    console.log(`Cache MISS for query: ${query.substring(0, 50)}...`);
    return null;
  } catch (error) {
    console.error('Error getting cached response:', error);
    return null;
  }
}

/**
 * Cache a response for a query
 * @param query - The user query
 * @param response - The full response to cache
 * @param params - Additional parameters used in the query
 * @param ttl - Time to live in seconds (default: 1 hour)
 */
export async function cacheResponse(
  query: string,
  response: string,
  params?: Record<string, any>,
  ttl: number = 3600 // 1 hour default
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const cacheKey = generateCacheKey(query, params);
    await redis.setex(cacheKey, ttl, response);
    console.log(`Cached response for query: ${query.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error caching response:', error);
  }
}

/**
 * Clear all cached responses
 */
export async function clearCache(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys('chat:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cleared ${keys.length} cached responses`);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
