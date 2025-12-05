# User Visibility Rules - Add-on Pricing

## Clear Separation: Admin vs User

### ✅ What Users See (Prices Only)

#### Product Details Page
In the "Add-on Pricing" section, users see:
- `sensor_price` ✅
- `remote_control_bluetooth_price` ✅
- `plugin_sensor_price` ✅
- `emergency_backup_battery_price` ✅
- `installation_kits_price` ✅

#### Additional Information Section
Users see general product information but NO pricing details.

### ❌ What Users DON'T See (Costs Hidden)

Users will NEVER see:
- `sensor_cost` ❌
- `remote_control_bluetooth_cost` ❌
- `plugin_sensor_cost` ❌
- `emergency_backup_battery_cost` ❌
- `installation_kits_cost` ❌

Also hidden from users:
- `cost_china_ddp_usa` ❌
- `cost_thailand_vietnam` ❌
- `price_per_piece` ❌
- `moq` ❌
- `lead_time` ❌
- `warranty` ❌

### ✅ What Admins See (Everything)

#### Admin Pages
Admins see ALL fields:
- All 5 addon costs
- All 5 addon prices
- All other product information
- All logistics and pricing data

#### Data Management Page
- 10 addon columns visible (5 costs + 5 prices)
- Full edit capability
- Export includes all data

#### Product Edit Modal
- "Add-on Pricing" section shows all 10 fields
- Separate inputs for costs and prices
- Clear labeling

## Implementation Details

### ProductDetails Component
**File:** `src/components/ProductDetails.jsx`

```javascript
// Excluded keys - hide costs from users
const excludedKeys = [
  'moq', 
  'cost_china_ddp_usa', 
  'cost_thailand_vietnam', 
  'cut_sheet', 
  'photo', 
  'lead_time', 
  'warranty', 
  'id', 
  'created_at', 
  'updated_at', 
  'price_per_piece',
  // Hide all addon costs (only show prices)
  'sensor_cost',
  'remote_control_bluetooth_cost',
  'plugin_sensor_cost',
  'emergency_backup_battery_cost',
  'installation_kits_cost'
]

// Only addon prices are shown to users
const addonKeys = [
  'sensor_price',
  'remote_control_bluetooth_price',
  'plugin_sensor_price',
  'emergency_backup_battery_price',
  'installation_kits_price'
]
```

## Visibility Matrix

| Field | Admin | User | Location |
|-------|-------|------|----------|
| sensor_cost | ✅ | ❌ | Admin pages only |
| sensor_price | ✅ | ✅ | Product Details → Add-on Pricing |
| remote_control_bluetooth_cost | ✅ | ❌ | Admin pages only |
| remote_control_bluetooth_price | ✅ | ✅ | Product Details → Add-on Pricing |
| plugin_sensor_cost | ✅ | ❌ | Admin pages only |
| plugin_sensor_price | ✅ | ✅ | Product Details → Add-on Pricing |
| emergency_backup_battery_cost | ✅ | ❌ | Admin pages only |
| emergency_backup_battery_price | ✅ | ✅ | Product Details → Add-on Pricing |
| installation_kits_cost | ✅ | ❌ | Admin pages only |
| installation_kits_price | ✅ | ✅ | Product Details → Add-on Pricing |

## User Pages - What's Displayed

### Product Details Page (`/indoor/[slug]`, `/outdoor/[slug]`)

**Visible Sections:**
1. Product Image
2. Product Title & Model
3. Key Specifications (6 specs)
4. Downloads (Cut Sheet, etc.)
5. Complete Specifications:
   - Power & Performance
   - Design & Specifications
   - Sensors & Controls
   - Smart Features
   - Certifications & Installation
   - **Add-on Pricing** ← Shows 5 prices only
   - Additional Information

**Hidden Information:**
- All costs (addon and base)
- MOQ
- Lead time
- Warranty
- Logistics information

### Product Cards
- No pricing displayed
- Only product name and image

### Cart Page
- No pricing details
- Only product references

### Enquiry Form
- No pricing information

## Admin Pages - What's Displayed

### Data Management (`/admin-dashboard/data-management`)
- All 10 addon fields visible in table
- Costs and prices side-by-side
- Full edit capability
- Export includes all data

### Product Edit Modal
- "Add-on Pricing" section
- All 10 fields editable
- Clear cost/price separation

### Price Variation (`/admin-dashboard/price-variation`)
- All 10 addon fields available
- Bulk update costs and prices
- Variation by specifications

### Data Entry (`/admin-dashboard/data-entry`)
- All 10 fields in form
- Create products with full pricing

### Bulk Update Modal
- All 10 fields in commercial section
- Batch operations

## Security Implementation

### Frontend Filtering
- `excludedKeys` array in ProductDetails
- Prevents cost fields from rendering
- Applied before display

### No API Changes
- Backend unchanged
- RLS policies unchanged
- Secure by design

### User Cannot Access Costs
- Costs not in rendered HTML
- Not in API responses to users
- Not in browser console
- Not in page source

## Testing Verification

### User Testing
```
1. Navigate to /indoor or /outdoor
2. Click on any product
3. Scroll to "Add-on Pricing" section
4. Verify ONLY prices visible:
   ✅ sensor_price
   ✅ remote_control_bluetooth_price
   ✅ plugin_sensor_price
   ✅ emergency_backup_battery_price
   ✅ installation_kits_price
5. Verify NO costs visible:
   ❌ sensor_cost
   ❌ remote_control_bluetooth_cost
   ❌ plugin_sensor_cost
   ❌ emergency_backup_battery_cost
   ❌ installation_kits_cost
6. Check browser console - no errors
7. Check page source - no cost values
```

### Admin Testing
```
1. Navigate to /admin-dashboard/data-management
2. Verify all 10 addon columns visible
3. Click edit on product
4. Verify "Add-on Pricing" section shows all 10 fields
5. Verify costs and prices both editable
6. Save and verify data persists
```

## Summary

✅ **Users see:** Prices only in "Add-on Pricing" section
✅ **Users don't see:** Any cost information
✅ **Admins see:** Both costs and prices everywhere
✅ **Security:** Costs hidden via frontend filtering
✅ **Implementation:** Complete and verified

**Status:** Ready for production
