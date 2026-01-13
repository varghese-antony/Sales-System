"use client"
import React, { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { DynamicSensorSelector } from "@/components/DynamicSensorSelector"
import { OptionSelector } from "@/components/OptionSelector"
import { ProductDetails } from "@/components/ProductDetails"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Home, ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"
import { getAllProductsV2 } from '@/lib/database/products-v2'
import { slugToProductName } from '@/lib/utils/slug'

export default function IndoorProductPage({ params }) {
  const [slug, setSlug] = useState(null)
  const [products, setProducts] = useState([])
  const [sensorSelection, setSensorSelection] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState({})
  const [currentStep, setCurrentStep] = useState(0)
  const [finalProduct, setFinalProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const productName = slugToProductName(slug)

  const desiredKeys = [
    'size', 'power_w', 'voltage', 'cct', 'cri_ra', 'lumen', 'efficacy_lumen_per_w',
    'dimming_type', 'material_finish', 'mounting', 'installation_kits', 
    'adjustment_dial', 'certifications'
  ]

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setSlug(resolvedParams.slug)
    }
    resolveParams()
  }, [params])

  const handleSensorSelection = async (selection) => {
    setSensorSelection(selection)
    setIsLoading(true)
    setError(null)

    console.log("S#############ensor Selection inside handleSensorSelection",selection)

    try {
      const filters = {
        productName: productName
      }

      // Map control type to boolean columns based on SQL schema
      // sensors_and_controls, occupancy, bi_level are all boolean fields
      // Use frontend field names that will be mapped via fieldMappingV2
      if (selection.sensorsAndControls === 'Occupancy') {
        filters.occupancy = true // Maps to 'occupancy' column
        filters.sensorsAndControls = true // Maps to 'sensors_and_controls' column
      } else if (selection.sensorsAndControls === 'Bi-Level') {
        filters.biLevel = true // Maps to 'bi_level' column
        filters.sensorsAndControls = true // Maps to 'sensors_and_controls' column
      } else if (selection.sensorsAndControls === 'None') {
        filters.sensorsAndControls = false // Maps to 'sensors_and_controls' column
      }

      // Map sensor type to separate pir and microwave boolean columns
      // pir and microwave are boolean/nullable in the database
      if (selection.sensorType && selection.sensorType !== 'None') {
        // Set pir and microwave separately based on sensorType
        if (selection.sensorType === 'PIR') {
          filters.pir = true // Maps to 'pir' column via fieldMappingV2
        } else if (selection.sensorType === 'Microwave') {
          filters.microwave = true // Maps to 'microwave' column via fieldMappingV2
        } else {
          // For other sensor types (Bluetooth, Photo cell, etc.), set both to false
          filters.pir = false
          filters.microwave = false
        }
      } else {
        filters.pir = false
        filters.microwave = false
      }

      // Map boolean features to their database column names using fieldMappingV2
      // These are already booleans, so pass them as true/false
      if (selection.remoteControl === true) {
        filters.remoteControl = true // Maps to 'remote_control_bluetooth' column
      }else{
        filters.remoteControl = false
      }
      if (selection.emergencyBackupBattery === true) {
        filters.emergencyBackupBattery = true // Maps to 'emergency_backup_battery' column
      }else{
        filters.emergencyBackupBattery = false
      }
      if (selection.pluginSensor === true) {
        filters.pluginSensor = true // Maps to 'plugin_sensor' column
      }else{
        filters.pluginSensor = false
      }

      console.log('handleSensorSelection filters:', filters)
      const { data, error: fetchError } = await getAllProductsV2('indoor', filters)
      
      if (fetchError) throw new Error(fetchError)
      
      if (data && data.length > 0) {
        setProducts(data)
      } else {
        setError('No products found matching your sensor configuration.')
      }
    } catch (err) {
      setError('Failed to load products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const filterProducts = async (key, value) => {
    setIsLoading(true)
    setError(null)

    const newFilters = { ...selectedFilters, [key]: value }
    setSelectedFilters(newFilters)

    try {
      const allFilters = {
        productName: productName,
        ...newFilters
      }

      // Map control type to boolean columns based on SQL schema
      // Use frontend field names that will be mapped via fieldMappingV2
      if (sensorSelection.sensorsAndControls === 'Occupancy') {
        allFilters.occupancy = true // Maps to 'occupancy' column
        allFilters.sensorsAndControls = true // Maps to 'sensors_and_controls' column
      } else if (sensorSelection.sensorsAndControls === 'Bi-Level') {
        allFilters.biLevel = true // Maps to 'bi_level' column
        allFilters.sensorsAndControls = true // Maps to 'sensors_and_controls' column
      } else if (sensorSelection.sensorsAndControls === 'None') {
        allFilters.sensorsAndControls = false // Maps to 'sensors_and_controls' column
      }

      // Map sensor type to separate pir and microwave boolean columns
      if (sensorSelection.sensorType && sensorSelection.sensorType !== 'None') {
        // Set pir and microwave separately based on sensorType
        if (sensorSelection.sensorType === 'PIR') {
          allFilters.pir = true // Maps to 'pir' column via fieldMappingV2
        } else if (sensorSelection.sensorType === 'Microwave') {
          allFilters.microwave = true // Maps to 'microwave' column via fieldMappingV2
        } else {
          // For other sensor types (Bluetooth, Photo cell, etc.), set both to false
          allFilters.pir = false
          allFilters.microwave = false
        }
      } else {
        allFilters.pir = false
        allFilters.microwave = false
      }

      // Map boolean features to their database column names using fieldMappingV2
      if (sensorSelection.remoteControl === true) {
        allFilters.remoteControl = true // Maps to 'remote_control_bluetooth' column
      }
      if (sensorSelection.emergencyBackupBattery === true) {
        allFilters.emergencyBackupBattery = true // Maps to 'emergency_backup_battery' column
      }
      if (sensorSelection.pluginSensor === true) {
        allFilters.pluginSensor = true // Maps to 'plugin_sensor' column
      }

      const { data, error: fetchError } = await getAllProductsV2('indoor', allFilters)
      
      if (fetchError) throw new Error(fetchError)

      if (data && data.length === 1) {
        // If only one product matches all filters, show it
        setFinalProduct(data[0])
      } else if (data && data.length > 0) {
        // Check if we have more filters to apply
        const nextStep = currentStep + 1
        if (nextStep < desiredKeys.length) {
          // If we have more filters, move to the next step
          setProducts(data)
          setCurrentStep(nextStep)
        } else {
          // If no more filters, show the first product
          setFinalProduct(data[0])
        }
      } else {
        setError('No products match your selection. Please try different options.')
        setProducts([])
      }
    } catch (err) {
      console.error('Error filtering products:', err)
      setError('Failed to filter products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetSelection = () => {
    setSensorSelection(null)
    setSelectedFilters({})
    setCurrentStep(0)
    setFinalProduct(null)
    setProducts([])
    setError(null)
  }

  const goBack = () => {
    if (finalProduct) {
      setFinalProduct(null)
      return
    }

    if (currentStep > 0) {
      const newStep = currentStep - 1
      const newFilters = { ...selectedFilters }
      const currentKey = desiredKeys[currentStep]
      delete newFilters[currentKey]
      
      setSelectedFilters(newFilters)
      setCurrentStep(newStep)
      setError(null)
      
      handleSensorSelection(sensorSelection)
    } else {
      setSensorSelection(null)
      setProducts([])
    }
  }

  console.log("*********** finalProduct", JSON.stringify(finalProduct))

  if (finalProduct) {
    return <ProductDetails product={finalProduct} onBack={goBack} sensorSelection={sensorSelection} />
  }

  if (isLoading && !sensorSelection) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20'>
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading {productName} options...</p>
        </div>
      </div>
    )
  }

  const currentKey = desiredKeys[currentStep]
  const currentValues = products.length > 0 
    ? [...new Set(products.map(p => {
        const value = p[currentKey]
        return value === null || value === undefined ? 'N/A' : value
      }))].filter(v => v?.toString().trim())
    : []

    console.log("################## cureent key", currentKey)
    console.log("###################current value", currentValues)

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20'>
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="indoor-product-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#indoor-product-grid)" />
        </svg>
      </div>

      <div className='container mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/indoor" className="text-muted-foreground hover:text-primary transition-colors">
              Indoor Lighting
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-primary font-medium">{productName}</span>
          </div>

          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-6">
              <Lightbulb className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {productName}
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Configure your perfect indoor lighting solution by selecting from the options below.
            </p>

            {sensorSelection && Object.keys(selectedFilters).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {Object.entries(selectedFilters).map(([key, value]) => (
                  <Badge key={key} variant="secondary">
                    {key}: {value || 'Not Specified'}
                  </Badge>
                ))}
              </div>
            )}

            {sensorSelection && (
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={goBack} className="group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Go Back
                </Button>
                <Button variant="ghost" onClick={resetSelection} className="group">
                  <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />
                  Reset Selection
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {!sensorSelection && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Configure Sensors & Controls</h2>
              <p className="text-muted-foreground">
                Choose your preferred sensor and control options for this lighting product
              </p>
            </div>
            <DynamicSensorSelector 
              productName={productName}
              type="indoor"
              onSelectionChange={handleSensorSelection} 
            />
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {sensorSelection && !error && currentValues.length > 0 && currentKey && (
          <OptionSelector
            title={currentKey === 'power_w' ? 'Wattage' : currentKey.replace(/_/g, ' ')}
            description={`Select your preferred ${currentKey === 'power_w' ? 'wattage' : currentKey.replace(/_/g, ' ')}`}
            options={currentValues}
            onSelect={(value) => filterProducts(currentKey, value)}
            isLoading={isLoading}
            step={currentStep + 1}
            totalSteps={desiredKeys.length}
            products={products}
          />
        )}
      </div>
    </div>
  )
}