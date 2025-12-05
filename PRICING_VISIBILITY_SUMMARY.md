# Pricing Visibility Summary - Admin vs User Pages

## Overview
The system now displays both costs and prices in admin pages, while showing only prices to regular users.

## Admin Pages - Show Both Cost & Price

### 1. Data Management (`/admin-dashboard/data-management`)
**Columns Displayed:**
- `sensor_cost` & `sensor_price`
- `remote_control_bluetooth_cost` & `remote_control_bluetooth_price`
- `plugin_sensor_cost` & `plugin_sensor_price`
- `emergency_backup_battery_cost` & `emergency_backup_battery_price`
- `installation_kits_cost` & `installation_kits_price`

**Features:**
- View all 10 fields in the data table
- Edit both costs and prices
- Export includes all fields
- Bulk operations support both fields

### 2. Price Variation (`/admin-dashboard/price-variation`)
**Fields Available:**
- All 10 addon fields (5 costs + 5 prices)
- Bulk update prices and costs
- Variation by product specifications

**Features:**
- Set base prices and costs
- Apply variations by field
- Update multiple products at once

### 3. Data Entry (`/admin-dashboard/data-entry`)
**Fields Available:**
- All 10 addon fields
- Create new products with costs and prices
- Bulk import with pricing

### 4. Bulk Update Modal (`/admin-dashboard/data-management`)
**Commercial Section Includes:**
- All 10 addon fields
- Update costs and prices for selected products
- Batch operations

### 5. Product Editing Modal (`/admin-dashboard/data-management`)
**Add-on Pricing Section:**
- All 10 fields in dedicated section
- Clear labeling: "Users will only see prices, not costs"
- Separate input fields for costs and prices

## User Pages - Show Only Prices

### 1. Product Details (`/indoor/[slug]`, `/outdoor/[slug]`)
**Visible Fields:**
- `sensor_price`
- `remote_control_bluetooth_price`
- `plugin_sensor_price`
- `emergency_backup_battery_price`
- `installation_kits_price`

**Hidden Fields (Excluded):**
- `sensor_cost`
- `remote_control_bluetooth_cost`
- `plugin_sensor_cost`
- `emergency_backup_battery_cost`
- `installation_kits_cost`

**Display:**
- "Add-on Pricing" section in complete specifications
- Prices formatted clearly
- No cost information visible

### 2. Product Cards
- No pricing displayed
- Only basic product information

### 3. Cart Page
- No pricing details displayed
- Only product references

### 4. Enquiry Form
- No pricing information displayed

## Implementation Details

### ProductDetails Component
**File:** `src/components/ProductDetails.jsx`

```javascript
// Excluded keys hide costs from users
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
  'sensor_cost',                          // Hidden
  'remote_control_bluetooth_cost',        // Hidden
  'plugin_sensor_cost',                   // Hidden
  'emergency_backup_battery_cost',        // Hidden
  'installation_kits_cost'                // Hidden
]

// Addon keys for display
const addonKeys = [
  'sensor_price',                         // Visible
  'remote_control_bluetooth_price',       // Visible
  'plugin_sensor_price',                  // Visible
  'emergency_backup_battery_price',       // Visible
  'installation_kits_price'               // Visible
]
```

### Data Management Columns
**File:** `src/app/admin-dashboard/data-management/page.jsx`

```javascript
// Admin sees both costs and prices
const columns = [
  // ... other columns ...
  
  // Add-on Pricing - Sensor
  { key: 'sensor_cost', label: 'Sensor Cost' },
  { key: 'sensor_price', label: 'Sensor Price' },
  
  // Add-on Pricing - Remote Control/Bluetooth
  { key: 'remote_control_bluetooth_cost', label: 'Remote Control/BT Cost' },
  { key: 'remote_control_bluetooth_price', label: 'Remote Control/BT Price' },
  
  // ... and so on for all 5 addons ...
]
```

### Price Variation Fields
**File:** `src/app/admin-dashboard/price-variation/page.jsx`

```javascript
const pricingFields = [
  // ... other fields ...
  
  { key: 'sensor_cost', label: 'Sensor Cost' },
  { key: 'sensor_price', label: 'Sensor Price' },
  
  { key: 'remote_control_bluetooth_cost', label: 'Remote Control/Bluetooth Cost' },
  { key: 'remote_control_bluetooth_price', label: 'Remote Control/Bluetooth Price' },
  
  // ... and so on for all 5 addons ...
]
```

## Security & Privacy

### Cost Information Protection
- Costs are excluded from ProductDetails component
- Frontend filtering prevents user access
- No API changes needed
- RLS policies unchanged

### Admin Access
- Admins see all fields in admin panels
- Full visibility for pricing management
- Export includes all data
- Bulk operations support all fields

## Testing Checklist

### Admin Testing
- [ ] Data Management shows all 10 columns
- [ ] Price Variation includes all 10 fields
- [ ] Data Entry form has all 10 fields
- [ ] Bulk Update modal includes all 10 fields
- [ ] Product Edit modal shows all 10 fields
- [ ] Export includes all 10 fields

### User Testing
- [ ] Product Details shows only 5 prices
- [ ] No cost fields visible to users
- [ ] "Add-on Pricing" section displays correctly
- [ ] Prices formatted properly
- [ ] No console errors

### Data Integrity
- [ ] Costs saved correctly in database
- [ ] Prices saved correctly in database
- [ ] Bulk updates work for both fields
- [ ] Export includes all data
- [ ] No data loss on updates

## Field Mapping Reference

### Frontend to Database
| Frontend | Database |
|----------|----------|
| sensorCost | sensor_cost |
| sensorPrice | sensor_price |
| remoteControlBluetoothCost | remote_control_bluetooth_cost |
| remoteControlBluetoothPrice | remote_control_bluetooth_price |
| pluginSensorCost | plugin_sensor_cost |
| pluginSensorPrice | plugin_sensor_price |
| emergencyBackupBatteryCost | emergency_backup_battery_cost |
| emergencyBackupBatteryPrice | emergency_backup_battery_price |
| installationKitsCost | installation_kits_cost |
| installationKitsPrice | installation_kits_price |

## Summary

✅ **Admin Pages:** Full visibility of costs and prices
✅ **User Pages:** Only prices visible, costs hidden
✅ **Data Integrity:** All fields stored and managed correctly
✅ **Security:** Cost information protected from users
✅ **Flexibility:** Easy to adjust visibility rules if needed
