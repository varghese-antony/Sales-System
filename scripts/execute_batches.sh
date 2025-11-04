#!/bin/bash

# Script to execute all batch SQL files one by one
# This will be used to import products into Supabase

echo "Starting batch import..."

for file in scripts/batches/indoor_batch_*.sql; do
    echo "Processing $file..."
    filename=$(basename "$file")
    echo "Executing $filename"
done

for file in scripts/batches/outdoor_batch_*.sql; do
    echo "Processing $file..."
    filename=$(basename "$file")
    echo "Executing $filename"
done

echo "All batches processed!"
