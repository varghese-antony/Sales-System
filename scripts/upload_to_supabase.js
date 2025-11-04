const fs = require('fs');
const path = require('path');

// This script will output the commands to run
// You'll need to execute these via the Supabase MCP

const batchesDir = path.join(__dirname, 'batches');
const files = fs.readdirSync(batchesDir).sort();

console.log('='.repeat(80));
console.log('SUPABASE SQL EXECUTION COMMANDS');
console.log('='.repeat(80));
console.log('\nExecute these batches in order using Supabase MCP:\n');

files.forEach((file, index) => {
  if (file.endsWith('.sql')) {
    const filePath = path.join(batchesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const statementCount = content.split(';').filter(s => s.trim().length > 0).length;
    
    console.log(`\n${index + 1}. ${file} (${statementCount} statements)`);
    console.log(`   File: ${filePath}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\nTotal batches: ${files.length}`);
console.log('\nTo execute, use the Supabase MCP execute_sql tool with project_id: fhhuzvyzhvkgswvauofa');
