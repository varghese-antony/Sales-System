/**
 * V2 Tables Validation and Error Handling Module
 * 
 * This module provides comprehensive validation and error handling
 * for operations on indoor_products_v2 and outdoor_products_v2 tables.
 */

// Field mapping for v2 tables (duplicated here to avoid circular dependency)
const fieldMappingV2 = {
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

// V2 Schema Definitions
export const V2_SCHEMA = {
  // Required fields for product creation
  required: ['sub_category', 'product_name'],
  
  // String fields with max lengths
  stringFields: {
    sub_category: { maxLength: 255 },
    product_name: { maxLength: 255 },
    model_number: { maxLength: 255 },
    size: { maxLength: 100 },
    voltage: { maxLength: 50 },
    cct: { maxLength: 50 },
    dimming_type: { maxLength: 100 },
    material_finish: { maxLength: 255 },
    sensors_and_controls: { maxLength: 100 },
    occupancy: { maxLength: 50 },
    bi_level: { maxLength: 50 },
    pir_microwave_bluetooth: { maxLength: 100 },
    remote_control: { maxLength: 50 },
    plugin_sensor: { maxLength: 50 },
    emergency_backup_battery: { maxLength: 50 },
    junction_cover: { maxLength: 50 },
    mounting: { maxLength: 100 },
    installation_kits: { maxLength: 255 },
    adjustment_dial: { maxLength: 50 },
    certifications: { maxLength: 255 },
    lead_time: { maxLength: 100 },
    warranty: { maxLength: 100 },
    moq: { maxLength: 100 },
    photo: { maxLength: 500 },
    cut_sheet: { maxLength: 500 },
    ip_rating: { maxLength: 50 }
  },
  
  // Numeric fields with validation rules
  numericFields: {
    power_w: { min: 0, max: 10000 },
    cri_ra: { min: 0, max: 100 },
    lumen: { min: 0, max: 1000000 },
    efficacy_lumen_per_w: { min: 0, max: 1000 },
    price_per_piece: { min: 0, max: 1000000 },
    cost_china_ddp_usa: { min: 0, max: 1000000 },
    cost_thailand_vietnam: { min: 0, max: 1000000 }
  },
  
  // Fields that should be URLs
  urlFields: ['photo', 'cut_sheet'],
  
  // Indoor-only fields
  indoorOnlyFields: [],
  
  // Outdoor-only fields
  outdoorOnlyFields: ['ip_rating']
}

// Error types for v2 operations
export const V2_ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_TYPE: 'INVALID_FIELD_TYPE',
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',
  FIELD_LENGTH_EXCEEDED: 'FIELD_LENGTH_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  OPERATION_ERROR: 'OPERATION_ERROR',
  INVALID_TABLE_TYPE: 'INVALID_TABLE_TYPE',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY'
}

/**
 * Create a standardized v2 error object
 */
export function createV2Error(type, message, details = {}) {
  const { table, ...otherDetails } = details
  return {
    type,
    message,
    table: table ? `${table}_products_v2` : 'v2 tables',
    timestamp: new Date().toISOString(),
    ...otherDetails
  }
}

/**
 * Validate table type parameter
 */
export function validateTableType(type) {
  if (!type || (type !== 'indoor' && type !== 'outdoor')) {
    throw createV2Error(
      V2_ERROR_TYPES.INVALID_TABLE_TYPE,
      'Invalid table type. Must be "indoor" or "outdoor"',
      { providedType: type }
    )
  }
  return true
}

/**
 * Validate required fields for v2 schema
 */
export function validateRequiredFields(data, operation = 'create') {
  const errors = []
  
  // For create operations, check all required fields
  if (operation === 'create') {
    for (const field of V2_SCHEMA.required) {
      if (!data[field] || data[field] === '') {
        errors.push(
          createV2Error(
            V2_ERROR_TYPES.MISSING_REQUIRED_FIELD,
            `Required field "${field}" is missing or empty`,
            { field, operation }
          )
        )
      }
    }
  }
  
  return errors
}

/**
 * Validate string field lengths
 */
export function validateStringFields(data) {
  const errors = []
  
  for (const [field, rules] of Object.entries(V2_SCHEMA.stringFields)) {
    if (data[field] !== undefined && data[field] !== null) {
      const value = String(data[field])
      
      if (value.length > rules.maxLength) {
        errors.push(
          createV2Error(
            V2_ERROR_TYPES.FIELD_LENGTH_EXCEEDED,
            `Field "${field}" exceeds maximum length of ${rules.maxLength} characters`,
            { 
              field, 
              maxLength: rules.maxLength, 
              actualLength: value.length,
              value: value.substring(0, 50) + (value.length > 50 ? '...' : '')
            }
          )
        )
      }
    }
  }
  
  return errors
}

/**
 * Validate numeric fields
 */
export function validateNumericFields(data) {
  const errors = []
  
  for (const [field, rules] of Object.entries(V2_SCHEMA.numericFields)) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const value = Number(data[field])
      
      if (isNaN(value)) {
        errors.push(
          createV2Error(
            V2_ERROR_TYPES.INVALID_FIELD_TYPE,
            `Field "${field}" must be a valid number`,
            { field, providedValue: data[field] }
          )
        )
        continue
      }
      
      if (value < rules.min) {
        errors.push(
          createV2Error(
            V2_ERROR_TYPES.INVALID_FIELD_VALUE,
            `Field "${field}" must be at least ${rules.min}`,
            { field, min: rules.min, providedValue: value }
          )
        )
      }
      
      if (value > rules.max) {
        errors.push(
          createV2Error(
            V2_ERROR_TYPES.INVALID_FIELD_VALUE,
            `Field "${field}" must not exceed ${rules.max}`,
            { field, max: rules.max, providedValue: value }
          )
        )
      }
    }
  }
  
  return errors
}

/**
 * Validate URL fields
 */
export function validateUrlFields(data) {
  const errors = []
  
  for (const field of V2_SCHEMA.urlFields) {
    if (data[field] && data[field] !== '') {
      const value = String(data[field])
      
      // Basic URL validation
      try {
        new URL(value)
      } catch (e) {
        // If not a full URL, check if it's a relative path (acceptable)
        if (!value.startsWith('/') && !value.startsWith('http')) {
          errors.push(
            createV2Error(
              V2_ERROR_TYPES.INVALID_FIELD_VALUE,
              `Field "${field}" must be a valid URL or path`,
              { field, providedValue: value }
            )
          )
        }
      }
    }
  }
  
  return errors
}

/**
 * Validate table-specific fields
 */
export function validateTableSpecificFields(type, data) {
  const errors = []
  
  if (type === 'indoor') {
    // Check for outdoor-only fields in indoor data
    for (const field of V2_SCHEMA.outdoorOnlyFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        errors.push(
          createV2Error(
            V2_ERROR_TYPES.INVALID_FIELD_VALUE,
            `Field "${field}" is only valid for outdoor products`,
            { field, table: 'indoor_products_v2' }
          )
        )
      }
    }
  }
  
  if (type === 'outdoor') {
    // Check for indoor-only fields in outdoor data
    for (const field of V2_SCHEMA.indoorOnlyFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        errors.push(
          createV2Error(
            V2_ERROR_TYPES.INVALID_FIELD_VALUE,
            `Field "${field}" is only valid for indoor products`,
            { field, table: 'outdoor_products_v2' }
          )
        )
      }
    }
  }
  
  return errors
}

/**
 * Comprehensive validation for v2 product data
 */
export function validateProductDataV2(type, data, operation = 'create') {
  const errors = []
  
  // Validate table type
  try {
    validateTableType(type)
  } catch (error) {
    return [error]
  }
  
  // Validate required fields
  errors.push(...validateRequiredFields(data, operation))
  
  // Validate string field lengths
  errors.push(...validateStringFields(data))
  
  // Validate numeric fields
  errors.push(...validateNumericFields(data))
  
  // Validate URL fields
  errors.push(...validateUrlFields(data))
  
  // Validate table-specific fields
  errors.push(...validateTableSpecificFields(type, data))
  
  return errors
}

/**
 * Validate bulk operation data
 */
export function validateBulkOperationV2(type, ids, data = null) {
  const errors = []
  
  // Validate table type
  try {
    validateTableType(type)
  } catch (error) {
    errors.push(error)
    return errors
  }
  
  // Validate IDs array
  if (!Array.isArray(ids)) {
    errors.push(
      createV2Error(
        V2_ERROR_TYPES.INVALID_FIELD_TYPE,
        'IDs must be provided as an array',
        { providedType: typeof ids }
      )
    )
    return errors
  }
  
  if (ids.length === 0) {
    errors.push(
      createV2Error(
        V2_ERROR_TYPES.INVALID_FIELD_VALUE,
        'IDs array cannot be empty',
        { table: `${type}_products_v2` }
      )
    )
    return errors
  }
  
  // Validate each ID is a valid UUID or number
  for (const id of ids) {
    if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
      errors.push(
        createV2Error(
          V2_ERROR_TYPES.INVALID_FIELD_VALUE,
          'Each ID must be a valid string or number',
          { invalidId: id }
        )
      )
    }
  }
  
  // If update data is provided, validate it
  if (data) {
    errors.push(...validateProductDataV2(type, data, 'update'))
  }
  
  return errors
}

/**
 * Format database error for v2 operations
 */
export function formatDatabaseErrorV2(error, operation, table) {
  const tableName = table ? `${table}_products_v2` : 'v2 tables'
  
  // Check for common Supabase/PostgreSQL errors
  if (error.code === '23505') {
    return createV2Error(
      V2_ERROR_TYPES.DUPLICATE_ENTRY,
      `Duplicate entry detected in ${tableName}`,
      { 
        operation,
        table, // Pass the base table name, createV2Error will format it
        originalError: error.message,
        code: error.code
      }
    )
  }
  
  if (error.code === '23503') {
    return createV2Error(
      V2_ERROR_TYPES.DATABASE_ERROR,
      `Foreign key constraint violation in ${tableName}`,
      { 
        operation,
        table,
        originalError: error.message,
        code: error.code
      }
    )
  }
  
  if (error.code === '42P01') {
    return createV2Error(
      V2_ERROR_TYPES.DATABASE_ERROR,
      `Table ${tableName} does not exist`,
      { 
        operation,
        table,
        originalError: error.message,
        code: error.code
      }
    )
  }
  
  if (error.code === '42703') {
    return createV2Error(
      V2_ERROR_TYPES.DATABASE_ERROR,
      `Invalid column name in ${tableName}`,
      { 
        operation,
        table,
        originalError: error.message,
        code: error.code,
        hint: 'Check that all field names match the v2 schema'
      }
    )
  }
  
  // Connection errors
  if (error.message && error.message.includes('connection')) {
    return createV2Error(
      V2_ERROR_TYPES.CONNECTION_ERROR,
      `Failed to connect to ${tableName}`,
      { 
        operation,
        table,
        originalError: error.message
      }
    )
  }
  
  // Generic database error
  return createV2Error(
    V2_ERROR_TYPES.DATABASE_ERROR,
    `Database operation failed on ${tableName}`,
    { 
      operation,
      table,
      originalError: error.message,
      code: error.code
    }
  )
}

/**
 * Get user-friendly error message for v2 operations
 */
export function getUserFriendlyErrorMessage(error) {
  if (!error || !error.type) {
    return 'An unexpected error occurred. Please try again.'
  }
  
  switch (error.type) {
    case V2_ERROR_TYPES.MISSING_REQUIRED_FIELD:
      return `${error.message}. Please provide a value for "${error.field}".`
    
    case V2_ERROR_TYPES.FIELD_LENGTH_EXCEEDED:
      return `${error.message}. Please shorten the "${error.field}" field.`
    
    case V2_ERROR_TYPES.INVALID_FIELD_TYPE:
      return `${error.message}. Please check the data type for "${error.field}".`
    
    case V2_ERROR_TYPES.INVALID_FIELD_VALUE:
      return `${error.message}. Please provide a valid value for "${error.field}".`
    
    case V2_ERROR_TYPES.INVALID_TABLE_TYPE:
      return 'Invalid product type. Please select either "indoor" or "outdoor".'
    
    case V2_ERROR_TYPES.PRODUCT_NOT_FOUND:
      return `Product not found in ${error.table}. It may have been deleted.`
    
    case V2_ERROR_TYPES.DUPLICATE_ENTRY:
      return `This product already exists in ${error.table}. Please check for duplicates.`
    
    case V2_ERROR_TYPES.CONNECTION_ERROR:
      return `Unable to connect to the database. Please check your connection and try again.`
    
    case V2_ERROR_TYPES.DATABASE_ERROR:
      if (error.hint) {
        return `${error.message}. ${error.hint}`
      }
      return `${error.message}. Please contact support if the problem persists.`
    
    case V2_ERROR_TYPES.OPERATION_ERROR:
      return `Failed to ${error.operation} product in ${error.table}. Please try again.`
    
    default:
      return error.message || 'An error occurred. Please try again.'
  }
}

/**
 * Validate and sanitize filter parameters for v2 queries
 */
export function validateFiltersV2(filters) {
  const errors = []
  const sanitizedFilters = {}
  
  if (!filters || typeof filters !== 'object') {
    return { errors, filters: {} }
  }
  
  for (const [key, value] of Object.entries(filters)) {
    // Map frontend field names to database column names
    const dbColumn = fieldMappingV2[key] || key
    
    // Skip empty values
    if (value === undefined || value === '') {
      continue
    }
    
    // Validate the field exists in schema
    const isValidField = 
      V2_SCHEMA.stringFields[dbColumn] ||
      V2_SCHEMA.numericFields[dbColumn] ||
      dbColumn === 'id' ||
      dbColumn === 'created_at'
    
    if (!isValidField) {
      errors.push(
        createV2Error(
          V2_ERROR_TYPES.INVALID_FIELD_VALUE,
          `Unknown filter field "${key}" (maps to "${dbColumn}")`,
          { field: key, dbColumn }
        )
      )
      continue
    }
    
    sanitizedFilters[key] = value
  }
  
  return { errors, filters: sanitizedFilters }
}

/**
 * Validate pagination parameters
 */
export function validatePaginationV2(pagination) {
  const errors = []
  const { currentPage, pageSize } = pagination || {}
  
  if (currentPage !== undefined) {
    const page = Number(currentPage)
    if (isNaN(page) || page < 1) {
      errors.push(
        createV2Error(
          V2_ERROR_TYPES.INVALID_FIELD_VALUE,
          'Page number must be a positive integer',
          { field: 'currentPage', providedValue: currentPage }
        )
      )
    }
  }
  
  if (pageSize !== undefined) {
    const size = Number(pageSize)
    if (isNaN(size) || size < 1 || size > 1000) {
      errors.push(
        createV2Error(
          V2_ERROR_TYPES.INVALID_FIELD_VALUE,
          'Page size must be between 1 and 1000',
          { field: 'pageSize', providedValue: pageSize }
        )
      )
    }
  }
  
  return errors
}
