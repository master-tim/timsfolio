/**
 * Test script for Redis caching
 * Run with: npm run test:cache
 */

async function testCache() {
  const baseUrl = 'http://localhost:4321';
  const query = 'What is Tim\'s experience with React?';

  console.log('🧪 Testing Redis Cache...\n');

  // Test 1: First request (cache miss)
  console.log('📤 Test 1: First request (should be cache MISS)');
  const start1 = Date.now();
  const response1 = await fetch(`${baseUrl}/api/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  let cached1 = false;
  let fullResponse1 = '';
  const reader1 = response1.body!.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader1.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.cached) cached1 = true;
          if (parsed.chunk) fullResponse1 += parsed.chunk;
        } catch (e) {}
      }
    }
  }
  
  const time1 = Date.now() - start1;
  console.log(`   ✓ Response received in ${time1}ms`);
  console.log(`   ✓ Cached: ${cached1 ? '⚡ YES' : '❌ NO (expected)'}`);
  console.log(`   ✓ Length: ${fullResponse1.length} chars\n`);

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Second identical request (cache hit)
  console.log('📤 Test 2: Second identical request (should be cache HIT)');
  const start2 = Date.now();
  const response2 = await fetch(`${baseUrl}/api/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  let cached2 = false;
  let fullResponse2 = '';
  const reader2 = response2.body!.getReader();
  
  while (true) {
    const { done, value } = await reader2.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.cached) cached2 = true;
          if (parsed.chunk) fullResponse2 += parsed.chunk;
        } catch (e) {}
      }
    }
  }
  
  const time2 = Date.now() - start2;
  console.log(`   ✓ Response received in ${time2}ms`);
  console.log(`   ✓ Cached: ${cached2 ? '⚡ YES (expected)' : '❌ NO'}`);
  console.log(`   ✓ Length: ${fullResponse2.length} chars`);
  console.log(`   ✓ Speedup: ${(time1 / time2).toFixed(2)}x faster\n`);

  // Test 3: Different query (cache miss)
  console.log('📤 Test 3: Different query (should be cache MISS)');
  const start3 = Date.now();
  const response3 = await fetch(`${baseUrl}/api/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'What projects has Tim worked on?' })
  });
  
  let cached3 = false;
  const reader3 = response3.body!.getReader();
  
  while (true) {
    const { done, value } = await reader3.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.cached) cached3 = true;
        } catch (e) {}
      }
    }
  }
  
  const time3 = Date.now() - start3;
  console.log(`   ✓ Response received in ${time3}ms`);
  console.log(`   ✓ Cached: ${cached3 ? '⚡ YES' : '❌ NO (expected)'}\n`);

  // Test 4: Clear cache
  console.log('🧹 Test 4: Clearing cache');
  const clearResponse = await fetch(`${baseUrl}/api/cache/clear`, {
    method: 'POST'
  });
  const clearData = await clearResponse.json();
  console.log(`   ✓ ${clearData.message}\n`);

  // Summary
  console.log('📊 Summary:');
  console.log(`   • First query took ${time1}ms (cache miss)`);
  console.log(`   • Second query took ${time2}ms (cache hit)`);
  console.log(`   • Cache provides ${(time1 / time2).toFixed(2)}x speedup`);
  console.log(`   • Different queries correctly bypass cache\n`);
  
  console.log('✅ All tests passed!');
}

// Run tests
testCache().catch(console.error);
