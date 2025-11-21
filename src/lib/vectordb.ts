import { VectorStoreIndex, storageContextFromDefaults, Settings, TextNode } from 'llamaindex';
import { OpenAI, OpenAIEmbedding } from '@llamaindex/openai';
import { PORTFOLIO_CONTEXT } from './context';

import path from 'path';

const PERSIST_DIR = path.resolve(process.cwd(), 'data/vectordb');

let indexInstance: VectorStoreIndex | null = null;

/**
 * Initialize Settings with OpenAI models
 */
function initializeSettings(temperature: number = 0.7) {
  // Get API key from Astro env or Node process.env
  const apiKey = import.meta.env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  // Initialize OpenAI models
  Settings.llm = new OpenAI({
    model: 'gpt-4o-mini',
    apiKey,
  });
  
  Settings.embedModel = new OpenAIEmbedding({
    model: 'text-embedding-3-large',
    apiKey,
  });
}

/**
 * Initialize or retrieve the vector store index
 */
export async function getVectorIndex(): Promise<VectorStoreIndex> {
  if (indexInstance) {
    return indexInstance;
  }
  
  try {
    initializeSettings();
    
    const storageContext = await storageContextFromDefaults({
      persistDir: PERSIST_DIR,
    });
    
    indexInstance = await VectorStoreIndex.init({
      storageContext,
    });
    
    return indexInstance;
  } catch (error) {
    console.error('Error loading vector index:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    throw new Error('Vector database not initialized. Please run: npm run build:vectordb');
  }
}

/**
 * Query the vector database with context
 */
export async function queryVectorDB(
  query: string,
  options: {
    topK?: number;
    temperature?: number;
    includeContext?: boolean;
  } = {}
): Promise<string> {
  const {
    topK = 2,
    temperature = 0.7,
    includeContext = true,
  } = options;
  
  try {
    initializeSettings(temperature);
    const index = await getVectorIndex();
    
    const queryEngine = index.asQueryEngine({
      similarityTopK: topK,
    });
    
    // Construct enhanced query with context
    let enhancedQuery = query;
    if (includeContext) {
      enhancedQuery = `
Context about Tim:
${PORTFOLIO_CONTEXT}

User Question: ${query}

System Instruction:
You are an AI assistant for Tim's portfolio website. Your ONLY purpose is to answer questions about Tim, his work, skills, experience, and projects based on the provided context.

Rules:
1. If the user asks about anything unrelated to Tim (e.g., general knowledge, coding help not related to his projects, other people, politics, etc.), politely refuse and say you can only answer questions about Tim.
2. Be conversational, professional, and helpful.
3. Keep your response concise (2-3 sentences max). Use bullet points for lists.
4. Be direct and to the point.

Please answer the user's question following these rules.
      `.trim();
    }
    
    const response = await queryEngine.query({
      query: enhancedQuery,
    });
    
    // Log RAG details
    console.log('\n🔍 --- RAG Query Log ---');
    console.log('❓ Query:', query);
    
    if (response.sourceNodes) {
      console.log('\n📄 Retrieved Nodes:');
      response.sourceNodes.forEach((node, i) => {
        const metadata = node.node.metadata || {};
        console.log(`\n[${i+1}] Score: ${node.score?.toFixed(4)}`);
        console.log(`    Source: ${metadata.source || 'Unknown'}`);
        console.log(`    Title: ${metadata.title || 'No Title'}`);
        // console.log(`    Preview: ${(node.node as any).text?.substring(0, 150)}...`);
      });
    }
    
    console.log('\n🤖 Response:', response.toString().substring(0, 100) + '...');
    console.log('---------------------\n');
    
    return response.toString();
  } catch (error) {
    console.error('Error querying vector database:', error);
    throw error;
  }
}

/**
 * Get relevant documents for a query (without LLM generation)
 */
export async function retrieveRelevantDocs(
  query: string,
  topK: number = 3
): Promise<Array<{ text: string; score: number; metadata: any }>> {
  try {
    initializeSettings();
    const index = await getVectorIndex();
    const retriever = index.asRetriever({
      similarityTopK: topK,
    });
    
    const nodes = await retriever.retrieve(query);
    
    return nodes.map(node => {
      const textNode = node.node as TextNode;
      return {
        text: textNode.text || '',
        score: node.score || 0,
        metadata: node.node.metadata,
      };
    });
  } catch (error) {
    console.error('Error retrieving documents:', error);
    throw error;
  }
}

/**
 * Stream response from vector database query
 */
export async function* streamQueryVectorDB(
  query: string,
  options: {
    topK?: number;
    temperature?: number;
    includeContext?: boolean;
  } = {}
): AsyncGenerator<string, void, unknown> {
  const {
    topK = 1,
    temperature = 0.7,
    includeContext = true,
  } = options;
  
  try {
    initializeSettings(temperature);
    const index = await getVectorIndex();
    
    const queryEngine = index.asQueryEngine({
      similarityTopK: topK,
    });
    
    // Construct enhanced query with context
    let enhancedQuery = query;
    if (includeContext) {
      enhancedQuery = `
Context about Tim:
${PORTFOLIO_CONTEXT}

User Question: ${query}

System Instruction:
You are an AI assistant for Tim's portfolio website. Your ONLY purpose is to answer questions about Tim, his work, skills, experience, and projects based on the provided context.

Rules:
1. If the user asks about anything unrelated to Tim (e.g., general knowledge, coding help not related to his projects, other people, politics, etc.), politely refuse and say you can only answer questions about Tim.
2. Be conversational, professional, and helpful.
3. Keep your response concise (2-3 sentences max). Use bullet points for lists.
4. Be direct and to the point.

Please answer the user's question following these rules.
      `.trim();
    }
    
    const stream = await queryEngine.query({
      query: enhancedQuery,
      stream: true,
    });
    
    for await (const chunk of stream) {
      yield chunk.toString();
    }
  } catch (error) {
    console.error('Error streaming query:', error);
    throw error;
  }
}
