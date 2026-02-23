import Papa from 'papaparse'
import { fieldMapping } from '../database/products'

// Helper function to get product field value with fallback to field mapping
export function get(p, frontendKey) {
  // First try the direct DB column name
  const dbColumn = fieldMapping[frontendKey] || frontendKey;
  return p[dbColumn] || p[frontendKey] || '';
}

// Export data to CSV format
export function exportToCSV(data, filename = 'export.csv') {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'No data to export' }
    }

    const firstRowWithFields = data.find(row => row && Object.keys(row).length > 0)
    if (!firstRowWithFields) {
      return { success: false, error: 'No fields available for export' }
    }

    // Convert data to CSV format
    const csv = Papa.unparse(data)

    // Create and download file
    downloadFile(csv, filename, 'text/csv')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    return { success: false, error: error.message }
  }
}

// Export data to Excel format (using CSV with Excel-friendly formatting)
export function exportToExcel(data, filename = 'export.xlsx') {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'No data to export' }
    }

    const firstRowWithFields = data.find(row => row && Object.keys(row).length > 0)
    if (!firstRowWithFields) {
      return { success: false, error: 'No fields available for export' }
    }

    // For now, export as CSV with .xlsx extension
    // In the future, this could be enhanced with a proper Excel library
    const csv = Papa.unparse(data)
    downloadFile(csv, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    return { success: false, error: error.message }
  }
}

// Format enquiry data for export
export function formatEnquiryForExport(enquiry) {
  return {
    'Enquiry ID': enquiry.id,
    'Date': formatDateForExport(enquiry.created_at),
    'Customer Name': enquiry.customer_name || '',
    'Email': enquiry.email || '',
    'Phone': enquiry.phone || '',
    'Company': enquiry.company || '',
    'Address': enquiry.address || '',
    'Message': enquiry.message || '',
    'Cart Items': formatCartItemsForExport(enquiry.cart_items),
    'Delivery Method': enquiry.delivery_method || '',
    'Status': enquiry.status || 'new',
    'Updated At': formatDateForExport(enquiry.updated_at)
  }
}

// Format cart items for export (flatten JSON structure)
function formatCartItemsForExport(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return ''

  // Updated to use v2 field names (snake_case)
  const SPEC_FIELDS = [
    { key: 'size', label: 'Size', legacyKey: 'Size' },
    { key: 'power_w', label: 'Power (W)' },
    { key: 'voltage', label: 'Voltage', legacyKey: 'Voltage' },
    { key: 'cct', label: 'CCT', legacyKey: 'CCT' },
    { key: 'cri_ra', label: 'CRI (Ra)' },
    { key: 'lumen', label: 'Lumen', legacyKey: 'Lumen' },
    { key: 'mounting', label: 'Mounting', legacyKey: 'Mounting' },
    { key: 'material_finish', label: 'Finish', legacyKey: 'Material Finish' }
  ]

  const formatSpecValue = (item, product, field) => {
    const { key, label, legacyKey } = field
    return (
      item?.specifications?.[label] ??
      item?.specifications?.[key] ??
      item?.specifications?.[legacyKey] ??
      product?.[key] ??
      product?.[legacyKey] ??
      product?.[label] ??
      item?.[key] ??
      item?.[legacyKey] ??
      item?.[label] ??
      null
    )
  }

  return cartItems
    .map((item) => {
      const product = item.product || {}
      
      // Handle both v2 (model_number) and legacy (modelNumber) field names
      const modelNumber =
        item.model_number ||
        item.modelNumber ||
        product.model_number ||
        product.modelNumber ||
        ''

      const productType =
        item.producttype ||
        item.productType ||
        product.producttype ||
        product.productType ||
        ''

      const quantity = Number(item.quantity ?? item.qty ?? 1) || 1

      const specEntries = []
      const usedLabels = new Set()

      SPEC_FIELDS.forEach((field) => {
        const value = formatSpecValue(item, product, field)
        if (value && !usedLabels.has(field.label)) {
          usedLabels.add(field.label)
          specEntries.push(`${field.label}: ${value}`)
        }
      })

      // Include any additional specifications provided on the cart item
      if (item.specifications && typeof item.specifications === 'object') {
        Object.entries(item.specifications).forEach(([key, value]) => {
          if (!value) return
          const normalizedKey = key.trim()
          if (!usedLabels.has(normalizedKey)) {
            usedLabels.add(normalizedKey)
            specEntries.push(`${normalizedKey}: ${value}`)
          }
        })
      }

      const summaryParts = []
      if (modelNumber) summaryParts.push(`Model: ${modelNumber}`)
      if (productType) summaryParts.push(`Type: ${productType}`)
      summaryParts.push(`Qty: ${quantity}`)

      if (specEntries.length > 0) {
        summaryParts.push(specEntries.join(', '))
      }

      return summaryParts.join(' - ')
    })
    .join(' | ')
}

// Format date for export
export function formatDateForExport(dateString) {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

// Generic file download function
export function downloadFile(content, filename, type = 'text/plain') {
  // Guard against window/document usage during SSR
  if (typeof window === 'undefined') return;

  try {
    // Create blob and download link
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)

    // Create temporary link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw error
  }
}

// Export enquiries with proper formatting
export function exportEnquiries(enquiries, filename = 'enquiries.csv') {
  try {
    // Format all enquiries for export
    const formattedData = enquiries.map(formatEnquiryForExport)

    // Export to CSV
    return exportToCSV(formattedData, filename)
  } catch (error) {
    console.error('Error exporting enquiries:', error)
    return { success: false, error: error.message }
  }
}

// Export enquiries with custom field selection
export function exportEnquiriesCustom(enquiries, selectedFields = null, filename = 'enquiries.csv') {
  try {
    let formattedData = enquiries.map(formatEnquiryForExport)

    // If specific fields are selected, filter the data
    if (selectedFields && Array.isArray(selectedFields)) {
      formattedData = formattedData.map(row => {
        const filteredRow = {}
        selectedFields.forEach(field => {
          if (row.hasOwnProperty(field)) {
            filteredRow[field] = row[field]
          }
        })
        return filteredRow
      })
    }

    // Export to CSV
    return exportToCSV(formattedData, filename)
  } catch (error) {
    console.error('Error exporting enquiries with custom fields:', error)
    return { success: false, error: error.message }
  }
}

// Format product data for export with readable column headers
const PRODUCT_EXPORT_FIELD_CONFIG = [
  { label: 'Product Type', key: 'productType' },
  { label: 'Model Number', key: 'modelNumber' },
  { label: 'Product Name', key: 'name' },
  { label: 'Description', key: 'description' },
  { label: 'Sizes', key: 'sizes' },
  { label: 'Mounting', key: 'mounting' },
  { label: 'Power (W)', key: 'powerW', formatType: 'power' },
  { label: 'Voltage', key: 'voltage', formatType: 'voltage' },
  { label: 'CCT (K)', key: 'cct', formatType: 'cct' },
  { label: 'CRI (Ra)', key: 'criRa', formatType: 'cri' },
  { label: 'Lumen', key: 'lumen', formatType: 'lumen' },
  { label: 'Efficacy (lm/W)', key: 'efficacyLmw' },
  { label: 'Beam Angle', key: 'beamAngle', formatType: 'beam_angle' },
  { label: 'Power Factor', key: 'powerFactor' },
  { label: 'Dimming Type', key: 'dimmingType' },
  { label: 'Emergency Backup Battery', key: 'emergencyBackupBattery' },
  { label: 'Plug-in Sensor', key: 'pluginSensor' },
  { label: 'Sensor / Microwave / Bluetooth', key: 'sensorMicrowaveBluetooth' },
  { label: 'Junction Cover', key: 'junctionCover' },
  { label: 'Remote Control', key: 'remote_control' },
  { label: 'Installation Kits', key: 'installationKits' },
  { label: 'Adjustment Dial', key: 'adjustmentDial' },
  { label: 'Material Finish', key: 'materialFinish', formatType: 'finish' },
  { label: 'LED Type', key: 'ledType' },
  { label: 'Driver Brand', key: 'driverBrand' },
  { label: 'Certifications', key: 'certifications' },
  { label: 'Lead Time', key: 'leadTime' },
  { label: 'Warranty', key: 'warranty' },
  { label: 'MOQ', key: 'moq' },
  { label: 'Price per piece', key: 'pricePc', formatType: 'price' },
  { label: 'Cost China DDP USA', key: 'costChinaDdpUsa', formatType: 'price' },
  { label: 'Cost Thailand/Vietnam', key: 'costThailandVietnam', formatType: 'price' },
  { label: 'Photo', key: 'photo' },
  { label: 'Cut Sheet', key: 'cutSheet' },
  { label: 'Image URL', key: 'imageUrl' },
  { label: 'IP Rating', key: 'ipRating' },
  { label: 'IK Rating', key: 'ikRating' }
]

export const getExportFieldLabels = () => PRODUCT_EXPORT_FIELD_CONFIG.map(field => field.label)

const normalizeFieldName = (field) => {
  if (typeof field !== 'string') return ''
  return field.trim().toLowerCase()
}

export function formatProductForExport(product) {
  const formatted = {
    'Type': product.type === 'indoor' ? 'Indoor' : 'Outdoor'
  }

  // V2 tables use 'sub_category' column
  const mappedCategory = get(product, 'category') || product.sub_category || ''
  formatted['Category'] = mappedCategory

  PRODUCT_EXPORT_FIELD_CONFIG.forEach(({ label, key, formatType }) => {
    const rawValue = get(product, key)
    formatted[label] = formatType
      ? formatProductFieldValue(rawValue, formatType)
      : rawValue || ''
  })

  return formatted
}

// Helper function for consistent field value formatting
export function formatProductFieldValue(value, type) {
  if (value === null || value === undefined || value === '') return ''

  switch (type) {
    case 'price':
      if (value === null || value === undefined || value === '') return ''
      const numericValue = parseFloat(value)
      return Number.isNaN(numericValue)
        ? `${value}`
        : `$${numericValue.toFixed(2)}`
    case 'power':
    case 'voltage':
    case 'cri':
    case 'lumen':
      return value ? `${value}` : ''
    case 'cct':
      return value ? `${value}K` : ''
    case 'beam_angle':
      return value ? `${value}°` : ''
    case 'finish':
      return value || ''
    default:
      return value
  }
}

// Export products with proper formatting
/**
 * Export products with all available fields using the CSV exporter.
 * @param {Array<object>} products - Array of product records from the database.
 * @param {string} [filename='products.csv'] - Desired filename for the exported CSV file.
 * @returns {{ success: boolean, error: string | null }} Result of the export operation.
 */
export function exportProducts(products, filename = 'products.csv') {
  try {
    // Format all products for export
    const formattedData = products.map(formatProductForExport)

    // Export to CSV
    return exportToCSV(formattedData, filename)
  } catch (error) {
    console.error('Error exporting products:', error)
    return { success: false, error: error.message || 'Failed to export products' }
  }
}

// Export products with custom field selection
/**
 * Export products with a custom field selection.
 * @param {Array<object>} products - Array of product records to export.
 * @param {Array<string>|null} selectedFields - List of field labels requested by the user (matches formatProductForExport labels).
 * @param {string} [filename='products.csv'] - Desired filename for the exported CSV file.
 * @returns {{ success: boolean, error?: string }} Result of the export operation.
 * @example
 * exportProductsCustom(products, ['Model Number', 'Product Name', 'Power (W)'], 'lighting.csv')
 */
export function exportProductsCustom(products, selectedFields = null, filename = 'products.csv') {
  try {
    if (!Array.isArray(products) || products.length === 0) {
      return { success: false, error: 'No products provided for export' }
    }

    let formattedData = products.map(formatProductForExport)

    // If specific fields are selected, filter the data
    if (selectedFields && Array.isArray(selectedFields)) {
      const fieldLookup = new Map()
      if (formattedData.length > 0) {
        Object.keys(formattedData[0]).forEach(label => {
          fieldLookup.set(normalizeFieldName(label), label)
        })
      }

      const filteredFieldLabels = []
      selectedFields.forEach((rawField) => {
        const normalized = normalizeFieldName(rawField)
        const matchedLabel = fieldLookup.get(normalized)

        if (!matchedLabel) {
          console.warn(`exportProductsCustom: field "${rawField}" not found in export configuration.`)
          return
        }

        if (!filteredFieldLabels.includes(matchedLabel)) {
          filteredFieldLabels.push(matchedLabel)
        }
      })

      if (filteredFieldLabels.length === 0) {
        return { success: false, error: 'No valid fields selected for export' }
      }

      formattedData = formattedData.map(row => {
        const filteredRow = {}
        filteredFieldLabels.forEach(label => {
          filteredRow[label] = row.hasOwnProperty(label) ? row[label] : ''
        })
        return filteredRow
      })
    }

    // Export to CSV
    return exportToCSV(formattedData, filename)
  } catch (error) {
    console.error('Error exporting products with custom fields:', error)
    return { success: false, error: error.message || 'Failed to export products with custom fields' }
  }
}
