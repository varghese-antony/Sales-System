const fs = require('fs');
const path = require('path');

// Read SQL file and split into batches
function splitSQLIntoBatches(filePath, batchSize = 50) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  const batches = [];
  for (let i = 0; i < statements.length; i += batchSize) {
    const batch = statements.slice(i, i + batchSize);
    batches.push(batch.join(';\n') + ';');
  }
  
  return batches;
}

// Save batches to separate files
function saveBatches(batches, outputDir, prefix) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  batches.forEach((batch, index) => {
    const filename = path.join(outputDir, `${prefix}_batch_${index + 1}.sql`);
    fs.writeFileSync(filename, batch);
  });
  
  return batches.length;
}

// Main execution
try {
  console.log('Splitting Indoor SQL into batches...');
  const indoorBatches = splitSQLIntoBatches(path.join(__dirname, 'insert_indoor_products_v2.sql'), 50);
  const indoorCount = saveBatches(indoorBatches, path.join(__dirname, 'batches'), 'indoor');
  
  console.log('Splitting Outdoor SQL into batches...');
  const outdoorBatches = splitSQLIntoBatches(path.join(__dirname, 'insert_outdoor_products_v2.sql'), 50);
  const outdoorCount = saveBatches(outdoorBatches, path.join(__dirname, 'batches'), 'outdoor');
  
  console.log(`\n✅ Created ${indoorCount} indoor batches`);
  console.log(`✅ Created ${outdoorCount} outdoor batches`);
  console.log(`\n📁 Batches saved to: ${path.join(__dirname, 'batches')}`);
  
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
