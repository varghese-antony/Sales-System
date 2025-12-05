# Add-on Pricing Fields Update

## Overview
Added comprehensive add-on pricing support to the lighting catalogue system. Users will only see prices, while costs are tracked internally for admin use.

## Database Changes

### New Fields Added to Both Tables
- `outdoor_products_v2`
- `indoor_products_v2`

#### Fields Added:
1. **Sensor Add-on**
   - `sensor_cost` - Internal cost (admin only)
   - `sensor_price` - User-visible price

2. **Remote Control/Bluetooth Add-on**
   - `remote_control_bluetooth_cost` - Internal cost (admin only)
   - `remote_control_bluetooth_price` - User-visible price

3. **Plugin Sensor Add-on**
   - `plugin_sensor_cost` - Internal cost (admin only)
   - `plugin_sensor_price` - User-visible price

4. **Emergency Backup Battery Add-on**
   - `emergency_backup_battery_cost` - Internal cost (admin only)
   - `emergency_backup_battery_price` - User-visible price

5. **Installation Kits Add-on**
   - `installation_kits_cost` - Internal cost (admin only)
   - `installation_kits_price` - User-visible price

**Migration File:** `migrations/add_addon_pricing_fields.sql`

## Code Changes

### 1. Field Mappings Updated
- **File:** `src/lib/database/products.js`
  - Added 10 new fields to `fieldMapping` object
  - Maps frontend camelCase to database snake_case

- **File:** `src/lib/database/products-v2.js`
  - Added 10 new fields to `fieldMappingV2` object
  - Added all 10 fields to `V2_ALLOWED_COLUMNS` set

### 2. Admin Panel - Product Editing
- **File:** `src/components/EditProductModal.jsx`
  - Added new fields to `FORM_FIELD_KEYS` array
  - Created new `addonFields` array with all 10 fields
  - Added "Add-on Pricing" section in the modal
  - Displays note: "Users will only see prices, not costs"

### 3. User-Facing Product Details
- **File:** `src/components/ProductDetails.jsx`
  - Updated `excludedKeys` to hide cost fields from users
  - Added addon price fields to display logic
  - Updated `getKeyCategory()` to categorize addon prices
  - Added "Add-on Pricing" category to `categoryTitles`
  - Users see prices but NOT costs

### 4. Admin Dashboard - Data Management
- **File:** `src/app/admin-dashboard/data-management/page.jsx`
  - Added 5 new columns to the data table (prices only, not costs)
  - Updated `FALLBACK_EXPORT_PRODUCT` with all 10 new fields
  - Columns display: sensor_price, remote_control_bluetooth_price, plugin_sensor_price, emergency_backup_battery_price, installation_kits_price

### 5. Admin Dashboard - Price Variation
- **File:** `src/app/admin-dashboard/price-variation/page.jsx`
  - Added 5 new fields to `pricingFields` array (prices only)
  - Allows bulk price updates for add-ons

### 6. Admin Dashboard - Data Entry
- **File:** `src/app/admin-dashboard/data-entry/page.jsx`
  - Added all 10 new fields to `TEXT_VARIATION_FIELDS`
  - Updated `INITIAL_STATE` with all 10 new fields
  - Allows data entry for both costs and prices

### 7. Admin Dashboard - Bulk Update
- **File:** `src/components/BulkUpdateModal.jsx`
  - Added all 10 new fields to `commercial` field group
  - Allows bulk updates for add-on pricing

## User Experience

### For Regular Users
- See add-on prices in product details
- Cannot see cost information
- Can add products with add-ons to cart
- Prices displayed in "Add-on Pricing" section

### For Admins
- Can edit both costs and prices for each add-on
- Costs are for internal tracking only
- Prices are what customers see
- Can bulk update prices across multiple products
- Can export data including both costs and prices

## Data Visibility

### Hidden from Users (Costs)
- sensor_cost
- remote_control_bluetooth_cost
- plugin_sensor_cost
- emergency_backup_battery_cost
- installation_kits_cost

### Visible to Users (Prices)
- sensor_price
- remote_control_bluetooth_price
- plugin_sensor_price
- emergency_backup_battery_price
- installation_kits_price

## Migration Steps

1. Run the migration SQL file to add columns to both tables:
   ```bash
   # Execute migrations/add_addon_pricing_fields.sql in your Supabase SQL editor
   ```

2. The application will automatically:
   - Display the new fields in admin panels
   - Hide cost fields from users
   - Show prices in product details
   - Support bulk updates and exports

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Admin can edit add-on costs and prices
- [ ] Users see prices but not costs in product details
- [ ] Bulk update works for add-on prices
- [ ] Data export includes all fields
- [ ] Price variation tool includes new fields
- [ ] Data entry form includes new fields
- [ ] Product cards display add-on pricing correctly
