# Vector Database Setup

This directory contains the vector database implementation for Tim's portfolio, enabling semantic search and RAG (Retrieval-Augmented Generation) capabilities across PDFs and blog content.

## 📁 Directory Structure

```
data/
├── pdfs/              # Place your PDF files here
└── vectordb/          # Generated vector database (auto-created)

scripts/
└── build-vectordb.ts  # Script to build the vector database

src/
├── lib/
│   ├── vectordb.ts    # Vector DB query interface
│   └── context.ts     # Portfolio context
└── pages/api/
    ├── query.ts       # Standard query API
    └── stream.ts      # Streaming query API
```

## 🚀 Setup Instructions

### 1. Add Your PDF Files

Copy your PDF files to the `data/pdfs/` directory:

```bash
# From your Desktop
cp ~/Desktop/TIM/CV_temirlan_dzhoroev.pdf ./data/pdfs/
cp ~/Desktop/TIM/Canonical_written_Temirlan.pdf ./data/pdfs/
```

### 2. Set Up Environment Variables

Make sure your `.env` file contains your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Build the Vector Database

Run the build script to process all PDFs and blog posts:

```bash
npm run build:vectordb
```

This will:
- ✅ Extract text from all PDFs in `data/pdfs/`
- ✅ Load all blog posts from `src/content/blog/`
- ✅ Generate embeddings using OpenAI's `text-embedding-3-small`
- ✅ Create a persistent vector index in `data/vectordb/`

## 📚 What Gets Indexed

### Blog Posts
All markdown files from `src/content/blog/`:
- Redbrick Frontend UX Engineer
- Computational Design: Palm Art
- Custom GPT Integration
- Fitts Law Face Tracking
- Publications

### PDF Documents
All PDFs from `data/pdfs/`:
- CV_temirlan_dzhoroev.pdf

### Text Documents
All text files from `data/docs/`:
- general_background.txt

## 🔍 Usage

### API Endpoints

#### 1. Standard Chat Endpoint (`/api/chat`)

Returns a complete JSON response. Used by the current frontend.

**Request:**
```json
POST /api/chat
{
  "message": "What is Tim's experience with AI?"
}
```

**Response:**
```json
{
  "answer": "Tim has extensive experience with AI..."
}
```
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is Tim\'s experience with AI?',
  }),
});

const { response: answer } = await response.json();
```



#### 3. Streaming Query (POST `/api/stream`)

```typescript
const response = await fetch('/api/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Tell me about Tim\'s publications',
    topK: 3,
    temperature: 0.7,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      
      const { chunk: text } = JSON.parse(data);
      console.log(text); // Display chunk
    }
  }
}
```

### Direct Usage in Code

```typescript
import { queryVectorDB, retrieveRelevantDocs } from '@/lib/vectordb';

// Full RAG query
const answer = await queryVectorDB('What are Tim\'s skills?', {
  topK: 3,
  temperature: 0.7,
  includeContext: true,
});

// Just retrieve relevant documents
const docs = await retrieveRelevantDocs('Three.js projects', 3);
```

## 🔧 Configuration

### Models Used
- **Embeddings**: `text-embedding-3-large` (High precision)
- **LLM**: `gpt-4o` (Fastest and most capable)

### Chunk Size & Overlap
LlamaIndex handles chunking automatically. To customize, modify the document loading in `scripts/build-vectordb.ts`.

## 🔄 Updating the Database

Whenever you add new PDFs or blog posts, rebuild the database:

```bash
npm run build:vectordb
```

## 📊 Monitoring

The build script provides detailed output:

```
🚀 Building Vector Database...

📚 Loading documents...

✓ Loaded blog post: Architecting a Web-based 3D Game Engine
✓ Loaded blog post: Building an AI Copilot with RAG & Vector Search
✓ Loaded PDF: CV_temirlan_dzhoroev.pdf
✓ Loaded PDF: Canonical_written_Temirlan.pdf

✓ Total documents loaded: 6
  - Blog posts: 4
  - PDFs: 2

🔨 Creating vector index...

✅ Vector database built and persisted successfully!
📁 Location: ./data/vectordb
```

## 🎯 Integration with Chat Component

To integrate with your existing `HeroChat.astro` component, update the chat handler to use the streaming API:

```typescript
async function sendMessage(message: string) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: message }),
  });
  
  // Handle streaming response...
}
```

## 🚨 Troubleshooting

### "Vector database not initialized"
Run `npm run build:vectordb` to create the database.

### "OPENAI_API_KEY not found"
Add your OpenAI API key to the `.env` file.

### Empty responses
Check that PDFs and blog posts are being loaded correctly. Review the build script output.

## 📝 Notes

- The vector database is **persistent** - it's saved to disk in `data/vectordb/`
- You only need to rebuild when content changes
- The database is **committed** to git for Vercel deployment
- PDF extraction quality depends on the PDF structure (scanned PDFs may have poor results)

## 🔐 Security

- Never commit your `.env` file
- The vector database doesn't contain sensitive data (it's just embeddings)
- API endpoints should be rate-limited in production
