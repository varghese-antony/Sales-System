
export const CONTAINER_TYPE_20FT = "20ft"
export const CONTAINER_TYPE_40FT_HQ = "40ft HQ"

const MAXIMUM_CONTAINER_UTILIZATION_PERCENTAGE = 0.97; // 97%
const TARRIF_PERCENTAGE = 0.35; // 35%
const DEFAULT_MARKUP_PERCENTAGE = 0.30; // 30%
const ADMIN_CONSOLIDATION_FEE = 650; // $650

const SHIPMENT_CONTAINER_DETAILS = [
    {
        "container_type": CONTAINER_TYPE_20FT,
        "container_price": 3000,
        "container_size_in_cubic_meters": 33,
    },
    {
        "container_type": CONTAINER_TYPE_40FT_HQ,
        "container_price": 4300,
        "container_size_in_cubic_meters": 76.4,
    }
]

export const getProductPriceSummaryPerUnit = (product, quantity) => {
    const product_price_per_unit = {}



    let markupPercentage = DEFAULT_MARKUP_PERCENTAGE
    if (product.markup_percentage !== null && product.markup_percentage !== undefined) {
        const parsed = typeof product.markup_percentage === 'number'
            ? product.markup_percentage
            : parseFloat(product.markup_percentage)
        if (Number.isFinite(parsed) && parsed > 0) {
            markupPercentage = parsed
        }
    }


    const total_cubic_meters_needed = quantity * product.cubic_m_per_pc;
    const base_cost = parseCostValue(product.cost_china_ddp_usa ?? product.cost_thailand_vietnam ?? 0)

    // Add sensor cost to base cost if sensors_and_controls is true
    const sensorCost = getTotalSensorCost(product)
    const cost_with_sensors = base_cost + sensorCost

    const price_per_unit = cost_with_sensors * (1 + markupPercentage / 100)

    for (let i = 0; i < SHIPMENT_CONTAINER_DETAILS.length; i++) {
        const container = SHIPMENT_CONTAINER_DETAILS[i];

        // If total cubic meters needed exceeds container space, return empty object
        if (total_cubic_meters_needed > container.container_size_in_cubic_meters) {
            product_price_per_unit[container.container_type] = {}
            continue
        }

        const container_maximum_utilization_space = container.container_size_in_cubic_meters * MAXIMUM_CONTAINER_UTILIZATION_PERCENTAGE;
        let admin_consolidation_fee = ADMIN_CONSOLIDATION_FEE;

        if (total_cubic_meters_needed >= container_maximum_utilization_space) {
            admin_consolidation_fee = 0;
        }

        // Calculate shipment cost per unit: proportional cost based on space used
        const total_shipment_cost = (total_cubic_meters_needed * container.container_price) / container.container_size_in_cubic_meters
        const shipment_cost_per_unit = total_shipment_cost / quantity

        product_price_per_unit[container.container_type] = {
            "product_price": price_per_unit,
            "admin_consolidation_fee": admin_consolidation_fee / quantity,
            "tarrif": price_per_unit * TARRIF_PERCENTAGE,
            "shipment_cost": shipment_cost_per_unit,
            "space_occupied_cubic_meters": total_cubic_meters_needed,
        }
    }

    return product_price_per_unit
}

export const getProductPriceSummary = (product, quantity) => {
    const product_price_summary = {}

    let markupPercentage = DEFAULT_MARKUP_PERCENTAGE
    if (product.markup_percentage !== null && product.markup_percentage !== undefined) {
        const parsed = typeof product.markup_percentage === 'number'
            ? product.markup_percentage
            : parseFloat(product.markup_percentage)
        if (Number.isFinite(parsed) && parsed > 0) {
            markupPercentage = parsed
        }
    }

    const total_cubic_meters_needed = quantity * product.cubic_m_per_pc;
    const base_cost = parseCostValue(product.cost_china_ddp_usa ?? product.cost_thailand_vietnam ?? 0)

    // Add sensor cost to base cost if sensors_and_controls is true
    const sensorCost = getTotalSensorCost(product)
    const cost_with_sensors = base_cost + sensorCost

    const price_per_unit = cost_with_sensors * (1 + markupPercentage / 100)
    const total_product_price = price_per_unit * quantity

    for (let i = 0; i < SHIPMENT_CONTAINER_DETAILS.length; i++) {
        const container = SHIPMENT_CONTAINER_DETAILS[i];

        // If total cubic meters needed exceeds container space, return empty object
        if (total_cubic_meters_needed > container.container_size_in_cubic_meters) {
            product_price_summary[container.container_type] = {}
            continue
        }

        const container_maximum_utilization_space = container.container_size_in_cubic_meters * MAXIMUM_CONTAINER_UTILIZATION_PERCENTAGE;
        let admin_consolidation_fee = ADMIN_CONSOLIDATION_FEE;

        if (total_cubic_meters_needed >= container_maximum_utilization_space) {
            admin_consolidation_fee = 0;
        }

        // Calculate total shipment cost: proportional cost based on space used
        const total_shipment_cost = (total_cubic_meters_needed * container.container_price) / container.container_size_in_cubic_meters

        product_price_summary[container.container_type] = {
            "product_price": total_product_price,
            "admin_consolidation_fee": admin_consolidation_fee,
            "tarrif": price_per_unit * TARRIF_PERCENTAGE * quantity,
            "shipment_cost": total_shipment_cost,
            "space_occupied_cubic_meters": total_cubic_meters_needed,
        }
    }

    return product_price_summary
}




const parseCostValue = (value) => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0
    }
    if (typeof value !== 'string') return 0
    const cleaned = value.replace(/[^\d.]/g, '')
    const parsed = parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
}

const getTotalSensorCost = (product) => {
    if (!product) return 0

    // Check if sensors_and_controls is true
    const hasSensorsAndControls = product.sensors_and_controls === true || product.sensorsAndControls === true

    if (!hasSensorsAndControls) return 0

    // Sum all sensor-related cost fields
    const sensorCostFields = [
        'sensor_cost',
        'remote_control_bluetooth_cost',
        'plugin_sensor_cost',
        'emergency_backup_battery_cost',
        'installation_kits_cost'
    ]

    let totalSensorCost = 0
    for (const field of sensorCostFields) {
        totalSensorCost += parseCostValue(product[field])
    }

    return totalSensorCost
}

// Calculate price optimization suggestions
export const getPriceOptimizationSuggestions = (cartItems) => {
    const suggestions = []

    if (!cartItems || cartItems.length === 0) return suggestions

    // Filter items with cubic_m_per_pc data
    const validItems = cartItems.filter(item => item.cubic_m_per_pc && item.cubic_m_per_pc > 0)
    if (validItems.length === 0) return suggestions

    // Calculate current totals for each container
    const currentTotals = {
        [CONTAINER_TYPE_20FT]: { total: 0, space: 0, hasAdminFee: false },
        [CONTAINER_TYPE_40FT_HQ]: { total: 0, space: 0, hasAdminFee: false }
    }

    // Calculate current state
    validItems.forEach(item => {
        const summary = getProductPriceSummary(item, item.quantity)
        if (summary[CONTAINER_TYPE_20FT] && Object.keys(summary[CONTAINER_TYPE_20FT]).length > 0) {
            currentTotals[CONTAINER_TYPE_20FT].total += summary[CONTAINER_TYPE_20FT].product_price + summary[CONTAINER_TYPE_20FT].tarrif + summary[CONTAINER_TYPE_20FT].shipment_cost + summary[CONTAINER_TYPE_20FT].admin_consolidation_fee
            currentTotals[CONTAINER_TYPE_20FT].space += summary[CONTAINER_TYPE_20FT].space_occupied_cubic_meters
            if (summary[CONTAINER_TYPE_20FT].admin_consolidation_fee > 0) {
                currentTotals[CONTAINER_TYPE_20FT].hasAdminFee = true
            }
        }
        if (summary[CONTAINER_TYPE_40FT_HQ] && Object.keys(summary[CONTAINER_TYPE_40FT_HQ]).length > 0) {
            currentTotals[CONTAINER_TYPE_40FT_HQ].total += summary[CONTAINER_TYPE_40FT_HQ].product_price + summary[CONTAINER_TYPE_40FT_HQ].tarrif + summary[CONTAINER_TYPE_40FT_HQ].shipment_cost + summary[CONTAINER_TYPE_40FT_HQ].admin_consolidation_fee
            currentTotals[CONTAINER_TYPE_40FT_HQ].space += summary[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters
            if (summary[CONTAINER_TYPE_40FT_HQ].admin_consolidation_fee > 0) {
                currentTotals[CONTAINER_TYPE_40FT_HQ].hasAdminFee = true
            }
        }
    })

    // Helper function to calculate total for a given quantity set
    const calculateTotalForQuantities = (itemsWithQuantities, containerType) => {
        let total = 0
        itemsWithQuantities.forEach(({ item, quantity }) => {
            const summary = getProductPriceSummary(item, quantity)
            if (summary[containerType] && Object.keys(summary[containerType]).length > 0) {
                total += summary[containerType].product_price + summary[containerType].tarrif + summary[containerType].shipment_cost + summary[containerType].admin_consolidation_fee
            }
        })
        return total
    }

    // Helper function to calculate total space for quantities
    const calculateTotalSpace = (itemsWithQuantities) => {
        return itemsWithQuantities.reduce((sum, { item, quantity }) => {
            return sum + (item.cubic_m_per_pc * quantity)
        }, 0)
    }

    // Optimization 1: Add quantity to eliminate admin consolidation fee (for each container)
    for (const containerType of [CONTAINER_TYPE_20FT, CONTAINER_TYPE_40FT_HQ]) {
        const container = SHIPMENT_CONTAINER_DETAILS.find(c => c.container_type === containerType)
        if (!container) continue

        const currentSpace = currentTotals[containerType].space
        const currentTotal = currentTotals[containerType].total

        if (currentSpace === 0 || currentTotal === 0) continue

        const maxUtilizationSpace = container.container_size_in_cubic_meters * MAXIMUM_CONTAINER_UTILIZATION_PERCENTAGE

        // If already at or above 97%, skip
        if (currentSpace >= maxUtilizationSpace) continue

        // Calculate additional space needed
        const additionalSpaceNeeded = maxUtilizationSpace - currentSpace

        // Find best product to add quantity to (lowest cost per cubic meter)
        let bestProduct = null
        let minCostPerCubicMeter = Infinity

        validItems.forEach(item => {
            const priceData = getProductPriceSummary(item, 1)
            if (priceData[containerType] && Object.keys(priceData[containerType]).length > 0) {
                const costPerCubicMeter = (priceData[containerType].product_price + priceData[containerType].tarrif + priceData[containerType].shipment_cost) / item.cubic_m_per_pc
                if (costPerCubicMeter < minCostPerCubicMeter) {
                    minCostPerCubicMeter = costPerCubicMeter
                    bestProduct = item
                }
            }
        })

        if (bestProduct && additionalSpaceNeeded > 0) {
            const quantityToAdd = Math.ceil(additionalSpaceNeeded / bestProduct.cubic_m_per_pc)
            const newQuantity = bestProduct.quantity + quantityToAdd

            // Calculate new total
            const bestProductId = bestProduct.id || bestProduct.ID
            const newItems = validItems.map(item => ({
                item,
                quantity: (item.id || item.ID) === bestProductId ? newQuantity : item.quantity
            }))

            const newTotal = calculateTotalForQuantities(newItems, containerType)
            const savings = currentTotal - newTotal

            if (savings > 0) {
                suggestions.push({
                    type: 'add-quantity',
                    containerType,
                    productName: bestProduct.name || bestProduct.product_name || bestProduct.producttype || 'Product',
                    quantityToAdd,
                    newTotal,
                    currentTotal,
                    savings,
                    changes: [{
                        productId: bestProduct.id || bestProduct.ID,
                        productName: bestProduct.name || bestProduct.product_name || bestProduct.producttype || 'Product',
                        currentQuantity: bestProduct.quantity,
                        newQuantity,
                        change: quantityToAdd
                    }]
                })
            }
        }
    }

    // Optimization 2: Reduce quantity to fit in smaller container
    const current20ftTotal = currentTotals[CONTAINER_TYPE_20FT].total
    const current40ftTotal = currentTotals[CONTAINER_TYPE_40FT_HQ].total

    if (current40ftTotal > 0 && current20ftTotal > 0) {
        // If 40ft is cheaper, try to reduce to fit in 20ft
        if (current40ftTotal < current20ftTotal) {
            const container20ft = SHIPMENT_CONTAINER_DETAILS.find(c => c.container_type === CONTAINER_TYPE_20FT)
            if (container20ft) {
                const maxSpace20ft = container20ft.container_size_in_cubic_meters
                const currentSpace40ft = currentTotals[CONTAINER_TYPE_40FT_HQ].space

                if (currentSpace40ft > maxSpace20ft) {
                    // Calculate how much space to reduce
                    const spaceToReduce = currentSpace40ft - maxSpace20ft

                    // Find product with highest cost per cubic meter to reduce
                    let bestProductToReduce = null
                    let maxCostPerCubicMeter = 0

                    validItems.forEach(item => {
                        const priceData = getProductPriceSummary(item, 1)
                        if (priceData[CONTAINER_TYPE_40FT_HQ] && Object.keys(priceData[CONTAINER_TYPE_40FT_HQ]).length > 0) {
                            const costPerCubicMeter = (priceData[CONTAINER_TYPE_40FT_HQ].product_price + priceData[CONTAINER_TYPE_40FT_HQ].tarrif + priceData[CONTAINER_TYPE_40FT_HQ].shipment_cost) / item.cubic_m_per_pc
                            if (costPerCubicMeter > maxCostPerCubicMeter) {
                                maxCostPerCubicMeter = costPerCubicMeter
                                bestProductToReduce = item
                            }
                        }
                    })

                    if (bestProductToReduce) {
                        const quantityToRemove = Math.floor(spaceToReduce / bestProductToReduce.cubic_m_per_pc)
                        if (quantityToRemove > 0 && quantityToRemove < bestProductToReduce.quantity) {
                            const newQuantity = bestProductToReduce.quantity - quantityToRemove

                            // Calculate new total for 20ft container
                            const bestProductToReduceId = bestProductToReduce.id || bestProductToReduce.ID
                            const newItems = validItems.map(item => ({
                                item,
                                quantity: (item.id || item.ID) === bestProductToReduceId ? newQuantity : item.quantity
                            }))

                            const newTotal = calculateTotalForQuantities(newItems, CONTAINER_TYPE_20FT)
                            const savings = current40ftTotal - newTotal

                            if (savings > 0) {
                                suggestions.push({
                                    type: 'reduce-quantity',
                                    containerType: CONTAINER_TYPE_20FT,
                                    productName: bestProductToReduce.name || bestProductToReduce.product_name || bestProductToReduce.producttype || 'Product',
                                    quantityToRemove,
                                    newTotal,
                                    currentTotal: current40ftTotal,
                                    savings,
                                    changes: [{
                                        productId: bestProductToReduce.id || bestProductToReduce.ID,
                                        productName: bestProductToReduce.name || bestProductToReduce.product_name || bestProductToReduce.producttype || 'Product',
                                        currentQuantity: bestProductToReduce.quantity,
                                        newQuantity,
                                        change: -quantityToRemove
                                    }]
                                })
                            }
                        }
                    }
                }
            }
        }
    }

    // Sort by savings (highest first)
    suggestions.sort((a, b) => b.savings - a.savings)

    return suggestions
}
