#!/usr/bin/env node

/**
 * Quick verification script for V2 API routes
 * Tests basic functionality of all V2 endpoints
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Response keys: ${Object.keys(data).join(', ')}`);
      return { success: true, data };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   ❌ Error: ${data.error || 'Unknown error'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting V2 API Routes Verification\n');
  console.log('=' .repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Data Management - Get Products (Indoor)
  let result = await testEndpoint(
    'Data Management - Get Indoor Products',
    `${API_BASE_URL}/api/admin/data-management-v2?table=indoor&page=1&limit=5`
  );
  results.total++;
  result.success ? results.passed++ : results.failed++;

  // Test 2: Data Management - Get Products (Outdoor)
  result = await testEndpoint(
    'Data Management - Get Outdoor Products',
    `${API_BASE_URL}/api/admin/data-management-v2?table=outdoor&page=1&limit=5`
  );
  results.total++;
  result.success ? results.passed++ : results.failed++;

  // Test 3: Data Management - Get Categories
  result = await testEndpoint(
    'Data Management - Get Categories',
    `${API_BASE_URL}/api/admin/data-management-v2?action=categories&table=indoor`
  );
  results.total++;
  result.success ? results.passed++ : results.failed++;

  // Test 4: Data Management - Get Product Types
  result = await testEndpoint(
    'Data Management - Get Product Types',
    `${API_BASE_URL}/api/admin/data-management-v2?action=productTypes&table=indoor`
  );
  results.total++;
  result.success ? results.passed++ : results.failed++;

  // Test 5: Data Management - Search
  result = await testEndpoint(
    'Data Management - Search Products',
    `${API_BASE_URL}/api/admin/data-management-v2?table=indoor&search=LED&page=1&limit=5`
  );
  results.total++;
  result.success ? results.passed++ : results.failed++;

  // Test 6: Data Management - Invalid Table (should fail with 400)
  result = await testEndpoint(
    'Data Management - Invalid Table Parameter',
    `${API_BASE_URL}/api/admin/data-management-v2?table=invalid`
  );
  results.total++;
  // This should fail with 400, so we expect success: false
  !result.success ? results.passed++ : results.failed++;

  // Test 7: Dashboard Stats
  result = await testEndpoint(
    'Dashboard Stats V2',
    `${API_BASE_URL}/api/admin/dashboard-stats-v2`
  );
  results.total++;
  result.success ? results.passed++ : results.failed++;

  // Test 8: Recent Activity
  result = await testEndpoint(
    'Recent Activity V2',
    `${API_BASE_URL}/api/admin/recent-activity-v2`
  );
  results.total++;
  result.success ? results.passed++ : results.failed++;

  // Test 9: POST - Invalid Action (should fail with 400)
  result = await testEndpoint(
    'Data Management POST - Invalid Action',
    `${API_BASE_URL}/api/admin/data-management-v2`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalidAction' })
    }
  );
  results.total++;
  // This should fail with 400, so we expect success: false
  !result.success ? results.passed++ : results.failed++;

  // Test 10: POST - Missing Parameters (should fail with 400)
  result = await testEndpoint(
    'Data Management POST - Missing Parameters',
    `${API_BASE_URL}/api/admin/data-management-v2`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', type: 'indoor' }) // Missing searchTerm
    }
  );
  results.total++;
  // This should fail with 400, so we expect success: false
  !result.success ? results.passed++ : results.failed++;

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
