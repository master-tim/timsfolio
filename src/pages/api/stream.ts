import type { APIRoute } from 'astro';
import { streamQueryVectorDB } from '../../lib/vectordb';
import { getCachedResponse, cacheResponse } from '../../lib/redis';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { query, topK = 3, temperature = 0.7, history = [] } = body;
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Block questions more than 50 words
    if (query.trim().split(/\s+/).length > 50) {
      return new Response(
        JSON.stringify({ error: 'Question is too long. Please limit to 50 words.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check cache first
    const cacheParams = { topK, temperature };
    const cachedResponse = await getCachedResponse(query, cacheParams);
    
    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // If we have a cached response, stream it
          if (cachedResponse) {
            // Add a header to indicate this is from cache
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ cached: true })}\n\n`
              )
            );
            
            // Stream cached response character by character for smooth UX
            const chunkSize = 10; // Characters per chunk
            for (let i = 0; i < cachedResponse.length; i += chunkSize) {
              const chunk = cachedResponse.slice(i, i + chunkSize);
              const data = `data: ${JSON.stringify({ chunk })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
              
              // Small delay to simulate streaming (optional, for UX)
              await new Promise(resolve => setTimeout(resolve, 20));
            }
            
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }
          
          // No cache hit - query the vector DB
          const responseStream = await streamQueryVectorDB(query, {
            topK,
            temperature,
            includeContext: true,
            history,
          });
          
          let fullResponse = '';
          
          for await (const chunk of responseStream) {
            fullResponse += chunk;
            const data = `data: ${JSON.stringify({ chunk })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
          
          // Cache the complete response
          if (fullResponse) {
            await cacheResponse(query, fullResponse, cacheParams, 3600); // Cache for 1 hour
          }
          
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Vector DB Stream API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to stream from vector database',
        details: errorMessage 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
