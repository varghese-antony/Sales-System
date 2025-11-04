import { NextResponse } from 'next/server'
import { createDirectServerClient } from '@/lib/supabase-server'

/**
 * GET /api/admin/recent-activity-v2
 * Fetches recent activity from v2 tables and enquiries
 * 
 * Returns:
 * - activities: Array of recent activities (enquiries and products)
 */
export async function GET() {
  try {
    const supabase = createDirectServerClient()

    // Get recent enquiries (last 5) - handle gracefully if table doesn't exist
    let recentEnquiries = []
    try {
      const { data: enquiriesData, error: enquiriesError } = await supabase
        .from('enquiries')
        .select('id, customer_name, company, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!enquiriesError && enquiriesData) {
        recentEnquiries = enquiriesData
      } else if (enquiriesError) {
        console.log('Error fetching enquiries:', enquiriesError.message)
      }
    } catch (error) {
      console.log('Enquiries table may not exist yet:', error.message)
    }

    // Get recent products from v2 tables (last 5 from both tables)
    const [recentIndoor, recentOutdoor] = await Promise.all([
      supabase
        .from('indoor_products_v2')
        .select('id, model_number, product_name, sub_category, created_at')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('outdoor_products_v2')
        .select('id, model_number, product_name, sub_category, created_at')
        .order('created_at', { ascending: false })
        .limit(3)
    ])

    if (recentIndoor.error) {
      console.error('Error fetching recent indoor products v2:', recentIndoor.error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch recent indoor products from v2 table',
          details: recentIndoor.error.message
        },
        { status: 500 }
      )
    }

    if (recentOutdoor.error) {
      console.error('Error fetching recent outdoor products v2:', recentOutdoor.error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch recent outdoor products from v2 table',
          details: recentOutdoor.error.message
        },
        { status: 500 }
      )
    }

    // Format recent activity
    const recentActivity = []

    // Add recent enquiries
    if (recentEnquiries) {
      recentEnquiries.forEach(enquiry => {
        recentActivity.push({
          id: enquiry.id,
          title: `New enquiry from ${enquiry.customer_name}`,
          timestamp: getTimeAgo(enquiry.created_at),
          details: enquiry.company || 'Customer enquiry submitted',
          status: enquiry.status,
          type: 'enquiry'
        })
      })
    }

    // Add recent products from v2 tables
    const allRecentProducts = [
      ...(recentIndoor.data || []).map(product => ({
        ...product,
        category: product.sub_category,
        table: 'indoor'
      })),
      ...(recentOutdoor.data || []).map(product => ({
        ...product,
        category: product.sub_category,
        table: 'outdoor'
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

    allRecentProducts.forEach(product => {
      recentActivity.push({
        id: product.id,
        title: `New ${product.category} product added`,
        timestamp: getTimeAgo(product.created_at),
        details: `${product.product_name} - Model ${product.model_number}`,
        status: 'Success',
        type: 'product'
      })
    })

    // Sort all activities by timestamp (most recent first)
    recentActivity.sort((a, b) => {
      // Convert timestamp strings back to dates for proper sorting
      const dateA = parseTimeAgo(a.timestamp)
      const dateB = parseTimeAgo(b.timestamp)
      return dateB - dateA
    })

    // Keep only the most recent 5
    const latestActivity = recentActivity.slice(0, 5)

    return NextResponse.json({ activities: latestActivity })
  } catch (error) {
    console.error('Error fetching recent activity from v2 tables:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch recent activity from v2 tables',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Convert a date string to a human-readable "time ago" format
 */
function getTimeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} days ago`

  return date.toLocaleDateString()
}

/**
 * Parse a "time ago" string back to a date for sorting
 * This is a helper function to maintain proper chronological order
 */
function parseTimeAgo(timeAgoString) {
  const now = new Date()
  
  if (timeAgoString === 'Just now') {
    return now
  }
  
  const minutesMatch = timeAgoString.match(/(\d+) minutes ago/)
  if (minutesMatch) {
    return new Date(now - parseInt(minutesMatch[1]) * 60 * 1000)
  }
  
  const hoursMatch = timeAgoString.match(/(\d+) hours ago/)
  if (hoursMatch) {
    return new Date(now - parseInt(hoursMatch[1]) * 60 * 60 * 1000)
  }
  
  const daysMatch = timeAgoString.match(/(\d+) days ago/)
  if (daysMatch) {
    return new Date(now - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000)
  }
  
  // If it's a date string, parse it
  return new Date(timeAgoString)
}
