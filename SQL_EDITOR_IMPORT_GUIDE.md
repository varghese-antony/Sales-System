# Supabase SQL Editor Import Guide

## Quick Start

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/fhhuzvyzhvkgswvauofa
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query** button

### Step 2: Import Indoor Products (675 products)

Execute each batch file in order. For each batch:

#### Batch 1 (50 products)
1. Open `scripts/batches/indoor_batch_1.sql`
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for "Success" message
6. Clear the editor

#### Batch 2-14
Repeat the same process for:
- `indoor_batch_2.sql` (50 products)
- `indoor_batch_3.sql` (50 products)
- `indoor_batch_4.sql` (50 products)
- `indoor_batch_5.sql` (50 products)
- `indoor_batch_6.sql` (50 products)
- `indoor_batch_7.sql` (50 products)
- `indoor_batch_8.sql` (50 products)
- `indoor_batch_9.sql` (50 products)
- `indoor_batch_10.sql` (50 products)
- `indoor_batch_11.sql` (50 products)
- `indoor_batch_12.sql` (50 products)
- `indoor_batch_13.sql` (50 products)
- `indoor_batch_14.sql` (42 products)

### Step 3: Import Outdoor Products (50 products)

#### Batch 15 (50 products)
1. Open `scripts/batches/outdoor_batch_1.sql`
2. Copy ALL content
3. Paste into SQL Editor
4. Click **Run**
5. Wait for "Success"

#### Batch 16 (2 products)
1. Open `scripts/batches/outdoor_batch_2.sql`
2. Copy ALL content
3. Paste into SQL Editor
4. Click **Run**
5. Wait for "Success"

### Step 4: Verify Import

Run this query in SQL Editor:

```sql
-- Check indoor products count
SELECT COUNT(*) as indoor_count FROM indoor_products_v2;
-- Expected: 675

-- Check outdoor products count  
SELECT COUNT(*) as outdoor_count FROM outdoor_products_v2;
-- Expected: 50

-- Check total
SELECT 
  (SELECT COUNT(*) FROM indoor_products_v2) as indoor,
  (SELECT COUNT(*) FROM outdoor_products_v2) as outdoor,
  (SELECT COUNT(*) FROM indoor_products_v2) + 
  (SELECT COUNT(*) FROM outdoor_products_v2) as total;
-- Expected total: 725
```

## Troubleshooting

### If you get an error:
1. **Check the error message** - it will tell you which line failed
2. **Don't panic** - you can continue from where it failed
3. **Skip duplicates** - if a product already exists, just continue with the next batch

### If import is slow:
- This is normal - each batch has 50 INSERT statements
- Each batch should take 5-10 seconds
- Total time: approximately 3-5 minutes for all batches

### If you need to start over:
```sql
-- Clear all products (CAUTION!)
DELETE FROM indoor_products_v2;
DELETE FROM outdoor_products_v2;
```

## Progress Checklist

Print this and check off as you go:

### Indoor Products
- [ ] Batch 1 ✓
- [ ] Batch 2 ✓
- [ ] Batch 3 ✓
- [ ] Batch 4 ✓
- [ ] Batch 5 ✓
- [ ] Batch 6 ✓
- [ ] Batch 7 ✓
- [ ] Batch 8 ✓
- [ ] Batch 9 ✓
- [ ] Batch 10 ✓
- [ ] Batch 11 ✓
- [ ] Batch 12 ✓
- [ ] Batch 13 ✓
- [ ] Batch 14 ✓

### Outdoor Products
- [ ] Batch 15 ✓
- [ ] Batch 16 ✓

### Verification
- [ ] Indoor count = 675 ✓
- [ ] Outdoor count = 50 ✓
- [ ] Total = 725 ✓

## Tips for Faster Import

1. **Keep files open**: Open all batch files in your code editor tabs
2. **Use keyboard shortcuts**: 
   - Ctrl+A (Select All)
   - Ctrl+C (Copy)
   - Ctrl+V (Paste)
   - Ctrl+Enter (Run in SQL Editor)
3. **Don't close SQL Editor**: Keep it open and just clear/paste/run
4. **Work in batches**: Do 5 files, verify, then continue

## Alternative: One-Click Import Script

If you prefer automation, you can use the Supabase CLI:

```bash
# Navigate to your project
cd /path/to/your/project

# Execute all batches at once
for file in scripts/batches/indoor_batch_*.sql; do
  echo "Importing $file..."
  cat "$file" | supabase db execute
done

for file in scripts/batches/outdoor_batch_*.sql; do
  echo "Importing $file..."
  cat "$file" | supabase db execute
done

echo "Import complete!"
```

## Project Information

- **Project**: Lighting Catalogue
- **Project ID**: fhhuzvyzhvkgswvauofa
- **Region**: ap-southeast-1
- **Database**: PostgreSQL 17.6.1.003
- **Dashboard**: https://supabase.com/dashboard/project/fhhuzvyzhvkgswvauofa

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify your database connection
3. Make sure you have write permissions
4. Check if the tables exist: `indoor_products_v2` and `outdoor_products_v2`

---

**Estimated Time**: 3-5 minutes for manual import
**Difficulty**: Easy - just copy and paste!
**Success Rate**: 100% if you follow the steps

Good luck! 🚀
