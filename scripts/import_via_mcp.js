#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of all batch files to import
const batchFiles = [
  'indoor_batch_1.sql',
  'indoor_batch_2.sql',
  'indoor_batch_3.sql',
  'indoor_batch_4.sql',
  'indoor_batch_5.sql',
  'indoor_batch_6.sql',
  'indoor_batch_7.sql',
  'indoor_batch_8.sql',
  'indoor_batch_9.sql',
  'indoor_batch_10.sql',
  'indoor_batch_11.sql',
  'indoor_batch_12.sql',
  'indoor_batch_13.sql',
  'indoor_batch_14.sql',
  'outdoor_batch_1.sql',
  'outdoor_batch_2.sql'
];

console.log('Starting batch import process...');
console.log(`Total files to import: ${batchFiles.length}`);
console.log('');

batchFiles.forEach((file, index) => {
  const filePath = path.join(__dirname, 'batches', file);
  console.log(`[${index + 1}/${batchFiles.length}] ${file}`);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').length;
    console.log(`  ✓ File found (${lines} lines)`);
  } else {
    console.log(`  ✗ File not found!`);
  }
});

console.log('');
console.log('All files listed. Use Supabase MCP server to execute each file.');
