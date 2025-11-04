const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filePath) {
  console.log(`\nProcessing: ${filePath}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC doesn't exist, try direct execution
      console.log('Trying direct SQL execution...');
      const { error: execError } = await supabase.from('_sql').insert({ query: sql });
      
      if (execError) {
        console.error(`Error in ${filePath}:`, execError.message);
        return false;
      }
    }
    
    console.log(`✓ Successfully imported ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return false;
  }
}

async function main() {
  const batchesDir = path.join(__dirname, 'batches');
  
  // Import indoor batches
  console.log('=== Importing Indoor Products ===');
  for (let i = 1; i <= 14; i++) {
    const filePath = path.join(batchesDir, `indoor_batch_${i}.sql`);
    if (fs.existsSync(filePath)) {
      await executeSQLFile(filePath);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Import outdoor batches
  console.log('\n=== Importing Outdoor Products ===');
  for (let i = 1; i <= 2; i++) {
    const filePath = path.join(batchesDir, `outdoor_batch_${i}.sql`);
    if (fs.existsSync(filePath)) {
      await executeSQLFile(filePath);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n=== Import Complete ===');
}

main().catch(console.error);
