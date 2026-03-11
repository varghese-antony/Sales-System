/**
 * Standardize all voltage values to "AC 120V" across indoor and outdoor products.
 * Run with: node scripts/standardize-voltage.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env
 */

const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const STANDARD_VOLTAGE = 'AC 120V';

async function standardizeVoltageInTable(tableName) {
  let updated = 0;
  let page = 0;
  const pageSize = 500;

  while (true) {
    const { data: rows, error } = await supabase
      .from(tableName)
      .select('id')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch from ${tableName}: ${error.message}`);
    }

    if (!rows || rows.length === 0) break;

    const ids = rows.map((r) => r.id);
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ voltage: STANDARD_VOLTAGE })
      .in('id', ids);

    if (updateError) {
      throw new Error(`Failed to update ${tableName}: ${updateError.message}`);
    }

    updated += rows.length;
    console.log(`  ${tableName}: updated ${rows.length} rows (total: ${updated})`);

    if (rows.length < pageSize) break;
    page++;
  }

  return updated;
}

async function main() {
  console.log(`Standardizing all voltage values to "${STANDARD_VOLTAGE}"...\n`);

  try {
    const indoorCount = await standardizeVoltageInTable('indoor_products_v3');
    const outdoorCount = await standardizeVoltageInTable('outdoor_products_v3');

    console.log(`\nDone. Updated ${indoorCount} indoor + ${outdoorCount} outdoor = ${indoorCount + outdoorCount} total products.`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
