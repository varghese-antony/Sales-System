const fs = require('fs');
const csv = require('csv-parser');

// Function to parse CSV and generate expanded product variations
function processLightingMatrix() {
  const indoorProducts = [];
  const outdoorProducts = [];

  // Sensor options for the new flow
  const sensorOptions = {
    'Occupancy': ['PIR', 'Microwave', 'Bluetooth'],
    'Bi-Level': ['PIR', 'Microwave', 'Bluetooth'],
    'Daylight': ['Photo cell'],
    'None': ['None']
  };

  // Process Indoor CSV
  fs.createReadStream('Lighting Matrix 101825(Indoor).csv')
    .pipe(csv())
    .on('data', (row) => {
      if (!row['Sub-Category '] || row['Sub-Category '].trim() === '') return;
      
      // Generate variations based on sensor options
      generateProductVariations(row, 'indoor', indoorProducts);
    })
    .on('end', () => {
      console.log('Indoor CSV processed');
      
      // Process Outdoor CSV
      fs.createReadStream('Lighting Matrix 101825(Outdoor).csv')
        .pipe(csv())
        .on('data', (row) => {
          if (!row['Sub-Category '] || row['Sub-Category '].trim() === '') return;
          
          generateProductVariations(row, 'outdoor', outdoorProducts);
        })
        .on('end', () => {
          console.log('Outdoor CSV processed');
          
          // Generate SQL insert statements
          generateInsertStatements(indoorProducts, outdoorProducts);
        });
    });
}

function generateProductVariations(row, type, products) {
  const baseProduct = {
    sub_category: row['Sub-Category ']?.trim(),
    product_name: row['Product_Name']?.trim(),
    model_number: row['Model_Number']?.trim(),
    size: row['Size']?.trim(),
    power_w: row['Power_W']?.trim(),
    voltage: row['Voltage']?.trim(),
    cct: row['CCT']?.trim(),
    cri_ra: parseInt(row['CRI_RA']) || null,
    lumen: row['Lumen']?.trim(),
    efficacy_lumen_per_w: row['Efficacy_Lumen_per_W']?.trim(),
    dimming_type: row['Dimming_Type']?.trim(),
    material_finish: row['Material_Finish']?.trim(),
    mounting: row['Mounting']?.trim(),
    installation_kits: row['Installation_Kits']?.trim(),
    adjustment_dial: row['Adjustment_Dial']?.trim(),
    certifications: row['Certifications']?.trim(),
    price_per_piece: row['Price_per_Piece']?.trim(),
    lead_time: row['Lead_Time']?.trim(),
    cut_sheet: row['Cut_Sheet']?.trim(),
    warranty: row['Warranty']?.trim(),
    moq: row['MOQ']?.trim(),
    cost_china_ddp_usa: row['COST_China_DDP_USA']?.trim(),
    cost_thailand_vietnam: row['COST_Thailand_Vietnam']?.trim(),
    photo: row['Photo']?.trim(),
    ip_rating: row['IP_Rating']?.trim()
  };

  // Generate variations for each sensor control type
  Object.keys(sensorOptions).forEach(controlType => {
    sensorOptions[controlType].forEach(sensorType => {
      // Generate variations for remote control (yes/no)
      [true, false].forEach(hasRemote => {
        // Generate variations for emergency backup (yes/no)
        [true, false].forEach(hasEmergency => {
          // Generate variations for plugin sensor (yes/no) 
          [true, false].forEach(hasPlugin => {
            const variation = {
              ...baseProduct,
              sensors_and_controls: controlType,
              occupancy: controlType === 'Occupancy',
              bi_level: controlType === 'Bi-Level',
              pir_microwave_bluetooth: sensorType !== 'None' ? sensorType : null,
              remote_control: hasRemote && sensorType !== 'None',
              plugin_sensor: hasPlugin,
              emergency_backup_battery: hasEmergency,
              junction_cover: Math.random() > 0.5, // Random for variety
              model_number: `${baseProduct.model_number}-${controlType.substring(0,3).toUpperCase()}-${sensorType.substring(0,3).toUpperCase()}-${hasRemote ? 'RC' : 'NRC'}-${hasEmergency ? 'EB' : 'NEB'}-${hasPlugin ? 'PS' : 'NPS'}`
            };
            
            products.push(variation);
          });
        });
      });
    });
  });
}

function generateInsertStatements(indoorProducts, outdoorProducts) {
  let indoorSQL = 'INSERT INTO public.indoor_products_v2 (\n';
  indoorSQL += '  sub_category, product_name, model_number, size, power_w, voltage, cct, cri_ra,\n';
  indoorSQL += '  lumen, efficacy_lumen_per_w, dimming_type, material_finish, sensors_and_controls,\n';
  indoorSQL += '  occupancy, bi_level, pir_microwave_bluetooth, remote_control, plugin_sensor,\n';
  indoorSQL += '  emergency_backup_battery, junction_cover, mounting, installation_kits,\n';
  indoorSQL += '  adjustment_dial, certifications, price_per_piece, lead_time, cut_sheet,\n';
  indoorSQL += '  warranty, moq, cost_china_ddp_usa, cost_thailand_vietnam, photo, ip_rating\n';
  indoorSQL += ') VALUES\n';

  const indoorValues = indoorProducts.map(product => {
    return `(${[
      `'${escapeSql(product.sub_category)}'`,
      `'${escapeSql(product.product_name)}'`,
      `'${escapeSql(product.model_number)}'`,
      product.size ? `'${escapeSql(product.size)}'` : 'NULL',
      product.power_w ? `'${escapeSql(product.power_w)}'` : 'NULL',
      product.voltage ? `'${escapeSql(product.voltage)}'` : 'NULL',
      product.cct ? `'${escapeSql(product.cct)}'` : 'NULL',
      product.cri_ra || 'NULL',
      product.lumen ? `'${escapeSql(product.lumen)}'` : 'NULL',
      product.efficacy_lumen_per_w ? `'${escapeSql(product.efficacy_lumen_per_w)}'` : 'NULL',
      product.dimming_type ? `'${escapeSql(product.dimming_type)}'` : 'NULL',
      product.material_finish ? `'${escapeSql(product.material_finish)}'` : 'NULL',
      product.sensors_and_controls ? `'${escapeSql(product.sensors_and_controls)}'` : 'NULL',
      product.occupancy,
      product.bi_level,
      product.pir_microwave_bluetooth ? `'${escapeSql(product.pir_microwave_bluetooth)}'` : 'NULL',
      product.remote_control,
      product.plugin_sensor,
      product.emergency_backup_battery,
      product.junction_cover,
      product.mounting ? `'${escapeSql(product.mounting)}'` : 'NULL',
      product.installation_kits ? `'${escapeSql(product.installation_kits)}'` : 'NULL',
      product.adjustment_dial ? `'${escapeSql(product.adjustment_dial)}'` : 'NULL',
      product.certifications ? `'${escapeSql(product.certifications)}'` : 'NULL',
      product.price_per_piece ? `'${escapeSql(product.price_per_piece)}'` : 'NULL',
      product.lead_time ? `'${escapeSql(product.lead_time)}'` : 'NULL',
      product.cut_sheet ? `'${escapeSql(product.cut_sheet)}'` : 'NULL',
      product.warranty ? `'${escapeSql(product.warranty)}'` : 'NULL',
      product.moq ? `'${escapeSql(product.moq)}'` : 'NULL',
      product.cost_china_ddp_usa ? `'${escapeSql(product.cost_china_ddp_usa)}'` : 'NULL',
      product.cost_thailand_vietnam ? `'${escapeSql(product.cost_thailand_vietnam)}'` : 'NULL',
      product.photo ? `'${escapeSql(product.photo)}'` : 'NULL',
      product.ip_rating ? `'${escapeSql(product.ip_rating)}'` : 'NULL'
    ].join(', ')})`;
  });

  indoorSQL += indoorValues.join(',\n') + ';\n\n';

  // Generate outdoor SQL similarly
  let outdoorSQL = 'INSERT INTO public.outdoor_products_v2 (\n';
  outdoorSQL += '  sub_category, product_name, model_number, size, power_w, voltage, cct, cri_ra,\n';
  outdoorSQL += '  lumen, efficacy_lumen_per_w, dimming_type, material_finish, sensors_and_controls,\n';
  outdoorSQL += '  occupancy, bi_level, pir_microwave_bluetooth, remote_control, plugin_sensor,\n';
  outdoorSQL += '  emergency_backup_battery, junction_cover, mounting, installation_kits,\n';
  outdoorSQL += '  adjustment_dial, certifications, price_per_piece, lead_time, cut_sheet,\n';
  outdoorSQL += '  warranty, moq, cost_china_ddp_usa, cost_thailand_vietnam, photo, ip_rating\n';
  outdoorSQL += ') VALUES\n';

  const outdoorValues = outdoorProducts.map(product => {
    return `(${[
      `'${escapeSql(product.sub_category)}'`,
      `'${escapeSql(product.product_name)}'`,
      `'${escapeSql(product.model_number)}'`,
      product.size ? `'${escapeSql(product.size)}'` : 'NULL',
      product.power_w ? `'${escapeSql(product.power_w)}'` : 'NULL',
      product.voltage ? `'${escapeSql(product.voltage)}'` : 'NULL',
      product.cct ? `'${escapeSql(product.cct)}'` : 'NULL',
      product.cri_ra || 'NULL',
      product.lumen ? `'${escapeSql(product.lumen)}'` : 'NULL',
      product.efficacy_lumen_per_w ? `'${escapeSql(product.efficacy_lumen_per_w)}'` : 'NULL',
      product.dimming_type ? `'${escapeSql(product.dimming_type)}'` : 'NULL',
      product.material_finish ? `'${escapeSql(product.material_finish)}'` : 'NULL',
      product.sensors_and_controls ? `'${escapeSql(product.sensors_and_controls)}'` : 'NULL',
      product.occupancy,
      product.bi_level,
      product.pir_microwave_bluetooth ? `'${escapeSql(product.pir_microwave_bluetooth)}'` : 'NULL',
      product.remote_control,
      product.plugin_sensor,
      product.emergency_backup_battery,
      product.junction_cover,
      product.mounting ? `'${escapeSql(product.mounting)}'` : 'NULL',
      product.installation_kits ? `'${escapeSql(product.installation_kits)}'` : 'NULL',
      product.adjustment_dial ? `'${escapeSql(product.adjustment_dial)}'` : 'NULL',
      product.certifications ? `'${escapeSql(product.certifications)}'` : 'NULL',
      product.price_per_piece ? `'${escapeSql(product.price_per_piece)}'` : 'NULL',
      product.lead_time ? `'${escapeSql(product.lead_time)}'` : 'NULL',
      product.cut_sheet ? `'${escapeSql(product.cut_sheet)}'` : 'NULL',
      product.warranty ? `'${escapeSql(product.warranty)}'` : 'NULL',
      product.moq ? `'${escapeSql(product.moq)}'` : 'NULL',
      product.cost_china_ddp_usa ? `'${escapeSql(product.cost_china_ddp_usa)}'` : 'NULL',
      product.cost_thailand_vietnam ? `'${escapeSql(product.cost_thailand_vietnam)}'` : 'NULL',
      product.photo ? `'${escapeSql(product.photo)}'` : 'NULL',
      product.ip_rating ? `'${escapeSql(product.ip_rating)}'` : 'NULL'
    ].join(', ')})`;
  });

  outdoorSQL += outdoorValues.join(',\n') + ';';

  // Write to files
  fs.writeFileSync('indoor_products_insert.sql', indoorSQL);
  fs.writeFileSync('outdoor_products_insert.sql', outdoorSQL);
  
  console.log(`Generated ${indoorProducts.length} indoor product variations`);
  console.log(`Generated ${outdoorProducts.length} outdoor product variations`);
  console.log('SQL files created: indoor_products_insert.sql, outdoor_products_insert.sql');
}

function escapeSql(str) {
  if (!str) return '';
  return str.toString().replace(/'/g, "''");
}

// Run the processing
processLightingMatrix();