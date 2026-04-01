import { VectorStoreIndex, storageContextFromDefaults, Settings, TextNode } from 'llamaindex';
import { OpenAIEmbedding } from '@llamaindex/openai';
import { streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { PORTFOLIO_CONTEXT } from './context';

import path from 'path';

const PERSIST_DIR = path.resolve(process.cwd(), 'data/vectordb');

let indexInstance: VectorStoreIndex | null = null;
let initPromise: Promise<VectorStoreIndex> | null = null;

/**
 * Create Vercel AI Gateway provider for text generation
 */
function getAIGateway() {
  return createOpenAI({
    baseURL: AI_GATEWAY_URL,
    apiKey: getApiKey(),
  });
}

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';

/**
 * Get AI Gateway API key from available env sources
 */
function getApiKey(): string {
  const apiKey = import.meta.env.AI_GATEWAY_API_KEY ?? process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error('Missing AI_GATEWAY_API_KEY environment variable');
  }
  return apiKey;
}

/**
 * Initialize Settings with embedding model routed through AI Gateway
 */
function initializeSettings() {
  Settings.embedModel = new OpenAIEmbedding({
    model: 'text-embedding-3-large',
    apiKey: getApiKey(),
    baseURL: AI_GATEWAY_URL,
  });
}

/**
 * Initialize or retrieve the vector store index (with promise lock to prevent race conditions)
 */
export async function getVectorIndex(): Promise<VectorStoreIndex> {
  if (indexInstance) {
    return indexInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
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
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Query the vector database with context (non-streaming)
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
    initializeSettings();
    const index = await getVectorIndex();

    // Retrieve relevant documents
    const retriever = index.asRetriever({ similarityTopK: topK });
    const nodes = await retriever.retrieve(query);

    // Log RAG details
    console.log('\n🔍 --- RAG Query Log ---');
    console.log('❓ Query:', query);
    if (nodes.length > 0) {
      console.log('\n📄 Retrieved Nodes:');
      nodes.forEach((node, i) => {
        const metadata = node.node.metadata || {};
        console.log(`\n[${i+1}] Score: ${node.score?.toFixed(4)}`);
        console.log(`    Source: ${metadata.source || 'Unknown'}`);
        console.log(`    Title: ${metadata.title || 'No Title'}`);
      });
    }

    // Build prompt with context
    const retrievedContext = nodes.map((node, i) => {
      const metadata = node.node.metadata || {};
      return `[Document ${i+1} - ${metadata.title || 'Untitled'}]\n${(node.node as TextNode).text}`;
    }).join('\n\n');

    const systemPrompt = `You are an AI assistant for Tim's portfolio website. Your ONLY purpose is to answer questions about Tim, his work, skills, experience, and projects.`;

    let userContent = query;
    if (includeContext) {
      userContent = buildUserPrompt(query, retrievedContext, '');
    }

    // Generate response via Vercel AI Gateway
    const gateway = getAIGateway();
    const { text } = await generateText({
      model: gateway('xai/grok-4.1-fast-reasoning'),
      system: systemPrompt,
      prompt: userContent,
      temperature,
    });

    console.log('\n🤖 Response:', text.substring(0, 100) + '...');
    console.log('---------------------\n');

    return text;
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
 * Build the user prompt with context, retrieved docs, and history
 */
function buildUserPrompt(query: string, retrievedContext: string, historyText: string): string {
  return `
Context about Tim:
${PORTFOLIO_CONTEXT}

Retrieved Information from Knowledge Base:
${retrievedContext}

${historyText ? `Chat History:\n${historyText}\n` : ''}
User Question: ${query}

System Instruction:
1. If the user asks about anything unrelated to Tim (e.g., general knowledge, coding help not related to his projects, other people, politics, etc.), politely refuse and say you can only answer questions about Tim.
2. Be conversational, professional, and helpful.
3. Keep your response concise (2-3 sentences max) for general questions. However, if the user asks for a list (e.g., 'list all projects', 'show me publications'), provide a comprehensive list using bullet points.
4. Be direct and to the point.
5. Use the Chat History to maintain context in the conversation.
6. **CRITICAL - Navigation Links**: After answering, you MUST include relevant navigation links using EXACT markdown format. Add a blank line, then "**Explore more:**" followed by the links:

   For skills/experience/education questions, include:
   📄 [View Full CV/About Me](https://mastertim.xyz/about)

   For projects/work questions, include:
   🚀 [Explore All Projects](https://mastertim.xyz/blog)

   For publications/research questions, include:
   📚 [Read Publications](https://mastertim.xyz/blog)

   Example response format:
   "Tim specializes in Full-stack AI Engineering and Frontend 3D Development.

   **Explore more:**
   📄 [View Full CV/About Me](https://mastertim.xyz/about)"

   IMPORTANT: Use the EXACT markdown link syntax shown above: [Link Text](URL)

Please answer the user's question following these rules.
  `.trim();
}

/**
 * Stream response from vector database query using Vercel AI SDK
 */
export async function* streamQueryVectorDB(
  query: string,
  options: {
    topK?: number;
    temperature?: number;
    includeContext?: boolean;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  } = {}
): AsyncGenerator<{ type: 'text' | 'status' | 'reasoning'; content: string }, void, unknown> {
  const {
    topK = 3,
    temperature = 0.7,
    includeContext = true,
  } = options;

  try {
    yield { type: 'status', content: 'Initializing AI...' };
    initializeSettings();
    const index = await getVectorIndex();

    // 1. Retrieve relevant documents
    yield { type: 'status', content: 'Searching knowledge base...' };
    const retriever = index.asRetriever({ similarityTopK: topK });
    const nodes = await retriever.retrieve(query);

    if (nodes.length > 0) {
      yield { type: 'status', content: `Found ${nodes.length} relevant documents` };
    } else {
      yield { type: 'status', content: 'No specific documents found, using general knowledge' };
    }

    // 2. Construct Prompt
    yield { type: 'status', content: 'Thinking...' };

    const systemPrompt = `You are an AI assistant for Tim's portfolio website. Your ONLY purpose is to answer questions about Tim, his work, skills, experience, and projects.`;

    let userContent = query;

    if (includeContext) {
      const historyText = options.history
        ? options.history.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n')
        : '';

      const retrievedContext = nodes.map((node, i) => {
        const metadata = node.node.metadata || {};
        return `[Document ${i+1} - ${metadata.title || 'Untitled'}]\n${(node.node as TextNode).text}`;
      }).join('\n\n');

      userContent = buildUserPrompt(query, retrievedContext, historyText);
    }

    // 3. Stream response via Vercel AI Gateway
    const gateway = getAIGateway();
    const result = streamText({
      model: gateway('xai/grok-4.1-fast-reasoning'),
      system: systemPrompt,
      prompt: userContent,
      temperature,
    });

    // Stream reasoning status and text output
    let isReasoning = false;
    for await (const part of result.fullStream) {
      if (part.type === 'reasoning-start') {
        isReasoning = true;
        yield { type: 'status', content: 'Reasoning...' };
      } else if (part.type === 'reasoning-end') {
        isReasoning = false;
      } else if (part.type === 'text-delta') {
        yield { type: 'text', content: part.text };
      }
    }

    // Log token usage
    const usage = await result.usage;
    console.log(`\n📊 Token usage — prompt: ${usage.promptTokens}, completion: ${usage.completionTokens}, total: ${usage.totalTokens}`);
  } catch (error) {
    console.error('Error streaming query:', error);
    throw error;
  }
}
