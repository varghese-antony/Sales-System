#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read and combine all SQL files
const batchFiles = [
  'indoor_batch_1.sql', 'indoor_batch_2.sql', 'indoor_batch_3.sql', 'indoor_batch_4.sql',
  'indoor_batch_5.sql', 'indoor_batch_6.sql', 'indoor_batch_7.sql', 'indoor_batch_8.sql',
  'indoor_batch_9.sql', 'indoor_batch_10.sql', 'indoor_batch_11.sql', 'indoor_batch_12.sql',
  'indoor_batch_13.sql', 'indoor_batch_14.sql', 'outdoor_batch_1.sql', 'outdoor_batch_2.sql'
];

console.log('Reading all batch files...\n');

let totalStatements = 0;

batchFiles.forEach((file, index) => {
  const filePath = path.join(__dirname, 'batches', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const statements = content.trim().split('\n\n').filter(s => s.trim());
    totalStatements += statements.length;
    console.log(`[${index + 1}/16] ${file}: ${statements.length} statements`);
  }
});

console.log(`\nTotal statements to execute: ${totalStatements}`);
console.log('\nNote: Execute each file separately using Supabase MCP server');
console.log('to avoid timeout issues with large batches.');
