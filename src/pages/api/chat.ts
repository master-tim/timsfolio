import type { APIRoute } from 'astro';
import { queryVectorDB } from '../../lib/vectordb';

// System prompt is now handled in queryVectorDB via context injection
// but we can add specific behavioral instructions here if needed

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    // Use the new persistent vector database (includes PDFs + Blogs)
    const response = await queryVectorDB(message, {
      topK: 3,
      temperature: 0.7,
      includeContext: true
    });

    // Return in the format the frontend expects
    return new Response(JSON.stringify({ 
      answer: response 
    }), { status: 200 });

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  }
};
