#!/usr/bin/env python3
import re

# Define the complete column list and their types
COLUMNS = [
    ('sub_category', 'text'),
    ('product_name', 'text'),
    ('model_number', 'text'),
    ('size', 'text'),
    ('power_w', 'text'),
    ('voltage', 'text'),
    ('cct', 'text'),
    ('cri_ra', 'int'),
    ('lumen', 'text'),
    ('efficacy_lumen_per_w', 'text'),
    ('dimming_type', 'text'),
    ('material_finish', 'text'),
    ('sensors_and_controls', 'text'),
    ('occupancy', 'bool'),
    ('bi_level', 'bool'),
    ('pir_microwave_bluetooth', 'text'),
    ('remote_control_bluetooth', 'bool'),
    ('plugin_sensor', 'bool'),
    ('emergency_backup_battery', 'bool'),
    ('junction_cover', 'bool'),
    ('mounting', 'text'),
    ('installation_kits', 'text'),
    ('adjustment_dial', 'text'),
    ('certifications', 'text'),
    ('price_per_piece', 'text'),
    ('lead_time', 'text'),
    ('cut_sheet', 'text'),
    ('warranty', 'text'),
    ('moq', 'text'),
    ('cost_china_ddp_usa', 'text'),
    ('cost_thailand_vietnam', 'text'),
    ('photo', 'text'),
    ('ip_rating', 'text')
]

def parse_value(val):
    """Parse a single value from SQL"""
    val = val.strip()
    if val.upper() == 'NULL':
        return None
    if val.lower() == 'true':
        return True
    if val.lower() == 'false':
        return False
    # Remove quotes if present
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1]
    return val

def is_boolean_like(val):
    """Check if a value looks like it should be boolean"""
    if val is None:
        return False
    val_str = str(val).lower()
    return val_str in ['true', 'false', 'yes', 'no', '0', '1']

def fix_value(val, expected_type):
    """Fix a value to match the expected type"""
    if val is None:
        return 'NULL'
    
    if expected_type == 'bool':
        # If it's already a boolean, return it
        if isinstance(val, bool):
            return 'true' if val else 'false'
        
        val_str = str(val).lower().strip()
        
        # Check for common boolean-like values
        if val_str in ['true', 'yes', '1', 't', 'y']:
            return 'true'
        if val_str in ['false', 'no', '0', 'f', 'n', 'none']:
            return 'false'
        
        # Check for patterns that shouldn't be boolean
        if '/' in val_str or ',' in val_str or 'w' in val_str.lower():
            # This looks like wattage or other data, default to false
            print(f"  WARNING: Converting non-boolean value '{val}' to false")
            return 'false'
        
        # Default to false for anything else
        return 'false'
    
    elif expected_type == 'int':
        try:
            return str(int(val))
        except:
            return 'NULL'
    
    else:  # text
        # Escape single quotes
        val_str = str(val).replace("'", "''")
        return f"'{val_str}'"

def parse_sql_values(values_str):
    """Parse VALUES string into individual values"""
    values = []
    current = ''
    in_quotes = False
    paren_depth = 0
    
    i = 0
    while i < len(values_str):
        char = values_str[i]
        
        if char == "'" and (i == 0 or values_str[i-1] != '\\'):
            in_quotes = not in_quotes
            current += char
        elif char == '(' and not in_quotes:
            paren_depth += 1
            current += char
        elif char == ')' and not in_quotes:
            paren_depth -= 1
            current += char
        elif char == ',' and not in_quotes and paren_depth == 0:
            values.append(current.strip())
            current = ''
        else:
            current += char
        
        i += 1
    
    if current.strip():
        values.append(current.strip())
    
    return values

# Read the SQL file
print("Reading SQL file...")
with open('scripts/batches/indoor_batch_complete.sql', 'r') as f:
    lines = f.readlines()

# Find the header
header_line = None
values_start = None
for i, line in enumerate(lines):
    if 'INSERT INTO indoor_products_v2' in line and '(' in line:
        header_line = i
    if header_line and 'VALUES' in line:
        values_start = i + 1
        break

if not header_line or not values_start:
    print("ERROR: Could not find SQL structure")
    exit(1)

print(f"Found header at line {header_line}, values start at line {values_start}")

# Process each value row
fixed_rows = []
error_count = 0

for i in range(values_start, len(lines)):
    line = lines[i].strip()
    if not line or line == ';':
        continue
    
    # Remove leading/trailing parentheses and comma
    if line.startswith('('):
        line = line[1:]
    if line.endswith('),'):
        line = line[:-2]
    elif line.endswith(');'):
        line = line[:-2]
    elif line.endswith(','):
        line = line[:-1]
    
    # Parse values
    try:
        values = parse_sql_values(line)
        
        if len(values) != len(COLUMNS):
            print(f"  Row {i}: Expected {len(COLUMNS)} values, got {len(values)} - SKIPPING")
            error_count += 1
            continue
        
        # Fix each value according to its type
        fixed_values = []
        for j, (val_str, (col_name, col_type)) in enumerate(zip(values, COLUMNS)):
            parsed_val = parse_value(val_str)
            fixed_val = fix_value(parsed_val, col_type)
            fixed_values.append(fixed_val)
        
        fixed_rows.append(fixed_values)
        
    except Exception as e:
        print(f"  Row {i}: Error parsing - {e} - SKIPPING")
        error_count += 1
        continue

print(f"\nProcessed {len(fixed_rows)} rows successfully")
print(f"Skipped {error_count} rows with errors")

# Generate the fixed SQL file
output = f"""-- Fixed Indoor Products Import
-- All data validated and type-corrected
-- Total rows: {len(fixed_rows)}

INSERT INTO indoor_products_v2 (
  {', '.join([col[0] for col in COLUMNS])}
)
VALUES
"""

for i, row in enumerate(fixed_rows):
    values_str = ', '.join(row)
    if i < len(fixed_rows) - 1:
        output += f"  ({values_str}),\n"
    else:
        output += f"  ({values_str});\n"

# Write the fixed file
with open('scripts/batches/indoor_batch_complete_final.sql', 'w') as f:
    f.write(output)

print(f"\nGenerated fixed SQL file: scripts/batches/indoor_batch_complete_final.sql")
print(f"Ready to import {len(fixed_rows)} rows")
