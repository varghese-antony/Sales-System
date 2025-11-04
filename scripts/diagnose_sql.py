#!/usr/bin/env python3
import re

# Read the SQL file
with open('scripts/batches/indoor_batch_complete.sql', 'r') as f:
    lines = f.readlines()

# Find problematic lines
problem_lines = []
for i, line in enumerate(lines, 1):
    if 'INSERT INTO indoor_products_v2' in line:
        # Count columns
        col_match = re.search(r'\((.*?)\) VALUES', line)
        val_match = re.search(r'VALUES \((.*?)\);', line)
        
        if col_match and val_match:
            cols_str = col_match.group(1)
            vals_str = val_match.group(1)
            
            # Simple count of commas (not perfect but good enough for diagnosis)
            col_count = cols_str.count(',') + 1
            
            # Count values more carefully
            val_count = 0
            in_quotes = False
            for char in vals_str:
                if char == "'" and (not vals_str or vals_str[vals_str.index(char)-1] != '\\'):
                    in_quotes = not in_quotes
                elif char == ',' and not in_quotes:
                    val_count += 1
            val_count += 1  # Add one for the last value
            
            if col_count != val_count:
                problem_lines.append((i, col_count, val_count, line[:200]))

print(f"Found {len(problem_lines)} problematic lines:\n")
for line_num, col_count, val_count, preview in problem_lines[:5]:
    print(f"Line {line_num}: {col_count} columns, {val_count} values")
    print(f"  Preview: {preview}...")
    print()
