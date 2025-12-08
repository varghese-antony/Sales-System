const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Read and parse CSV files
function parseCSV(filePath) {
  const csvData = fs.readFileSync(filePath, 'utf8');
  const result = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });
  return result.data;
}

// Clean and normalize values
function cleanValue(value) {
  if (!value || value === '' || value === 'N/A' || value === 'N/A ') return null;
  if (typeof value === 'string') {
    value = value.trim();
    if (value.toLowerCase() === 'yes') return true;
    if (value.toLowerCase() === 'no') return false;
    // Return null for empty strings after trim
    if (value === '') return null;
  }
  return value;
}

// Parse PIR_Microwave_Bluetooth field to get individual sensor type
function parseSensorType(pirMicrowaveBluetoothValue) {
  if (!pirMicrowaveBluetoothValue) return null;
  const sensors = pirMicrowaveBluetoothValue.split(',').map(s => s.trim());
  // Return the first sensor type, or join them if multiple
  return sensors.length > 0 ? sensors[0] : null;
}

// Generate SQL INSERT statements
function generateSQL(data, tableName) {
  const sqlStatements = [];
  
  data.forEach((row, index) => {
    // Skip empty rows
    if (!row['Product_Name'] || row['Product_Name'].trim() === '') return;
    
    const values = {
      sub_category: cleanValue(row['Sub-Category'] || row['Sub-Category ']),
      product_name: cleanValue(row['Product_Name']),
      model_number: cleanValue(row['Model_Number']),
      size: cleanValue(row['Size']),
      power_w: cleanValue(row['Power_W']),
      voltage: cleanValue(row['Voltage']),
      cct: cleanValue(row['CCT']),
      cri_ra: cleanValue(row['CRI_RA']),
      lumen: cleanValue(row['Lumen']),
      efficacy_lumen_per_w: cleanValue(row['Efficacy_Lumen_per_W']),
      dimming_type: cleanValue(row['Dimming_Type']),
      material_finish: cleanValue(row['Material_Finish']),
      sensors_and_controls: cleanValue(row['Sensors_and_Controls']),
      pir_microwave_bluetooth: parseSensorType(cleanValue(row['PIR_Microwave_Bluetooth'])),
      remote_control_bluetooth: cleanValue(row['Remote Control']),
      plugin_sensor: cleanValue(row['Plugin _Sensor']),
      emergency_backup_battery: cleanValue(row['Emergency_Backup_Battery']),
      junction_cover: cleanValue(row['Junction_Cover']),
      mounting: cleanValue(row['Mounting']),
      installation_kits: cleanValue(row['Installation_Kits']),
      adjustment_dial: cleanValue(row['Adjustment_Dial']),
      certifications: cleanValue(row['Certifications']),
      price_per_piece: cleanValue(row['Price_per_Piece']),
      lead_time: cleanValue(row['Lead_Time']),
      cut_sheet: cleanValue(row['Cut_Sheet']),
      warranty: cleanValue(row['Warranty']),
      moq: cleanValue(row['MOQ']),
      cost_china_ddp_usa: cleanValue(row['COST_China_DDP_USA']),
      cost_thailand_vietnam: cleanValue(row['COST_Thailand_Vietnam']),
      photo: cleanValue(row['Photo']),
      ip_rating: cleanValue(row['IP_Rating'])
    };
    
    // Build SQL INSERT statement
    const columns = Object.keys(values).filter(key => values[key] !== null);
    const valuesList = columns.map(col => {
      const val = values[col];
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val;
      if (val === null) return 'NULL';
      // Escape single quotes in strings
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${valuesList.join(', ')});`;
    sqlStatements.push(sql);
  });
  
  return sqlStatements;
}

// Main execution
try {
  console.log('Processing Indoor CSV...');
  const indoorData = parseCSV(path.join(__dirname, '../Lighting Matrix 101825(Indoor).csv'));
  const indoorSQL = generateSQL(indoorData, 'indoor_products_v3');
  
  console.log('Processing Outdoor CSV...');
  const outdoorData = parseCSV(path.join(__dirname, '../Lighting Matrix 101825(Outdoor).csv'));
  const outdoorSQL = generateSQL(outdoorData, 'outdoor_products_v3');
  
  // Write SQL files
  const indoorSQLFile = path.join(__dirname, 'insert_indoor_products_v3.sql');
  const outdoorSQLFile = path.join(__dirname, 'insert_outdoor_products_v3.sql');
  
  fs.writeFileSync(indoorSQLFile, indoorSQL.join('\n\n'));
  fs.writeFileSync(outdoorSQLFile, outdoorSQL.join('\n\n'));
  
  console.log(`\n✅ Generated ${indoorSQL.length} indoor product inserts`);
  console.log(`✅ Generated ${outdoorSQL.length} outdoor product inserts`);
  console.log(`\n📄 Indoor SQL: ${indoorSQLFile}`);
  console.log(`📄 Outdoor SQL: ${outdoorSQLFile}`);
  console.log('\nYou can now run these SQL files in your Supabase SQL editor.');
  
} catch (error) {
  console.error('Error processing CSV files:', error);
  process.exit(1);
}
