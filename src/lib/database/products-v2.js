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

const idResolutionCache = new Map();

async function ensureUUIDForId(type, rawId) {
  if (rawId === null || rawId === undefined) {
    return { original: rawId, resolved: rawId, isUUID: false, changed: false };
  }

  const stringId = typeof rawId === 'string' ? rawId : String(rawId);
  const cacheKey = `${type}:${stringId}`;

  if (idResolutionCache.has(cacheKey)) {
    return idResolutionCache.get(cacheKey);
  }

  const resolver = (async () => {
    if (isValidUUID(stringId)) {
      return { original: stringId, resolved: stringId, isUUID: true, changed: false };
    }

    const { id: resolvedId, isUUID } = await resolveProductId(type, stringId);
    const resolvedValue = isUUID && resolvedId ? resolvedId : stringId;

    return {
      original: stringId,
      resolved: resolvedValue,
      isUUID,
      changed: isUUID && resolvedId && resolvedId !== stringId
    };
  })();

  idResolutionCache.set(cacheKey, resolver);
  return resolver;
}

async function resolveProductListIds(type, products = []) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const resolvedProducts = await Promise.all(
    products.map(async (product) => {
      if (!product || typeof product !== 'object') return product;

      const result = await ensureUUIDForId(type, product.id);
      if (!result) return product;

      if (result.changed) {
        return {
          ...product,
          id: result.resolved,
          legacy_id: product.legacy_id ?? result.original
        };
      }

      if (result.resolved !== product.id) {
        return { ...product, id: result.resolved };
      }

      return product;
    })
  );

  return resolvedProducts;
}

async function normalizeIdsForQuery(type, ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { idsForQuery: [], resolution: [] };
  }

  const resolution = await Promise.all(ids.map((id) => ensureUUIDForId(type, id)));
  const idsForQuery = Array.from(new Set(resolution.map((item) => item.resolved)));

  return { idsForQuery, resolution };
}

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
  pirMicrowave: 'pir_microwave',
  remoteControl: 'remote_control_bluetooth',
  remoteControlBluetooth: 'remote_control_bluetooth',
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

const V2_ALLOWED_COLUMNS = new Set([
  'sub_category',
  'product_name',
  'model_number',
  'size',
  'power_w',
  'voltage',
  'cct',
  'cri_ra',
  'lumen',
  'efficacy_lumen_per_w',
  'dimming_type',
  'material_finish',
  'sensors_and_controls',
  'occupancy',
  'bi_level',
  'pir_microwave',
  'remote_control_bluetooth',
  'plugin_sensor',
  'emergency_backup_battery',
  'junction_cover',
  'mounting',
  'installation_kits',
  'adjustment_dial',
  'certifications',
  'price_per_piece',
  'lead_time',
  'cut_sheet',
  'warranty',
  'moq',
  'cost_china_ddp_usa',
  'cost_thailand_vietnam',
  'photo',
  'ip_rating',
  'markup_percentage',
  'sensor_cost',
  'sensor_price',
  'remote_control_bluetooth_cost',
  'remote_control_bluetooth_price',
  'plugin_sensor_cost',
  'plugin_sensor_price',
  'emergency_backup_battery_cost',
  'emergency_backup_battery_price',
  'installation_kits_cost',
  'installation_kits_price'
])

const V2_BOOLEAN_COLUMNS = new Set([
  'sensors_and_controls',
  'occupancy',
  'bi_level',
  'pir_microwave',
  'remote_control_bluetooth',
  'plugin_sensor',
  'emergency_backup_battery',
  'junction_cover'
])

const V2_INTEGER_COLUMNS = new Set(['cri_ra'])

const TRUTHY_BOOLEAN_VALUES = new Set(['true', 'yes', '1', 'included', 'optional'])

function normalizeBooleanInput(value) {
  if (typeof value === 'boolean') return value
  if (value === null || value === undefined) return null
  const normalized = String(value).trim().toUpperCase()
  if (normalized === '') return null
  if (normalized === 'TRUE' || normalized === 'T') return true
  if (normalized === 'FALSE' || normalized === 'F') return false
  // Handle lowercase versions
  const lowerNormalized = normalized.toLowerCase()
  if (lowerNormalized === 'true' || lowerNormalized === 'yes' || lowerNormalized === '1' || lowerNormalized === 'included' || lowerNormalized === 'optional') return true
  if (lowerNormalized === 'false' || lowerNormalized === 'no' || lowerNormalized === '0') return false
  return null
}

function normalizeIntegerInput(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function sanitizeProductForInsert(product, options = {}) {
  const { fillBooleanDefaults = true } = options
  const sanitized = {}

  Object.entries(product).forEach(([key, rawValue]) => {
    const dbColumn = fieldMappingV2[key] || key
    if (!V2_ALLOWED_COLUMNS.has(dbColumn)) {
      return
    }

    let value = rawValue
    if (typeof value === 'string') {
      value = value.trim()
    }

    if (value === '') {
      sanitized[dbColumn] = null
      return
    }

    if (V2_BOOLEAN_COLUMNS.has(dbColumn)) {
      sanitized[dbColumn] = normalizeBooleanInput(value)
      return
    }

    if (V2_INTEGER_COLUMNS.has(dbColumn)) {
      sanitized[dbColumn] = normalizeIntegerInput(value)
      return
    }

    sanitized[dbColumn] = value
  })

  if (fillBooleanDefaults) {
    V2_BOOLEAN_COLUMNS.forEach((column) => {
      if (!(column in sanitized)) {
        sanitized[column] = false
      }
    })
  }

  return sanitized
}

export function getReverseFieldMappingV2() {
  return Object.entries(fieldMappingV2).reduce((acc, [frontendField, dbColumn]) => {
    acc[dbColumn] = frontendField
    return acc
  }, {})
}

// Get table name for v2 tables
function getTableNameV2(type) {
  return type === 'indoor' ? 'indoor_products_v3' : 'outdoor_products_v3'
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
      const [resolvedProduct] = await resolveProductListIds(type, data)
      return { data: resolvedProduct, error: null };
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
        const [resolvedFallback] = await resolveProductListIds(type, fallbackData)
        return { data: resolvedFallback, error: null };
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
    validateTableType(type)
    const table = getTableNameV2(type)
    
    const { data, error } = await supabase
      .from(table)
      .select('sub_category')
      .not('sub_category', 'is', null)
      .order('sub_category', { ascending: true })

    if (error) {
      console.error('[getDistinctCategoriesV2] Database error:', error)
      throw error
    }

    const uniqueValues = [...new Set(data.map(item => item.sub_category).filter(Boolean))]
    
    return { data: uniqueValues.map(value => ({ sub_category: value })), error: null }
  } catch (error) {
    console.error('[getDistinctCategoriesV2] Error:', error)
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
        // Skip empty values
        if (value === undefined || value === '') {
          return
        }
        
        // Map frontend field names to database column names
        const dbColumn = fieldMappingV2[key] || key
        
        // Handle boolean columns - normalize to boolean
        if (V2_BOOLEAN_COLUMNS.has(dbColumn)) {
          // Handle null explicitly for nullable boolean fields (like pir_microwave)
          if (value === null) {
            query = query.is(formatColumnName(dbColumn), null)
          } else {
            // Convert to boolean
            const boolValue = normalizeBooleanInput(value)
            query = query.eq(formatColumnName(dbColumn), boolValue)
          }
        } 
        // Handle integer columns
        else if (V2_INTEGER_COLUMNS.has(dbColumn)) {
          if (value === null) {
            query = query.is(formatColumnName(dbColumn), null)
          } else {
            const intValue = normalizeIntegerInput(value)
            if (intValue !== null) {
              query = query.eq(formatColumnName(dbColumn), intValue)
            }
          }
        }
        // Handle null values explicitly for other fields
        else if (value === null) {
          query = query.is(formatColumnName(dbColumn), null)
        } 
        // Handle text/numeric fields
        else {
          query = query.eq(formatColumnName(dbColumn), value)
        }
      })
    }

    console.log("#################### query",query)
    
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    
    const resolvedData = await resolveProductListIds(type, data || [])

    return { data: resolvedData, error: null }
  } catch (error) {
    console.error('Error fetching products:', error)
    return { data: null, error: error.message }
  }
}

// Get all products with optional filters
export async function getAllProductsV2(type, filters = {}) {
  try {

    console.log("#### getAllProductsV2 filters", filters)
    console.log("#### getAllProductsV2 type", type)
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
      
      // Skip empty values
      if (value === undefined || value === '') {
        return
      }
      
      // Handle boolean columns - normalize to boolean
      if (V2_BOOLEAN_COLUMNS.has(dbColumn)) {
        const column = formatColumnName(dbColumn)
        // Handle null explicitly for nullable boolean fields (like pir_microwave)
        if (value === null) {
          query = query.is(column, null)
        } else {
          // Convert to boolean
          const boolValue = normalizeBooleanInput(value)
          if (boolValue === true) {
            query = query.eq(column, true)
          } else {
            // When filtering for false, include nulls as well
            query = query.or(`${dbColumn}.is.null,${dbColumn}.eq.false`)
          }
        }
      } 
      // Handle integer columns
      else if (V2_INTEGER_COLUMNS.has(dbColumn)) {
        if (value === null) {
          query = query.is(formatColumnName(dbColumn), null)
        } else {
          const intValue = normalizeIntegerInput(value)
          if (intValue !== null) {
            query = query.eq(formatColumnName(dbColumn), intValue)
          }
        }
      }
      // Handle null values explicitly for other fields
      else if (value === null) {
        query = query.is(formatColumnName(dbColumn), null)
      } 
      // Handle text/numeric fields
      else {
        query = query.eq(formatColumnName(dbColumn), value)
      }
    })

    const { data, error } = await query

    if (error) throw error

    const resolvedData = await resolveProductListIds(type, data || [])

    return { data: resolvedData, error: null }
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
      // Skip empty values
      if (value === undefined || value === '') {
        return
      }
      
      const dbColumn = fieldMappingV2[key] || key
      
      // Special handling for sensor-related filters (legacy support)
      if (key === 'sensorsAndControls') {
        // Handle boolean conversion
        if (value === null) {
          query = query.is('sensors_and_controls', null)
        } else {
          const boolValue = normalizeBooleanInput(value)
          query = query.eq('sensors_and_controls', boolValue)
        }
      } else if (key === 'sensorType') {
        // Handle boolean/nullable field
        if (value === null) {
          query = query.is('pir_microwave', null)
        } else {
          const boolValue = normalizeBooleanInput(value)
          query = query.eq('pir_microwave', boolValue)
        }
      } 
      // Handle boolean columns - normalize to boolean
      else if (V2_BOOLEAN_COLUMNS.has(dbColumn)) {
        // Handle null explicitly for nullable boolean fields (like pir_microwave)
        if (value === null) {
          query = query.is(formatColumnName(dbColumn), null)
        } else {
          // Convert to boolean
          const boolValue = normalizeBooleanInput(value)
          query = query.eq(formatColumnName(dbColumn), boolValue)
        }
      } 
      // Handle integer columns
      else if (V2_INTEGER_COLUMNS.has(dbColumn)) {
        if (value === null) {
          query = query.is(formatColumnName(dbColumn), null)
        } else {
          const intValue = normalizeIntegerInput(value)
          if (intValue !== null) {
            query = query.eq(formatColumnName(dbColumn), intValue)
          }
        }
      }
      // Handle null values explicitly for other fields
      else if (value === null) {
        query = query.is(formatColumnName(dbColumn), null)
      } 
      // Handle text/numeric fields
      else {
        query = query.eq(formatColumnName(dbColumn), value)
      }
    })

    const { data, error } = await query

    if (error) throw error

    const resolvedData = await resolveProductListIds(type, data || [])

    return { data: resolvedData, error: null }
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
      .select('sensors_and_controls, pir_microwave')
      .not('sensors_and_controls', 'is', null)

    if (error) throw error

    // Group sensor types by control type
    const sensorOptions = data.reduce((acc, item) => {
      const controlType = item.sensors_and_controls
      const sensorType = item.pir_microwave
      
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

    const resolvedData = await resolveProductListIds(type, data || [])

    return { data: resolvedData, error: null }
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
      // Skip empty values
      if (value === undefined || value === '') {
        return
      }
      
      // Map frontend field names to database column names
      const dbColumn = fieldMappingV2[key] || key
      
      // Handle boolean columns - normalize to boolean
      if (V2_BOOLEAN_COLUMNS.has(dbColumn)) {
        // Handle null explicitly for nullable boolean fields (like pir_microwave)
        if (value === null) {
          query = query.is(formatColumnName(dbColumn), null)
        } else {
          // Convert to boolean
          const boolValue = normalizeBooleanInput(value)
          query = query.eq(formatColumnName(dbColumn), boolValue)
        }
      } 
      // Handle integer columns
      else if (V2_INTEGER_COLUMNS.has(dbColumn)) {
        if (value === null) {
          query = query.is(formatColumnName(dbColumn), null)
        } else {
          const intValue = normalizeIntegerInput(value)
          if (intValue !== null) {
            query = query.eq(formatColumnName(dbColumn), intValue)
          }
        }
      }
      // Handle null values explicitly for other fields
      else if (value === null) {
        query = query.is(formatColumnName(dbColumn), null)
      } 
      // Handle text/numeric fields
      else {
        query = query.eq(formatColumnName(dbColumn), value)
      }
    })

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    const resolvedData = await resolveProductListIds(type, data || [])

    return { data: resolvedData, count, error: null }
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
    const mappedData = sanitizeProductForInsert(updateData, { fillBooleanDefaults: false })

    // Validate update data
    const validationErrors = validateProductDataV2(type, mappedData, 'update')
    if (validationErrors.length > 0) {
      const error = validationErrors[0]
      return { data: null, error: error.message, errorDetails: error, validationErrors }
    }
    
    if (Object.keys(mappedData).length === 0) {
      const error = createV2Error(
        V2_ERROR_TYPES.INVALID_FIELD_VALUE,
        'No valid fields provided for update operation',
        { operation: 'update', table: type }
      )
      return { data: null, error: error.message, errorDetails: error }
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

    const resolvedData = await resolveProductListIds(type, data || [])

    return { data: resolvedData, error: null }
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
      const sanitizedProduct = sanitizeProductForInsert(product, { fillBooleanDefaults: true })

      // Validate each product
      const validationErrors = validateProductDataV2(type, sanitizedProduct, 'create')
      if (validationErrors.length > 0) {
        allValidationErrors.push({
          productIndex: i,
          errors: validationErrors
        })
      } else {
        productsToInsert.push(sanitizedProduct)
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

    const resolvedData = await resolveProductListIds(type, data || [])

    return { data: resolvedData, error: null }
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
    const mappedData = sanitizeProductForInsert(updateData, { fillBooleanDefaults: false })

    // Validate bulk operation
    const validationErrors = validateBulkOperationV2(type, ids, mappedData)
    if (validationErrors.length > 0) {
      const error = validationErrors[0]
      return { data: null, error: error.message, errorDetails: error, validationErrors }
    }
    
    const table = getTableNameV2(type)
    const { idsForQuery, resolution } = await normalizeIdsForQuery(type, ids)

    if (idsForQuery.length === 0) {
      const notFoundError = createV2Error(
        V2_ERROR_TYPES.PRODUCT_NOT_FOUND,
        `No valid product IDs provided for ${table}`,
        { operation: 'bulkUpdate', table: type, idsCount: ids.length, ids }
      )
      return { data: null, error: notFoundError.message, errorDetails: notFoundError }
    }


    const { data: existingRecords, error: existingError } = await supabase
      .from(table)
      .select('id, model_number')
      .in('id', idsForQuery)

    if (existingError) {
      console.error('[bulkUpdateProductsV2] preflight select error', existingError)
    } else {
    }

    const { data, error } = await supabase
      .from(table)
      .update(mappedData)
      .in('id', idsForQuery)
      .select()

    if (error) throw error
    
    // Check if any products were updated
    if (!data || data.length === 0) {
      const notFoundError = createV2Error(
        V2_ERROR_TYPES.PRODUCT_NOT_FOUND,
        `No products found with the provided IDs in ${table}`,
        {
          operation: 'bulkUpdate',
          table: type,
          idsCount: ids.length,
          ids,
          resolvedIds: resolution,
          matchedRecords: existingRecords?.length || 0
        }
      )
      return { data: null, error: notFoundError.message, errorDetails: notFoundError }
    }

    const dataWithLegacy = await resolveProductListIds(type, data || [])

    return { data: dataWithLegacy, error: null, resolvedIds: resolution }
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
      // Skip empty values
      if (value === undefined || value === '') {
        return
      }
      
      const dbColumn = fieldMappingV2[key] || key
      
      // Handle boolean columns - normalize to boolean
      if (V2_BOOLEAN_COLUMNS.has(dbColumn)) {
        // Handle null explicitly for nullable boolean fields (like pir_microwave)
        if (value === null) {
          query = query.is(formatColumnName(dbColumn), null)
        } else {
          // Convert to boolean
          const boolValue = normalizeBooleanInput(value)
          query = query.eq(formatColumnName(dbColumn), boolValue)
        }
      } 
      // Handle integer columns
      else if (V2_INTEGER_COLUMNS.has(dbColumn)) {
        if (value === null) {
          query = query.is(formatColumnName(dbColumn), null)
        } else {
          const intValue = normalizeIntegerInput(value)
          if (intValue !== null) {
            query = query.eq(formatColumnName(dbColumn), intValue)
          }
        }
      }
      // Handle null values explicitly for other fields
      else if (value === null) {
        query = query.is(formatColumnName(dbColumn), null)
      } 
      // Handle text/numeric fields
      else {
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

// Helper to add value into a Set safely
function addValueToSetV2(value, targetSet) {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    value.forEach(v => addValueToSetV2(v, targetSet));
    return;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.includes(',')) {
      trimmed.split(',').map(part => part.trim()).filter(Boolean).forEach(part => targetSet.add(part));
      return;
    }
    targetSet.add(trimmed);
    return;
  }
  targetSet.add(value);
}

// Fetch distinct values for dropdown filters for a given table, applying existing filters (except the column itself)
export async function getFilterOptionsV2(type, filters = {}) {
  try {
    validateTableType(type);
    // sanitize filters using existing validation util, ignore errors
    const { filters: sanitizedFilters } = validateFiltersV2(filters);

    const table = getTableNameV2(type);
    // db column list to fetch - all available v2 fields
    const filterColumns = [
      'sub_category',
      'product_name',
      'model_number',
      'size',
      'power_w',
      'voltage',
      'cct',
      'cri_ra',
      'lumen',
      'efficacy_lumen_per_w',
      'dimming_type',
      'material_finish',
      'sensors_and_controls',
      'mounting',
      'certifications',
      'lead_time',
      'warranty',
      'moq'
    ];
    if (type === 'outdoor') {
      filterColumns.push('ip_rating');
    }

    let query = supabase.from(table).select(filterColumns.map(formatColumnName).join(','));

    // apply filters
    Object.entries(sanitizedFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      const dbColumn = fieldMappingV2[key] || key;
      // do not filter on the same column when collecting its distinct values to avoid empty sets
      if (!filterColumns.includes(dbColumn)) {
        query = query.eq(formatColumnName(dbColumn), value);
      }
    });

    const { data, error } = await query;
    if (error) throw error;

    const options = {
      categories: new Set(),
      producttypes: new Set(),
      modelNumbers: new Set(),
      sizes: new Set(),
      Voltage: new Set(),
      power_w: new Set(),
      CCT: new Set(),
      cri_ra: new Set(),
      lumen: new Set(),
      efficacy: new Set(),
      dimmingType: new Set(),
      materialFinish: new Set(),
      sensorsControls: new Set(),
      mounting: new Set(),
      certifications: new Set(),
      leadTime: new Set(),
      warranty: new Set(),
      moq: new Set(),
      ip_rating: type === 'outdoor' ? new Set() : null
    };

    data.forEach(row => {
      addValueToSetV2(row.sub_category, options.categories);
      addValueToSetV2(row.product_name, options.producttypes);
      addValueToSetV2(row.model_number, options.modelNumbers);
      addValueToSetV2(row.size, options.sizes);
      addValueToSetV2(row.voltage, options.Voltage);
      addValueToSetV2(row.power_w, options.power_w);
      addValueToSetV2(row.cct, options.CCT);
      addValueToSetV2(row.cri_ra, options.cri_ra);
      addValueToSetV2(row.lumen, options.lumen);
      addValueToSetV2(row.efficacy_lumen_per_w, options.efficacy);
      addValueToSetV2(row.dimming_type, options.dimmingType);
      addValueToSetV2(row.material_finish, options.materialFinish);
      addValueToSetV2(row.sensors_and_controls, options.sensorsControls);
      addValueToSetV2(row.mounting, options.mounting);
      addValueToSetV2(row.certifications, options.certifications);
      addValueToSetV2(row.lead_time, options.leadTime);
      addValueToSetV2(row.warranty, options.warranty);
      addValueToSetV2(row.moq, options.moq);
      if (type === 'outdoor') {
        addValueToSetV2(row.ip_rating, options.ip_rating);
      }
    });

    const sortFn = (a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    };

    return Object.entries(options).reduce((acc, [key, setVal]) => {
      acc[key] = setVal ? Array.from(setVal).sort(sortFn) : [];
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching filter options V2:', error);
    return {};
  }
}