# Verification Checklist - Add-on Pricing Implementation

## Database Setup
- [ ] Run migration: `migrations/add_addon_pricing_fields.sql`
- [ ] Verify columns added to `indoor_products_v2`
- [ ] Verify columns added to `outdoor_products_v2`
- [ ] Test data insertion with new fields

## Code Changes Verification

### Field Mappings
- [x] `src/lib/database/products.js` - fieldMapping updated
- [x] `src/lib/database/products-v2.js` - fieldMappingV2 updated
- [x] `src/lib/database/products-v2.js` - V2_ALLOWED_COLUMNS updated

### Admin Components
- [x] `src/components/EditProductModal.jsx` - FORM_FIELD_KEYS updated
- [x] `src/components/EditProductModal.jsx` - addonFields array created
- [x] `src/components/EditProductModal.jsx` - "Add-on Pricing" section added
- [x] `src/components/BulkUpdateModal.jsx` - commercial fields updated

### Admin Pages
- [x] `src/app/admin-dashboard/data-management/page.jsx` - columns updated (10 fields)
- [x] `src/app/admin-dashboard/data-management/page.jsx` - FALLBACK_EXPORT_PRODUCT updated
- [x] `src/app/admin-dashboard/price-variation/page.jsx` - pricingFields updated (10 fields)
- [x] `src/app/admin-dashboard/data-entry/page.jsx` - TEXT_VARIATION_FIELDS updated
- [x] `src/app/admin-dashboard/data-entry/page.jsx` - INITIAL_STATE updated

### User Components
- [x] `src/components/ProductDetails.jsx` - excludedKeys updated (hides 5 costs)
- [x] `src/components/ProductDetails.jsx` - getKeyCategory updated
- [x] `src/components/ProductDetails.jsx` - categoryTitles updated

## Admin Panel Testing

### Data Management Page
- [ ] Navigate to `/admin-dashboard/data-management`
- [ ] Verify all 10 addon columns visible in table
- [ ] Columns appear in this order:
  - sensor_cost, sensor_price
  - remote_control_bluetooth_cost, remote_control_bluetooth_price
  - plugin_sensor_cost, plugin_sensor_price
  - emergency_backup_battery_cost, emergency_backup_battery_price
  - installation_kits_cost, installation_kits_price
- [ ] Click edit on a product
- [ ] Verify "Add-on Pricing" section visible
- [ ] Enter test values for costs and prices
- [ ] Save and verify data persists
- [ ] Export CSV includes all 10 fields

### Price Variation Page
- [ ] Navigate to `/admin-dashboard/price-variation`
- [ ] Verify all 10 addon fields in pricing fields list
- [ ] Select products and update addon prices
- [ ] Verify costs can be updated
- [ ] Verify prices can be updated
- [ ] Verify bulk updates work correctly

### Data Entry Page
- [ ] Navigate to `/admin-dashboard/data-entry`
- [ ] Create new product
- [ ] Verify all 10 addon fields in form
- [ ] Enter test values
- [ ] Save and verify data stored

### Bulk Update Modal
- [ ] Open data management page
- [ ] Select multiple products
- [ ] Click bulk update
- [ ] Verify "Commercial & Pricing" section includes all 10 fields
- [ ] Update addon costs and prices
- [ ] Verify changes applied to all selected products

## User Page Testing

### Product Details Page
- [ ] Navigate to `/indoor` or `/outdoor`
- [ ] Click on any product
- [ ] Scroll to "Add-on Pricing" section
- [ ] Verify ONLY prices visible:
  - sensor_price ✓
  - remote_control_bluetooth_price ✓
  - plugin_sensor_price ✓
  - emergency_backup_battery_price ✓
  - installation_kits_price ✓
- [ ] Verify NO costs visible:
  - sensor_cost ✗
  - remote_control_bluetooth_cost ✗
  - plugin_sensor_cost ✗
  - emergency_backup_battery_cost ✗
  - installation_kits_cost ✗
- [ ] Check browser console for errors
- [ ] Verify section displays in "Complete Specifications"

### Product Cards
- [ ] Navigate to product listing
- [ ] Verify no pricing displayed on cards
- [ ] Click card to view details
- [ ] Verify only prices shown in details

### Cart Page
- [ ] Add products to cart
- [ ] Navigate to `/cart`
- [ ] Verify no pricing details displayed
- [ ] Verify no cost information visible

## Data Integrity Testing

### Create New Product
- [ ] Create product with all 10 addon fields
- [ ] Verify all fields saved correctly
- [ ] Retrieve product and verify data

### Update Product
- [ ] Edit existing product
- [ ] Update addon costs and prices
- [ ] Save changes
- [ ] Verify changes persisted
- [ ] Verify other fields unchanged

### Bulk Operations
- [ ] Select multiple products
- [ ] Bulk update addon prices
- [ ] Verify all products updated
- [ ] Verify costs updated correctly
- [ ] Verify prices updated correctly

### Export/Import
- [ ] Export products to CSV
- [ ] Verify all 10 fields in export
- [ ] Verify costs included in export
- [ ] Verify prices included in export
- [ ] Verify data formatting correct

## Security Testing

### Cost Visibility
- [ ] Open browser DevTools
- [ ] Navigate to product details
- [ ] Search for "cost" in page source
- [ ] Verify no cost values visible
- [ ] Check network requests for cost data
- [ ] Verify costs not exposed in API responses

### Admin Access
- [ ] Login as admin
- [ ] Verify full access to costs and prices
- [ ] Verify can edit all fields
- [ ] Verify can export all data

### User Access
- [ ] Logout or use incognito window
- [ ] Navigate to product details
- [ ] Verify only prices visible
- [ ] Verify no cost information accessible

## Performance Testing

### Page Load Times
- [ ] Measure product details page load time
- [ ] Verify no performance degradation
- [ ] Check for console warnings

### Data Table Performance
- [ ] Load data management page with 100+ products
- [ ] Verify table renders smoothly
- [ ] Verify sorting works on new columns
- [ ] Verify filtering works on new columns

### Bulk Operations
- [ ] Bulk update 50+ products
- [ ] Verify operation completes successfully
- [ ] Verify no timeout errors
- [ ] Verify all products updated

## Browser Compatibility

- [ ] Chrome/Edge - Latest
- [ ] Firefox - Latest
- [ ] Safari - Latest
- [ ] Mobile browsers - iOS Safari, Chrome Mobile

## Documentation

- [x] ADDON_PRICING_UPDATE.md - Created
- [x] IMPLEMENTATION_GUIDE.md - Created
- [x] PRICING_VISIBILITY_SUMMARY.md - Created
- [x] VERIFICATION_CHECKLIST.md - Created (this file)
- [x] migrations/add_addon_pricing_fields.sql - Created

## Final Sign-Off

### Code Quality
- [x] No TypeScript/ESLint errors
- [x] All files pass diagnostics
- [x] Code follows project conventions
- [x] Comments added where needed

### Functionality
- [ ] All admin features working
- [ ] All user features working
- [ ] Data integrity maintained
- [ ] Security requirements met

### Documentation
- [ ] Implementation guide complete
- [ ] Migration script ready
- [ ] Verification checklist complete
- [ ] All changes documented

## Deployment Steps

1. **Backup Database**
   - [ ] Create database backup before migration

2. **Run Migration**
   - [ ] Execute `migrations/add_addon_pricing_fields.sql`
   - [ ] Verify columns added successfully

3. **Deploy Code**
   - [ ] Deploy updated code to production
   - [ ] Clear cache if applicable

4. **Verify Deployment**
   - [ ] Test admin pages
   - [ ] Test user pages
   - [ ] Monitor for errors

5. **Post-Deployment**
   - [ ] Verify all features working
   - [ ] Check error logs
   - [ ] Monitor performance

## Rollback Plan

If issues occur:

1. **Revert Code**
   - Deploy previous version

2. **Database Rollback**
   - Drop new columns if needed
   - Restore from backup if necessary

3. **Verify Rollback**
   - Test all pages
   - Verify data integrity

## Notes

- All 10 fields are TEXT type for flexibility
- Costs hidden via frontend filtering (ProductDetails component)
- No backend API changes required
- RLS policies unchanged
- Field mappings updated in both products.js and products-v2.js
- Admin pages show both costs and prices
- User pages show only prices

## Sign-Off

- [ ] Developer: Code review complete
- [ ] QA: Testing complete
- [ ] Product: Feature approved
- [ ] DevOps: Deployment ready
