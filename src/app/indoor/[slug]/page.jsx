"use client"
import React, {useState, useEffect} from 'react'
import { getProductsByType } from '@/lib/database/products'
import { motion } from "framer-motion"
import { OptionSelector } from "@/components/OptionSelector"
import { ProductDetails } from "@/components/ProductDetails"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Lightbulb, Home, ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"


export default function IndoorProductPage({ params }) {
  const {slug} = React.use(params)
  
  const [products, setProducts] = useState([])
  const [selectedFilters, setSelectedFilters] = useState({})
  const [currentStep, setCurrentStep] = useState(0)
  const [finalProduct, setFinalProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)


  const productType = decodeURIComponent(slug).replace(/%20/g, ' ')

  const addIndoorTableField = (items) =>
    Array.isArray(items) ? items.map((item) => ({ ...item, table: 'indoor' })) : []

  const desiredKeys = [
    'Size', 'power_w', 'Voltage', 'CCT', 'cri_ra', 'Lumen','efficacy_lmw',
    'Dimming Type', 'Material Finish', 'sensor_microwave_bluetooth', 'plugin_sensor',
    'emergency_backup_battery', 'junction_cover', 'remote_control', 'Mounting',
    'installation_kits', 'adjustment_dial', 'Certifications'
  ]

  const keyDescriptions = {
    'Size': 'Choose the dimensions that fit your space perfectly',
    'power_w': 'Select the power consumption that meets your efficiency needs',
    'Voltage': 'Pick the voltage compatible with your electrical system',
    'CCT': 'Choose the color temperature for the desired ambiance',
    'cri_ra': 'Select the color rendering index for accurate color representation',
    'Lumen': 'Pick the brightness level suitable for your application',
    'efficacy_lmw': 'Choose the energy efficiency rating',
    'Dimming Type': 'Select your preferred dimming control method',
    'Material Finish': 'Choose the finish that matches your design aesthetic',
    'Mounting': 'Select the installation method that works for your space'
  }

  useEffect(() => {
    fetchInitialProducts()
  }, [])

  const fetchData = async (type, productType, filters = {}) => {
    try {
      const { data, error } = await getProductsByType(type, productType, { filters })
      if (error) throw error
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching data:', error)
      throw error
    }
  }

  const buildSupabaseFilters = (filters) => {
    // Convert frontend filter names to database column names
    const columnMapping = {
      'Size': 'Size',
      'Power (W)': 'power_w',
      'Voltage': 'Voltage',
      'CCT': 'CCT',
      'CRI/RA': 'cri_ra',
      'Lumen': 'Lumen',
      'Efficacy (lm/W)': 'efficacy_lmw',
      'Dimming Type': 'Dimming Type',
      'Material Finish': 'Material Finish',
      'Sensor(Microwave/Bluetooth)': 'sensor_microwave_bluetooth',
      'Plug-in Sensor': 'plugin_sensor',
      'Eme. Backup-Battery': 'emergency_backup_battery',
      'Junction Cover': 'junction_cover',
      'Remote Control': 'remote_control',
      'Mounting': 'Mounting',
      'Installation Kits': 'installation_kits',
      'Adjustment Dial': 'adjustment_dial',
      'Certifications': 'Certifications'
    }

    // Convert the filters object to use database column names
    const supabaseFilters = {}
    Object.entries(filters).forEach(([key, value]) => {
      const dbColumn = columnMapping[key] || key
      supabaseFilters[dbColumn] = value
    })

    return supabaseFilters
  }

  const fetchInitialProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchData('indoor', productType)
      const productsWithTable = addIndoorTableField(data)
      setProducts(productsWithTable)
      if (productsWithTable.length === 0) {
        setError('No products found for this category.')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to load products. Please try again.')
      setProducts([])
    }
    setIsLoading(false)
  }

  const filterProducts = async (key, value) => {
    setIsLoading(true)
    setError(null)
    
    // Convert database column name back to frontend name for filtering
    const reverseColumnMapping = {
      'Size': 'Size',
      'power_w': 'Power (W)',
      'Voltage': 'Voltage',
      'CCT': 'CCT',
      'cri_ra': 'CRI/RA',
      'Lumen': 'Lumen',
      'efficacy_lmw': 'Efficacy (lm/W)',
      'Dimming Type': 'Dimming Type',
      'Material Finish': 'Material Finish',
      'sensor_microwave_bluetooth': 'Sensor(Microwave/Bluetooth)',
      'plugin_sensor': 'Plug-in Sensor',
      'emergency_backup_battery': 'Eme. Backup-Battery',
      'junction_cover': 'Junction Cover',
      'remote_control': 'Remote Control',
      'Mounting': 'Mounting',
      'installation_kits': 'Installation Kits',
      'adjustment_dial': 'Adjustment Dial',
      'Certifications': 'Certifications'
    }
    
    const frontendKey = reverseColumnMapping[key] || key
    const newFilters = { ...selectedFilters, [frontendKey]: value }
    setSelectedFilters(newFilters)
    
    try {
      const filtered = await fetchData('indoor', productType, buildSupabaseFilters(newFilters))
      const filteredWithTable = addIndoorTableField(filtered)
      if (filteredWithTable.length === 1) {
        setFinalProduct(filteredWithTable[0])
      } else if (filteredWithTable.length === 0) {
        setError('No products match your current selection. Please try different options.')
        setProducts([])
      } else {
        setProducts(filteredWithTable)
        setCurrentStep(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to filter products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetSelection = () => {
    setSelectedFilters({})
    setCurrentStep(0)
    fetchInitialProducts()
  }

  const goBack = async () => {
    if (finalProduct) {
      setFinalProduct(null)
      return
    }

    if (currentStep > 0) {
      const newStep = currentStep - 1
      const newFilters = { ...selectedFilters }
      const currentKey = desiredKeys[currentStep]

      // Convert database column name back to frontend name for removal
      const reverseColumnMapping = {
        'Size': 'Size',
        'power_w': 'Power (W)',
        'Voltage': 'Voltage',
        'CCT': 'CCT',
        'cri_ra': 'CRI/RA',
        'Lumen': 'Lumen',
        'efficacy_lmw': 'Efficacy (lm/W)',
        'Dimming Type': 'Dimming Type',
        'Material Finish': 'Material Finish',
        'sensor_microwave_bluetooth': 'Sensor(Microwave/Bluetooth)',
        'plugin_sensor': 'Plug-in Sensor',
        'emergency_backup_battery': 'Eme. Backup-Battery',
        'junction_cover': 'Junction Cover',
        'remote_control': 'Remote Control',
        'Mounting': 'Mounting',
        'installation_kits': 'Installation Kits',
        'adjustment_dial': 'Adjustment Dial',
        'Certifications': 'Certifications'
      }

      const frontendKey = reverseColumnMapping[currentKey] || currentKey
      delete newFilters[frontendKey]

      setSelectedFilters(newFilters)
      setCurrentStep(newStep)
      setError(null)

      // Refetch with previous filters
      if (Object.keys(newFilters).length === 0) {
        fetchInitialProducts()
      } else {
        try {
          const filtered = await fetchData('indoor', productType, buildSupabaseFilters(newFilters))
          setProducts(addIndoorTableField(filtered))
        } catch (error) {
          console.error('Error:', error)
        }
      }
    }
  }

  // Show final product details
  if (finalProduct) {
    return <ProductDetails product={finalProduct} onBack={goBack} />
  }

  // Show loading state
  if (isLoading && products.length === 0 && currentStep === 0) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20'>
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading {productType} options...</p>
        </div>
      </div>
    )
  }

  const currentKey = desiredKeys[currentStep]
  const currentValues = [...new Set(products.map(p => { 
    const value = p[currentKey]; 
    return value === null || value === undefined ? 'N/A' : value; 
  }))].filter(v => v?.toString().trim())

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20'>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="product-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#product-grid)" />
        </svg>
      </div>

      <div className='container mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {/* Breadcrumb */}
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
            <span className="text-primary font-medium">{productType}</span>
          </div>

          {/* Title */}
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-6">
              <Lightbulb className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {productType}
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Configure your perfect lighting solution by selecting from the available options below.
            </p>

            {/* Selected Filters */}
            {Object.keys(selectedFilters).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {Object.entries(selectedFilters).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="flex items-center gap-2">
                    {key}: {value || 'Not Specified'}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {(currentStep > 0 || Object.keys(selectedFilters).length > 0) && (
                <Button variant="outline" onClick={goBack} className="group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Go Back
                </Button>
              )}
              {Object.keys(selectedFilters).length > 0 && (
                <Button variant="ghost" onClick={resetSelection} className="group">
                  <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />
                  Reset Selection
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Error State */}
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

        {/* Option Selection */}
        {!error && currentValues.length > 0 && (
          <OptionSelector
            title={currentKey}
            description={keyDescriptions[currentKey]}
            options={currentValues}
            onSelect={(value) => filterProducts(currentKey, value)}
            isLoading={isLoading}
            step={currentStep + 1}
            totalSteps={desiredKeys.length}
            products={products}
          />
        )}



        {/* Empty State */}
        {!isLoading && !error && currentValues.length === 0 && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Lightbulb className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">No Options Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any products matching your current selection. Try adjusting your filters or contact our support team.
            </p>
            <Button onClick={resetSelection} variant="outline">
              Start Over
            </Button>
          </motion.div>
        )}


      </div>
    </div>
  )
}
