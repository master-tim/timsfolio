import type { APIRoute } from 'astro';
import { clearCache } from '../../lib/redis';

/**
 * Admin endpoint to clear the Redis cache
 * Usage: POST /api/cache/clear
 */
export const POST: APIRoute = async ({ request }) => {
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to clear cache',
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
