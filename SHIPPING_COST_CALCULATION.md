# Shipping Cost Calculation Guide

## Overview

The shipping cost calculation system determines container allocation and costs based on the total cubic meters required for all items in the cart. The system prioritizes 20ft containers first, then moves to 40ft containers when necessary.

## Constants

- **20ft Container**: $2,000 | Max Capacity: 32.01 m³ (97% of 33 m³)
- **40ft Container**: $4,000 | Max Capacity: 64.99 m³ (97% of 67 m³)
- **Consolidation Fee**: $650 (applied when utilization < 97% and one more piece can fit)
- **97% Threshold**: 
  - 20ft: 32.01 m³ (97% of 33 m³)
  - 40ft: 64.99 m³ (97% of 67 m³)

## Calculation Logic

### Step 1: Calculate Total Cubic Meters

```
totalCubicMeters = Σ(item.quantity × item.cubic_m_per_pc)
```

### Step 2: Determine Container Type

#### Case A: Fits in 20ft Container (`totalCubicMeters ≤ 32.01 m³`)

1. **Check Overflow Condition**:
   - `wouldOverflow = (totalCubicMeters + smallestCubicMPerPc) > 32.01`
   - If `wouldOverflow = true`: Charge full container price ($2,000)
   - If `wouldOverflow = false`: Charge proportional price: `(totalCubicMeters / 33) × $2,000`

2. **Check Consolidation Fee**:
   - Applied if ALL conditions are met:
     - Utilization < 97% (`totalCubicMeters < 32.01 m³`)
     - One more piece can fit (`!wouldOverflow`)
     - Not already overflowing (`totalCubicMeters < 32.01`)

3. **Final Shipping Cost**:
   ```
   shippingCost = proportional or full price
   consolidationFee = $650 (if conditions met) or $0
   effectiveShippingCost = shippingCost + consolidationFee
   shippingPerUnit = effectiveShippingCost / totalPieces
   ```

#### Case B: Exceeds 20ft Container (`totalCubicMeters > 32.01 m³`)

Uses 40ft container:

1. **Check Overflow Condition**:
   - `wouldOverflow40ft = (totalCubicMeters + smallestCubicMPerPc) > 64.99`
   - If `wouldOverflow40ft = true`: Charge full container price ($4,000)
   - If `wouldOverflow40ft = false`: Charge proportional price: `(totalCubicMeters / 67) × $4,000`

2. **Check Consolidation Fee**:
   - Applied if ALL conditions are met:
     - Utilization < 97% (`totalCubicMeters < 64.99 m³`)
     - One more piece can fit (`!wouldOverflow40ft`)
     - Not already overflowing (`totalCubicMeters < 64.99`)

3. **Final Shipping Cost**:
   ```
   shippingCost = proportional or full price
   consolidationFee = $650 (if conditions met) or $0
   effectiveShippingCost = shippingCost + consolidationFee
   ```

---

## Examples

### Example 1: Small Order (20ft Container with Consolidation Fee)

**Cart Contents:**
- Product A: 5 pieces × 2.0 m³ = 10.0 m³
- Product B: 3 pieces × 1.5 m³ = 4.5 m³
- **Total: 14.5 m³**

**Calculation:**
- ✅ Fits in 20ft: Yes (14.5 < 32.01)
- Utilization: 14.5 / 32.01 = **45.3%** (< 97%)
- Smallest piece: 1.5 m³
- Would overflow: (14.5 + 1.5) = 16.0 < 32.01 → **No**
- Consolidation fee: **Yes** (utilization < 97% and one more piece fits)

**Shipping Cost:**
```
shippingCost = (14.5 / 33) × $2,000 = $878.79
consolidationFee = $650
effectiveShippingCost = $878.79 + $650 = $1,528.79
shippingPerUnit = $1,528.79 / 8 = $191.10 per piece
```

---

### Example 2: Medium Order (20ft Container with Consolidation Fee)

**Cart Contents:**
- Product A: 10 pieces × 2.0 m³ = 20.0 m³
- Product B: 5 pieces × 1.5 m³ = 7.5 m³
- **Total: 27.5 m³**

**Calculation:**
- ✅ Fits in 20ft: Yes (27.5 < 32.01)
- Utilization: 27.5 / 32.01 = **85.9%** (< 97%)
- Smallest piece: 1.5 m³
- Would overflow: (27.5 + 1.5) = 29.0 < 32.01 → **No**
- Consolidation fee: **Yes**

**Shipping Cost:**
```
shippingCost = (27.5 / 33) × $2,000 = $1,666.67
consolidationFee = $650
effectiveShippingCost = $1,666.67 + $650 = $2,316.67
shippingPerUnit = $2,316.67 / 15 = $154.44 per piece
```

---

### Example 3: Large Order (20ft Container with Consolidation Fee - Near Threshold)

**Cart Contents:**
- Product A: 12 pieces × 2.0 m³ = 24.0 m³
- Product B: 4 pieces × 1.5 m³ = 6.0 m³
- **Total: 30.0 m³**

**Calculation:**
- ✅ Fits in 20ft: Yes (30.0 < 32.01)
- Utilization: 30.0 / 32.01 = **93.7%** (< 97%)
- Smallest piece: 1.5 m³
- Would overflow: (30.0 + 1.5) = 31.5 < 32.01 → **No**
- Consolidation fee: **Yes**

**Shipping Cost:**
```
shippingCost = (30.0 / 33) × $2,000 = $1,818.18
consolidationFee = $650
effectiveShippingCost = $1,818.18 + $650 = $2,468.18
shippingPerUnit = $2,468.18 / 16 = $154.26 per piece
```

---

### Example 4: Just Below 97% Threshold (With Consolidation Fee)

**Cart Contents:**
- Product A: 15 pieces × 2.0 m³ = 30.0 m³
- Product B: 1 piece × 1.5 m³ = 1.5 m³
- **Total: 31.5 m³**

**Calculation:**
- ✅ Fits in 20ft: Yes (31.5 < 32.01)
- Utilization: 31.5 / 33 = **95.5%** (< 97% of total container)
- Smallest piece: 1.5 m³
- Would overflow: (31.5 + 1.5) = 33.0 > 32.01 → **Yes** (would exceed max capacity)
- Consolidation fee: **No** (would overflow, so full container price applies instead)

**Shipping Cost:**
```
shippingCost = $2,000 (full container price - would overflow)
consolidationFee = $0 (not applied when would overflow)
effectiveShippingCost = $2,000
shippingPerUnit = $2,000 / 16 = $125.00 per piece
```

**Note:** Even though utilization is below 97%, the consolidation fee is not applied because adding one more piece would exceed the max capacity, triggering full container price instead.

---

### Example 4b: At 97% Threshold (No Consolidation Fee)

**Cart Contents:**
- Product A: 16 pieces × 2.0 m³ = 32.0 m³
- **Total: 32.0 m³**

**Calculation:**
- ✅ Fits in 20ft: Yes (32.0 < 32.01)
- Utilization: 32.0 / 33 = **97.0%** (≥ 97% of total container)
- Smallest piece: 2.0 m³
- Would overflow: (32.0 + 2.0) = 34.0 > 32.01 → **Yes** (would exceed max capacity)
- Consolidation fee: **No** (utilization ≥ 97% of total container)

**Shipping Cost:**
```
shippingCost = $2,000 (full container price - would overflow)
consolidationFee = $0
effectiveShippingCost = $2,000
shippingPerUnit = $2,000 / 16 = $125.00 per piece
```

**Note:** At exactly 97% utilization of the total container (33 m³), the consolidation fee is removed. Since adding one more piece would exceed max capacity, full container price is charged.

---

### Example 5: Would Overflow (Full Container Price, No Consolidation Fee)

**Cart Contents:**
- Product A: 15 pieces × 2.0 m³ = 30.0 m³
- Product B: 2 pieces × 1.5 m³ = 3.0 m³
- **Total: 33.0 m³**

**Calculation:**
- ⚠️ Fits in 20ft: Technically exceeds max capacity (33.0 > 32.01)
- Smallest piece: 1.5 m³
- Would overflow: (33.0 + 1.5) = 34.5 > 32.01 → **Yes**
- Consolidation fee: **No** (would overflow)

**Shipping Cost:**
```
shippingCost = $2,000 (full container price)
consolidationFee = $0
effectiveShippingCost = $2,000
shippingPerUnit = $2,000 / 17 = $117.65 per piece
```

---

### Example 6: Requires 40ft Container

**Cart Contents:**
- Product A: 20 pieces × 2.0 m³ = 40.0 m³
- Product B: 10 pieces × 1.5 m³ = 15.0 m³
- **Total: 55.0 m³**

**Calculation:**
- ❌ Fits in 20ft: No (55.0 > 32.01)
- Uses 40ft container
- Utilization: 55.0 / 64.99 = **84.6%** (< 97%)
- Smallest piece: 1.5 m³
- Would overflow: (55.0 + 1.5) = 56.5 < 64.99 → **No**
- Consolidation fee: **Yes**

**Shipping Cost:**
```
shippingCost = (55.0 / 67) × $4,000 = $3,283.58
consolidationFee = $650
effectiveShippingCost = $3,283.58 + $650 = $3,933.58
shippingPerUnit = $3,933.58 / 30 = $131.12 per piece
```

---

### Example 7: 40ft Container at 97% Threshold (No Consolidation Fee)

**Cart Contents:**
- Product A: 28 pieces × 2.0 m³ = 56.0 m³
- Product B: 5 pieces × 1.5 m³ = 7.5 m³
- **Total: 63.5 m³**

**Calculation:**
- ❌ Fits in 20ft: No (63.5 > 32.01)
- Uses 40ft container
- Utilization: 63.5 / 64.99 = **97.7%** (≥ 97%)
- Consolidation fee: **No** (utilization ≥ 97%)

**Shipping Cost:**
```
shippingCost = (63.5 / 67) × $4,000 = $3,791.04
consolidationFee = $0
effectiveShippingCost = $3,791.04
shippingPerUnit = $3,791.04 / 33 = $114.88 per piece
```

---

### Example 8: 40ft Container Would Overflow (Full Container Price)

**Cart Contents:**
- Product A: 30 pieces × 2.0 m³ = 60.0 m³
- Product B: 5 pieces × 1.5 m³ = 7.5 m³
- **Total: 67.5 m³**

**Calculation:**
- ❌ Fits in 20ft: No (67.5 > 32.01)
- Uses 40ft container
- Smallest piece: 1.5 m³
- Would overflow: (67.5 + 1.5) = 69.0 > 64.99 → **Yes**
- Consolidation fee: **No** (would overflow)

**Shipping Cost:**
```
shippingCost = $4,000 (full container price)
consolidationFee = $0
effectiveShippingCost = $4,000
shippingPerUnit = $4,000 / 35 = $114.29 per piece
```

---

## How Quantity Changes Affect Shipping

### Adding Quantity

When you **increase** the quantity of items:

1. **Increases `totalCubicMeters`**
2. **May increase proportional cost** (if still within container capacity)
3. **May trigger full container price** (if adding one more piece would cause overflow)
4. **May remove consolidation fee** (if utilization reaches ≥97%)
5. **May switch from 20ft to 40ft** (if total exceeds 32.01 m³)

**Example:** Starting with Example 1 (14.5 m³, $1,528.79):
- Add 1 more Product B (1.5 m³) → 16.0 m³
- Shipping cost increases proportionally: `(16.0 / 33) × $2,000 + $650 = $1,619.70`
- Still has consolidation fee (utilization = 50.0% < 95%)

### Reducing Quantity

When you **decrease** the quantity of items:

1. **Decreases `totalCubicMeters`**
2. **May decrease proportional cost** (if still within container capacity)
3. **May add consolidation fee** (if utilization drops below 97%)
4. **May switch from 40ft to 20ft** (if total falls below 32.01 m³)

**Example:** Starting with Example 6 (55.0 m³, $3,933.58):
- Remove 12 pieces of Product A (24.0 m³) → 31.0 m³
- Now fits in 20ft container
- Shipping cost: `(31.0 / 33) × $2,000 + $650 = $2,528.79`
- Still has consolidation fee (utilization = 96.8% but check is < 95% threshold)

---

## Key Rules Summary

1. **Always prioritize 20ft container** - Only use 40ft when 20ft cannot accommodate the order
2. **97% threshold rule** - Consolidation fee is removed when utilization reaches 97% or higher
3. **Overflow protection** - If adding one more piece would exceed capacity, charge full container price
4. **Proportional pricing** - When not overflowing, cost is proportional to space used
5. **Real-time updates** - Shipping cost recalculates automatically when quantities change

---

## Optimization Opportunities

The system provides optimization suggestions when:

1. **Consolidation Fee Present**: Shows how many pieces to add to reach 97% threshold and remove the fee
2. **Using 40ft Container**: Shows how many pieces to reduce to fit in 20ft container and save on shipping

These suggestions appear in a dialog when clicking "Submit Enquiry" if optimization opportunities exist.

