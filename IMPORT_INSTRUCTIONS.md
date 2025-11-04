# Product Import Instructions

## Overview
You have 16 batch SQL files ready to import:
- 14 indoor product batches (675 products total)
- 2 outdoor product batches (50 products total)

## Files Ready for Import
All files are located in `scripts/batches/`:

### Indoor Products
1. `indoor_batch_1.sql` - 50 products
2. `indoor_batch_2.sql` - 50 products
3. `indoor_batch_3.sql` - 50 products
4. `indoor_batch_4.sql` - 50 products
5. `indoor_batch_5.sql` - 50 products
6. `indoor_batch_6.sql` - 50 products
7. `indoor_batch_7.sql` - 50 products
8. `indoor_batch_8.sql` - 50 products
9. `indoor_batch_9.sql` - 50 products
10. `indoor_batch_10.sql` - 50 products
11. `indoor_batch_11.sql` - 50 products
12. `indoor_batch_12.sql` - 50 products
13. `indoor_batch_13.sql` - 50 products
14. `indoor_batch_14.sql` - 42 products

### Outdoor Products
15. `outdoor_batch_1.sql` - 50 products
16. `outdoor_batch_2.sql` - 2 products

## How to Import

Since the files are large, I recommend importing them using the Supabase SQL Editor or CLI:

### Option 1: Using Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the content of each batch file
4. Execute each batch one by one

### Option 2: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref fhhuzvyzhvkgswvauofa

# Execute each batch file
supabase db execute --file scripts/batches/indoor_batch_1.sql
supabase db execute --file scripts/batches/indoor_batch_2.sql
# ... continue for all files
```

### Option 3: Automated Script
Run the import script that will execute all batches:
```bash
# This would need to be implemented with proper Supabase client
node scripts/import_all_batches.js
```

## Verification
After import, verify the count:
```sql
SELECT COUNT(*) FROM indoor_products_v2;  -- Should be 675
SELECT COUNT(*) FROM outdoor_products_v2; -- Should be 50
```

## Project Details
- **Project ID**: fhhuzvyzhvkgswvauofa
- **Project Name**: Lighting Catalogue
- **Region**: ap-southeast-1
