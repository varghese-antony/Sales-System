import { supabase } from '../supabase'

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
    return { data: uniqueValues.map(value => ({ [columnName]: value })), error: null }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: null, error: error.message }
  }
}

// Get product types grouped by category
export async function getProductTypesByCategory(type) {
  try {
    const categoryColumn = type === 'indoor' ? 'Indoor' : 'Outdoor'
    const { data, error } = await supabase
      .from(type)
      .select(`${categoryColumn}, producttype`)
      .not('producttype', 'is', null)
      .not(categoryColumn, 'is', null)
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
          const columnMapping = {
            productType: 'producttype',
            emergencyBackupBattery: 'emergency_backup_battery',
            powerW: 'power_w',
            criRa: 'cri_ra',
            beamAngle: 'efficacy_lmw',
            pf: 'Power Factor',
            leadTime: 'lead_time',
            driverBrand: 'Driver Brand',
            adjustmentDial: 'adjustment_dial',
            pricePc: 'price_pc',
            voltage: 'Voltage',
            cct: 'CCT',
            pluginSensor: 'plugin_sensor',
            dimmable: 'Dimmable',
            finish: 'Material Finish',
            sensorMicrowaveBluetooth: 'sensor_microwave_bluetooth',
          }
          const dbColumn = columnMapping[key] || key
          query = query.eq(dbColumn, value)
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
        const columnMapping = {
          productType: 'producttype',
          emergencyBackupBattery: 'emergency_backup_battery',
          powerW: 'power_w',
          criRa: 'cri_ra',
          beamAngle: 'efficacy_lmw',
          pf: 'Power Factor',
          leadTime: 'lead_time',
          driverBrand: 'Driver Brand',
          adjustmentDial: 'adjustment_dial',
          pricePc: 'price_pc',
          voltage: 'Voltage',
          cct: 'CCT',
          pluginSensor: 'plugin_sensor',
          dimmable: 'Dimmable',
          finish: 'Material Finish',
          sensorMicrowaveBluetooth: 'sensor_microwave_bluetooth',
        }
        const dbColumn = columnMapping[key] || key
        query = query.eq(dbColumn, value)
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
