import { NextResponse } from 'next/server';
import {
  getProductsWithPagination,
  clearCache,
  getProductById,
  createProducts,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  updateProductPrices,
  bulkUpdateProducts,
  bulkSetCategory,
  searchProducts
} from '@/lib/database/products-optimized';
import { getDistinctCategories, getDistinctProductTypes } from '@/lib/database/products';

// GET /api/admin/data-management - Get products with pagination and filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tableParam = searchParams.get('table') || 'indoor';
    const table = tableParam === 'both' ? 'both' : tableParam;

    // Handle different actions
    if (action === 'categories') {
      const result = await getDistinctCategories(table);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json(result.data);
    }

    if (action === 'productTypes') {
      const result = await getDistinctProductTypes(table);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json(result.data);
    }

    // Default: Get products with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const productType = searchParams.get('productType') || '';

    const result = await getProductsWithPagination(table, {
      search,
      category,
      productType
    }, {
      currentPage: page,
      pageSize: limit
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'private, max-age=120');
    response.headers.set('Vary', 'Accept-Encoding');
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/data-management - Create products
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'create':
        result = await createProducts(params.products);
        break;
      case 'update':
        result = await updateProduct(params.table, params.id, params.updateData);
        break;
      case 'delete':
        result = await deleteProduct(params.table, params.id);
        break;
      case 'bulkDelete':
        result = await bulkDeleteProducts(params.table, params.ids);
        break;
      case 'updatePrices':
        result = await updateProductPrices(params.priceUpdates);
        break;
      case 'bulkUpdate':
        result = await bulkUpdateProducts(params.table, params.ids, params.updateData);
        break;
      case 'bulkSetCategory':
        result = await bulkSetCategory(params.table, params.ids, params.categoryValue);
        break;
      case 'search':
        result = await searchProducts(params.table, params.searchTerm);
        break;
      case 'clearCache':
        result = await clearCache();
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
