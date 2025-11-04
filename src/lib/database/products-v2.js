import { supabase } from '../supabase';

// Helper function to check if a string is a valid UUID
function isValidUUID(uuid) {
  if (typeof uuid !== 'string') return false;
  // Simple regex to check for UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to get numeric ID from old ID if needed
async function resolveProductId(type, id) {
  // If it's already a valid UUID, return as is
  if (isValidUUID(id)) {
    return { id, isUUID: true };
  }
  
  try {
    // Use the database function to resolve the ID
    const { data, error } = await supabase
      .rpc('resolve_product_id', { 
        p_old_id: id, 
        p_type: type 
      });
    
    if (error) throw error;
    
    if (data) {
      return { id: data, isUUID: true };
    }
    
  } catch (error) {
    console.warn(`Error resolving product ID ${id} for type ${type}:`, error);
  }
  
  // If we can't resolve it, return the original ID
  return { id, isUUID: false };
}

import {
  validateTableType,
  validateProductDataV2,
  validateBulkOperationV2,
  validateFiltersV2,
  validatePaginationV2,
  formatDatabaseErrorV2,
  createV2Error,
  V2_ERROR_TYPES
} from './v2-validation'

function formatColumnName(column) {
  if (!column) return column
  return /^[a-z0-9_]+$/.test(column) ? column : `"${column.replace(/"/g, '""')}"`
}

// Updated field mapping for the new v2 tables
// Only includes fields that actually exist in the v2 database schema
export const fieldMappingV2 = {
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
  ipRating: 'ip_rating'
}

export function getReverseFieldMappingV2() {
  return Object.entries(fieldMappingV2).reduce((acc, [frontendField, dbColumn]) => {
    acc[dbColumn] = frontendField
    return acc
  }, {})
}

// Get table name for v2 tables
function getTableNameV2(type) {
  return type === 'indoor' ? 'indoor_products_v2' : 'outdoor_products_v2'
}

export async function getProductByIdV2(type, id) {
  try {
    // Validate table type
    validateTableType(type);
    const table = getTableNameV2(type);

    // Validate ID
    if (!id) {
      const error = createV2Error(
        V2_ERROR_TYPES.INVALID_INPUT,
        'Product ID is required',
        { operation: 'read', table: type, id }
      );
      return { data: null, error: error.message, errorDetails: error };
    }

    // First, try to get the product by ID directly
    const { data, error } = await supabase.rpc('get_product_by_id', {
      p_table: table,
      p_id: id.toString() // Convert to string to handle both numbers and UUIDs
    });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return { data: data[0], error: null };
    }
    
    // If not found and ID is numeric, try with a different approach
    if (!isNaN(Number(id))) {
      // Try to find any product where the ID contains the numeric part
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(table)
        .select('*')
        .ilike('id', `%${id}%`)
        .limit(1);
        
      if (fallbackData && fallbackData.length > 0) {
        return { data: fallbackData[0], error: null };
      }
      
      if (fallbackError) {
        console.warn('Fallback query error:', fallbackError);
      }
    }

    if (error) {
      // Check if product not found
      if (error.code === 'PGRST116') {
        const notFoundError = createV2Error(
          V2_ERROR_TYPES.PRODUCT_NOT_FOUND,
          `Product with ID "${id}" not found in ${table}`,
          { operation: 'read', table: type, productId: id }
        )
        return { data: null, error: notFoundError.message, errorDetails: notFoundError }
      }
      throw error
    }

    return { data: data ? { ...data, table, type } : null, error: null }
  } catch (error) {
    console.error('Error fetching product by id:', error)
    const formattedError = formatDatabaseErrorV2(error, 'read', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

export async function getProductsByIdsV2(references = []) {
  if (!Array.isArray(references) || references.length === 0) {
    return []
  }

  const results = await Promise.all(
    references.map(async ({ type, id }) => {
      if (!type || !id) return null
      const { data } = await getProductByIdV2(type, id)
      return data ?? null
    })
  )

  return results.filter(Boolean)
}

// Get distinct categories from v2 tables
export async function getDistinctCategoriesV2(type) {
  try {
    // Validate table type
    validateTableType(type)
    
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .select('sub_category')
      .not('sub_category', 'is', null)
      .order('sub_category', { ascending: true })

    if (error) {
      console.error('Database error in getDistinctCategoriesV2:', error)
      throw error
    }

    // Get unique values manually since Supabase doesn't support DISTINCT
    const uniqueValues = [...new Set(data.map(item => item.sub_category).filter(Boolean))]
    
    return { data: uniqueValues.map(value => ({ sub_category: value })), error: null }
  } catch (error) {
    console.error('Error fetching categories from v2 tables:', error)
    const formattedError = formatDatabaseErrorV2(error, 'read', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

// Get distinct product names from v2 tables
export async function getDistinctProductNamesV2(type) {
  try {
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .select('product_name')
      .not('product_name', 'is', null)
      .order('product_name', { ascending: true })

    if (error) throw error

    // Get unique product names manually
    const uniqueNames = [...new Set(data.map(item => item.product_name).filter(Boolean))]
    
    return { data: uniqueNames.map(product_name => ({ product_name })), error: null }
  } catch (error) {
    console.error('Error fetching distinct product names:', error)
    return { data: null, error: error.message }
  }
}

// Get product names grouped by category
export async function getProductNamesByCategoryV2(type) {
  try {
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .select('sub_category, product_name')
      .not('product_name', 'is', null)
      .not('sub_category', 'is', null)
      .order('product_name', { ascending: true })

    if (error) throw error

    // Group product names by category
    const groupedData = data.reduce((acc, item) => {
      const category = item.sub_category
      const productName = item.product_name
      
      if (!acc[category]) {
        acc[category] = []
      }
      
      if (!acc[category].includes(productName)) {
        acc[category].push(productName)
      }
      
      return acc
    }, {})

    // Transform to the expected format
    const result = Object.entries(groupedData).map(([category, productNames]) => ({
      sub_category: category,
      product_names: productNames
    }))

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching product names by category:', error)
    return { data: null, error: error.message }
  }
}

// Get products by category with optional limit and filters
export async function getProductsByCategoryV2(type, category, options = {}) {
  try {
    const table = getTableNameV2(type)
    const { limit = null, filters: filterObj } = options
    let query = supabase
      .from(table)
      .select('*')
      .eq('sub_category', category)
    
    // Apply filters
    if (filterObj) {
      Object.entries(filterObj).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Map frontend field names to database column names
          const dbColumn = fieldMappingV2[key] || key
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
export async function getAllProductsV2(type, filters = {}) {
  try {
    // Validate table type
    validateTableType(type)
    
    // Validate and sanitize filters
    const { errors: filterErrors, filters: sanitizedFilters } = validateFiltersV2(filters)
    if (filterErrors.length > 0) {
      console.warn('Filter validation warnings:', filterErrors)
      // Continue with sanitized filters instead of failing
    }
    
    const table = getTableNameV2(type)
    let query = supabase
      .from(table)
      .select('*')

    // Apply filters
    Object.entries(sanitizedFilters).forEach(([key, value]) => {
      // Map frontend field names to database column names
      const dbColumn = fieldMappingV2[key] || key
      
      // Handle null values explicitly (for "None" sensor options)
      if (value === null) {
        query = query.is(formatColumnName(dbColumn), null)
      } else if (value !== undefined && value !== '') {
        query = query.eq(formatColumnName(dbColumn), value)
      }
    })

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching all products from v2 tables:', error)
    const formattedError = formatDatabaseErrorV2(error, 'read', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

// Get products with sensor filtering
export async function getProductsWithSensorFiltersV2(type, filters = {}) {
  try {
    const table = getTableNameV2(type)
    let query = supabase
      .from(table)
      .select('*')

    // Apply standard filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const dbColumn = fieldMappingV2[key] || key
        
        // Special handling for sensor-related filters
        if (key === 'sensorsAndControls') {
          query = query.eq('sensors_and_controls', value)
        } else if (key === 'sensorType') {
          query = query.eq('pir_microwave_bluetooth', value)
        } else {
          query = query.eq(formatColumnName(dbColumn), value)
        }
      }
    })

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching products with sensor filters:', error)
    return { data: null, error: error.message }
  }
}

// Get distinct sensor options
export async function getDistinctSensorOptionsV2(type) {
  try {
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .select('sensors_and_controls, pir_microwave_bluetooth')
      .not('sensors_and_controls', 'is', null)

    if (error) throw error

    // Group sensor types by control type
    const sensorOptions = data.reduce((acc, item) => {
      const controlType = item.sensors_and_controls
      const sensorType = item.pir_microwave_bluetooth
      
      if (!acc[controlType]) {
        acc[controlType] = new Set()
      }
      
      if (sensorType) {
        acc[controlType].add(sensorType)
      }
      
      return acc
    }, {})

    // Convert Sets to Arrays
    const result = Object.entries(sensorOptions).map(([controlType, sensorTypes]) => ({
      control_type: controlType,
      sensor_types: Array.from(sensorTypes)
    }))

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching sensor options:', error)
    return { data: null, error: error.message }
  }
}

// Search products by model number or other criteria
export async function searchProductsV2(type, searchTerm) {
  try {
    // Validate table type
    validateTableType(type)
    
    // Validate search term
    if (!searchTerm || searchTerm.trim() === '') {
      const error = createV2Error(
        V2_ERROR_TYPES.INVALID_FIELD_VALUE,
        'Search term is required',
        { field: 'searchTerm', operation: 'search', table: type }
      )
      return { data: null, error: error.message, errorDetails: error }
    }
    
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .or(`model_number.ilike.%${searchTerm}%, product_name.ilike.%${searchTerm}%, sub_category.ilike.%${searchTerm}%`)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error searching products in v2 table:', error)
    const formattedError = formatDatabaseErrorV2(error, 'search', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

// Get products with pagination support
export async function getProductsWithPaginationV2(type, filters = {}, pagination = {}) {
  try {
    // Validate table type
    validateTableType(type)
    
    // Validate pagination parameters
    const paginationErrors = validatePaginationV2(pagination)
    if (paginationErrors.length > 0) {
      const error = paginationErrors[0]
      return { data: null, count: 0, error: error.message, errorDetails: error }
    }
    
    // Validate and sanitize filters
    const { errors: filterErrors, filters: sanitizedFilters } = validateFiltersV2(filters)
    if (filterErrors.length > 0) {
      console.warn('Filter validation warnings:', filterErrors)
    }
    
    const table = getTableNameV2(type)
    const { currentPage = 1, pageSize = 25 } = pagination
    const offset = (currentPage - 1) * pageSize

    let query = supabase
      .from(table)
      .select('*', { count: 'exact' })

    // Apply filters
    Object.entries(sanitizedFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Map frontend field names to database column names
        const dbColumn = fieldMappingV2[key] || key
        query = query.eq(formatColumnName(dbColumn), value)
      }
    })

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    return { data, count, error: null }
  } catch (error) {
    console.error('Error fetching products with pagination from v2 tables:', error)
    const formattedError = formatDatabaseErrorV2(error, 'read', type)
    return { data: null, count: 0, error: formattedError.message, errorDetails: formattedError }
  }
}

// Update single product with field mapping
export async function updateProductV2(type, id, updateData) {
  try {
    // Validate table type
    validateTableType(type)
    
    // Validate ID
    if (!id) {
      const error = createV2Error(
        V2_ERROR_TYPES.INVALID_FIELD_VALUE,
        'Product ID is required for update operation',
        { field: 'id', operation: 'update', table: type }
      )
      return { data: null, error: error.message, errorDetails: error }
    }
    
    // Map frontend field names to database column names
    const mappedData = {}
    Object.entries(updateData).forEach(([key, value]) => {
      const dbColumn = fieldMappingV2[key] || key
      mappedData[dbColumn] = value
    })
    
    // Validate update data
    const validationErrors = validateProductDataV2(type, mappedData, 'update')
    if (validationErrors.length > 0) {
      const error = validationErrors[0]
      return { data: null, error: error.message, errorDetails: error, validationErrors }
    }
    
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .update(mappedData)
      .eq('id', id)
      .select()

    if (error) throw error
    
    // Check if product was found and updated
    if (!data || data.length === 0) {
      const notFoundError = createV2Error(
        V2_ERROR_TYPES.PRODUCT_NOT_FOUND,
        `Product with ID "${id}" not found in ${table}`,
        { operation: 'update', table: type, productId: id }
      )
      return { data: null, error: notFoundError.message, errorDetails: notFoundError }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error updating product in v2 table:', error)
    const formattedError = formatDatabaseErrorV2(error, 'update', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

// Create new products (for data entry)
export async function createProductsV2(type, products) {
  try {
    // Validate table type
    validateTableType(type)
    
    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      const error = createV2Error(
        V2_ERROR_TYPES.INVALID_FIELD_VALUE,
        'Products must be provided as a non-empty array',
        { operation: 'create', table: type }
      )
      return { data: null, error: error.message, errorDetails: error }
    }
    
    const table = getTableNameV2(type)
    
    // Map frontend field names to database column names for each product
    const productsToInsert = []
    const allValidationErrors = []
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const mappedProduct = {}
      
      Object.entries(product).forEach(([key, value]) => {
        const dbColumn = fieldMappingV2[key] || key
        mappedProduct[dbColumn] = value
      })
      
      // Validate each product
      const validationErrors = validateProductDataV2(type, mappedProduct, 'create')
      if (validationErrors.length > 0) {
        allValidationErrors.push({
          productIndex: i,
          errors: validationErrors
        })
      } else {
        productsToInsert.push(mappedProduct)
      }
    }
    
    // If there are validation errors, return them
    if (allValidationErrors.length > 0) {
      const error = createV2Error(
        V2_ERROR_TYPES.VALIDATION_ERROR,
        `Validation failed for ${allValidationErrors.length} product(s)`,
        { 
          operation: 'create', 
          table: type,
          validationErrors: allValidationErrors
        }
      )
      return { data: null, error: error.message, errorDetails: error, validationErrors: allValidationErrors }
    }

    const { data, error } = await supabase
      .from(table)
      .insert(productsToInsert)
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating products in v2 table:', error)
    const formattedError = formatDatabaseErrorV2(error, 'create', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

// Delete single product
export async function deleteProductV2(type, id) {
  try {
    // Validate table type
    validateTableType(type)
    
    // Validate ID
    if (!id) {
      const error = createV2Error(
        V2_ERROR_TYPES.INVALID_FIELD_VALUE,
        'Product ID is required for delete operation',
        { field: 'id', operation: 'delete', table: type }
      )
      return { data: null, error: error.message, errorDetails: error }
    }
    
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select()

    if (error) throw error
    
    // Check if product was found and deleted
    if (!data || data.length === 0) {
      const notFoundError = createV2Error(
        V2_ERROR_TYPES.PRODUCT_NOT_FOUND,
        `Product with ID "${id}" not found in ${table}`,
        { operation: 'delete', table: type, productId: id }
      )
      return { data: null, error: notFoundError.message, errorDetails: notFoundError }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error deleting product from v2 table:', error)
    const formattedError = formatDatabaseErrorV2(error, 'delete', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

// Bulk operations
export async function bulkUpdateProductsV2(type, ids, updateData) {
  try {
    // Map frontend field names to database column names
    const mappedData = {}
    Object.entries(updateData).forEach(([key, value]) => {
      const dbColumn = fieldMappingV2[key] || key
      mappedData[dbColumn] = value
    })
    
    // Validate bulk operation
    const validationErrors = validateBulkOperationV2(type, ids, mappedData)
    if (validationErrors.length > 0) {
      const error = validationErrors[0]
      return { data: null, error: error.message, errorDetails: error, validationErrors }
    }
    
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .update(mappedData)
      .in('id', ids)
      .select()

    if (error) throw error
    
    // Check if any products were updated
    if (!data || data.length === 0) {
      const notFoundError = createV2Error(
        V2_ERROR_TYPES.PRODUCT_NOT_FOUND,
        `No products found with the provided IDs in ${table}`,
        { operation: 'bulkUpdate', table: type, idsCount: ids.length }
      )
      return { data: null, error: notFoundError.message, errorDetails: notFoundError }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk updating products in v2 table:', error)
    const formattedError = formatDatabaseErrorV2(error, 'bulkUpdate', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

export async function bulkDeleteProductsV2(type, ids) {
  try {
    // Validate bulk operation
    const validationErrors = validateBulkOperationV2(type, ids)
    if (validationErrors.length > 0) {
      const error = validationErrors[0]
      return { data: null, error: error.message, errorDetails: error, validationErrors }
    }
    
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .delete()
      .in('id', ids)
      .select()

    if (error) throw error
    
    // Check if any products were deleted
    if (!data || data.length === 0) {
      const notFoundError = createV2Error(
        V2_ERROR_TYPES.PRODUCT_NOT_FOUND,
        `No products found with the provided IDs in ${table}`,
        { operation: 'bulkDelete', table: type, idsCount: ids.length }
      )
      return { data: null, error: notFoundError.message, errorDetails: notFoundError }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk deleting products from v2 table:', error)
    const formattedError = formatDatabaseErrorV2(error, 'bulkDelete', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

// Bulk set category (sub_category in v2 tables)
export async function bulkSetCategoryV2(type, ids, categoryValue) {
  try {
    // Validate bulk operation
    const validationErrors = validateBulkOperationV2(type, ids)
    if (validationErrors.length > 0) {
      const error = validationErrors[0]
      return { data: null, error: error.message, errorDetails: error, validationErrors }
    }
    
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .update({ sub_category: categoryValue })
      .in('id', ids)
      .select()

    if (error) throw error
    
    // Check if any products were updated
    if (!data || data.length === 0) {
      const notFoundError = createV2Error(
        V2_ERROR_TYPES.PRODUCT_NOT_FOUND,
        `No products found with the provided IDs in ${table}`,
        { operation: 'bulkSetCategory', table: type, idsCount: ids.length }
      )
      return { data: null, error: notFoundError.message, errorDetails: notFoundError }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk setting category in v2 table:', error)
    const formattedError = formatDatabaseErrorV2(error, 'bulkSetCategory', type)
    return { data: null, error: formattedError.message, errorDetails: formattedError }
  }
}

// Get total product count for pagination
export async function getProductCountV2(type, filters = {}) {
  try {
    const table = getTableNameV2(type)
    let query = supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const dbColumn = fieldMappingV2[key] || key
        query = query.eq(formatColumnName(dbColumn), value)
      }
    })

    const { count, error } = await query

    if (error) throw error

    return { count, error: null }
  } catch (error) {
    console.error('Error getting product count:', error)
    return { count: 0, error: error.message }
  }
}

// Get distinct product names (equivalent to product types in legacy)
export async function getDistinctProductTypesV2(type) {
  try {
    const table = getTableNameV2(type)
    const { data, error } = await supabase
      .from(table)
      .select('product_name')
      .not('product_name', 'is', null)
      .order('product_name', { ascending: true })

    if (error) throw error

    // Get unique product names manually since Supabase doesn't support DISTINCT
    const uniqueTypes = [...new Set(data.map(item => item.product_name).filter(Boolean))]
    
    // Transform the data to match the expected format (using product_name as producttype for compatibility)
    return { data: uniqueTypes.map(product_name => ({ producttype: product_name, product_name })), error: null }
  } catch (error) {
    console.error('Error fetching distinct product types:', error)
    return { data: null, error: error.message }
  }
}

// Update product prices in bulk
export async function updateProductPricesV2(priceUpdates) {
  try {
    const results = []

    for (const update of priceUpdates) {
      const { id, price, type } = update

      const table = getTableNameV2(type)
      const { data, error } = await supabase
        .from(table)
        .update({ price_per_piece: price })
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