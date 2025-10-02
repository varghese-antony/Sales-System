import { NextResponse } from 'next/server'
import { createDirectServerClient } from '@/lib/supabase-server'

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
      }
    } catch (error) {
      console.log('Enquiries table may not exist yet:', error.message)
    }

    // Get recent products (last 5 from both tables)
    const [recentIndoor, recentOutdoor] = await Promise.all([
      supabase
        .from('indoor')
        .select('id, model_number, producttype, created_at, Indoor')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('outdoor')
        .select('id, model_number, producttype, created_at, Outdoor')
        .order('created_at', { ascending: false })
        .limit(3)
    ])

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

    // Add recent products
    const allRecentProducts = [
      ...(recentIndoor.data || []).map(product => ({
        ...product,
        category: product.Indoor,
        table: 'indoor'
      })),
      ...(recentOutdoor.data || []).map(product => ({
        ...product,
        category: product.Outdoor,
        table: 'outdoor'
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

    allRecentProducts.forEach(product => {
      recentActivity.push({
        id: product.id,
        title: `New ${product.category} product added`,
        timestamp: getTimeAgo(product.created_at),
        details: `${product.producttype} - Model ${product.model_number}`,
        status: 'Success',
        type: 'product'
      })
    })

    // Sort all activities by timestamp
    recentActivity.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

    // Keep only the most recent 5
    const latestActivity = recentActivity.slice(0, 5)

    return NextResponse.json({ activities: latestActivity })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}

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
