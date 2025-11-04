import { NextResponse } from 'next/server';
import {
  getProductsWithPaginationV2,
  getProductByIdV2,
  createProductsV2,
  updateProductV2,
  deleteProductV2,
  bulkDeleteProductsV2,
  bulkSetCategoryV2,
  updateProductPricesV2,
  bulkUpdateProductsV2,
  searchProductsV2,
  getDistinctCategoriesV2,
  getDistinctProductTypesV2
} from '@/lib/database/products-v2';

/**
 * GET /api/admin/data-management-v2
 * Handles fetching products from v2 tables with pagination, filters, and metadata
 * 
 * Query Parameters:
 * - action: 'categories' | 'productTypes' | default (get products)
 * - table: 'indoor' | 'outdoor' | 'both'
 * - page: number (default: 1)
 * - limit: number (default: 50)
 * - search: string (search term)
 * - category: string (filter by sub_category)
 * - productType: string (filter by product_name)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tableParam = searchParams.get('table') || 'indoor';
    const table = tableParam === 'both' ? 'both' : tableParam;

    // Validate table parameter
    if (table !== 'indoor' && table !== 'outdoor' && table !== 'both') {
      return NextResponse.json(
        { error: 'Invalid table parameter. Must be "indoor", "outdoor", or "both"' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'categories') {
      if (table === 'both') {
        // Fetch categories from both tables
        const [indoorResult, outdoorResult] = await Promise.all([
          getDistinctCategoriesV2('indoor'),
          getDistinctCategoriesV2('outdoor')
        ]);

        if (indoorResult.error || outdoorResult.error) {
          return NextResponse.json(
            { 
              error: 'Failed to fetch categories from v2 tables',
              details: indoorResult.error || outdoorResult.error
            },
            { status: 500 }
          );
        }

        // Combine and deduplicate categories
        const allCategories = [
          ...(indoorResult.data || []),
          ...(outdoorResult.data || [])
        ];
        const uniqueCategories = Array.from(
          new Set(allCategories.map(c => c.sub_category))
        ).map(sub_category => ({ sub_category }));

        return NextResponse.json(uniqueCategories);
      } else {
        const result = await getDistinctCategoriesV2(table);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to fetch categories from ${table}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        return NextResponse.json(result.data);
      }
    }

    if (action === 'productTypes') {
      if (table === 'both') {
        // Fetch product types from both tables
        const [indoorResult, outdoorResult] = await Promise.all([
          getDistinctProductTypesV2('indoor'),
          getDistinctProductTypesV2('outdoor')
        ]);

        if (indoorResult.error || outdoorResult.error) {
          return NextResponse.json(
            { 
              error: 'Failed to fetch product types from v2 tables',
              details: indoorResult.error || outdoorResult.error
            },
            { status: 500 }
          );
        }

        // Combine and deduplicate product types
        const allTypes = [
          ...(indoorResult.data || []),
          ...(outdoorResult.data || [])
        ];
        const uniqueTypes = Array.from(
          new Set(allTypes.map(t => t.product_name))
        ).map(product_name => ({ producttype: product_name, product_name }));

        return NextResponse.json(uniqueTypes);
      } else {
        const result = await getDistinctProductTypesV2(table);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to fetch product types from ${table}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        return NextResponse.json(result.data);
      }
    }

    // Default: Get products with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const productType = searchParams.get('productType') || '';

    // Build filters object using v2 field names
    const filters = {};
    if (category) filters.subCategory = category;
    if (productType) filters.productName = productType;
    if (search) {
      // For search, we'll use the search function instead
      if (table === 'both') {
        const [indoorResult, outdoorResult] = await Promise.all([
          searchProductsV2('indoor', search),
          searchProductsV2('outdoor', search)
        ]);

        if (indoorResult.error || outdoorResult.error) {
          return NextResponse.json(
            { 
              error: 'Failed to search products in v2 tables',
              details: indoorResult.error || outdoorResult.error
            },
            { status: 500 }
          );
        }

        const allProducts = [
          ...(indoorResult.data || []).map(p => ({ ...p, type: 'indoor' })),
          ...(outdoorResult.data || []).map(p => ({ ...p, type: 'outdoor' }))
        ];

        // Apply pagination to combined results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = allProducts.slice(startIndex, endIndex);

        const indoorCount = (indoorResult.data || []).length;
        const outdoorCount = (outdoorResult.data || []).length;

        const response = NextResponse.json({
          data: paginatedData,
          count: allProducts.length,
          countsByType: {
            indoor: indoorCount,
            outdoor: outdoorCount
          },
          filterOptions: null,
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(allProducts.length / limit)
        });
        response.headers.set('Cache-Control', 'private, max-age=120');
        response.headers.set('Vary', 'Accept-Encoding');
        return response;
      } else {
        const result = await searchProductsV2(table, search);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to search products in ${table}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }

        // Apply pagination to search results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = result.data.slice(startIndex, endIndex);

        const response = NextResponse.json({
          data: paginatedData,
          count: result.data.length,
          countsByType: {
            indoor: table === 'indoor' ? result.data.length : 0,
            outdoor: table === 'outdoor' ? result.data.length : 0
          },
          filterOptions: null,
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(result.data.length / limit)
        });
        response.headers.set('Cache-Control', 'private, max-age=120');
        response.headers.set('Vary', 'Accept-Encoding');
        return response;
      }
    }

    // Regular pagination without search
    if (table === 'both') {
      const [indoorResult, outdoorResult] = await Promise.all([
        getProductsWithPaginationV2('indoor', filters, { currentPage: page, pageSize: limit }),
        getProductsWithPaginationV2('outdoor', filters, { currentPage: page, pageSize: limit })
      ]);

      if (indoorResult.error || outdoorResult.error) {
        return NextResponse.json(
          { 
            error: 'Failed to fetch products from v2 tables',
            details: indoorResult.error || outdoorResult.error
          },
          { status: 500 }
        );
      }

      const allProducts = [
        ...(indoorResult.data || []).map(p => ({ ...p, type: 'indoor' })),
        ...(outdoorResult.data || []).map(p => ({ ...p, type: 'outdoor' }))
      ];
      const totalCount = (indoorResult.count || 0) + (outdoorResult.count || 0);

      const response = NextResponse.json({
        data: allProducts,
        count: totalCount,
        countsByType: {
          indoor: indoorResult.count || 0,
          outdoor: outdoorResult.count || 0
        },
        filterOptions: null, // TODO: Implement filter options aggregation
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit)
      });
      response.headers.set('Cache-Control', 'private, max-age=120');
      response.headers.set('Vary', 'Accept-Encoding');
      return response;
    } else {
      const result = await getProductsWithPaginationV2(table, filters, {
        currentPage: page,
        pageSize: limit
      });

      if (result.error) {
        return NextResponse.json(
          { 
            error: `Failed to fetch products from ${table}_products_v2 table`,
            details: result.error
          },
          { status: 500 }
        );
      }

      const response = NextResponse.json({
        data: result.data,
        count: result.count,
        countsByType: {
          indoor: table === 'indoor' ? result.count || 0 : 0,
          outdoor: table === 'outdoor' ? result.count || 0 : 0
        },
        filterOptions: null, // TODO: Implement filter options
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil((result.count || 0) / limit)
      });
      response.headers.set('Cache-Control', 'private, max-age=120');
      response.headers.set('Vary', 'Accept-Encoding');
      return response;
    }
  } catch (error) {
    console.error('API Error in data-management-v2:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error in v2 data management API',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/data-management-v2
 * Handles CRUD operations on v2 tables
 * 
 * Body Parameters:
 * - action: 'create' | 'update' | 'delete' | 'bulkDelete' | 'updatePrices' | 'bulkUpdate' | 'search'
 * - Additional parameters based on action
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Validate action
    const validActions = ['create', 'update', 'delete', 'bulkDelete', 'bulkSetCategory', 'updatePrices', 'bulkUpdate', 'search'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'create':
        // Validate required parameters
        if (!params.type || !params.products) {
          return NextResponse.json(
            { error: 'Missing required parameters: type and products' },
            { status: 400 }
          );
        }
        result = await createProductsV2(params.type, params.products);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to create products in ${params.type}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        break;

      case 'update':
        // Validate required parameters
        if (!params.type || !params.id || !params.updateData) {
          return NextResponse.json(
            { error: 'Missing required parameters: type, id, and updateData' },
            { status: 400 }
          );
        }
        result = await updateProductV2(params.type, params.id, params.updateData);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to update product in ${params.type}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        break;

      case 'delete':
        // Validate required parameters
        if (!params.type || !params.id) {
          return NextResponse.json(
            { error: 'Missing required parameters: type and id' },
            { status: 400 }
          );
        }
        result = await deleteProductV2(params.type, params.id);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to delete product from ${params.type}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        break;

      case 'bulkDelete':
        // Validate required parameters
        if (!params.type || !params.ids || !Array.isArray(params.ids)) {
          return NextResponse.json(
            { error: 'Missing required parameters: type and ids (array)' },
            { status: 400 }
          );
        }
        result = await bulkDeleteProductsV2(params.type, params.ids);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to bulk delete products from ${params.type}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        break;

      case 'bulkSetCategory':
        // Validate required parameters
        if (!params.type || !params.ids || !Array.isArray(params.ids) || params.categoryValue === undefined) {
          return NextResponse.json(
            { error: 'Missing required parameters: type, ids (array), and categoryValue' },
            { status: 400 }
          );
        }
        result = await bulkSetCategoryV2(params.type, params.ids, params.categoryValue);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to bulk set category in ${params.type}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        break;

      case 'updatePrices':
        // Validate required parameters
        if (!params.priceUpdates || !Array.isArray(params.priceUpdates)) {
          return NextResponse.json(
            { error: 'Missing required parameter: priceUpdates (array)' },
            { status: 400 }
          );
        }
        result = await updateProductPricesV2(params.priceUpdates);
        if (result.error) {
          return NextResponse.json(
            { 
              error: 'Failed to update prices in v2 tables',
              details: result.error
            },
            { status: 500 }
          );
        }
        break;

      case 'bulkUpdate':
        // Validate required parameters
        if (!params.type || !params.ids || !Array.isArray(params.ids) || !params.updateData) {
          return NextResponse.json(
            { error: 'Missing required parameters: type, ids (array), and updateData' },
            { status: 400 }
          );
        }
        result = await bulkUpdateProductsV2(params.type, params.ids, params.updateData);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to bulk update products in ${params.type}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        break;

      case 'search':
        // Validate required parameters
        if (!params.type || !params.searchTerm) {
          return NextResponse.json(
            { error: 'Missing required parameters: type and searchTerm' },
            { status: 400 }
          );
        }
        result = await searchProductsV2(params.type, params.searchTerm);
        if (result.error) {
          return NextResponse.json(
            { 
              error: `Failed to search products in ${params.type}_products_v2 table`,
              details: result.error
            },
            { status: 500 }
          );
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Successfully completed ${action} operation on v2 tables`
    });
  } catch (error) {
    console.error('API Error in data-management-v2 POST:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error in v2 data management API',
        details: error.message
      },
      { status: 500 }
    );
  }
}
