#!/bin/bash

# Import all product batches to Supabase
# This script reads each batch file and executes it via Supabase

PROJECT_ID="fhhuzvyzhvkgswvauofa"
BATCH_DIR="scripts/batches"

echo "Starting batch import..."
echo "Project ID: $PROJECT_ID"
echo ""

# Count total batches
TOTAL_BATCHES=$(ls -1 $BATCH_DIR/*.sql 2>/dev/null | wc -l)
echo "Found $TOTAL_BATCHES batch files"
echo ""

# Process each batch
COUNTER=0
for batch_file in $BATCH_DIR/*.sql; do
    COUNTER=$((COUNTER + 1))
    filename=$(basename "$batch_file")
    
    echo "[$COUNTER/$TOTAL_BATCHES] Processing: $filename"
    
    # Count statements in batch
    STMT_COUNT=$(grep -c "INSERT INTO" "$batch_file")
    echo "  - Statements: $STMT_COUNT"
    echo "  - File: $batch_file"
    echo ""
done

echo "All batches listed. Ready to import."
echo ""
echo "To import, you'll need to execute each batch file via Supabase MCP."
