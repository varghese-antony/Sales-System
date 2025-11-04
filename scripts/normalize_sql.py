#!/usr/bin/env python3
import re

# Define the complete column list from the schema
COLUMNS = [
    'sub_category', 'product_name', 'model_number', 'size', 'power_w', 'voltage', 
    'cct', 'cri_ra', 'lumen', 'efficacy_lumen_per_w', 'dimming_type', 'material_finish',
    'sensors_and_controls', 'occupancy', 'bi_level', 'pir_microwave_bluetooth',
    'remote_control', 'plugin_sensor', 'emergency_backup_battery', 'junction_cover',
    'mounting', 'installation_kits', 'adjustment_dial', 'certifications', 
    'price_per_piece', 'lead_time', 'cut_sheet', 'warranty', 'moq', 
    'cost_china_ddp_usa', 'cost_thailand_vietnam', 'photo', 'ip_rating'
]

# Read the SQL file
with open('scripts/batches/indoor_batch_complete.sql', 'r') as f:
    content = f.read()

# Extract all INSERT statements
insert_pattern = r'INSERT INTO indoor_products_v2 \((.*?)\) VALUES \((.*?)\);'
matches = re.findall(insert_pattern, content, re.DOTALL)

print(f"Found {len(matches)} INSERT statements")

all_rows = []
errors = []

for idx, (columns_str, values_str) in enumerate(matches):
    # Parse columns
    columns = [c.strip() for c in columns_str.split(',')]
    
    # Parse values - this is tricky because values can contain commas
    # We'll use a simple state machine
    values = []
    current_value = ''
    in_quotes = False
    paren_depth = 0
    
    for char in values_str:
        if char == "'" and (not current_value or current_value[-1] != '\\'):
            in_quotes = not in_quotes
            current_value += char
        elif char == '(' and not in_quotes:
            paren_depth += 1
            current_value += char
        elif char == ')' and not in_quotes:
            paren_depth -= 1
            current_value += char
        elif char == ',' and not in_quotes and paren_depth == 0:
            values.append(current_value.strip())
            current_value = ''
        else:
            current_value += char
    
    if current_value.strip():
        values.append(current_value.strip())
    
    # Create a mapping
    if len(columns) != len(values):
        errors.append(f"Row {idx+1}: Column count ({len(columns)}) != Value count ({len(values)})")
        continue
    
    row_data = dict(zip(columns, values))
    
    # Build complete row with defaults
    complete_row = []
    for col in COLUMNS:
        if col in row_data:
            complete_row.append(row_data[col])
        else:
            # Default values for missing columns
            if col in ['occupancy', 'bi_level', 'remote_control', 'plugin_sensor', 
                      'emergency_backup_battery', 'junction_cover']:
                complete_row.append('false')
            else:
                complete_row.append('NULL')
    
    all_rows.append(complete_row)

# Print errors
if errors:
    print("\nErrors found:")
    for error in errors[:10]:  # Show first 10 errors
        print(f"  {error}")
    print(f"Total errors: {len(errors)}")

# Generate optimized SQL
output = f"""-- Optimized Indoor Products Import
-- All rows normalized to use the same column structure
-- Total rows: {len(all_rows)}

INSERT INTO indoor_products_v2 (
  {', '.join(COLUMNS)}
)
VALUES
"""

# Add all values
for i, row in enumerate(all_rows):
    values_str = ', '.join(row)
    if i < len(all_rows) - 1:
        output += f"  ({values_str}),\n"
    else:
        output += f"  ({values_str});\n"

# Write the optimized file
with open('scripts/batches/indoor_batch_complete_fixed.sql', 'w') as f:
    f.write(output)

print(f"\nGenerated optimized SQL with {len(all_rows)} rows")
print("Output: scripts/batches/indoor_batch_complete_fixed.sql")
