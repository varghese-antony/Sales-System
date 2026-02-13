const MAXIMUM_CONTAINER_UTILIZATION_PERCENTAGE = 0.97; // 97%
const TARRIF_PERCENTAGE = 0.35; // 35%
const DEFAULT_MARKUP_PERCENTAGE = 0.30; // 30%
const ADMIN_CONSOLIDATION_FEE = 650; // $650

const SHIPMENT_CONTAINER_DETAILS = [
    {
        "container_type": "20ft",
        "container_price": 2000,
        "container_size_in_cubic_meters": 33,
    },
    {
        "container_type": "40ft",
        "container_price": 4000,
        "container_size_in_cubic_meters": 67,
    }
]

const getProductPriceSummaryPerUnit = (product:any, quantity:number) => {
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

        product_price_per_unit[container.container_type] = {
            "product_price": price_per_unit,
            "admin_consolidation_fee": admin_consolidation_fee / quantity,
            "tarrif": price_per_unit * TARRIF_PERCENTAGE,
            "shipment_cost": (total_cubic_meters_needed * container.container_price) / container.container_size_in_cubic_meters,
        }
    }
}

const getProductPriceSummary = (product: any, quantity: number) => {
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

        const total_shipment_cost = (total_cubic_meters_needed * container.container_price) / container.container_size_in_cubic_meters;

        product_price_summary[container.container_type] = {
            "product_price": total_product_price,
            "admin_consolidation_fee": admin_consolidation_fee,
            "tarrif": price_per_unit * TARRIF_PERCENTAGE * quantity,
            "shipment_cost": total_shipment_cost,
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

const getTotalSensorCost = (product: any) => {
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