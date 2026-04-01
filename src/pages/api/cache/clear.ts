import type { APIRoute } from 'astro';
import { clearCache } from '../../../lib/redis';

/**
 * Admin endpoint to clear the Redis cache
 * Usage: POST /api/cache/clear (requires Bearer token matching ADMIN_TOKEN env var)
 */
export const POST: APIRoute = async ({ request }) => {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return new Response(
      JSON.stringify({ error: 'Admin endpoint not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${adminToken}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await clearCache();
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cache cleared successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Cache clear error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to clear cache'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
