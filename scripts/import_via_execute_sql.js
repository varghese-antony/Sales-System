const fs = require('fs');
const path = require('path');

// Read all batch files
const batchesDir = path.join(__dirname, 'batches');
const files = fs.readdirSync(batchesDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log('Found', files.length, 'batch files');
console.log('');

// Output the SQL content for each batch
files.forEach((file, index) => {
  const filePath = path.join(batchesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`-- Batch ${index + 1}: ${file}`);
  console.log(content);
  console.log('');
  console.log('-- End of batch', index + 1);
  console.log('');
  console.log('='.repeat(80));
  console.log('');
});
