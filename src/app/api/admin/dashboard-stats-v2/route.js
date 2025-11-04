import { NextResponse } from 'next/server'
import { createDirectServerClient } from '@/lib/supabase-server'
import { getEnquiryStats } from '@/lib/database/enquiries'

/**
 * GET /api/admin/dashboard-stats-v2
 * Fetches dashboard statistics from v2 tables
 * 
 * Returns:
 * - totalProducts: Total count from both v2 tables
 * - unpricedProducts: Products without price_per_piece in v2 tables
 * - pendingEnquiries: Count of new enquiries
 * - recentUpdates: Products created in last 7 days from v2 tables
 * - totalUsers: Total user count
 * - enquiryStats: Detailed enquiry statistics
 */
export async function GET() {
  try {
    const supabase = createDirectServerClient()

    // Get total products count from both v2 tables
    const [indoorProducts, outdoorProducts] = await Promise.all([
      supabase.from('indoor_products_v2').select('*', { count: 'exact', head: true }),
      supabase.from('outdoor_products_v2').select('*', { count: 'exact', head: true })
    ])

    if (indoorProducts.error) {
      console.error('Error fetching indoor products v2:', indoorProducts.error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch indoor products from v2 table',
          details: indoorProducts.error.message
        },
        { status: 500 }
      )
    }

    if (outdoorProducts.error) {
      console.error('Error fetching outdoor products v2:', outdoorProducts.error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch outdoor products from v2 table',
          details: outdoorProducts.error.message
        },
        { status: 500 }
      )
    }

    const totalProducts = (indoorProducts.count || 0) + (outdoorProducts.count || 0)

    // Get products without prices from v2 tables (price_per_piece field)
    const [indoorUnpriced, outdoorUnpriced] = await Promise.all([
      supabase
        .from('indoor_products_v2')
        .select('*', { count: 'exact', head: true })
        .or('price_per_piece.is.null,price_per_piece.eq.'),
      supabase
        .from('outdoor_products_v2')
        .select('*', { count: 'exact', head: true })
        .or('price_per_piece.is.null,price_per_piece.eq.')
    ])

    if (indoorUnpriced.error) {
      console.error('Error fetching unpriced indoor products v2:', indoorUnpriced.error)
    }

    if (outdoorUnpriced.error) {
      console.error('Error fetching unpriced outdoor products v2:', outdoorUnpriced.error)
    }

    const unpricedProducts = (indoorUnpriced.count || 0) + (outdoorUnpriced.count || 0)

    // Get enquiry statistics
    const enquiryStats = await getEnquiryStats()

    // Get user statistics
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    // Get recent enquiries for pending count - handle gracefully if table doesn't exist
    let pendingEnquiries = 0
    try {
      const { count, error: enquiriesError } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
      
      if (enquiriesError) {
        console.log('Error fetching enquiries:', enquiriesError.message)
      } else {
        pendingEnquiries = count || 0
      }
    } catch (error) {
      console.log('Enquiries table may not exist yet:', error.message)
      pendingEnquiries = 0
    }

    // Get recent product updates from v2 tables (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [recentIndoor, recentOutdoor] = await Promise.all([
      supabase
        .from('indoor_products_v2')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase
        .from('outdoor_products_v2')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())
    ])

    if (recentIndoor.error) {
      console.error('Error fetching recent indoor products v2:', recentIndoor.error)
    }

    if (recentOutdoor.error) {
      console.error('Error fetching recent outdoor products v2:', recentOutdoor.error)
    }

    const recentUpdates = (recentIndoor.count || 0) + (recentOutdoor.count || 0)

    const stats = {
      totalProducts: totalProducts || 0,
      pendingEnquiries: pendingEnquiries || 0,
      unpricedProducts: unpricedProducts || 0,
      recentUpdates: recentUpdates || 0,
      totalUsers: totalUsers || 0,
      enquiryStats: enquiryStats.data || {
        totalEnquiries: 0,
        statusCounts: { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 },
        trendsData: [],
        conversionRate: 0
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats from v2 tables:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics from v2 tables',
        details: error.message
      },
      { status: 500 }
    )
  }
}
