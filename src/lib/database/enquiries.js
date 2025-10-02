import { supabase } from '../supabase'

const STATUS_VALUES = ['new', 'contacted', 'quoted', 'won', 'lost']

// Get all enquiries with optional filtering
export async function getAllEnquiries(filters = {}) {
  try {
    let query = supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.searchTerm) {
      query = query.or(`customerDetails->>name.ilike.%${filters.searchTerm}%,customerDetails->>email.ilike.%${filters.searchTerm}%,customerDetails->>company.ilike.%${filters.searchTerm}%,customerDetails->>message.ilike.%${filters.searchTerm}%`)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform data to expected format
    const transformedData = (data || []).map(enquiry => ({
      id: enquiry.id,
      customer_name: enquiry.customerDetails?.name || '',
      company: enquiry.customerDetails?.company || '',
      email: enquiry.customerDetails?.email || '',
      phone: enquiry.customerDetails?.phone || '',
      message: enquiry.customerDetails?.message || '',
      address: enquiry.customerDetails?.address || '',
      cart_items: enquiry.cartItems || [],
      delivery_method: null, // Not in current schema
      status: enquiry.status || 'new',
      created_at: enquiry.created_at,
      updated_at: enquiry.created_at
    }))

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return { data: null, error: error.message }
  }
}

// Get enquiry by ID
export async function getEnquiryById(id) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    // Transform data to expected format
    const transformedData = {
      id: data.id,
      customer_name: data.customerDetails?.name || '',
      company: data.customerDetails?.company || '',
      email: data.customerDetails?.email || '',
      phone: data.customerDetails?.phone || '',
      message: data.customerDetails?.message || '',
      address: data.customerDetails?.address || '',
      cart_items: data.cartItems || [],
      delivery_method: null,
      status: data.status || 'new',
      created_at: data.created_at,
      updated_at: data.created_at
    }

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching enquiry by ID:', error)
    return { data: null, error: error.message }
  }
}

// Update enquiry status
export async function updateEnquiryStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) throw error

    // Return the updated enquiry data in expected format
    const transformedData = {
      id: data[0].id,
      customer_name: data[0].customerDetails?.name || '',
      company: data[0].customerDetails?.company || '',
      email: data[0].customerDetails?.email || '',
      phone: data[0].customerDetails?.phone || '',
      message: data[0].customerDetails?.message || '',
      address: data[0].customerDetails?.address || '',
      cart_items: data[0].cartItems || [],
      delivery_method: null,
      status: data[0].status,
      created_at: data[0].created_at,
      updated_at: data[0].updated_at
    }

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error updating enquiry status:', error)
    return { data: null, error: error.message }
  }
}

// Add a timeline note for an enquiry
export async function addEnquiryNote(enquiryId, status, note) {
  try {
    const payload = {
      enquiry_id: enquiryId,
      status,
      note: note?.trim() ? note.trim() : null
    }

    const { data, error } = await supabase
      .from('enquiry_notes')
      .insert([payload])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error adding enquiry note:', error)
    return { data: null, error: error.message }
  }
}

// Retrieve timeline entries for an enquiry
export async function getEnquiryTimeline(enquiryId) {
  try {
    const { data, error } = await supabase
      .from('enquiry_notes')
      .select('*')
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching enquiry timeline:', error)
    return { data: null, error: error.message }
  }
}

// Delete enquiry
export async function deleteEnquiry(id) {
  try {
    const { error } = await supabase
      .from('enquiries')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { data: null, error: null }
  } catch (error) {
    console.error('Error deleting enquiry:', error)
    return { data: null, error: error.message }
  }
}

// Get enquiry statistics for dashboard
export async function getEnquiryStats({ startDate, endDate } = {}) {
  try {
    const applyDateFilters = (query) => {
      let filteredQuery = query
      if (startDate) {
        filteredQuery = filteredQuery.gte('created_at', startDate)
      }
      if (endDate) {
        filteredQuery = filteredQuery.lte('created_at', endDate)
      }
      return filteredQuery
    }

    // Handle case where enquiries table doesn't exist yet
    let totalEnquiries = 0
    let statusCounts = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 }
    let trendsData = []

    try {
      const totalPromise = applyDateFilters(
        supabase
          .from('enquiries')
          .select('*', { count: 'exact', head: true })
      )

      const statusPromises = STATUS_VALUES.map(async (status) => {
        const { count, error } = await applyDateFilters(
          supabase
            .from('enquiries')
            .select('*', { count: 'exact', head: true })
            .eq('status', status)
        )

        if (error) throw error
        return [status, count || 0]
      })

      const trendsPromise = supabase.rpc('get_enquiry_trends', {
        start_date: startDate || null,
        end_date: endDate || null
      })

      const [{ count: totalCount, error: totalError }, statusEntries, { data: trendsResult, error: trendsError }] = await Promise.all([
        totalPromise,
        Promise.all(statusPromises),
        trendsPromise
      ])

      if (totalError) throw totalError
      if (trendsError) throw trendsError

      totalEnquiries = totalCount || 0

      statusCounts = statusEntries.reduce((acc, [status, count]) => {
        acc[status] = count
        return acc
      }, {})

      trendsData = (trendsResult || []).map(item => ({
        date: item.date,
        count: item.count
      }))

    } catch (error) {
      console.log('Enquiries table may not exist yet:', error.message)
      // Return default values when table doesn't exist
    }

    // Ensure all statuses have numeric values
    STATUS_VALUES.forEach((status) => {
      if (typeof statusCounts[status] !== 'number') {
        statusCounts[status] = 0
      }
    })

    const conversionRate = totalEnquiries > 0
      ? parseFloat(((statusCounts.won || 0) / totalEnquiries * 100).toFixed(1))
      : 0

    return {
      data: {
        totalEnquiries: totalEnquiries || 0,
        statusCounts,
        trendsData,
        conversionRate
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching enquiry stats:', error)
    return { data: null, error: error.message }
  }
}

// Search enquiries
export async function searchEnquiries(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .or(`customer_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error searching enquiries:', error)
    return { data: null, error: error.message }
  }
}

// Get enquiries by date range
export async function getEnquiriesByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching enquiries by date range:', error)
    return { data: null, error: error.message }
  }
}

// Create new enquiry (for future webhook integration)
export async function createEnquiry(enquiryData) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .insert([{
        ...enquiryData,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return { data: null, error: error.message }
  }
}

// Get enquiries by customer email
export async function getEnquiriesByEmail(email, options = {}) {
  try {
    if (!email) {
      return { data: null, error: 'Email is required' }
    }

    const { status = null, limit = null } = options

    let query = supabase
      .from('enquiries')
      .select('*')
      .ilike('customerDetails->>email', email)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform data to expected format
    const transformedData = (data || []).map(enquiry => ({
      id: enquiry.id,
      customer_name: enquiry.customerDetails?.name || '',
      company: enquiry.customerDetails?.company || '',
      email: enquiry.customerDetails?.email || '',
      phone: enquiry.customerDetails?.phone || '',
      message: enquiry.customerDetails?.message || '',
      address: enquiry.customerDetails?.address || '',
      cart_items: enquiry.cartItems || [],
      delivery_method: null,
      status: enquiry.status || 'new',
      created_at: enquiry.created_at,
      updated_at: enquiry.created_at
    }))

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching enquiries by email:', error)
    return { data: null, error: error.message }
  }
}
