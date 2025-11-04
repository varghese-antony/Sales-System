// Client-side API functions for data management
import { cacheManager } from '../cache-manager';

const API_BASE = '/api/admin/data-management';
const API_BASE_V2 = '/api/admin/data-management-v2';

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,    // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000,   // 5 minutes - for moderately stable data
  LONG: 10 * 60 * 1000,    // 10 minutes - for stable data like categories
};

// Helper function to generate cache keys
function generateCacheKey(prefix, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `${prefix}|${sortedParams}`;
}

// Helper function to invalidate related caches
function invalidateProductCaches(table) {
  cacheManager.invalidatePattern(`^v2:products:${table}`);
  cacheManager.invalidatePattern(`^v2:categories:${table}`);
  cacheManager.invalidatePattern(`^v2:productTypes:${table}`);
  cacheManager.invalidatePattern(`^v2:search:${table}`);
}

// Get products with pagination and filters
// @param {AbortSignal|null} signal Optional abort signal for request cancellation
export async function getProductsWithPaginationClient(table, page = 1, limit = 50, filters = {}, signal = null) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      table,
      ...filters
    });

    const response = await fetch(`${API_BASE}?${params}`, signal ? { signal } : undefined);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to fetch products');
    }

    return {
      data: payload.data || [],
      count: payload.count ?? 0,
      countsByType: payload.countsByType || { indoor: 0, outdoor: 0 },
      filterOptions: payload.filterOptions || null,
      error: null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { data: null, count: 0, countsByType: { indoor: 0, outdoor: 0 }, filterOptions: null, error: 'Request aborted' };
    }
    console.error('Error fetching products:', error);
    return { data: null, count: 0, countsByType: { indoor: 0, outdoor: 0 }, filterOptions: null, error: error.message };
  }
}

// Get distinct categories
export async function getDistinctCategoriesClient(table) {
  try {
    const response = await fetch(`${API_BASE}?table=${table}&action=categories`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch categories');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: null, error: error.message };
  }
}

// Get distinct product types
export async function getDistinctProductTypesClient(table) {
  try {
    const response = await fetch(`${API_BASE}?table=${table}&action=productTypes`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch product types');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching product types:', error);
    return { data: null, error: error.message };
  }
}

// Create products
export async function createProductsClient(products) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        products
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create products');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating products:', error);
    return { data: null, error: error.message };
  }
}

// Update product
export async function updateProductClient(table, id, updateData) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        table,
        id,
        updateData
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update product');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating product:', error);
    return { data: null, error: error.message };
  }
}

// Delete product
export async function deleteProductClient(table, id) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        table,
        id
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete product');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { data: null, error: error.message };
  }
}

// Bulk delete products
export async function bulkDeleteProductsClient(table, ids) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'bulkDelete',
        table,
        ids
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to bulk delete products');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    return { data: null, error: error.message };
  }
}

// Update product prices
export async function updateProductPricesClient(priceUpdates) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updatePrices',
        priceUpdates
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update prices');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating prices:', error);
    return { data: null, error: error.message };
  }
}

// Bulk update products
export async function bulkUpdateProductsClient(table, ids, updateData) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'bulkUpdate',
        table,
        ids,
        updateData
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to bulk update products');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return { data: null, error: error.message };
  }
}

// Bulk set category
export async function bulkSetCategoryClient(table, ids, categoryValue) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'bulkSetCategory',
        table,
        ids,
        categoryValue
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to set category');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error setting category:', error);
    return { data: null, error: error.message };
  }
}

// Search products
export async function searchProductsClient(table, searchTerm) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'search',
        table,
        searchTerm
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to search products');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error searching products:', error);
    return { data: null, error: error.message };
  }
}

// Clear cache
export async function clearCacheClient() {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'clearCache'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to clear cache');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { data: null, error: error.message };
  }
}

// ============================================
// V2 CLIENT FUNCTIONS WITH CACHING
// ============================================

// Get products with pagination and filters (V2)
export async function getProductsWithPaginationClientV2(table, page = 1, limit = 50, filters = {}, signal = null) {
  const cacheKey = generateCacheKey(`v2:products:${table}`, { page, limit, ...filters });
  
  // Check cache first (skip cache if signal is provided for abort capability)
  if (!signal) {
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      table,
      ...filters
    });

    const response = await fetch(`${API_BASE_V2}?${params}`, signal ? { signal } : undefined);
    const payload = await response.json();

    if (!response.ok) {
      const errorMsg = payload.error || 'Failed to fetch products from v2 tables';
      const detailedMsg = payload.details ? `${errorMsg}: ${payload.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    const result = {
      data: payload.data || [],
      count: payload.count ?? 0,
      countsByType: payload.countsByType || { indoor: 0, outdoor: 0 },
      filterOptions: payload.filterOptions || null,
      error: null
    };

    // Cache the result
    if (!signal) {
      cacheManager.set(cacheKey, result, CACHE_TTL.SHORT);
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      return { data: null, count: 0, countsByType: { indoor: 0, outdoor: 0 }, filterOptions: null, error: 'Request aborted' };
    }
    console.error('Error fetching products from v2 tables:', error);
    return { data: null, count: 0, countsByType: { indoor: 0, outdoor: 0 }, filterOptions: null, error: error.message };
  }
}

// Get distinct categories (V2)
export async function getDistinctCategoriesClientV2(table) {
  const cacheKey = `v2:categories:${table}`;
  
  // Check cache first
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(`${API_BASE_V2}?table=${table}&action=categories`);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to fetch categories from v2 tables';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    const result = { data, error: null };
    
    // Cache the result (categories are relatively stable)
    cacheManager.set(cacheKey, result, CACHE_TTL.LONG);

    return result;
  } catch (error) {
    console.error('Error fetching categories from v2 tables:', error);
    return { data: null, error: error.message };
  }
}

// Get distinct product types (V2)
export async function getDistinctProductTypesClientV2(table) {
  const cacheKey = `v2:productTypes:${table}`;
  
  // Check cache first
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(`${API_BASE_V2}?table=${table}&action=productTypes`);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to fetch product types from v2 tables';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    const result = { data, error: null };
    
    // Cache the result (product types are relatively stable)
    cacheManager.set(cacheKey, result, CACHE_TTL.LONG);

    return result;
  } catch (error) {
    console.error('Error fetching product types from v2 tables:', error);
    return { data: null, error: error.message };
  }
}

// Create products (V2)
export async function createProductsClientV2(products) {
  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create',
        products
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to create products in v2 tables';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    // Invalidate caches for all affected tables
    const affectedTables = [...new Set(products.map(p => p.table || 'indoor'))];
    affectedTables.forEach(table => invalidateProductCaches(table));

    return { data, error: null };
  } catch (error) {
    console.error('Error creating products in v2 tables:', error);
    return { data: null, error: error.message };
  }
}

// Update product (V2)
export async function updateProductClientV2(table, id, updateData) {
  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        table,
        id,
        updateData
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to update product in v2 table';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    // Invalidate caches for the affected table
    invalidateProductCaches(table);

    return { data, error: null };
  } catch (error) {
    console.error('Error updating product in v2 table:', error);
    return { data: null, error: error.message };
  }
}

// Delete product (V2)
export async function deleteProductClientV2(table, id) {
  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        table,
        id
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to delete product from v2 table';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    // Invalidate caches for the affected table
    invalidateProductCaches(table);

    return { data, error: null };
  } catch (error) {
    console.error('Error deleting product from v2 table:', error);
    return { data: null, error: error.message };
  }
}

// Bulk delete products (V2)
export async function bulkDeleteProductsClientV2(table, ids) {
  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'bulkDelete',
        table,
        ids
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to bulk delete products from v2 tables';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    // Invalidate caches for the affected table
    invalidateProductCaches(table);

    return { data, error: null };
  } catch (error) {
    console.error('Error bulk deleting products from v2 tables:', error);
    return { data: null, error: error.message };
  }
}

// Update product prices (V2)
export async function updateProductPricesClientV2(priceUpdates) {
  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updatePrices',
        priceUpdates
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to update prices in v2 tables';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    // Invalidate caches for all affected tables
    const affectedTables = [...new Set(priceUpdates.map(p => p.type || 'indoor'))];
    affectedTables.forEach(table => invalidateProductCaches(table));

    return { data, error: null };
  } catch (error) {
    console.error('Error updating prices in v2 tables:', error);
    return { data: null, error: error.message };
  }
}

// Bulk update products (V2)
export async function bulkUpdateProductsClientV2(table, ids, updateData) {
  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'bulkUpdate',
        table,
        ids,
        updateData
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to bulk update products in v2 tables';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    // Invalidate caches for the affected table
    invalidateProductCaches(table);

    return { data, error: null };
  } catch (error) {
    console.error('Error bulk updating products in v2 tables:', error);
    return { data: null, error: error.message };
  }
}

// Bulk set category (V2)
export async function bulkSetCategoryClientV2(table, ids, categoryValue) {
  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'bulkSetCategory',
        table,
        ids,
        categoryValue
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to set category in v2 tables';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    // Invalidate caches for the affected table
    invalidateProductCaches(table);

    return { data, error: null };
  } catch (error) {
    console.error('Error setting category in v2 tables:', error);
    return { data: null, error: error.message };
  }
}

// Search products (V2)
export async function searchProductsClientV2(table, searchTerm) {
  const cacheKey = generateCacheKey(`v2:search:${table}`, { searchTerm });
  
  // Check cache first
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'search',
        table,
        searchTerm
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error || 'Failed to search products in v2 tables';
      const detailedMsg = data.details ? `${errorMsg}: ${data.details}` : errorMsg;
      throw new Error(detailedMsg);
    }

    const result = { data, error: null };
    
    // Cache search results (short TTL as search results can change frequently)
    cacheManager.set(cacheKey, result, CACHE_TTL.SHORT);

    return result;
  } catch (error) {
    console.error('Error searching products in v2 tables:', error);
    return { data: null, error: error.message };
  }
}

// Clear cache (V2)
export async function clearCacheClientV2() {
  try {
    const response = await fetch(API_BASE_V2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'clearCache'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to clear cache');
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { data: null, error: error.message };
  }
}
