import { supabase } from '../supabase'
import { getProductsByIds } from './products'

const STATUS_VALUES = ['new', 'contacted', 'quoted', 'won', 'lost']

const VALID_PRODUCT_TABLES = new Set(['indoor', 'outdoor'])

const toLowerSafe = (value) =>
  typeof value === 'string' ? value.toLowerCase() : value

const inferProductTable = (item = {}) => {
  const tableCandidates = [
    item.table,
    item.productTable,
    item.sourceTable,
    item.type,
    item.productType,
    item.category
  ]

  for (const candidate of tableCandidates) {
    const normalized = toLowerSafe(candidate)
    if (normalized && VALID_PRODUCT_TABLES.has(normalized)) {
      return normalized
    }
  }

  if (item.Indoor || item.indoor) return 'indoor'
  if (item.Outdoor || item.outdoor) return 'outdoor'

  return null
}

const getCartItemProductId = (item = {}) =>
  item.productId ?? item.product_id ?? item.id ?? null

const getCartItemQuantity = (item = {}) => {
  const quantityValue = item.quantity ?? item.qty ?? item.count ?? 1
  const quantityNumber = Number(quantityValue)
  return Number.isFinite(quantityNumber) && quantityNumber > 0 ? quantityNumber : 1
}

const buildProductReferences = (enquiries = []) => {
  const seen = new Set()
  const references = []

  enquiries.forEach((enquiry) => {
    const cartItems = Array.isArray(enquiry.cartItems) ? enquiry.cartItems : []

    cartItems.forEach((item) => {
      const id = getCartItemProductId(item)
      const table = inferProductTable(item)

      if (!id || !table) return

      const key = `${table}-${id}`
      if (!seen.has(key)) {
        seen.add(key)
        references.push({ table, id })
      }
    })
  })

  return references
}

const buildProductLookup = async (enquiries = []) => {
  const references = buildProductReferences(enquiries)

  if (references.length === 0) {
    return new Map()
  }

  try {
    const products = await getProductsByIds(references)
    return new Map(
      (products || []).map((product) => [`${product.table}-${product.id}`, product])
    )
  } catch (error) {
    console.error('Error building product lookup for enquiries:', error)
    return new Map()
  }
}

const enrichCartItem = (item = {}, productLookup = new Map()) => {
  const productId = getCartItemProductId(item)
  const table = inferProductTable(item)
  const key = table && productId ? `${table}-${productId}` : null
  const product = key ? productLookup.get(key) : null
  const quantity = getCartItemQuantity(item)

  const enriched = {
    ...item,
    id: productId ?? item.id ?? null,
    table: table || item.table || null,
    quantity
  }

  const modelNumber =
    product?.model_number ||
    product?.modelNumber ||
    item.model_number ||
    item.modelNumber ||
    null

  if (modelNumber) {
    enriched.model_number = modelNumber
    if (!enriched.modelNumber) {
      enriched.modelNumber = modelNumber
    }
  }

  const productType =
    product?.producttype ||
    item.producttype ||
    item.productType ||
    null

  if (productType) {
    enriched.producttype = productType
    if (!enriched.productType) {
      enriched.productType = productType
    }
  }

  if (product) {
    enriched.product = product
  }

  return enriched
}

const transformEnquiryRecord = (enquiry, productLookup = new Map()) => {
  const customerDetails = enquiry.customer_details || enquiry.customerDetails || {}
  const cartItems = Array.isArray(enquiry.cart_items) 
    ? enquiry.cart_items 
    : Array.isArray(enquiry.cartItems) 
    ? enquiry.cartItems 
    : []

  const enrichedCartItems = cartItems.map((item) => enrichCartItem(item, productLookup))

  return {
    id: enquiry.id,
    customer_name: customerDetails.name || '',
    company: customerDetails.company || '',
    email: customerDetails.email || '',
    phone: customerDetails.phone || '',
    message: customerDetails.message || '',
    address: customerDetails.address || '',
    delivery_method:
      customerDetails.deliveryMethod || customerDetails.delivery_method || null,
    delivery_time:
      customerDetails.deliveryTime || customerDetails.delivery_time || null,
    cart_items: enrichedCartItems,
    status: enquiry.status || 'new',
    created_at: enquiry.created_at,
    updated_at: enquiry.updated_at || enquiry.created_at,
    customer_details: customerDetails
  }
}

const transformEnquiriesWithProducts = async (enquiries = []) => {
  if (!Array.isArray(enquiries) || enquiries.length === 0) {
    return []
  }

  const productLookup = await buildProductLookup(enquiries)

  return enquiries.map((enquiry) => transformEnquiryRecord(enquiry, productLookup))
}

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
      query = query.or(`customer_details->>name.ilike.%${filters.searchTerm}%,customer_details->>email.ilike.%${filters.searchTerm}%,customer_details->>company.ilike.%${filters.searchTerm}%,customer_details->>message.ilike.%${filters.searchTerm}%`)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const transformedData = await transformEnquiriesWithProducts(data || [])

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

    const [transformed] = await transformEnquiriesWithProducts([data])

    return { data: transformed || null, error: null }
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

    const [transformed] = await transformEnquiriesWithProducts(data || [])

    return { data: transformed || null, error: null }
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

    const groupEnquiriesByDate = (enquiries) => {
      if (!Array.isArray(enquiries) || enquiries.length === 0) return []

      const countsByDate = {}

      enquiries.forEach((enquiry) => {
        if (!enquiry?.created_at) return
        const date = new Date(enquiry.created_at).toISOString().split('T')[0]
        countsByDate[date] = (countsByDate[date] || 0) + 1
      })

      return Object.entries(countsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
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

      const trendsQueryPromise = applyDateFilters(
        supabase
          .from('enquiries')
          .select('created_at')
          .order('created_at', { ascending: true })
      )

      const [{ count: totalCount, error: totalError }, statusEntries, { data: trendsQueryData, error: trendsError }] = await Promise.all([
        totalPromise,
        Promise.all(statusPromises),
        trendsQueryPromise
      ])

      if (totalError) throw totalError
      if (trendsError) throw trendsError

      totalEnquiries = totalCount || 0

      statusCounts = statusEntries.reduce((acc, [status, count]) => {
        acc[status] = count
        return acc
      }, {})

      trendsData = groupEnquiriesByDate(trendsQueryData || [])

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
    const { customerDetails, cartItems, ...otherData } = enquiryData
    
    const { data, error } = await supabase
      .from('enquiries')
      .insert([{
        customer_details: customerDetails || {},
        cart_items: cartItems || [],
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...otherData
      }])
      .select()

    if (error) throw error

    const [transformed] = await transformEnquiriesWithProducts(data || [])

    return { data: transformed || null, error: null }
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
      .ilike('customer_details->>email', email)
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

    const transformedData = await transformEnquiriesWithProducts(data || [])

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching enquiries by email:', error)
    return { data: null, error: error.message }
  }
}
