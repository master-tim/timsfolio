import { Document, VectorStoreIndex, storageContextFromDefaults, Settings } from 'llamaindex';
import { OpenAI, OpenAIEmbedding } from '@llamaindex/openai';
import * as fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { createRequire } from 'module';

// Load environment variables
config();

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

const PERSIST_DIR = './data/vectordb';
const PDFS_DIR = './data/pdfs';
const DOCS_DIR = './data/docs';
const BLOG_DIR = './src/content/blog';

interface DocumentMetadata {
  source: string;
  type: 'pdf' | 'blog';
  title?: string;
  date?: string;
}

/**
 * Extract text from PDF files using pdf2json
 */
async function extractPDFText(pdfPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1); // 1 = text content only
    
    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error(`Error parsing PDF ${pdfPath}:`, errData.parserError);
      resolve(''); // Resolve with empty string to continue processing other files
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        // Manually extract text from the JSON structure to avoid library bugs
        let text = '';
        
        // Iterate through pages
        if (pdfData && pdfData.Pages) {
          pdfData.Pages.forEach((page: any) => {
            // Iterate through text elements
            if (page.Texts) {
              page.Texts.forEach((textItem: any) => {
                // Text is URL encoded
                if (textItem.R && textItem.R.length > 0) {
                  try {
                    const decodedText = decodeURIComponent(textItem.R[0].T);
                    text += decodedText + ' ';
                  } catch (e) {
                    // Fallback if decoding fails
                    text += textItem.R[0].T + ' ';
                  }
                }
              });
            }
            text += '\n\n'; // New line between pages
          });
        }
        
        resolve(text);
      } catch (error) {
        console.error(`Error extracting text from PDF ${pdfPath}:`, error);
        resolve('');
      }
    });

    try {
      pdfParser.loadPDF(pdfPath);
    } catch (error) {
      console.error(`Error loading PDF ${pdfPath}:`, error);
      resolve('');
    }
  });
}

/**
 * Load blog posts from markdown files
 */
async function loadBlogPosts(): Promise<Document[]> {
  const documents: Document[] = [];
  
  try {
    const files = await fs.promises.readdir(BLOG_DIR);
    const mdFiles = files.filter((file: string) => file.endsWith('.md') || file.endsWith('.mdx'));
    
    for (const file of mdFiles) {
      const filePath = path.join(BLOG_DIR, file);
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Simple frontmatter extraction
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
      const body = content.replace(/^---\n[\s\S]*?\n---/, '').trim();
      
      // Extract title from frontmatter
      const titleMatch = frontmatter.match(/title:\s*(.*)/);
      const title = titleMatch ? titleMatch[1].replace(/['"]/g, '').trim() : file;
      
      documents.push(new Document({
        text: body,
        metadata: {
          source: file,
          type: 'blog',
          title,
        },
      }));
      
      console.log(`✓ Loaded blog post: ${title}`);
    }
  } catch (error) {
    console.error('Error loading blog posts:', error);
  }
  
  return documents;
}

/**
 * Load PDF documents
 */
async function loadPDFs(): Promise<Document[]> {
  const documents: Document[] = [];
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(PDFS_DIR)) {
      return [];
    }

    const files = await fs.promises.readdir(PDFS_DIR);
    const pdfFiles = files.filter((file: string) => file.toLowerCase().endsWith('.pdf'));
    
    for (const file of pdfFiles) {
      const filePath = path.join(PDFS_DIR, file);
      const text = await extractPDFText(filePath);
      
      if (text.trim().length > 0) {
        documents.push(new Document({
          text,
          metadata: {
            source: file,
            type: 'pdf',
            title: file.replace('.pdf', '').replace(/_/g, ' '),
          },
        }));
        console.log(`✓ Loaded PDF: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error loading PDFs:', error);
  }
  
  return documents;
}

/**
 * Load text files from data/docs
 */
async function loadTextDocs(): Promise<Document[]> {
  const documents: Document[] = [];
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(DOCS_DIR)) {
      return [];
    }

    const files = await fs.promises.readdir(DOCS_DIR);
    
    for (const file of files) {
      if (file.toLowerCase().endsWith('.txt') || file.toLowerCase().endsWith('.md')) {
        const filePath = path.join(DOCS_DIR, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        
        documents.push(new Document({
          text: content,
          metadata: {
            source: file,
            type: 'text_doc',
            title: file.replace(/\.(txt|md)$/, '').replace(/_/g, ' '),
          },
        }));
        
        console.log(`✓ Loaded text doc: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error loading text docs:', error);
  }
  
  return documents;
}

/**
 * Build and persist vector database
 */
async function buildVectorDB() {
  console.log('🚀 Building Vector Database...\n');
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  // Initialize OpenAI models
  Settings.llm = new OpenAI({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  Settings.embedModel = new OpenAIEmbedding({
    model: 'text-embedding-3-large',
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Load all documents
  console.log('📚 Loading documents...\n');
  const blogDocs = await loadBlogPosts();
  const pdfDocs = await loadPDFs();
  const textDocs = await loadTextDocs();
  const allDocs = [...blogDocs, ...pdfDocs, ...textDocs];
  
  console.log(`\n✓ Total documents loaded: ${allDocs.length}`);
  console.log(`  - Blog posts: ${blogDocs.length}`);
  console.log(`  - PDFs: ${pdfDocs.length}`);
  console.log(`  - Text docs: ${textDocs.length}\n`);
  
  if (allDocs.length === 0) {
    console.error('❌ No documents found to index');
    process.exit(1);
  }
  
  // Create storage context
  console.log('🔨 Creating vector index...\n');
  const storageContext = await storageContextFromDefaults({
    persistDir: PERSIST_DIR,
  });
  
  // Create index
  const index = await VectorStoreIndex.fromDocuments(allDocs, {
    storageContext,
  });
  
  // Persist to disk - the index is automatically persisted via the storage context
  console.log('✅ Vector database built and persisted successfully!');
  console.log(`📁 Location: ${PERSIST_DIR}\n`);
}

// Run the script
buildVectorDB().catch(console.error);
