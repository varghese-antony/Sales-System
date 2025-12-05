# Implementation Guide - Add-on Pricing Fields

## Quick Start

### Step 1: Apply Database Migration
Execute the SQL migration to add the new columns:

```sql
-- Run this in your Supabase SQL editor
-- File: migrations/add_addon_pricing_fields.sql
```

This adds 10 new columns to both `indoor_products_v2` and `outdoor_products_v2` tables.

### Step 2: Verify Changes in Admin Panel

1. **Product Editing** (`/admin-dashboard/data-management`)
   - Open any product to edit
   - Scroll to "Add-on Pricing" section
   - Enter costs and prices for each add-on

2. **Data Entry** (`/admin-dashboard/data-entry`)
   - Create new products with add-on pricing
   - All 10 fields available in the form

3. **Price Variation** (`/admin-dashboard/price-variation`)
   - Bulk update add-on prices across products
   - 5 price fields available (costs not shown here)

4. **Data Management** (`/admin-dashboard/data-management`)
   - View add-on prices in the data table
   - Export includes all fields (costs and prices)

### Step 3: Verify User Experience

1. **Product Details Page** (`/indoor/[slug]` or `/outdoor/[slug]`)
   - Navigate to any product
   - Scroll to "Add-on Pricing" section
   - Verify only prices are shown (not costs)

2. **Product Cards**
   - Add-on pricing displays in the complete specifications

## Field Reference

### Cost Fields (Admin Only)
| Field | Database Column | Purpose |
|-------|-----------------|---------|
| Sensor Cost | sensor_cost | Internal tracking |
| Remote Control/BT Cost | remote_control_bluetooth_cost | Internal tracking |
| Plugin Sensor Cost | plugin_sensor_cost | Internal tracking |
| Backup Battery Cost | emergency_backup_battery_cost | Internal tracking |
| Installation Kits Cost | installation_kits_cost | Internal tracking |

### Price Fields (User Visible)
| Field | Database Column | Purpose |
|-------|-----------------|---------|
| Sensor Price | sensor_price | Customer-facing price |
| Remote Control/BT Price | remote_control_bluetooth_price | Customer-facing price |
| Plugin Sensor Price | plugin_sensor_price | Customer-facing price |
| Backup Battery Price | emergency_backup_battery_price | Customer-facing price |
| Installation Kits Price | installation_kits_price | Customer-facing price |

## Code Changes Summary

### Modified Files (8 total)

1. **src/lib/database/products.js**
   - Added 10 fields to `fieldMapping`

2. **src/lib/database/products-v2.js**
   - Added 10 fields to `fieldMappingV2`
   - Added 10 fields to `V2_ALLOWED_COLUMNS`

3. **src/components/EditProductModal.jsx**
   - Added 10 fields to `FORM_FIELD_KEYS`
   - Created `addonFields` array
   - Added "Add-on Pricing" card section

4. **src/components/ProductDetails.jsx**
   - Updated `excludedKeys` (hides costs)
   - Updated `getKeyCategory()` function
   - Updated `categoryTitles` object

5. **src/app/admin-dashboard/data-management/page.jsx**
   - Added 5 price columns to table
   - Updated `FALLBACK_EXPORT_PRODUCT`

6. **src/app/admin-dashboard/price-variation/page.jsx**
   - Added 5 price fields to `pricingFields`

7. **src/app/admin-dashboard/data-entry/page.jsx**
   - Added 10 fields to `TEXT_VARIATION_FIELDS`
   - Updated `INITIAL_STATE`

8. **src/components/BulkUpdateModal.jsx**
   - Added 10 fields to `commercial` group

### New Files (2 total)

1. **migrations/add_addon_pricing_fields.sql**
   - Database migration script

2. **ADDON_PRICING_UPDATE.md**
   - Detailed documentation

## Testing Workflow

### Admin Testing
1. Go to `/admin-dashboard/data-management`
2. Click edit on any product
3. Scroll to "Add-on Pricing" section
4. Enter test values for costs and prices
5. Save and verify data persists

### User Testing
1. Go to `/indoor` or `/outdoor`
2. Click on any product
3. Scroll to "Add-on Pricing" section
4. Verify prices are shown (not costs)
5. Verify section appears in complete specifications

### Bulk Operations Testing
1. Go to `/admin-dashboard/price-variation`
2. Select products and update add-on prices
3. Verify changes applied to all selected products

### Export Testing
1. Go to `/admin-dashboard/data-management`
2. Export products
3. Verify CSV includes all 10 new fields

## Troubleshooting

### Fields Not Appearing in Admin Panel
- Ensure migration was applied
- Clear browser cache
- Restart development server

### Costs Visible to Users
- Check `excludedKeys` in ProductDetails.jsx
- Verify field names match database columns
- Check browser console for errors

### Bulk Update Not Working
- Verify fields are in `fieldMappingV2`
- Check `V2_ALLOWED_COLUMNS` includes new fields
- Verify product type (indoor/outdoor) is correct

## Performance Notes

- All new fields are TEXT type for flexibility
- No indexes added (can be added if needed)
- No performance impact on existing queries
- Costs hidden via application logic (not database)

## Security Notes

- Costs are hidden from users via frontend filtering
- No backend API changes needed
- RLS policies unchanged
- Cost data only visible to authenticated admins

## Future Enhancements

- Add cost/price validation rules
- Implement margin calculation
- Add pricing history tracking
- Create pricing templates
- Add bulk pricing rules
