# Data Import Guide for V2 Tables

This guide explains how to import the lighting matrix CSV data into the v2 database tables with the new sensor schema.

## Overview

The new schema properly handles sensor configurations by storing them as separate fields:
- `sensors_and_controls`: The main control type (Occupancy, Bi-Level, Daylight, None, no)
- `pir_microwave_bluetooth`: The specific sensor technology (PIR, Microwave, Bluetooth, Photo cell)
- `remote_control`: Boolean for remote control availability
- `emergency_backup_battery`: Boolean for emergency backup
- `plugin_sensor`: Boolean for plugin sensor option

## Step 1: Install Dependencies

```bash
npm install papaparse
```

## Step 2: Run the Import Script

```bash
node scripts/import_csv_to_v2_tables.js
```

This will generate two SQL files:
- `scripts/insert_indoor_products_v2.sql`
- `scripts/insert_outdoor_products_v2.sql`

## Step 3: Clear Existing Data (Optional)

If you want to start fresh, run this in Supabase SQL Editor:

```sql
-- Clear existing data
TRUNCATE TABLE indoor_products_v2 RESTART IDENTITY CASCADE;
TRUNCATE TABLE outdoor_products_v2 RESTART IDENTITY CASCADE;
```

## Step 4: Import the Data

### Option A: Using Supabase SQL Editor

1. Open your Supabase project
2. Go to SQL Editor
3. Copy the contents of `scripts/insert_indoor_products_v2.sql`
4. Run the query
5. Repeat for `scripts/insert_outdoor_products_v2.sql`

### Option B: Using psql Command Line

```bash
psql -h your-project.supabase.co -U postgres -d postgres -f scripts/insert_indoor_products_v2.sql
psql -h your-project.supabase.co -U postgres -d postgres -f scripts/insert_outdoor_products_v2.sql
```

## Data Structure Explanation

### CSV Column Mapping

| CSV Column | Database Column | Type | Notes |
|------------|----------------|------|-------|
| Sub-Category | sub_category | text | Product category |
| Product_Name | product_name | text | Product name |
| Model_Number | model_number | text | Model identifier |
| Size | size | text | Physical dimensions |
| Power_W | power_w | text | Power consumption |
| Voltage | voltage | text | Operating voltage |
| CCT | cct | text | Color temperature |
| CRI_RA | cri_ra | text | Color rendering index |
| Lumen | lumen | text | Light output |
| Efficacy_Lumen_per_W | efficacy_lumen_per_w | text | Energy efficiency |
| Dimming_Type | dimming_type | text | Dimming control method |
| Material_Finish | material_finish | text | Material and finish |
| **Sensors_and_Controls** | **sensors_and_controls** | text | **Main control type** |
| PIR_Microwave_Bluetooth | pir_microwave_bluetooth | text | Sensor technology (first from comma-separated list) |
| Remote Control | remote_control | boolean | Remote control availability |
| Plugin _Sensor | plugin_sensor | boolean | Plugin sensor option |
| Emergency_Backup_Battery | emergency_backup_battery | boolean | Emergency backup |
| Junction_Cover | junction_cover | boolean | Junction cover |
| Mounting | mounting | text | Installation method |
| Installation_Kits | installation_kits | text | Available kits |
| Adjustment_Dial | adjustment_dial | text | Adjustment dial |
| Certifications | certifications | text | Product certifications |
| Price_per_Piece | price_per_piece | text | Price |
| Lead_Time | lead_time | text | Lead time |
| Cut_Sheet | cut_sheet | text | Cut sheet URL |
| Warranty | warranty | text | Warranty period |
| MOQ | moq | text | Minimum order quantity |
| COST_China_DDP_USA | cost_china_ddp_usa | text | China DDP USA cost |
| COST_Thailand_Vietnam | cost_thailand_vietnam | text | Thailand/Vietnam cost |
| Photo | photo | text | Photo URL |
| IP_Rating | ip_rating | text | IP rating (outdoor only) |

### Sensor Configuration Examples

#### Example 1: No Sensors
```
Sensors_and_Controls: "no"
PIR_Microwave_Bluetooth: (empty)
Remote Control: no
Plugin _Sensor: no
Emergency_Backup_Battery: no
```

#### Example 2: Bi-Level with PIR
```
Sensors_and_Controls: "B-Level"
PIR_Microwave_Bluetooth: "PIR,Microwave,Bluetooth"
Remote Control: yes
Plugin _Sensor: no
Emergency_Backup_Battery: yes
```

#### Example 3: Occupancy with Microwave
```
Sensors_and_Controls: "Occupancy"
PIR_Microwave_Bluetooth: "Microwave/Bluetooth"
Remote Control: no
Plugin _Sensor: yes
Emergency_Backup_Battery: no
```

## Verification Queries

After importing, verify the data:

### Check Total Records
```sql
SELECT COUNT(*) as indoor_count FROM indoor_products_v2;
SELECT COUNT(*) as outdoor_count FROM outdoor_products_v2;
```

### Check Sensor Configurations
```sql
-- Indoor products with sensors
SELECT 
  sensors_and_controls,
  pir_microwave_bluetooth,
  COUNT(*) as count
FROM indoor_products_v2
WHERE sensors_and_controls IS NOT NULL
GROUP BY sensors_and_controls, pir_microwave_bluetooth
ORDER BY sensors_and_controls, pir_microwave_bluetooth;

-- Outdoor products with sensors
SELECT 
  sensors_and_controls,
  pir_microwave_bluetooth,
  COUNT(*) as count
FROM outdoor_products_v2
WHERE sensors_and_controls IS NOT NULL
GROUP BY sensors_and_controls, pir_microwave_bluetooth
ORDER BY sensors_and_controls, pir_microwave_bluetooth;
```

### Check Product Names
```sql
-- Unique product names (indoor)
SELECT DISTINCT product_name 
FROM indoor_products_v2 
ORDER BY product_name;

-- Unique product names (outdoor)
SELECT DISTINCT product_name 
FROM outdoor_products_v2 
ORDER BY product_name;
```

### Check Sensor Options for a Specific Product
```sql
-- Example: LED Double Ring Ceiling Light
SELECT 
  sensors_and_controls,
  pir_microwave_bluetooth,
  remote_control,
  emergency_backup_battery,
  plugin_sensor,
  COUNT(*) as variants
FROM indoor_products_v2
WHERE product_name = 'LED Double Ring Ceiling Light'
GROUP BY 
  sensors_and_controls,
  pir_microwave_bluetooth,
  remote_control,
  emergency_backup_battery,
  plugin_sensor
ORDER BY sensors_and_controls, pir_microwave_bluetooth;
```

## Troubleshooting

### Issue: Import script fails with "Cannot find module 'papaparse'"
**Solution**: Run `npm install papaparse`

### Issue: SQL file is too large for Supabase SQL Editor
**Solution**: Split the SQL file into smaller chunks or use psql command line

### Issue: Duplicate key errors
**Solution**: Clear the tables first using the TRUNCATE commands above

### Issue: Some products show "No sensor options available"
**Solution**: Check that the product_name in the database exactly matches the product name in the URL

## Expected Results

After successful import, you should have:

### Indoor Products
- LED Ultra Slim Downlight: ~12 variants (with/without sensors, different features)
- LED Double Ring Ceiling Light: ~100+ variants (multiple sizes, sensor configs)
- Strip Light: ~12 variants

### Outdoor Products
- LED Vapor Linear Light: ~12 variants per size
- LED Vapor Proof Linear Light: ~8 variants per size

## Next Steps

1. Test the sensor selector on the frontend
2. Verify that only available sensors show up for each product
3. Test the complete product selection flow
4. Verify product details display correctly

## API Endpoint

The sensor options are fetched via:
```
GET /api/products/sensor-options?productName={name}&type={indoor|outdoor}
```

Response format:
```json
{
  "sensorOptions": [
    {
      "controlType": "Occupancy",
      "sensorTypes": ["PIR", "Microwave"],
      "hasRemoteControl": true,
      "hasEmergencyBackup": true,
      "hasPluginSensor": false
    },
    {
      "controlType": "no",
      "sensorTypes": [],
      "hasRemoteControl": false,
      "hasEmergencyBackup": true,
      "hasPluginSensor": true
    }
  ]
}
```
