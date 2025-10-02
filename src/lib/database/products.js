import { supabase } from '../supabase'

function formatColumnName(column) {
  if (!column) return column
  return /^[a-z0-9_]+$/.test(column) ? column : `"${column.replace(/"/g, '""')}"`
}

// Field mapping for frontend to database column translation
export const fieldMapping = {
  productType: 'producttype',
  category: 'category',
  name: 'name',
  description: 'description',
  modelNumber: 'model_number',
  sizes: 'Size',
  mounting: 'Mounting',
  voltage: 'Voltage',
  powerW: 'power_w',
  cct: 'CCT',
  criRa: 'cri_ra',
  lumen: 'Lumen',
  efficacyLmw: 'efficacy_lmw',
  beamAngle: 'beam_angle',
  powerFactor: 'power_factor',
  emergencyBackupBattery: 'emergency_backup_battery',
  pluginSensor: 'plugin_sensor',
  sensorMicrowaveBluetooth: 'sensor_microwave_bluetooth',
  junctionCover: 'junction_cover',
  remoteControl: 'remote_control',
  installationKits: 'installation_kits',
  adjustmentDial: 'adjustment_dial',
  materialFinish: 'Material Finish',
  ledType: 'led_type',
  driverBrand: 'driver_brand',
  dimmingType: 'Dimming Type',
  certifications: 'Certifications',
  leadTime: 'lead_time',
  warranty: 'Warranty',
  moq: 'MOQ',
  pricePc: 'price_pc',
  costChinaDdpUsa: 'cost_china_ddp_usa',
  costThailandVietnam: 'cost_thailand_vietnam',
  photo: 'Photo',
  cutSheet: 'cut_sheet',
  imageUrl: 'image_url',
  ipRating: 'ip_rating',
  ikRating: 'ik_rating',
}

// Note: Supabase tables mix snake_case with PascalCase + spaces (e.g. `Voltage`, `Dimming Type`).
// Keep frontend keys camelCase and map to the exact database column names here for consistency.
// This mapping is used for both frontend-to-database and database-to-frontend translations.

export function getReverseFieldMapping() {
  return Object.entries(fieldMapping).reduce((acc, [frontendField, dbColumn]) => {
    acc[dbColumn] = frontendField
    return acc
  }, {})
}

export const OUTDOOR_ONLY_FIELDS = ['ip_rating', 'ik_rating']
// Test function to check actual column names in database
export async function testColumnNames(type) {
  try {
    const { data, error } = await supabase
      .from(type)
      .select('*')
      .limit(1)

    if (error) throw error

    console.log('Actual columns in', type, 'table:', Object.keys(data[0] || {}))
    console.log('Sample data:', data[0])
    return { data, error: null }
  } catch (error) {
    console.error('Error testing columns:', error)
    return { data: null, error: error.message }
  }
}

// Get distinct categories from indoor or outdoor table
// Using proper column selection without DISTINCT keyword
export async function getDistinctCategories(type) {
  try {
    const columnName = type === 'indoor' ? 'Indoor' : 'Outdoor'
    const { data, error } = await supabase
      .from(type)
      .select(formatColumnName(columnName))
      .not(formatColumnName(columnName), 'is', null)
      .order(formatColumnName(columnName), { ascending: true })

    if (error) {
      console.error('Database error in getDistinctCategories:', error)
      throw error
    }

    // Get unique values manually since Supabase doesn't support DISTINCT
    const uniqueValues = [...new Set(data.map(item => item[columnName]).filter(Boolean))]
    
    // Transform the data to match the expected format
    return { data: uniqueValues.map(value => ({ [columnName]: value })), error: null }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: null, error: error.message }
  }
}

// Get distinct product types from indoor or outdoor table
export async function getDistinctProductTypes(type) {
  try {
    const { data, error } = await supabase
      .from(type)
      .select('producttype')
      .not('producttype', 'is', null)
      .order('producttype', { ascending: true })

    if (error) throw error

    // Get unique product types manually since Supabase doesn't support DISTINCT
    const uniqueTypes = [...new Set(data.map(item => item.producttype).filter(Boolean))]
    
    // Transform the data to match the expected format
    return { data: uniqueTypes.map(producttype => ({ producttype })), error: null }
  } catch (error) {
    console.error('Error fetching distinct product types:', error)
    return { data: null, error: error.message }
  }
}

// Get product types grouped by category
export async function getProductTypesByCategory(type) {
  try {
    const categoryColumn = type === 'indoor' ? 'Indoor' : 'Outdoor'
    const { data, error } = await supabase
      .from(type)
      .select(`${formatColumnName(categoryColumn)},producttype`)
      .not('producttype', 'is', null)
      .not(formatColumnName(categoryColumn), 'is', null)
      .order('producttype', { ascending: true })

    if (error) throw error

    // Group product types by category
    const groupedData = data.reduce((acc, item) => {
      const category = item[categoryColumn]
      const productType = item.producttype
      
      if (!acc[category]) {
        acc[category] = []
      }
      
      if (!acc[category].includes(productType)) {
        acc[category].push(productType)
      }
      
      return acc
    }, {})

    // Transform to the expected format
    const result = Object.entries(groupedData).map(([category, productTypes]) => ({
      [categoryColumn]: category,
      producttypes: productTypes
    }))

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching product types by category:', error)
    return { data: null, error: error.message }
  }
}

// Get products by type with optional limit and filters
export async function getProductsByType(type, productType, options = {}) {
  try {
    const { limit = null, filters: filterObj } = options
    let query = supabase
      .from(type)
      .select('*')
      .eq('producttype', productType)
    
    // Apply filters
    if (filterObj) {
      Object.entries(filterObj).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Map frontend field names to database column names
          const dbColumn = fieldMapping[key] || key
          query = query.eq(formatColumnName(dbColumn), value)
        }
      })
    }
    
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching products:', error)
    return { data: null, error: error.message }
  }
}

// Get all products with optional filters
export async function getAllProducts(type, filters = {}) {
  try {
    let query = supabase
      .from(type)
      .select('*')

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Map frontend field names to database column names
        const dbColumn = fieldMapping[key] || key
        query = query.eq(formatColumnName(dbColumn), value)
      }
    })

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching all products:', error)
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

    const { data, error } = await supabase
      .from(table)
      .insert(productsToInsert)
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating products:', error)
    return { data: null, error: error.message }
  }
}

// Update product prices
export async function updateProductPrices(priceUpdates) {
  try {
    const results = []

    for (const update of priceUpdates) {
      const { id, price, type } = update

      const { data, error } = await supabase
        .from(type)
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

// Search products by model number or other criteria
export async function searchProducts(type, searchTerm) {
  try {
    const { data, error } = await supabase
      .from(type)
      .select('*')
      .or(`model_number.ilike.%${searchTerm}%, producttype.ilike.%${searchTerm}%`)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error searching products:', error)
    return { data: null, error: error.message }
  }
}

// Update single product with field mapping
export async function updateProduct(table, id, updateData) {
  try {
    // Map frontend field names to database column names
    const mappedData = {}
    Object.entries(updateData).forEach(([key, value]) => {
      const dbColumn = fieldMapping[key] || key
      mappedData[dbColumn] = value
    })

    const { data, error } = await supabase
      .from(table)
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
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { data: null, error: error.message }
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

    const { data, error } = await supabase
      .from(table)
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

// Bulk delete multiple products
export async function bulkDeleteProducts(table, ids) {
  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .in('id', ids)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk deleting products:', error)
    return { data: null, error: error.message }
  }
}

// Bulk set category for multiple products
export async function bulkSetCategory(table, ids, categoryValue) {
  try {
    const categoryColumn = table === 'indoor' ? 'Indoor' : 'Outdoor'
    const updateData = { [categoryColumn]: categoryValue }

    const { data, error } = await supabase
      .from(table)
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

// Get products with pagination support
export async function getProductsWithPagination(table, filters = {}, pagination = {}) {
  try {
    const { currentPage = 1, pageSize = 25 } = pagination
    const offset = (currentPage - 1) * pageSize

    let query = supabase
      .from(table)
      .select('*', { count: 'exact' })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Special handling for category filter - map to table-specific column
        if (key === 'category') {
          const categoryColumn = table === 'indoor' ? 'Indoor' : 'Outdoor';
          query = query.eq(formatColumnName(categoryColumn), value);
        } else {
          // Map frontend field names to database column names
          const dbColumn = fieldMapping[key] || key;
          query = query.eq(formatColumnName(dbColumn), value);
        }
      }
    });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    return { data, count, error: null }
  } catch (error) {
    console.error('Error fetching products with pagination:', error)
    return { data: null, count: 0, error: error.message }
  }
}

// Get total product count for pagination
export async function getProductCount(table, filters = {}) {
  try {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Special handling for category filter - map to table-specific column
        if (key === 'category') {
          const categoryColumn = table === 'indoor' ? 'Indoor' : 'Outdoor';
          query = query.eq(categoryColumn, value);
        } else {
          // Map frontend field names to database column names
          const dbColumn = fieldMapping[key] || key;
          query = query.eq(dbColumn, value);
        }
      }
    });

    const { count, error } = await query

    if (error) throw error

    return { count, error: null }
  } catch (error) {
    console.error('Error getting product count:', error)
    return { count: 0, error: error.message }
  }
}
