import { createDirectServerClient } from '../supabase-server'

const STATUS_VALUES = ['new', 'contacted', 'quoted', 'won', 'lost']

// Simple in-memory cache with TTL for frequently accessed data
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes for enquiry data (more dynamic)

// Cache manager helper functions
function getCacheKey(operation, params) {
  return `${operation}:${JSON.stringify(params)}`
}

function getCached(key) {
  const cached = cache.get(key)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  if (cached) {
    cache.delete(key) // Remove expired cache
  }
  return null
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })

  // Clean up old cache entries periodically
  if (cache.size > 100) {
    const cutoff = Date.now() - CACHE_TTL
    for (const [cacheKey, value] of Array.from(cache.entries())) {
      if (value.timestamp < cutoff) {
        cache.delete(cacheKey)
      }
    }
  }
}

// Optimized Supabase client instance
let supabaseClient = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createDirectServerClient()
  }
  return supabaseClient
}

// Optimized enquiries query with server-side pagination
export async function getEnquiriesWithPagination(filters = {}, pagination = {}) {
  try {
    const { currentPage = 1, pageSize = 25 } = pagination
    const offset = (currentPage - 1) * pageSize

    let query = getSupabaseClient()
      .from('enquiries')
      .select(`
        id,
        customer_name,
        email,
        company,
        phone,
        message,
        status,
        delivery_method,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters efficiently
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.searchTerm) {
      query = query.or(`customer_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,company.ilike.%${filters.searchTerm}%,message.ilike.%${filters.searchTerm}%`)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters.deliveryMethod) {
      query = query.eq('delivery_method', filters.deliveryMethod)
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    return { data, count: count || 0, error: null }
  } catch (error) {
    console.error('Error fetching enquiries with pagination:', error)
    return { data: null, count: 0, error: error.message }
  }
}

// Cached enquiry statistics to avoid recalculation
export async function getEnquiryStatsCached({ startDate, endDate } = {}) {
  try {
    const cacheKey = getCacheKey('stats', { startDate, endDate })
    const cached = getCached(cacheKey)

    if (cached) {
      return cached
    }

    // Use database aggregation for better performance
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

    // Get total count
    const { count: totalEnquiries, error: totalError } = await applyDateFilters(
      getSupabaseClient()
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
    )

    if (totalError) throw totalError

    // Get status counts in a single query using RPC or aggregation
    const statusCounts = {}

    // Use Promise.allSettled for better error handling
    const statusPromises = STATUS_VALUES.map(async (status) => {
      try {
        const { count, error } = await applyDateFilters(
          getSupabaseClient()
            .from('enquiries')
            .select('*', { count: 'exact', head: true })
            .eq('status', status)
        )

        if (error) throw error
        return [status, count || 0]
      } catch (error) {
        console.error(`Error fetching count for status ${status}:`, error)
        return [status, 0]
      }
    })

    const statusResults = await Promise.allSettled(statusPromises)
    statusResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const [status, count] = result.value
        statusCounts[status] = count
      }
    })

    // Ensure all statuses have numeric values
    STATUS_VALUES.forEach((status) => {
      if (typeof statusCounts[status] !== 'number') {
        statusCounts[status] = 0
      }
    })

    const conversionRate = totalEnquiries > 0
      ? parseFloat(((statusCounts.won || 0) / totalEnquiries * 100).toFixed(1))
      : 0

    const result = {
      data: {
        totalEnquiries: totalEnquiries || 0,
        statusCounts,
        conversionRate
      },
      error: null
    }

    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching enquiry stats:', error)
    return { data: null, error: error.message }
  }
}

// Batch update enquiry statuses for better performance
export async function batchUpdateEnquiryStatus(updates) {
  try {
    const results = []
    const batchSize = 50

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)

      // Group by status for efficient updates
      const statusGroups = batch.reduce((acc, update) => {
        const { id, status } = update
        if (!acc[status]) acc[status] = []
        acc[status].push(id)
        return acc
      }, {})

      // Execute batch updates
      for (const [status, ids] of Object.entries(statusGroups)) {
        const { data, error } = await getSupabaseClient()
          .from('enquiries')
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .in('id', ids)
          .select('id, status')

        if (error) {
          results.push({ status, ids, error: error.message, success: false })
        } else {
          results.push({ status, ids, data, success: true })
        }
      }
    }

    return { results, error: null }
  } catch (error) {
    console.error('Error batch updating enquiry statuses:', error)
    return { results: [], error: error.message }
  }
}

// Optimized search with caching
export async function searchEnquiriesOptimized(searchTerm, filters = {}) {
  try {
    const cacheKey = getCacheKey('search', { searchTerm, filters })
    const cached = getCached(cacheKey)

    if (cached) {
      return cached
    }

    let query = getSupabaseClient()
      .from('enquiries')
      .select(`
        id,
        customer_name,
        email,
        company,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })

    // Apply search
    if (searchTerm) {
      query = query.or(`customer_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)
    }

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    query = query.limit(50) // Limit search results

    const { data, error } = await query

    if (error) throw error

    const result = { data, error: null }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error searching enquiries:', error)
    return { data: null, error: error.message }
  }
}

// Get enquiry by ID with caching
export async function getEnquiryByIdCached(id) {
  try {
    const cacheKey = getCacheKey('enquiry', { id })
    const cached = getCached(cacheKey)

    if (cached) {
      return cached
    }

    const { data, error } = await getSupabaseClient()
      .from('enquiries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    const result = { data, error: null }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching enquiry by ID:', error)
    return { data: null, error: error.message }
  }
}

// Batch add enquiry notes
export async function batchAddEnquiryNotes(notes) {
  try {
    const results = []
    const batchSize = 25

    for (let i = 0; i < notes.length; i += batchSize) {
      const batch = notes.slice(i, i + batchSize)

      const notesToInsert = batch.map(({ enquiryId, status, note }) => ({
        enquiry_id: enquiryId,
        status,
        note: note?.trim() ? note.trim() : null
      }))

      const { data, error } = await getSupabaseClient()
        .from('enquiry_notes')
        .insert(notesToInsert)
        .select()

      if (error) {
        results.push({ batch: i / batchSize + 1, error: error.message, success: false })
      } else {
        results.push({ batch: i / batchSize + 1, data, success: true })
      }
    }

    return { results, error: null }
  } catch (error) {
    console.error('Error batch adding enquiry notes:', error)
    return { results: [], error: error.message }
  }
}

// Get enquiry timeline with caching
export async function getEnquiryTimelineCached(enquiryId) {
  try {
    const cacheKey = getCacheKey('timeline', { enquiryId })
    const cached = getCached(cacheKey)

    if (cached) {
      return cached
    }

    const { data, error } = await getSupabaseClient()
      .from('enquiry_notes')
      .select('*')
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const result = { data, error: null }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching enquiry timeline:', error)
    return { data: null, error: error.message }
  }
}

// Clear cache function for admin operations
export function clearEnquiryCache() {
  cache.clear()
}
