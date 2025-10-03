import { NextResponse } from 'next/server'
import { createDirectServerClient } from '@/lib/supabase-server'
import { getCustomersWithEnquiriesAdmin, getCustomerStatsAdmin } from '@/lib/database/profiles'

export async function GET(request) {
  try {
    const supabase = createDirectServerClient()
    const { searchParams } = new URL(request.url)

    const searchTerm = searchParams.get('searchTerm') || null
    const hasDiscount = searchParams.get('hasDiscount')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : null
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset'), 10) : 0

    let hasDiscountFilter = null
    if (hasDiscount === 'true') hasDiscountFilter = true
    else if (hasDiscount === 'false') hasDiscountFilter = false

    const options = {
      searchTerm,
      hasDiscount: hasDiscountFilter,
      sortBy,
      sortOrder,
      limit,
      offset
    }

    const [customersResult, statsResult] = await Promise.all([
      getCustomersWithEnquiriesAdmin(supabase, options),
      getCustomerStatsAdmin(supabase)
    ])

    if (customersResult.error) {
      throw new Error(customersResult.error)
    }

    if (statsResult.error) {
      throw new Error(statsResult.error)
    }

    return NextResponse.json({
      customers: customersResult.data || [],
      count: customersResult.count || 0,
      stats: statsResult.data || {
        totalCustomers: 0,
        customersWithDiscount: 0,
        averageDiscount: 0,
        recentRegistrations: 0
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers', message: error.message },
      { status: 500 }
    )
  }
}
