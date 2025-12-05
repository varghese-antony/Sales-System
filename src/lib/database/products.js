import { supabase } from '../supabase'

function formatColumnName(column) {
  if (!column) return column
  return /^[a-z0-9_]+$/.test(column) ? column : `"${column.replace(/"/g, '""')}"`
}

// Helper function to get the correct table name (v2 tables)
function getTableName(table) {
  if (table === 'indoor') return 'indoor_products_v2'
  if (table === 'outdoor') return 'outdoor_products_v2'
  if (table === 'both') return 'both' // Special case handled separately
  return table // Return as-is if already a full table name
}

export async function getProductById(table, id) {
  try {
    const tableName = getTableName(table)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { data: data ? { ...data, table } : null, error: null }
  } catch (error) {
    console.error('Error fetching product by id:', error)
    return { data: null, error: error.message }
  }
}

export async function getProductsByIds(references = []) {
  if (!Array.isArray(references) || references.length === 0) {
    return []
  }

  const results = await Promise.all(
    references.map(async ({ table, id }) => {
      if (!table || !id) return null
      const { data } = await getProductById(table, id)
      return data ?? null
    })
  )

  return results.filter(Boolean)
}

// Field mapping for frontend to database column translation (V2 tables)
export const fieldMapping = {
  productType: 'product_name',
  category: 'sub_category',
  subCategory: 'sub_category',
  productName: 'product_name',
  modelNumber: 'model_number',
  size: 'size',
  sizes: 'size',
  powerW: 'power_w',
  voltage: 'voltage',
  cct: 'cct',
  criRa: 'cri_ra',
  lumen: 'lumen',
  efficacyLumenPerW: 'efficacy_lumen_per_w',
  efficacyLmw: 'efficacy_lumen_per_w',
  dimmingType: 'dimming_type',
  ledType: 'led_type',
  driverBrand: 'driver_brand',
  materialFinish: 'material_finish',
  sensorsAndControls: 'sensors_and_controls',
  occupancy: 'occupancy',
  biLevel: 'bi_level',
  pirMicrowaveBluetooth: 'pir_microwave_bluetooth',
  sensorMicrowaveBluetooth: 'pir_microwave_bluetooth',
  remoteControl: 'remote_control',
  pluginSensor: 'plugin_sensor',
  emergencyBackupBattery: 'emergency_backup_battery',
  junctionCover: 'junction_cover',
  mounting: 'mounting',
  installationKits: 'installation_kits',
  adjustmentDial: 'adjustment_dial',
  certifications: 'certifications',
  pricePerPiece: 'price_per_piece',
  pricePc: 'price_per_piece',
  leadTime: 'lead_time',
  cutSheet: 'cut_sheet',
  warranty: 'warranty',
  moq: 'moq',
  costChinaDdpUsa: 'cost_china_ddp_usa',
  costThailandVietnam: 'cost_thailand_vietnam',
  photo: 'photo',
  ipRating: 'ip_rating',
  ikRating: 'ik_rating',
  sensorCost: 'sensor_cost',
  sensorPrice: 'sensor_price',
  remoteControlBluetoothCost: 'remote_control_bluetooth_cost',
  remoteControlBluetoothPrice: 'remote_control_bluetooth_price',
  pluginSensorCost: 'plugin_sensor_cost',
  pluginSensorPrice: 'plugin_sensor_price',
  emergencyBackupBatteryCost: 'emergency_backup_battery_cost',
  emergencyBackupBatteryPrice: 'emergency_backup_battery_price',
  installationKitsCost: 'installation_kits_cost',
  installationKitsPrice: 'installation_kits_price'
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
    const tableName = getTableName(type)
    const { data, error } = await supabase
      .from(tableName)
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
    const tableName = getTableName(type)
    // V2 tables use 'sub_category' column instead of 'Indoor'/'Outdoor'
    const columnName = 'sub_category'
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .not(columnName, 'is', null)
      .order(columnName, { ascending: true })

    if (error) {
      console.error('Database error in getDistinctCategories:', error)
      throw error
    }

    // Get unique values manually since Supabase doesn't support DISTINCT
    const uniqueValues = [...new Set(data.map(item => item[columnName]).filter(Boolean))]
    
    // Transform the data to match the expected format
    return { data: uniqueValues.map(value => ({ sub_category: value })), error: null }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: null, error: error.message }
  }
}

// Get distinct product types from indoor or outdoor table
export async function getDistinctProductTypes(type) {
  try {
    const tableName = getTableName(type)
    // V2 tables use 'product_name' column instead of 'producttype'
    const columnName = 'product_name'
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .not(columnName, 'is', null)
      .order(columnName, { ascending: true })

    if (error) throw error

    // Get unique product types manually since Supabase doesn't support DISTINCT
    const uniqueTypes = [...new Set(data.map(item => item[columnName]).filter(Boolean))]
    
    // Transform the data to match the expected format (using product_name as producttype for compatibility)
    return { data: uniqueTypes.map(product_name => ({ producttype: product_name, product_name })), error: null }
  } catch (error) {
    console.error('Error fetching distinct product types:', error)
    return { data: null, error: error.message }
  }
}

// Get product types grouped by category
export async function getProductTypesByCategory(type) {
  try {
    const tableName = getTableName(type)
    // V2 tables use 'sub_category' and 'product_name' columns
    const { data, error } = await supabase
      .from(tableName)
      .select('sub_category,product_name')
      .not('product_name', 'is', null)
      .not('sub_category', 'is', null)
      .order('product_name', { ascending: true })

    console.log(`[getProductTypesByCategory] Supabase query result for type ${type}:`, { data, error })

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

    // Transform to the expected format
    const result = Object.entries(groupedData).map(([category, productTypes]) => ({
      sub_category: category,
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
    const tableName = getTableName(type)
    const { limit = null, filters: filterObj } = options
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('product_name', productType)
    
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
    const tableName = getTableName(type)
    let query = supabase
      .from(tableName)
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

    const tableName = getTableName(table)
    const { data, error } = await supabase
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

// Update product prices
export async function updateProductPrices(priceUpdates) {
  try {
    const results = []

    for (const update of priceUpdates) {
      const { id, price, type } = update

      const tableName = getTableName(type)
      const { data, error } = await supabase
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

// Search products by model number or other criteria
export async function searchProducts(type, searchTerm) {
  try {
    const tableName = getTableName(type)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .or(`model_number.ilike.%${searchTerm}%, product_name.ilike.%${searchTerm}%, sub_category.ilike.%${searchTerm}%`)

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

    const tableName = getTableName(table)
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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

// Bulk delete multiple products
export async function bulkDeleteProducts(table, ids) {
  try {
    const tableName = getTableName(table)
    const { data, error } = await supabase
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

// Bulk set category for multiple products
export async function bulkSetCategory(table, ids, categoryValue) {
  try {
    // V2 tables use 'sub_category' column
    const updateData = { sub_category: categoryValue }

    const tableName = getTableName(table)
    const { data, error } = await supabase
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

// Get products with pagination support
export async function getProductsWithPagination(table, filters = {}, pagination = {}) {
  try {
    const { currentPage = 1, pageSize = 25 } = pagination
    const offset = (currentPage - 1) * pageSize

    const tableName = getTableName(table)
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Special handling for category filter - map to v2 column
        if (key === 'category') {
          query = query.eq('sub_category', value);
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
    const tableName = getTableName(table)
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Special handling for category filter - map to v2 column
        if (key === 'category') {
          query = query.eq('sub_category', value);
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
