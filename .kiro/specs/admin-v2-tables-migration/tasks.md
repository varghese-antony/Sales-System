# Implementation Plan: Admin V2 Tables Migration

## Overview
This implementation plan outlines the tasks required to migrate all admin dashboard pages from legacy tables (`indoor_products`, `outdoor_products`) to v2 tables (`indoor_products_v2`, `outdoor_products_v2`). The v2 tables use an updated schema with improved field naming conventions (e.g., `product_name` instead of `name`, `sub_category` instead of `Indoor`/`Outdoor` columns).

## Task List

- [x] 1. Migrate Data Entry Page to V2 Tables
  - Update imports to use `products-v2.js` functions and `fieldMappingV2`
  - Replace `createProducts` with `createProductsV2` function
  - Update field mapping in form submission to use v2 schema (e.g., `category` → `sub_category`, `name` → `product_name`)
  - Remove legacy category column logic (`Indoor`/`Outdoor` columns)
  - Update variation generation to use v2 field mapping
  - Test product creation with all field types and variations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Migrate Price Entry Page to V2 Tables
  - Update imports to use v2 database functions
  - Replace `getAllProducts` with `getAllProductsV2` for fetching unpriced products
  - Update price field from `price_pc` to `price_per_piece` in queries and updates
  - Replace `updateProductPrices` with v2 equivalent using `price_per_piece` field
  - Update product display fields to use v2 schema (e.g., `Size` → `size`, `Voltage` → `voltage`, `CCT` → `cct`)
  - Update filter logic to use v2 field names
  - Test price entry workflow with both indoor and outdoor products
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Migrate Price Variation Page to V2 Tables
  - Update imports to use v2 database functions
  - Replace `getAllProducts` and `getDistinctProductTypes` with v2 equivalents
  - Update filter queries to use v2 field names (e.g., `sub_category` instead of `Indoor`/`Outdoor`)
  - Update field configuration array to use v2 database column names
  - Replace `updateProductPrices` with v2 equivalent using `price_per_piece` field
  - Update product attribute display to use v2 field names
  - Update bulk price update operations to use v2 tables
  - Test price variation workflow with multiple filters and bulk updates
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Migrate Enquiry Management Page to V2 Integration
  - Update product detail fetching to use `getProductsByIdsV2` function
  - Update product field display to use v2 schema (e.g., `product_name`, `model_number`)
  - Update export functionality to use v2 field names in exported data
  - Update product filtering in enquiries to query v2 tables
  - Test enquiry display with products from v2 tables
  - Test enquiry export with v2 product data
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Migrate Data Management Page to V2 Tables
  - Update imports to use v2 client functions (create v2 versions if needed)
  - Update column configuration to use v2 field names (e.g., `product_name`, `sub_category`)
  - Replace category filter logic (remove `Indoor`/`Outdoor` column references, use `sub_category`)
  - Update all filter queries to use v2 field names
  - Update CRUD operations to use v2 functions (`updateProductV2`, `deleteProductV2`, etc.)
  - Update bulk operations to use v2 API (`bulkUpdateProductsV2`, `bulkDeleteProductsV2`)
  - Update export functionality to use v2 schema and field names
  - Update product display rendering to use v2 field names
  - Test pagination, filtering, search, and all CRUD operations
  - Test bulk operations (update, delete, category assignment)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 6. Create or Update Client-Side V2 Module
  - Create v2 versions of all client-side functions in `products-client.js`
  - Implement `getProductsWithPaginationClientV2` with v2 field mapping
  - Implement `createProductsClientV2` with v2 field mapping
  - Implement `updateProductClientV2` with v2 field mapping
  - Implement `deleteProductClientV2` for v2 tables
  - Implement `bulkUpdateProductsClientV2` with v2 field mapping
  - Implement `bulkDeleteProductsClientV2` for v2 tables
  - Implement `searchProductsClientV2` with v2 field mapping
  - Add client-side caching support for v2 operations
  - Add consistent error handling for all v2 client functions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Update API Routes for V2 Support
  - Update or create API route handlers to support v2 table operations
  - Ensure API routes use v2 database functions for all operations
  - Update API response formatting to use v2 field names
  - Add proper error handling with v2 table context
  - Test all API endpoints with v2 data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Update Error Handling and Validation
  - Update error messages to reference v2 tables and field names
  - Implement validation against v2 schema requirements
  - Update field validation error messages to use v2 field names
  - Add user-friendly error messages for v2 operations
  - Test error handling for all failure scenarios
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Remove Legacy Dependencies
  - Remove imports of legacy `products.js` functions from all admin pages
  - Remove references to legacy field names (e.g., `Indoor`, `Outdoor` as category columns)
  - Remove legacy table query logic
  - Update code comments to reference v2 tables
  - Clean up unused legacy code
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Integration Testing and Validation
  - Test complete data entry workflow with v2 tables
  - Test complete price entry workflow with v2 tables
  - Test complete price variation workflow with v2 tables
  - Test enquiry management with v2 product data
  - Test complete data management workflow (CRUD, bulk operations, export)
  - Verify data integrity in v2 tables after all operations
  - Test filter combinations across all admin pages
  - Test pagination and search across all admin pages
  - Verify all field mappings are correct
  - Test error scenarios and validation
  - _Requirements: All requirements 1.1-8.5_

## Notes

- Each task should be completed and tested before moving to the next
- The v2 tables use snake_case naming (e.g., `product_name`, `sub_category`, `price_per_piece`)
- Legacy tables used mixed naming (e.g., `name`, `Indoor`/`Outdoor` columns, `price_pc`)
- The `category` field in forms maps to `sub_category` in v2 tables
- The `Indoor`/`Outdoor` columns in legacy tables are replaced by a single `sub_category` column in v2
- All admin pages should use consistent v2 field mapping from `fieldMappingV2`
- Test with both indoor and outdoor products for each page
- Ensure backward compatibility is not needed (full migration to v2)

## Field Mapping Reference

### Key V2 Field Changes:
- `name` → `product_name`
- `category` (with Indoor/Outdoor columns) → `sub_category`
- `price_pc` → `price_per_piece`
- `Size` → `size`
- `Voltage` → `voltage`
- `CCT` → `cct`
- `Lumen` → `lumen`
- `Mounting` → `mounting`
- `Material Finish` → `material_finish`
- `Dimming Type` → `dimming_type`
- `Certifications` → `certifications`
- `Warranty` → `warranty`
- `MOQ` → `moq`
- `Photo` → `photo`
- `cut_sheet` → `cut_sheet` (unchanged)
- `image_url` → `image_url` (unchanged)

### V2 Field Mapping Object:
```javascript
export const fieldMappingV2 = {
  subCategory: 'sub_category',
  productName: 'product_name',
  modelNumber: 'model_number',
  size: 'size',
  powerW: 'power_w',
  voltage: 'voltage',
  cct: 'cct',
  criRa: 'cri_ra',
  lumen: 'lumen',
  efficacyLumenPerW: 'efficacy_lumen_per_w',
  dimmingType: 'dimming_type',
  materialFinish: 'material_finish',
  sensorsAndControls: 'sensors_and_controls',
  pricePerPiece: 'price_per_piece',
  // ... additional mappings
}
```
