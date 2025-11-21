import { queryVectorDB, retrieveRelevantDocs } from '../src/lib/vectordb.js';
import { config } from 'dotenv';

config();

async function testVectorDB() {
  console.log('🧪 Testing Vector Database...\n');
  
  try {
    // Test 1: Simple query
    console.log('Test 1: Querying about AI experience...');
    const answer1 = await queryVectorDB('What is Tim\'s experience with AI and machine learning?', {
      topK: 2,
      temperature: 0.7,
    });
    console.log('✅ Answer:', answer1.substring(0, 200) + '...\n');
    
    // Test 2: Document retrieval
    console.log('Test 2: Retrieving documents about WebGL...');
    const docs = await retrieveRelevantDocs('WebGL and Three.js projects', 2);
    console.log(`✅ Found ${docs.length} relevant documents:`);
    docs.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.metadata.title} (score: ${doc.score.toFixed(3)})`);
    });
    console.log();
    
    // Test 3: High School query (from PDF)
    console.log('Test 3: Querying about high school...');
    const answer3 = await queryVectorDB('What high school did Tim attend?', {
      topK: 3,
      temperature: 0.5,
    });
    console.log('✅ Answer:', answer3.substring(0, 200) + '...\n');
    
    console.log('✅ All tests passed! Vector database is working correctly.\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testVectorDB();
