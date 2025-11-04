# Design Document

## Overview

This design implements a comprehensive update to the lighting product catalog system, introducing new database tables with enhanced sensor control capabilities while maintaining backward compatibility. The system will create new `indoor_products_v2` and `outdoor_products_v2` tables that support extensive product variations based on sensor and control combinations, and update the entire application to use these new data sources.

## Architecture

### Database Schema Design

#### New Table Structure

**indoor_products_v2 Table:**
```sql
CREATE TABLE indoor_products_v2 (
  id BIGSERIAL PRIMARY KEY,
  sub_category TEXT,
  product_name TEXT,
  model_number TEXT,
  size TEXT,
  power_w TEXT,
  voltage TEXT,
  cct TEXT,
  cri_ra INTEGER,
  lumen TEXT,
  efficacy_lumen_per_w TEXT,
  dimming_type TEXT,
  material_finish TEXT,
  sensors_and_controls TEXT,
  occupancy BOOLEAN DEFAULT FALSE,
  bi_level BOOLEAN DEFAULT FALSE,
  pir_microwave_bluetooth TEXT,
  remote_control BOOLEAN DEFAULT FALSE,
  plugin_sensor BOOLEAN DEFAULT FALSE,
  emergency_backup_battery BOOLEAN DEFAULT FALSE,
  junction_cover BOOLEAN DEFAULT FALSE,
  mounting TEXT,
  installation_kits TEXT,
  adjustment_dial TEXT,
  certifications TEXT,
  price_per_piece TEXT,
  lead_time TEXT,
  cut_sheet TEXT,
  warranty TEXT,
  moq TEXT,
  cost_china_ddp_usa TEXT,
  cost_thailand_vietnam TEXT,
  photo TEXT,
  ip_rating TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**outdoor_products_v2 Table:**
```sql
CREATE TABLE outdoor_products_v2 (
  id BIGSERIAL PRIMARY KEY,
  sub_category TEXT,
  product_name TEXT,
  model_number TEXT,
  size TEXT,
  power_w TEXT,
  voltage TEXT,
  cct TEXT,
  cri_ra INTEGER,
  lumen TEXT,
  efficacy_lumen_per_w TEXT,
  dimming_type TEXT,
  material_finish TEXT,
  sensors_and_controls TEXT,
  occupancy BOOLEAN DEFAULT FALSE,
  bi_level BOOLEAN DEFAULT FALSE,
  pir_microwave_bluetooth TEXT,
  remote_control BOOLEAN DEFAULT FALSE,
  plugin_sensor BOOLEAN DEFAULT FALSE,
  emergency_backup_battery BOOLEAN DEFAULT FALSE,
  junction_cover BOOLEAN DEFAULT FALSE,
  mounting TEXT,
  installation_kits TEXT,
  adjustment_dial TEXT,
  certifications TEXT,
  price_per_piece TEXT,
  lead_time TEXT,
  cut_sheet TEXT,
  warranty TEXT,
  moq TEXT,
  cost_china_ddp_usa TEXT,
  cost_thailand_vietnam TEXT,
  photo TEXT,
  ip_rating TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Import Strategy

#### CSV Processing Logic

1. **Base Product Identification**: Group products by model_number and base specifications
2. **Variation Generation**: Create separate rows for each sensor/control combination
3. **Boolean Field Mapping**: Convert CSV text values to boolean fields for sensor options
4. **Data Validation**: Ensure all required fields are populated and valid

#### Sensor Control Mapping

The CSV data contains various sensor control combinations that need to be normalized:

- **No Sensors**: `sensors_and_controls = "no"` or `"N/A"`
- **Occupancy**: `occupancy = true`, `sensors_and_controls = "Occupancy"`
- **Bi-Level**: `bi_level = true`, `sensors_and_controls = "B-Level"`
- **PIR/Microwave/Bluetooth**: Parsed from `pir_microwave_bluetooth` field
- **Remote Control**: Boolean based on `remote_control` field values
- **Additional Options**: Plugin sensor, emergency backup, junction cover

## Components and Interfaces

### Database Layer Updates

#### New Database Services

**File: `src/lib/database/products-v2.js`**
```javascript
// New service for v2 product tables
export class ProductsV2Service {
  async getIndoorProducts(filters = {}) { }
  async getOutdoorProducts(filters = {}) { }
  async getProductById(id, type) { }
  async searchProducts(query, type) { }
  async getProductVariations(modelNumber, type) { }
  async getFilterOptions(type) { }
}
```

#### Migration Service

**File: `src/lib/database/migration-service.js`**
```javascript
export class MigrationService {
  async createV2Tables() { }
  async importCSVData(csvPath, tableType) { }
  async validateImportedData() { }
  async generateProductVariations() { }
}
```

### API Layer Updates

#### Updated API Endpoints

All existing API endpoints will be updated to use the new v2 tables:

- `/api/products/indoor` → Uses `indoor_products_v2`
- `/api/products/outdoor` → Uses `outdoor_products_v2`
- `/api/products/filter-options` → Updated for new sensor fields
- `/api/products/search` → Enhanced search across new fields

#### New Sensor Selection API

**File: `src/app/api/products/sensor-options/route.js`**
```javascript
// New endpoint for sensor selection flow
export async function GET(request) {
  return {
    sensorTypes: ['Occupancy', 'Bi-Level', 'Daylight', 'Photo cell', 'None'],
    occupancyOptions: ['PIR', 'Microwave', 'Bluetooth'],
    biLevelOptions: ['PIR', 'Microwave', 'Bluetooth'],
    additionalOptions: ['Remote Control', 'Plugin Sensor', 'Emergency Backup', 'Junction Cover']
  };
}
```

### Frontend Component Updates

#### Product Display Components

**Updated Components:**
- `ProductCard.jsx` → Display sensor information
- `ProductDetails.jsx` → Show sensor control options
- `ProductFilterModal.jsx` → Add sensor filtering
- `OptionSelector.jsx` → Enhanced for sensor selection

#### New Sensor Selection Component

**File: `src/components/SensorSelector.jsx`**
```javascript
export default function SensorSelector({ onSensorChange, selectedSensors }) {
  // Implements the simplified sensor selection flow
  // - Occupancy: PIR, Microwave, Bluetooth (Remote mandatory)
  // - Bi-Level: PIR, Microwave, Bluetooth (Remote mandatory)
  // - Daylight: Photo cell
  // - None
}
```

### Data Processing Pipeline

#### CSV Import Process

1. **File Validation**: Verify CSV structure and required columns
2. **Data Cleaning**: Normalize text values, handle empty fields
3. **Variation Generation**: Create product variations based on sensor combinations
4. **Database Import**: Bulk insert processed data into v2 tables
5. **Validation**: Verify data integrity and completeness

#### Sensor Combination Logic

```javascript
function generateSensorVariations(baseProduct) {
  const variations = [];
  
  // Base product with no sensors
  variations.push({
    ...baseProduct,
    sensors_and_controls: 'None',
    occupancy: false,
    bi_level: false,
    remote_control: false
  });
  
  // Occupancy variations
  if (baseProduct.supportsOccupancy) {
    ['PIR', 'Microwave', 'Bluetooth'].forEach(sensor => {
      variations.push({
        ...baseProduct,
        sensors_and_controls: 'Occupancy',
        occupancy: true,
        pir_microwave_bluetooth: sensor,
        remote_control: true // Mandatory for occupancy
      });
    });
  }
  
  // Bi-Level variations
  if (baseProduct.supportsBiLevel) {
    ['PIR', 'Microwave', 'Bluetooth'].forEach(sensor => {
      variations.push({
        ...baseProduct,
        sensors_and_controls: 'Bi-Level',
        bi_level: true,
        pir_microwave_bluetooth: sensor,
        remote_control: true // Mandatory for bi-level
      });
    });
  }
  
  return variations;
}
```

## Data Models

### Product Model Structure

```typescript
interface ProductV2 {
  id: number;
  sub_category: string;
  product_name: string;
  model_number: string;
  size?: string;
  power_w?: string;
  voltage?: string;
  cct?: string;
  cri_ra?: number;
  lumen?: string;
  efficacy_lumen_per_w?: string;
  dimming_type?: string;
  material_finish?: string;
  sensors_and_controls?: string;
  occupancy: boolean;
  bi_level: boolean;
  pir_microwave_bluetooth?: string;
  remote_control: boolean;
  plugin_sensor: boolean;
  emergency_backup_battery: boolean;
  junction_cover: boolean;
  mounting?: string;
  installation_kits?: string;
  adjustment_dial?: string;
  certifications?: string;
  price_per_piece?: string;
  lead_time?: string;
  cut_sheet?: string;
  warranty?: string;
  moq?: string;
  cost_china_ddp_usa?: string;
  cost_thailand_vietnam?: string;
  photo?: string;
  ip_rating?: string;
  created_at: Date;
  updated_at: Date;
}
```

### Sensor Selection Model

```typescript
interface SensorSelection {
  type: 'Occupancy' | 'Bi-Level' | 'Daylight' | 'Photo cell' | 'None';
  options?: {
    sensor?: 'PIR' | 'Microwave' | 'Bluetooth';
    remoteControl: boolean;
    pluginSensor: boolean;
    emergencyBackup: boolean;
    junctionCover: boolean;
  };
}
```

## Error Handling

### Data Import Validation

1. **CSV Structure Validation**: Verify required columns exist
2. **Data Type Validation**: Ensure numeric fields contain valid numbers
3. **Reference Validation**: Check for valid model numbers and categories
4. **Duplicate Detection**: Identify and handle duplicate entries
5. **Missing Data Handling**: Provide defaults for optional fields

### Runtime Error Handling

1. **Database Connection Errors**: Graceful fallback to cached data
2. **Query Timeout Handling**: Implement query timeouts and retries
3. **Invalid Filter Parameters**: Sanitize and validate filter inputs
4. **Product Not Found**: Return appropriate error responses
5. **Sensor Selection Validation**: Ensure valid sensor combinations

## Testing Strategy

### Unit Tests

1. **CSV Import Functions**: Test data parsing and validation
2. **Sensor Variation Generation**: Verify correct variation creation
3. **Database Query Functions**: Test all CRUD operations
4. **Filter Logic**: Validate filtering and search functionality
5. **API Endpoints**: Test request/response handling

### Integration Tests

1. **End-to-End Import Process**: Full CSV to database workflow
2. **Product Display Flow**: From database to frontend rendering
3. **Sensor Selection Flow**: Complete user interaction testing
4. **Cart Integration**: Ensure new products work with existing cart
5. **Search and Filter Integration**: Test combined functionality

### Data Migration Tests

1. **Schema Creation**: Verify new tables are created correctly
2. **Data Import Accuracy**: Compare imported data with source CSV
3. **Variation Generation**: Validate all expected variations are created
4. **Performance Testing**: Ensure acceptable query performance
5. **Rollback Testing**: Verify ability to revert changes if needed

## Performance Considerations

### Database Optimization

1. **Indexing Strategy**: Create indexes on frequently queried fields
2. **Query Optimization**: Use efficient joins and filtering
3. **Bulk Import Operations**: Optimize CSV import performance
4. **Connection Pooling**: Manage database connections efficiently
5. **Caching Strategy**: Implement caching for frequently accessed data

### Frontend Performance

1. **Lazy Loading**: Load product data on demand
2. **Virtual Scrolling**: Handle large product lists efficiently
3. **Image Optimization**: Optimize product image loading
4. **Filter Debouncing**: Prevent excessive API calls during filtering
5. **Component Memoization**: Optimize React component rendering

## Security Considerations

1. **Input Validation**: Sanitize all user inputs and CSV data
2. **SQL Injection Prevention**: Use parameterized queries
3. **Access Control**: Maintain existing RLS policies
4. **Data Validation**: Validate all imported data for consistency
5. **Error Information Disclosure**: Prevent sensitive data leakage in errors