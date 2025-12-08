import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('productName')
    const type = searchParams.get('type') // 'indoor' or 'outdoor'

    if (!productName || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: productName and type' },
        { status: 400 }
      )
    }

    const table = type === 'indoor' ? 'indoor_products_v3' : 'outdoor_products_v3'

    // Get all unique sensor configurations for this product
    // Include products with NULL sensors (means "None" - no sensors)
    const { data, error } = await supabase
      .from(table)
      .select('sensors_and_controls, pir_microwave, remote_control_bluetooth, emergency_backup_battery, plugin_sensor')
      .eq('product_name', productName)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sensor options' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No products found with this name' },
        { status: 404 }
      )
    }

    // Group by sensors_and_controls and collect available sensor types
    // NULL sensors_and_controls means "None" (no sensors)
    const sensorOptionsMap = {}

    data.forEach(row => {
      const controlType = row.sensors_and_controls || 'None'
      
      if (!sensorOptionsMap[controlType]) {
        sensorOptionsMap[controlType] = {
          controlType,
          sensorTypes: new Set(),
          hasRemoteControl: false,
          hasEmergencyBackup: false,
          hasPluginSensor: false
        }
      }

      // Only add sensor type if it exists (NULL means no sensor)
      if (row.pir_microwave) {
        sensorOptionsMap[controlType].sensorTypes.add(row.pir_microwave)
      } else if (controlType === 'None') {
        // For "None" control type, add "None" as the sensor type
        sensorOptionsMap[controlType].sensorTypes.add('None')
      }

      // Track if any variant has these features
      if (row.remote_control_bluetooth) sensorOptionsMap[controlType].hasRemoteControl = true
      if (row.emergency_backup_battery) sensorOptionsMap[controlType].hasEmergencyBackup = true
      if (row.plugin_sensor) sensorOptionsMap[controlType].hasPluginSensor = true
    })

    // Convert to array format
    const sensorOptions = Object.values(sensorOptionsMap).map(option => ({
      controlType: option.controlType,
      sensorTypes: Array.from(option.sensorTypes),
      hasRemoteControl: option.hasRemoteControl,
      hasEmergencyBackup: option.hasEmergencyBackup,
      hasPluginSensor: option.hasPluginSensor
    }))

    return NextResponse.json({ sensorOptions })

  } catch (error) {
    console.error('Error in sensor-options API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
