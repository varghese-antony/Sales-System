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
      .select('sensors_and_controls,occupancy,bi_level, pir, microwave, remote_control_bluetooth, emergency_backup_battery, plugin_sensor')
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
      const has_sensors_and_controls = row.sensors_and_controls;
      let controlType = '';



      if (has_sensors_and_controls) {
        if (row.occupancy) {
          controlType = 'Occupancy'
        } else if (row.bi_level) {
          controlType = 'Bi-Level'
        } else {
          controlType = 'Occupancy' // Fallback when sensors true but occupancy/bi_level not set
        }
      } else {
        controlType = 'None'
      }

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
      // Check pir and microwave separately
      if (row.pir === true) {
        sensorOptionsMap[controlType].sensorTypes.add("PIR")
      }
      if (row.microwave === true) {
        sensorOptionsMap[controlType].sensorTypes.add("Microwave")
      } 

      // Track if any variant has these features
      if (row.remote_control_bluetooth) sensorOptionsMap[controlType].hasRemoteControl = true
      if (row.emergency_backup_battery) sensorOptionsMap[controlType].hasEmergencyBackup = true
      if (row.plugin_sensor) sensorOptionsMap[controlType].hasPluginSensor = true
    })

    // Convert to array format, filter out any empty controlType
    const sensorOptions = Object.values(sensorOptionsMap)
      .filter(opt => opt.controlType && opt.controlType.trim() !== '')
      .map(option => ({
      controlType: option.controlType,
      sensorTypes: Array.from(option.sensorTypes),
      hasRemoteControl: option.hasRemoteControl,
      hasEmergencyBackup: option.hasEmergencyBackup,
      hasPluginSensor: option.hasPluginSensor
    }))

    console.log("################# sensorOptions ", sensorOptions)

    return NextResponse.json({ sensorOptions })

  } catch (error) {
    console.error('Error in sensor-options API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
