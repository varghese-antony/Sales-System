/**
 * Test script to verify all data is properly loaded
 * Run with: node scripts/test-data-loading.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, description) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    console.log(`\n✓ ${description}`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Data:`, JSON.stringify(data).substring(0, 200) + '...');
    
    return { success: true, data };
  } catch (error) {
    console.log(`\n✗ ${description}`);
    console.log(`  Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Data Loading Test Suite');
  console.log('='.repeat(60));
  
  // Test sensor options for indoor products
  await testAPI(
    '/api/products/sensor-options?productName=LED%20Ultra%20Slim%20Downlight&type=indoor',
    'Indoor Product: LED Ultra Slim Downlight - Sensor Options'
  );
  
  await testAPI(
    '/api/products/sensor-options?productName=High%20Bay%20UFO&type=indoor',
    'Indoor Product: High Bay UFO - Sensor Options'
  );
  
  await testAPI(
    '/api/products/sensor-options?productName=A19%20LED%20Bulb&type=indoor',
    'Indoor Product: A19 LED Bulb - Sensor Options'
  );
  
  // Test sensor options for outdoor products (if any exist)
  await testAPI(
    '/api/products/sensor-options?productName=LED%20Wall%20Pack&type=outdoor',
    'Outdoor Product: LED Wall Pack - Sensor Options'
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('Test Suite Complete');
  console.log('='.repeat(60));
  console.log('\nNote: If you see 404 errors, the dev server needs to be restarted.');
  console.log('Run: npm run dev');
}

runTests().catch(console.error);
