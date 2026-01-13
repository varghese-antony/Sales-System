"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from "framer-motion"
import { ArrowLeft, Download, FileText, Award, ExternalLink, Zap, Shield, Settings, Info, ShoppingCart, Check, Image as ImageIcon, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { useCart } from "@/contexts/CartContext"
import { ImageModal } from "@/components/ui/image-modal"
import { getOptimizedImageUrl } from "@/lib/image-utils"
import { ImageWithLoading } from "@/components/ui/image-with-loading"
import { fieldMapping } from '@/lib/database/products'

const MARKUP_PERCENTAGE_DEFAULT = 30 // 30% default markup
const TARIFF_PERCENTAGE = 35 // 35% global tariff

// Container constants
const CONTAINER_20FT = {
  totalCubicM: 33,
  price: 2000,
  maxCapacity: 33 * 0.97 // 97% utilization = 32.01 cubic meters
}

const CONTAINER_40FT = {
  totalCubicM: 67,
  price: 4000,
  maxCapacity: 67 * 0.97 // 97% utilization = 64.99 cubic meters
}

const addonCostFields = [
  { key: 'sensor_cost', label: 'Sensor' },
  { key: 'remote_control_bluetooth_cost', label: 'Remote Control / Bluetooth' },
  { key: 'plugin_sensor_cost', label: 'Plugin Sensor' },
  { key: 'emergency_backup_battery_cost', label: 'Emergency Backup Battery' },
  { key: 'installation_kits_cost', label: 'Installation Kits' }
]

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

const formatCurrency = (value) => {
  const numeric = Number.isFinite(value) ? value : 0
  return `$${numeric.toFixed(2)}`
}

export function ProductDetails({ product, onBack, sensorSelection = null }) {
  const { addToCart, items } = useCart()
  const [isAdded, setIsAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  
  // Convert database field names to frontend field names for display
  const reverseFieldMapping = useMemo(() => {
    const mapping = {};
    Object.entries(fieldMapping).forEach(([frontend, db]) => {
      mapping[db] = frontend;
    });
    return mapping;
  }, []);

  const mappedProduct = useMemo(() => {
    const mapped = {}
    Object.entries(product).forEach(([key, value]) => {
      const frontendKey = reverseFieldMapping[key] || key
      mapped[frontendKey] = value
    })
    return mapped
  }, [product, reverseFieldMapping])

  const baseCost = useMemo(() => {
    const rawBase = product.cost_china_ddp_usa ?? product.cost_thailand_vietnam ?? 0
    return parseCostValue(rawBase)
  }, [product.cost_china_ddp_usa, product.cost_thailand_vietnam])

  const addonCostData = useMemo(() => {
    const entries = addonCostFields.map(({ key, label }) => {
      const value = parseCostValue(product[key])
      return { key, label, value }
    })
    const totalAddons = entries.reduce((sum, entry) => sum + entry.value, 0)
    return { entries, totalAddons }
  }, [product])

  // Get markup percentage: use product.markup_percentage if it exists and is > 0, otherwise use default 30%
  const markupPercentage = useMemo(() => {
    const productMarkup = product.markup_percentage
    if (productMarkup !== null && productMarkup !== undefined) {
      const parsed = typeof productMarkup === 'number' 
        ? productMarkup 
        : parseFloat(productMarkup)
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed
      }
    }
    return MARKUP_PERCENTAGE_DEFAULT
  }, [product.markup_percentage])

  // Calculate markup breakdown for base cost
  const baseCostBreakdown = useMemo(() => {
    const markupAmount = baseCost * (markupPercentage / 100)
    const finalPrice = baseCost + markupAmount
    return {
      original: baseCost,
      markup: markupAmount,
      final: finalPrice
    }
  }, [baseCost, markupPercentage])

  // Calculate markup breakdown for each addon
  const addonBreakdowns = useMemo(() => {
    return addonCostData.entries.map(({ key, label, value }) => {
      const markupAmount = value * (markupPercentage / 100)
      const finalPrice = value + markupAmount
      return {
        key,
        label,
        original: value,
        markup: markupAmount,
        final: finalPrice
      }
    })
  }, [addonCostData.entries, markupPercentage])

  // Calculate total cost: apply markup percentage to each item separately (base price and each addon), then sum
  const totalCostWithAddons = useMemo(() => {
    // Sum all marked-up items
    return baseCostBreakdown.final + addonBreakdowns.reduce((sum, addon) => sum + addon.final, 0)
  }, [baseCostBreakdown.final, addonBreakdowns])

  // Parse cubic meters per piece value
  const parseCubicMValue = (value) => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0 ? value : 0
    }
    if (typeof value !== 'string') return 0
    const cleaned = value.toString().trim()
    if (cleaned === '') return 0
    const parsed = parseFloat(cleaned)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }

  // Calculate shipping cost based on quantity
  const shippingCost = useMemo(() => {
    const cubicMPerPc = parseCubicMValue(product.cubic_m_per_pc)
    if (cubicMPerPc === 0) return 0

    const totalCubicMeters = cubicMPerPc * quantity

    if (totalCubicMeters <= CONTAINER_20FT.maxCapacity) {
      const smallestCubicMPerPc = cubicMPerPc
      const wouldOverflow = (totalCubicMeters + smallestCubicMPerPc) > CONTAINER_20FT.maxCapacity
      const isOverflowing = totalCubicMeters > CONTAINER_20FT.maxCapacity
      
      return (isOverflowing || wouldOverflow) 
        ? CONTAINER_20FT.price 
        : (totalCubicMeters / CONTAINER_20FT.totalCubicM) * CONTAINER_20FT.price
    } else {
      // Need 40ft container
      const smallestCubicMPerPc = cubicMPerPc
      const isOverflowing = totalCubicMeters > CONTAINER_40FT.maxCapacity
      const wouldOverflow = (totalCubicMeters + smallestCubicMPerPc) > CONTAINER_40FT.maxCapacity
      
      return (isOverflowing || wouldOverflow)
        ? CONTAINER_40FT.price
        : (totalCubicMeters / CONTAINER_40FT.totalCubicM) * CONTAINER_40FT.price
    }
  }, [product.cubic_m_per_pc, quantity])

  // Calculate tariff amount (35% of product total)
  const tariffAmount = useMemo(() => {
    return totalCostWithAddons * quantity * (TARIFF_PERCENTAGE / 100)
  }, [totalCostWithAddons, quantity])

  // Calculate final total (product total + tariff + shipping)
  const finalTotal = useMemo(() => {
    const productTotal = totalCostWithAddons * quantity
    return productTotal + tariffAmount + shippingCost
  }, [totalCostWithAddons, quantity, tariffAmount, shippingCost])

  const hasAddonData = useMemo(
    () => baseCost > 0 || addonCostData.entries.some((entry) => entry.value > 0),
    [baseCost, addonCostData.entries]
  )

  const optimizedImageUrl = useMemo(() => {
    // Check for image fields in order of priority (v2 tables use 'photo')
    const imageFields = ['photo', 'Photo', 'image', 'image_url', 'thumbnail'];
    for (const field of imageFields) {
      if (product[field]) {
        return getOptimizedImageUrl(product[field]);
      }
    }
    // Return placeholder if no image found
    return '/placeholder-product.svg';
  }, [product]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setIsImageModalOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])
  
  const isInCart = items.some(item => (item.id || item.ID) === (product.id || product.ID))
  
  // Transform product for cart: set pir/microwave based on user's selection and remove pir_microwave
  const transformProductForCart = (productData) => {
    const transformed = { ...productData }
    
    // Remove pir_microwave field (both snake_case and camelCase variants)
    if ('pir_microwave' in transformed) {
      delete transformed.pir_microwave
    }
    if ('pirMicrowave' in transformed) {
      delete transformed.pirMicrowave
    }
    
    // Use the sensorSelection prop to determine which sensor was selected
    // This ensures we save what the user actually selected, not what's in the database
    if (sensorSelection && sensorSelection.sensorType) {
      if (sensorSelection.sensorType === 'PIR') {
        transformed.pir = true
        transformed.microwave = false
      } else if (sensorSelection.sensorType === 'Microwave') {
        transformed.pir = false
        transformed.microwave = true
      } else {
        // For other sensor types (Bluetooth, Photo cell, None, etc.), set both to false
        transformed.pir = false
        transformed.microwave = false
      }
    } else {
      // Fallback: if no sensorSelection provided, use product data
      const pirValue = transformed.pir === true || transformed.pir === 'true' || transformed.pir === 1
      const microwaveValue = transformed.microwave === true || transformed.microwave === 'true' || transformed.microwave === 1
      
      if (pirValue) {
        transformed.pir = true
        transformed.microwave = false
      } else if (microwaveValue) {
        transformed.pir = false
        transformed.microwave = true
      } else {
        // If neither is explicitly true, ensure both are false
        transformed.pir = false
        transformed.microwave = false
      }
    }
    
    return transformed
  }
  
  const handleAddToCart = (selectedQuantity = quantity) => {
    const transformedProduct = transformProductForCart(product)
    for (let i = 0; i < selectedQuantity; i++) {
      addToCart(transformedProduct)
    }
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity)
  }
  
  // Excluded keys - hide costs, logistics, and internal fields from users
  const excludedKeys = [
    'moq', 
    'cost_china_ddp_usa', 
    'cost_thailand_vietnam', 
    'cut_sheet', 
    'photo', 
    'lead_time', 
    'warranty', 
    'id', 
    'created_at', 
    'updated_at', 
    'price_per_piece',
    'markup_percentage', // Hide markup percentage from UI
    // Hide all addon costs (only show prices)
    'sensor_cost',
    'remote_control_bluetooth_cost',
    'plugin_sensor_cost',
    'emergency_backup_battery_cost',
    'installation_kits_cost'
  ]
  // Create a display product with corrected pir/microwave values based on selection
  const displayProduct = useMemo(() => {
    const display = { ...product }
    
    // Ensure pir and microwave fields always exist in display
    // If sensorSelection is provided, set pir and microwave based on selection
    if (sensorSelection && sensorSelection.sensorType) {
      if (sensorSelection.sensorType === 'PIR') {
        display.pir = true
        display.microwave = false
      } else if (sensorSelection.sensorType === 'Microwave') {
        display.pir = false
        display.microwave = true
      } else {
        // For other sensor types, set both to false
        display.pir = false
        display.microwave = false
      }
    } else {
      // If no sensorSelection, ensure both fields exist (use product values or default to false)
      if (!('pir' in display)) display.pir = false
      if (!('microwave' in display)) display.microwave = false
    }
    
    return display
  }, [product, sensorSelection])
  
  // Filter product keys (no longer need to filter out sensors)
  const productKeys = Object.keys(displayProduct).filter(key => !excludedKeys.includes(key))
  
  // Key specifications to highlight
  const keySpecs = ['model_number', 'size', 'power_w', 'voltage', 'cct', 'lumen', 'material_finish']
  const highlightedSpecs = keySpecs.filter(key => product[key]).slice(0, 6)
  
  const getKeyIcon = (key) => {
    if (!key) return <Info className="w-4 h-4" />
    const lowerKey = key.toLowerCase()
    if (lowerKey.includes('power') || lowerKey.includes('watt') || lowerKey.includes('voltage')) return <Zap className="w-4 h-4" />
    if (lowerKey.includes('certification')) return <Award className="w-4 h-4" />
    if (lowerKey.includes('warranty') || lowerKey.includes('backup')) return <Shield className="w-4 h-4" />
    if (lowerKey.includes('dimming') || lowerKey.includes('sensor') || lowerKey.includes('remote') || lowerKey.includes('control')) return <Settings className="w-4 h-4" />
    return <Info className="w-4 h-4" />
  }

  const getKeyCategory = (key) => {
    const powerKeys = ['power_w', 'voltage', 'efficacy_lumen_per_w', 'lumen']
    const designKeys = ['model_number', 'size', 'material_finish', 'mounting', 'cct', 'cri_ra', 'sub_category', 'product_name', 'ip_rating']
    const sensorKeys = ['sensors_and_controls', 'pir', 'microwave', 'remote_control_bluetooth', 'emergency_backup_battery', 'plugin_sensor']
    const featureKeys = ['dimming_type', 'junction_cover', 'adjustment_dial', 'installation_kits']
    const certKeys = ['certifications']
    // Only show prices to users, not costs (costs are in excludedKeys)
    const addonKeys = ['sensor_price', 'remote_control_bluetooth_price', 'plugin_sensor_price', 'emergency_backup_battery_price', 'installation_kits_price']

    if (powerKeys.includes(key)) return 'power'
    if (designKeys.includes(key)) return 'design'
    if (sensorKeys.includes(key)) return 'sensors'
    if (featureKeys.includes(key)) return 'features'
    if (certKeys.includes(key)) return 'certification'
    if (addonKeys.includes(key)) return 'addons'
    return 'general'
  }

  // Group keys by category
  const groupedKeys = productKeys.reduce((acc, key) => {
    const category = getKeyCategory(key)
    if (!acc[category]) acc[category] = []
    acc[category].push(key)
    return acc
  }, {})

  if (hasAddonData && !groupedKeys.addons) {
    groupedKeys.addons = []
  }

  const categoryTitles = {
    power: 'Power & Performance',
    design: 'Design & Specifications',
    sensors: 'Sensors & Controls',
    features: 'Smart Features',
    certification: 'Certifications & Installation',
    addons: 'Build cost summary',
    general: 'Additional Information'
  }

  const formatFieldName = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="min-h-screen bg-background">
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack} className="group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Selection
          </Button>
          
          <div className="flex gap-2">
            {product['cut_sheet'] && (
              <Button variant="outline" asChild>
                <a href={product['cut_sheet']} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" />
                  View Cut Sheet
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
            
            {/* Quantity Selector */}
            <QuantitySelector
              value={quantity}
              onChange={handleQuantityChange}
              size="sm"
            />

            <Button 
              variant="default"
              onClick={() => handleAddToCart(quantity)}
              disabled={isAdded}
              className="min-w-[120px]"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add {quantity > 1 ? `${quantity} ` : ''}to Cart
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image & Key Specs */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            {/* Product Image - Always show */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="relative aspect-square group cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  <ImageWithLoading
                    src={optimizedImageUrl}
                    alt={product['product_name'] || product['producttype'] || 'Product Image'}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 p-4"
                    containerClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
                      <ZoomIn className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="p-2 rounded-lg bg-black/50 backdrop-blur-sm">
                      <p className="text-white text-xs text-center">Click to view full size</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Title */}
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {product['product_name'] || product['producttype'] || 'Lighting Product'}
              </h1>
              {product['model_number'] && (
                <p className="text-sm text-muted-foreground mb-2">
                  Model: {product['model_number']}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {product['sub_category'] && (
                  <Badge variant="secondary">{product['sub_category']}</Badge>
                )}
                {product['sensors_and_controls'] && (
                  <Badge variant="outline">{product['sensors_and_controls']}</Badge>
                )}
                {optimizedImageUrl && optimizedImageUrl !== '/placeholder-product.svg' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Image Available
                  </Badge>
                )}
              </div>
            </div>

            {/* Key Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {highlightedSpecs.map((key) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
                    <span className="text-sm font-medium text-muted-foreground">{formatFieldName(key)}</span>
                    <span className="text-sm font-semibold">{displayProduct[key]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Downloads Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product['cut_sheet'] && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={product['cut_sheet']} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Product Cut Sheet</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  IES File (Coming Soon)
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Award className="w-4 h-4 mr-2" />
                  Certifications (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Specs */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            {/* Add-on Pricing Section - Top */}
            {hasAddonData && groupedKeys.addons !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getKeyIcon('addons')} 
                      {categoryTitles.addons}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">Unit Price: {formatCurrency(totalCostWithAddons)}</Badge>
                        {quantity > 1 && (
                          <Badge variant="secondary">Total ({quantity} units): {formatCurrency(totalCostWithAddons * quantity)}</Badge>
                        )}
                      </div>
                      
                      {/* Base Price */}
                      {baseCostBreakdown.original > 0 && (
                        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                          <span className="text-sm font-medium text-muted-foreground">Base Price</span>
                          <span className="text-sm font-semibold">{formatCurrency(baseCostBreakdown.final)}</span>
                        </div>
                      )}
                      
                      {/* Addon Breakdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {addonBreakdowns.map(({ key, label, original, final }) => {
                          if (original === 0) return null
                          return (
                            <div key={key} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                              <span className="text-sm font-medium text-muted-foreground">{label}</span>
                              <span className="text-sm font-semibold">{formatCurrency(final)}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Shipping Cost */}
                      {shippingCost > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Shipping Cost</span>
                            <span className="text-sm font-semibold">{formatCurrency(shippingCost)}</span>
                          </div>
                          {tariffAmount > 0 && (
                            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 mb-2">
                              <span className="text-sm font-medium text-muted-foreground">Tariff ({TARIFF_PERCENTAGE}%)</span>
                              <span className="text-sm font-semibold">{formatCurrency(tariffAmount)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between rounded-lg border-2 border-primary/30 bg-primary/5 px-3 py-2">
                            <span className="text-sm font-semibold">Final Total</span>
                            <span className="text-base font-bold text-primary">{formatCurrency(finalTotal)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <h2 className="text-xl font-semibold">Complete Specifications</h2>
            
            {Object.entries(groupedKeys)
              .filter(([category]) => category !== 'addons') // Exclude addons from here since it's shown at top
              .map(([category, keys]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getKeyIcon(keys[0] || '')}
                    {categoryTitles[category]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {keys.map((key) => (
                      <div key={key} className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">{formatFieldName(key)}</span>
                        <span className="text-sm font-semibold">
                          {displayProduct[key] !== null && displayProduct[key] !== undefined && displayProduct[key] !== '' ? (
                            typeof displayProduct[key] === 'boolean' ? (
                              displayProduct[key] ? 'Yes' : 'No'
                            ) : (
                              displayProduct[key].toString()
                            )
                          ) : (
                            <span className="text-muted-foreground italic">Not specified</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Add to Cart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 border-t pt-8"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold mb-1">
                    Ready to add this product to your cart?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select quantity and add to your enquiry list for pricing and availability.
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Qty:</span>
                    <QuantitySelector
                      value={quantity}
                      onChange={handleQuantityChange}
                      size="default"
                    />
                  </div>

                  {/* Add to Cart Button */}
                  <Button 
                    size="lg"
                    onClick={() => handleAddToCart(quantity)}
                    disabled={isAdded}
                    className="min-w-[140px]"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add {quantity > 1 ? `${quantity} ` : ''}to Cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Image Modal */}
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          src={optimizedImageUrl}
          alt={product['producttype'] || 'Product Image'}
          title={product['producttype']}
        />
      </div>
    </div>
  )
}