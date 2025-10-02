import { NextResponse } from 'next/server'
import { createDirectServerClient } from '@/lib/supabase-server'
import { getEnquiryStats } from '@/lib/database/enquiries'
import { getProductStats } from '@/lib/database/products-optimized'

export async function GET() {
  try {
    const supabase = createDirectServerClient()

    // Get total products count from both tables
    const [indoorProducts, outdoorProducts] = await Promise.all([
      supabase.from('indoor').select('*', { count: 'exact', head: true }),
      supabase.from('outdoor').select('*', { count: 'exact', head: true })
    ])

    const totalProducts = (indoorProducts.count || 0) + (outdoorProducts.count || 0)

    // Get products without prices
    const [indoorUnpriced, outdoorUnpriced] = await Promise.all([
      supabase.from('indoor').select('*', { count: 'exact', head: true }).is('price_pc', null),
      supabase.from('outdoor').select('*', { count: 'exact', head: true }).is('price_pc', null)
    ])

    const unpricedProducts = (indoorUnpriced.count || 0) + (outdoorUnpriced.count || 0)

    // Get enquiry statistics
    const enquiryStats = await getEnquiryStats()

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get recent enquiries for pending count - handle gracefully if table doesn't exist
    let pendingEnquiries = 0
    try {
      const { count } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
      pendingEnquiries = count || 0
    } catch (error) {
      console.log('Enquiries table may not exist yet:', error.message)
      pendingEnquiries = 0
    }

    // Get recent product updates (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [recentIndoor, recentOutdoor] = await Promise.all([
      supabase
        .from('indoor')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase
        .from('outdoor')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())
    ])

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
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
