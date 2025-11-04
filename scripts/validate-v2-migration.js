/**
 * Manual Validation Script for Admin V2 Tables Migration
 * 
 * This script validates the complete migration by testing all workflows:
 * - Data Entry
 * - Price Entry
 * - Price Variation
 * - Enquiry Management
 * - Data Management
 */

import {
  createProductsV2,
  getAllProductsV2,
  updateProductV2,
  deleteProductV2,
  bulkUpdateProductsV2,
  bulkDeleteProductsV2,
  getProductByIdV2,
  getProductsByIdsV2,
  searchProductsV2,
  getProductsWithPaginationV2,
  getDistinctCategoriesV2,
  getDistinctProductTypesV2,
  updateProductPricesV2,
  fieldMappingV2
} from '../src/lib/database/products-v2.js';

// Test data
const TEST_PRODUCT = {
  sub_category: 'V2 Migration Test',
  product_name: 'Test Product V2',
  model_number: `TEST-V2-${Date.now()}`,
  size: '6 inch',
  power_w: '15W',
  voltage: '220V',
  cct: '4000K',
  cri_ra: '80',
  lumen: '1200',
  efficacy_lumen_per_w: '80',
  dimming_type: '0-10V',
  material_finish: 'White',
  mounting: 'Recessed',
  certifications: 'CE, RoHS',
  warranty: '3 years',
  moq: '100',
  price_per_piece: '25.50'
};

const createdIds = [];
let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    log(`✓ ${message}`, 'success');
    return true;
  } else {
    testsFailed++;
    log(`✗ ${message}`, 'error');
    return false;
  }
}

async function test1_DataEntry() {
  log('\n=== Test 1: Data Entry Workflow ===', 'info');
  
  try {
    // Create product
    const { data, error } = await createProductsV2('indoor', [TEST_PRODUCT]);
    
    assert(!error, 'Product created without errors');
    assert(data && data.length === 1, 'Product data returned');
    assert(data[0].product_name === TEST_PRODUCT.product_name, 'Product name matches');
    assert(data[0].sub_category === TEST_PRODUCT.sub_category, 'Sub-category matches');
    assert(data[0].price_per_piece === TEST_PRODUCT.price_per_piece, 'Price per piece matches');
    
    if (data && data[0]) {
      createdIds.push(data[0].id);
      log(`Created product ID: ${data[0].id}`, 'info');
    }
    
    // Create variations
    const variations = [
      { ...TEST_PRODUCT, model_number: `TEST-V2-VAR1-${Date.now()}`, size: '4 inch', power_w: '10W' },
      { ...TEST_PRODUCT, model_number: `TEST-V2-VAR2-${Date.now()}`, size: '8 inch', power_w: '20W' }
    ];
    
    const { data: varData, error: varError } = await createProductsV2('indoor', variations);
    assert(!varError, 'Variations created without errors');
    assert(varData && varData.length === 2, 'Two variations created');
    
    if (varData) {
      varData.forEach(v => createdIds.push(v.id));
    }
    
  } catch (error) {
    log(`Test 1 failed with error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function test2_PriceEntry() {
  log('\n=== Test 2: Price Entry Workflow ===', 'info');
  
  try {
    if (createdIds.length === 0) {
      log('Skipping test 2: No products created', 'warning');
      return;
    }
    
    const productId = createdIds[0];
    
    // Update price
    const newPrice = '99.99';
    const { data, error } = await updateProductV2('indoor', productId, {
      pricePerPiece: newPrice
    });
    
    assert(!error, 'Price updated without errors');
    assert(data && data[0].price_per_piece === newPrice, 'Price matches new value');
    
    // Bulk price update
    if (createdIds.length >= 2) {
      const priceUpdates = createdIds.slice(0, 2).map((id, index) => ({
        id,
        type: 'indoor',
        price: `${50 + index}.00`
      }));
      
      const { results, error: bulkError } = await updateProductPricesV2(priceUpdates);
      assert(!bulkError, 'Bulk price update without errors');
      assert(results && results.length === 2, 'Two prices updated');
    }
    
  } catch (error) {
    log(`Test 2 failed with error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function test3_PriceVariation() {
  log('\n=== Test 3: Price Variation Workflow ===', 'info');
  
  try {
    // Fetch distinct product types
    const { data: types, error: typesError } = await getDistinctProductTypesV2('indoor');
    assert(!typesError, 'Fetched product types without errors');
    assert(types && Array.isArray(types), 'Product types is an array');
    
    // Fetch products by type
    const { data: products, error: productsError } = await getAllProductsV2('indoor', {
      productName: TEST_PRODUCT.product_name
    });
    assert(!productsError, 'Fetched products by type without errors');
    assert(products && Array.isArray(products), 'Products is an array');
    
  } catch (error) {
    log(`Test 3 failed with error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function test4_EnquiryManagement() {
  log('\n=== Test 4: Enquiry Management Integration ===', 'info');
  
  try {
    if (createdIds.length === 0) {
      log('Skipping test 4: No products created', 'warning');
      return;
    }
    
    // Fetch products by IDs
    const references = createdIds.slice(0, 2).map(id => ({ type: 'indoor', id }));
    const products = await getProductsByIdsV2(references);
    
    assert(products && products.length > 0, 'Fetched products by IDs');
    assert(products[0].product_name !== undefined, 'Product has product_name field');
    assert(products[0].model_number !== undefined, 'Product has model_number field');
    
    // Verify v2 field names
    const productId = createdIds[0];
    const { data, error } = await getProductByIdV2('indoor', productId);
    
    assert(!error, 'Fetched product by ID without errors');
    assert(data && data.sub_category !== undefined, 'Product has sub_category field');
    assert(data && data.price_per_piece !== undefined, 'Product has price_per_piece field');
    
  } catch (error) {
    log(`Test 4 failed with error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function test5_DataManagement() {
  log('\n=== Test 5: Data Management CRUD Operations ===', 'info');
  
  try {
    // Read with pagination
    const { data: paginatedData, count, error: paginationError } = await getProductsWithPaginationV2(
      'indoor',
      {},
      { currentPage: 1, pageSize: 10 }
    );
    
    assert(!paginationError, 'Fetched paginated products without errors');
    assert(paginatedData && Array.isArray(paginatedData), 'Paginated data is an array');
    assert(typeof count === 'number', 'Count is a number');
    
    // Search
    const { data: searchData, error: searchError } = await searchProductsV2('indoor', 'TEST-V2');
    assert(!searchError, 'Search completed without errors');
    assert(searchData && Array.isArray(searchData), 'Search results is an array');
    
    // Filter by category
    const { data: filteredData, error: filterError } = await getAllProductsV2('indoor', {
      subCategory: TEST_PRODUCT.sub_category
    });
    assert(!filterError, 'Filtered products without errors');
    assert(filteredData && Array.isArray(filteredData), 'Filtered data is an array');
    
    // Update
    if (createdIds.length > 0) {
      const productId = createdIds[0];
      const { data: updateData, error: updateError } = await updateProductV2('indoor', productId, {
        warranty: '10 years'
      });
      assert(!updateError, 'Updated product without errors');
      assert(updateData && updateData[0].warranty === '10 years', 'Warranty updated correctly');
    }
    
    // Bulk update
    if (createdIds.length >= 2) {
      const { data: bulkData, error: bulkError } = await bulkUpdateProductsV2(
        'indoor',
        createdIds.slice(0, 2),
        { certifications: 'CE, RoHS, UL' }
      );
      assert(!bulkError, 'Bulk update without errors');
      assert(bulkData && bulkData.length === 2, 'Two products updated');
    }
    
  } catch (error) {
    log(`Test 5 failed with error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function test6_FieldMapping() {
  log('\n=== Test 6: Field Mapping Validation ===', 'info');
  
  try {
    // Verify field mappings
    assert(fieldMappingV2.subCategory === 'sub_category', 'subCategory maps to sub_category');
    assert(fieldMappingV2.productName === 'product_name', 'productName maps to product_name');
    assert(fieldMappingV2.pricePerPiece === 'price_per_piece', 'pricePerPiece maps to price_per_piece');
    assert(fieldMappingV2.pricePc === 'price_per_piece', 'pricePc maps to price_per_piece');
    assert(fieldMappingV2.powerW === 'power_w', 'powerW maps to power_w');
    assert(fieldMappingV2.criRa === 'cri_ra', 'criRa maps to cri_ra');
    
    // Test frontend to database mapping
    const frontendData = {
      subCategory: 'Frontend Test',
      productName: 'Frontend Product',
      modelNumber: `FRONTEND-${Date.now()}`,
      pricePerPiece: '75.00',
      powerW: '18W'
    };
    
    const { data, error } = await createProductsV2('indoor', [frontendData]);
    assert(!error, 'Created product with frontend field names');
    assert(data && data[0].sub_category === frontendData.subCategory, 'Frontend mapping works');
    
    if (data && data[0]) {
      createdIds.push(data[0].id);
    }
    
  } catch (error) {
    log(`Test 6 failed with error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function test7_DataIntegrity() {
  log('\n=== Test 7: Data Integrity Verification ===', 'info');
  
  try {
    if (createdIds.length === 0) {
      log('Skipping test 7: No products created', 'warning');
      return;
    }
    
    const productId = createdIds[0];
    
    // Fetch and verify v2 field names
    const { data, error } = await getProductByIdV2('indoor', productId);
    
    assert(!error, 'Fetched product without errors');
    assert(data && 'sub_category' in data, 'Product has sub_category field');
    assert(data && 'product_name' in data, 'Product has product_name field');
    assert(data && 'price_per_piece' in data, 'Product has price_per_piece field');
    assert(data && 'power_w' in data, 'Product has power_w field');
    
    // Verify legacy fields don't exist
    assert(data && !('name' in data), 'Product does not have legacy "name" field');
    assert(data && !('price_pc' in data), 'Product does not have legacy "price_pc" field');
    assert(data && !('Indoor' in data), 'Product does not have legacy "Indoor" field');
    
  } catch (error) {
    log(`Test 7 failed with error: ${error.message}`, 'error');
    testsFailed++;
  }
}

async function cleanup() {
  log('\n=== Cleanup ===', 'info');
  
  try {
    if (createdIds.length > 0) {
      log(`Deleting ${createdIds.length} test products...`, 'info');
      const { data, error } = await bulkDeleteProductsV2('indoor', createdIds);
      
      if (error) {
        log(`Cleanup error: ${error}`, 'warning');
      } else {
        log(`Successfully deleted ${data ? data.length : 0} products`, 'success');
      }
    }
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'warning');
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'info');
  log('║   Admin V2 Tables Migration Validation Script         ║', 'info');
  log('╚════════════════════════════════════════════════════════╝', 'info');
  
  try {
    await test1_DataEntry();
    await test2_PriceEntry();
    await test3_PriceVariation();
    await test4_EnquiryManagement();
    await test5_DataManagement();
    await test6_FieldMapping();
    await test7_DataIntegrity();
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'error');
  } finally {
    await cleanup();
    
    log('\n╔════════════════════════════════════════════════════════╗', 'info');
    log('║                   Test Summary                         ║', 'info');
    log('╚════════════════════════════════════════════════════════╝', 'info');
    log(`\nTests Passed: ${testsPassed}`, 'success');
    log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
    log(`Total Tests: ${testsPassed + testsFailed}\n`, 'info');
    
    if (testsFailed === 0) {
      log('✓ All tests passed! V2 migration is working correctly.', 'success');
      process.exit(0);
    } else {
      log('✗ Some tests failed. Please review the errors above.', 'error');
      process.exit(1);
    }
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\nUnexpected error: ${error.message}`, 'error');
  process.exit(1);
});
