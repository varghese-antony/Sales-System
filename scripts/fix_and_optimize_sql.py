#!/usr/bin/env python3
import re
import sys

# Read the SQL file
with open('scripts/batches/indoor_batch_complete.sql', 'r') as f:
    content = f.read()

# Extract all INSERT statements
insert_pattern = r'INSERT INTO indoor_products_v2 \((.*?)\) VALUES \((.*?)\);'
matches = re.findall(insert_pattern, content, re.DOTALL)

print(f"Found {len(matches)} INSERT statements")

# Parse each insert to extract values
all_values = []
column_list = None

for columns, values in matches:
    # Store the first column list we find
    if column_list is None:
        column_list = columns.strip()
    
    # Clean up the values string
    values_clean = values.strip()
    all_values.append(values_clean)

# Generate optimized SQL
output = f"""-- Optimized Indoor Products Import
-- Generated with all data in a single multi-row INSERT

INSERT INTO indoor_products_v2 ({column_list})
VALUES
"""

# Add all values with proper formatting
for i, values in enumerate(all_values):
    if i < len(all_values) - 1:
        output += f"({values}),\n"
    else:
        output += f"({values});\n"

# Write the optimized file
with open('scripts/batches/indoor_batch_complete_optimized.sql', 'w') as f:
    f.write(output)

print(f"Generated optimized SQL with {len(all_values)} rows")
print("Output: scripts/batches/indoor_batch_complete_optimized.sql")
