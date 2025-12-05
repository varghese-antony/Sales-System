import { createDirectServerClient } from '../supabase-server'
import { fieldMapping } from './products'

// Simple in-memory cache with TTL for frequently accessed data
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_VERSION = 'v1'
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000 // 10 minutes

let cacheHits = 0
let cacheMisses = 0
let lastCleanup = 0

function stableStringify(value) {
  if (value === null || value === undefined) {
    return String(value)
  }

  if (typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  const keys = Object.keys(value).sort()
  const entries = keys.map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
  return `{${entries.join(',')}}`
}

// Cache manager helper functions
function getCacheKey(operation, params) {
  return `${CACHE_VERSION}:${operation}:${stableStringify(params)}`
}

function getCached(key) {
  const cached = cache.get(key)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    cacheHits += 1
    return cached.data
  }
  if (cached) {
    cache.delete(key) // Remove expired cache
  }
  cacheMisses += 1
  return null
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })

  cleanupCache()
}

function cleanupCache(force = false) {
  const now = Date.now()
  if (!force && (now - lastCleanup) < CACHE_CLEANUP_INTERVAL) {
    return
  }

  const cutoff = now - CACHE_TTL
  for (const [cacheKey, value] of Array.from(cache.entries())) {
    if (value.timestamp < cutoff) {
      cache.delete(cacheKey)
    }
  }

  lastCleanup = now
}

function formatColumnName(column) {
  if (!column) return column
  return /^[a-z0-9_]+$/.test(column) ? column : `"${column.replace(/"/g, '""')}"`
}

// Optimized Supabase client instance
let supabaseClient = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createDirectServerClient()
  }
  return supabaseClient
}

// Helper function to get the correct table name (v2 tables)
function getTableName(table) {
  if (table === 'indoor') return 'indoor_products_v2'
  if (table === 'outdoor') return 'outdoor_products_v2'
  if (table === 'both') return 'both' // Special case handled separately
  return table // Return as-is if already a full table name
}

function applyFiltersToQuery(query, table, filters = {}) {
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === 'all') {
      return
    }

    if (key === 'category') {
      // V2 tables use 'sub_category' column
      query = query.eq('sub_category', value)
    } else if (key === 'search') {
      query = query.or(`model_number.ilike.%${value}%,product_name.ilike.%${value}%,sub_category.ilike.%${value}%`)
    } else {
      const cleanedKey = key.replace(/Filter$/, '');
      const dbColumn = fieldMapping[cleanedKey] || cleanedKey;
      query = query.eq(dbColumn, value)
    }
  })

  return query
}

function addValueToSet(value, targetSet) {
  if (value === null || value === undefined) return

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return

    if (trimmed.includes(',')) {
      trimmed
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .forEach(part => targetSet.add(part))
      return
    }

    targetSet.add(trimmed)
    return
  }

  targetSet.add(value)
}

async function getTableCount(table, filters = {}) {
  const tableName = getTableName(table)
  let query = getSupabaseClient()
    .from(tableName)
    .select('*', { count: 'exact', head: true })

  query = applyFiltersToQuery(query, table, filters)

  const { count, error } = await query

  if (error) throw error

  return count || 0
}

async function getFilterOptionsForTable(table, filters = {}) {
  const tableName = getTableName(table)
  // V2 tables use 'sub_category' and 'product_name' columns
  const filterColumns = [
    'sub_category',
    'product_name',
    'voltage',
    'power_w',
    'cct',
    'cri_ra',
    'dimming_type',
    'led_type',
    'driver_brand'
  ]

  if (table === 'outdoor') {
    filterColumns.push('ip_rating', 'ik_rating')
  }

  let query = getSupabaseClient()
    .from(tableName)
    .select(filterColumns.map(formatColumnName).join(','))

  query = applyFiltersToQuery(query, table, filters)

  const { data, error } = await query

  if (error) throw error

  const options = {
    categories: new Set(),
    producttypes: new Set(),
    Voltage: new Set(),
    power_w: new Set(),
    CCT: new Set(),
    cri_ra: new Set(),
    dimmingType: new Set(),
    led_type: new Set(),
    driver_brand: new Set(),
    ip_rating: table === 'outdoor' ? new Set() : null,
    ik_rating: table === 'outdoor' ? new Set() : null
  }

  data.forEach(row => {
    addValueToSet(row.sub_category, options.categories)
    addValueToSet(row.product_name, options.producttypes)
    addValueToSet(row.voltage, options.Voltage)
    addValueToSet(row.power_w, options.power_w)
    addValueToSet(row.cct, options.CCT)
    addValueToSet(row.cri_ra, options.cri_ra)
    addValueToSet(row.dimming_type, options.dimmingType)
    addValueToSet(row.led_type, options.led_type)
    addValueToSet(row.driver_brand, options.driver_brand)

    if (table === 'outdoor') {
      addValueToSet(row.ip_rating, options.ip_rating)
      addValueToSet(row.ik_rating, options.ik_rating)
    }
  })

  return Object.entries(options).reduce((acc, [key, valueSet]) => {
    if (!valueSet) {
      acc[key] = []
      return acc
    }

    acc[key] = Array.from(valueSet).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b
      }
      return String(a).localeCompare(String(b))
    })
    return acc
  }, {})
}

async function fetchTableData(table, filters = {}, offset = 0, limit = 10) {
  const tableName = getTableName(table)
  let query = getSupabaseClient()
    .from(tableName)
    .select('*', { count: 'exact' })

  query = applyFiltersToQuery(query, table, filters)
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  const dataWithType = (data || []).map(item => ({
    ...item,
    type: table
  }))

  return { data: dataWithType, count: count || 0 }
}

// Get distinct categories with caching

// Get product types grouped by category with caching
export async function getProductTypesByCategory(type) {
  try {
    const cacheKey = getCacheKey('productTypesByCategory', { type })
    const cached = getCached(cacheKey)

    if (cached) {
      return cached
    }

    const tableName = getTableName(type)
    // V2 tables use 'sub_category' and 'product_name' columns
    const { data, error} = await getSupabaseClient()
      .from(tableName)
      .select('sub_category,product_name')
      .not('product_name', 'is', null)
      .not('sub_category', 'is', null)
      .order('product_name', { ascending: true })

    if (error) throw error

    // Group product types by category
    const groupedData = data.reduce((acc, item) => {
      const category = item.sub_category
      const productType = item.product_name

      if (!acc[category]) {
        acc[category] = []
      }

      if (!acc[category].includes(productType)) {
        acc[category].push(productType)
      }

      return acc
    }, {})

    const result = {
      data: Object.entries(groupedData).map(([category, productTypes]) => ({
        [categoryColumn]: category,
        producttypes: productTypes
      })),
      error: null
    }

    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching product types by category:', error)
    return { data: null, error: error.message }
  }
}

// Optimized products query with server-side pagination
export async function getProductsWithPagination(table, filters = {}, pagination = {}) {
  try {
    const { currentPage = 1, pageSize = 10 } = pagination
    const offset = (currentPage - 1) * pageSize

    if (table === 'both') {
      const [indoorCount, outdoorCount] = await Promise.all([
        getTableCount('indoor', filters),
        getTableCount('outdoor', filters)
      ])

      const totalCount = indoorCount + outdoorCount

      let remaining = pageSize
      let indoorOffset = offset
      let outdoorOffset = Math.max(offset - indoorCount, 0)

      const data = []

      if (indoorOffset < indoorCount && remaining > 0) {
        const indoorLimit = Math.min(remaining, indoorCount - indoorOffset)
        const indoorResult = await fetchTableData('indoor', filters, indoorOffset, indoorLimit)
        data.push(...indoorResult.data)
        remaining -= indoorLimit
        indoorOffset += indoorLimit
      }

      if (remaining > 0 && outdoorOffset < outdoorCount) {
        const outdoorLimit = Math.min(remaining, outdoorCount - outdoorOffset)
        const outdoorResult = await fetchTableData('outdoor', filters, outdoorOffset, outdoorLimit)
        data.push(...outdoorResult.data)
      }

      const [indoorOptions, outdoorOptions] = await Promise.all([
        getFilterOptionsForTable('indoor', filters),
        getFilterOptionsForTable('outdoor', filters)
      ])

      const mergeOptionSets = (key) => Array.from(new Set([...(indoorOptions[key] || []), ...(outdoorOptions[key] || [])])).sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b
        }
        return String(a).localeCompare(String(b))
      })

      const filterOptions = {
        categories: mergeOptionSets('categories'),
        producttypes: mergeOptionSets('producttypes'),
        Voltage: mergeOptionSets('Voltage'),
        power_w: mergeOptionSets('power_w'),
        CCT: mergeOptionSets('CCT'),
        cri_ra: mergeOptionSets('cri_ra'),
        dimmingType: mergeOptionSets('dimmingType'),
        led_type: mergeOptionSets('led_type'),
        driver_brand: mergeOptionSets('driver_brand'),
        ip_rating: mergeOptionSets('ip_rating'),
        ik_rating: mergeOptionSets('ik_rating')
      }

      return {
        data,
        count: totalCount,
        countsByType: {
          indoor: indoorCount,
          outdoor: outdoorCount
        },
        filterOptions,
        error: null
      }
    }
    const { data, count } = await fetchTableData(table, filters, offset, pageSize)
    const filterOptions = await getFilterOptionsForTable(table, filters)

    return {
      data,
      count,
      countsByType: {
        indoor: table === 'indoor' ? count : 0,
        outdoor: table === 'outdoor' ? count : 0
      },
      filterOptions,
      error: null
    }
  } catch (error) {
    console.error('Error fetching products with pagination:', error)
    return { data: null, count: 0, countsByType: { indoor: 0, outdoor: 0 }, filterOptions: null, error: error.message }
  }
}

// Batch update products for better performance
export async function bulkUpdateProductsBatch(table, updates) {
  try {
    const results = []
    const batchSize = 50 // Process in batches of 50

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)

      // Group updates by field to minimize queries
      const updateGroups = batch.reduce((acc, update) => {
        const { id, ...fields } = update
        Object.entries(fields).forEach(([field, value]) => {
          if (!acc[field]) acc[field] = []
          acc[field].push({ id, value })
        })
        return acc
      }, {})

      // Execute updates for each field
      for (const [field, fieldUpdates] of Object.entries(updateGroups)) {
        const tableName = getTableName(table)
        const ids = fieldUpdates.map(u => u.id)
        const { data, error } = await getSupabaseClient()
          .from(tableName)
          .update({ [field]: fieldUpdates[0].value })
          .in('id', ids)
          .select()

        if (error) {
          results.push({ ids, error: error.message, success: false })
        } else {
          results.push({ ids, data, error: null, success: true })
        }
      }
    }

    return { results, error: null }
  } catch (error) {
    console.error('Error bulk updating products:', error)
    return { results: [], error: error.message }
  }
}

// Optimized search with caching
export async function searchProductsOptimized(table, searchTerm, filters = {}) {
  try {
    const cacheKey = getCacheKey('search', { table, searchTerm, filters })
    const cached = getCached(cacheKey)

    if (cached) {
      return cached
    }

    // Build query with optimized selects - define column list explicitly
    const selectColumns = [
      'id',
      'model_number',
      'producttype',
      table === 'indoor' ? 'Indoor' : 'Outdoor',
      'price_pc',
      'Size'
    ].map(formatColumnName).join(',')

    const tableName = getTableName(table)
    let query = getSupabaseClient()
      .from(tableName)
      .select(selectColumns)

    // Apply search
    if (searchTerm) {
      query = query.or(`model_number.ilike.%${searchTerm}%,producttype.ilike.%${searchTerm}%`)
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'category') {
          // V2 tables use 'sub_category' column
          query = query.eq('sub_category', value)
        } else {
          const dbColumn = fieldMapping[key] || key
          query = query.eq(formatColumnName(dbColumn), value)
        }
      }
    })

    query = query.limit(100) // Limit search results

    const { data, error } = await query

    if (error) throw error

    const result = { data, error: null }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error searching products:', error)
    return { data: null, error: error.message }
  }
}

// Get product statistics with caching
export async function getProductStats(table) {
  try {
    const cacheKey = getCacheKey('stats', { table })
    const cached = getCached(cacheKey)

    if (cached) {
      return cached
    }

    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .select('producttype')
      .not('producttype', 'is', null)

    if (error) throw error

    // Calculate stats
    const stats = data.reduce((acc, item) => {
      const type = item.product_name
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const result = { data: stats, error: null }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching product stats:', error)
    return { data: null, error: error.message }
  }
}

// Batch create products with better error handling
export async function createProductsBatch(products) {
  try {
    if (!products.length) return { data: [], error: null }

    const table = products[0]?.type === 'indoor' ? 'indoor' : 'outdoor'
    const productsToInsert = products.map(({ type, ...product }) => product)

    // Insert in batches of 100
    const results = []
    const batchSize = 100

    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize)

      const tableName = getTableName(table)
      const { data, error } = await getSupabaseClient()
        .from(tableName)
        .insert(batch)
        .select()

      if (error) {
        results.push({ batch: i / batchSize + 1, error: error.message, success: false })
      } else {
        results.push({ batch: i / batchSize + 1, data, success: true })
      }
    }

    return { results, error: null }
  } catch (error) {
    console.error('Error creating products:', error)
    return { results: [], error: error.message }
  }
}

// Get product by ID
export async function getProductById(table, id) {
  try {
    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return { data: null, error: error.message }
  }
}

// Create new products (for data entry)
export async function createProducts(products) {
  try {
    // Determine the table based on the first product's type
    const table = products[0]?.type === 'indoor' ? 'indoor' : 'outdoor'

    // Remove the type field since it's determined by the table
    const productsToInsert = products.map(({ type, ...product }) => product)

    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .insert(productsToInsert)
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating products:', error)
    return { data: null, error: error.message }
  }
}

// Update single product
export async function updateProduct(table, id, updateData) {
  try {
    // Map frontend field names to database column names
    const mappedData = {}
    Object.entries(updateData).forEach(([key, value]) => {
      const dbColumn = fieldMapping[key] || key
      mappedData[dbColumn] = value
    })

    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .update(mappedData)
      .eq('id', id)
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating product:', error)
    return { data: null, error: error.message }
  }
}

// Delete single product
export async function deleteProduct(table, id) {
  try {
    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { data: null, error: error.message }
  }
}

// Bulk delete multiple products
export async function bulkDeleteProducts(table, ids) {
  try {
    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .delete()
      .in('id', ids)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk deleting products:', error)
    return { data: null, error: error.message }
  }
}

// Update product prices
export async function updateProductPrices(priceUpdates) {
  try {
    const results = []

    for (const update of priceUpdates) {
      const { id, price, type } = update

      const tableName = getTableName(type)
      const { data, error } = await getSupabaseClient()
        .from(tableName)
        .update({ price_pc: price })
        .eq('id', id)
        .select()

      results.push({ id, data, error })
    }

    return { results, error: null }
  } catch (error) {
    console.error('Error updating prices:', error)
    return { results: [], error: error.message }
  }
}

// Bulk update multiple products
export async function bulkUpdateProducts(table, ids, updateData) {
  try {
    // Map frontend field names to database column names
    const mappedData = {}
    Object.entries(updateData).forEach(([key, value]) => {
      const dbColumn = fieldMapping[key] || key
      mappedData[dbColumn] = value
    })

    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .update(mappedData)
      .in('id', ids)
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk updating products:', error)
    return { data: null, error: error.message }
  }
}

// Bulk set category for multiple products
export async function bulkSetCategory(table, ids, categoryValue) {
  try {
    // V2 tables use 'sub_category' column
    const updateData = { sub_category: categoryValue }

    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .update(updateData)
      .in('id', ids)
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk setting category:', error)
    return { data: null, error: error.message }
  }
}

// Search products
export async function searchProducts(table, searchTerm) {
  try {
    // Build query with optimized selects - define column list explicitly
    const selectColumns = [
      'id',
      'model_number',
      'producttype',
      table === 'indoor' ? 'Indoor' : 'Outdoor',
      'price_pc',
      'Size'
    ].map(formatColumnName).join(',')

    const tableName = getTableName(table)
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .select(selectColumns)
      .or(`model_number.ilike.%${searchTerm}%,producttype.ilike.%${searchTerm}%`)
    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error searching products:', error)
    return { data: null, error: error.message }
  }
}

// Clear cache function
export function clearCache() {
  try {
    cache.clear()
    cacheHits = 0
    cacheMisses = 0
    return { data: { success: true }, error: null }
  } catch (error) {
    console.error('Error clearing cache:', error)
    return { data: null, error: error.message }
  }
}

export function clearCacheByPattern(pattern) {
  try {
    const matcher = pattern instanceof RegExp ? pattern : new RegExp(pattern)
    let cleared = 0
    for (const key of Array.from(cache.keys())) {
      if (matcher.test(key)) {
        cache.delete(key)
        cleared += 1
      }
    }
    return { data: { cleared }, error: null }
  } catch (error) {
    console.error('Error clearing cache by pattern:', error)
    return { data: null, error: error.message }
  }
}

export function getCacheStats() {
  const totalRequests = cacheHits + cacheMisses
  const hitRate = totalRequests === 0 ? 0 : cacheHits / totalRequests
  return {
    size: cache.size,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate
  }
}

export async function warmCache(table, commonFilters = [], paginationOverrides = {}) {
  try {
    if (!Array.isArray(commonFilters)) return { warmed: 0 }

    let warmed = 0
    for (const filters of commonFilters) {
      const cacheKey = getCacheKey('getProductsWithPagination', {
        table,
        filters,
        pagination: paginationOverrides
      })

      if (!cache.has(cacheKey)) {
        const result = await getProductsWithPagination(table, filters, paginationOverrides)
        if (!result.error) {
          setCache(cacheKey, result)
          warmed += 1
        }
      }
    }

    return { warmed }
  } catch (error) {
    console.error('Error warming cache:', error)
    return { warmed: 0, error: error.message }
  }
}
