// Client-side API functions for data management
const API_BASE = '/api/admin/data-management';

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
