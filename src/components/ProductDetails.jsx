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

const MARKUP_PERCENTAGE_DEFAULT = 10 // 10% default markup

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

export function ProductDetails({ product, onBack }) {
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

  // Get markup percentage: use product.markup_percentage if it exists and is > 0, otherwise use default 10%
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

  // Calculate total cost: baseCost + addons, then add markup as percentage of total cost
  const totalCostWithAddons = useMemo(() => {
    const totalCost = baseCost + addonCostData.totalAddons
    const markupAmount = totalCost * (markupPercentage / 100)
    return totalCost + markupAmount
  }, [baseCost, addonCostData.totalAddons, markupPercentage])

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
  
  const handleAddToCart = (selectedQuantity = quantity) => {
    for (let i = 0; i < selectedQuantity; i++) {
      addToCart(product)
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
  const productKeys = Object.keys(product).filter(key => !excludedKeys.includes(key))
  
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
    const sensorKeys = ['sensors_and_controls', 'pir_microwave', 'remote_control_bluetooth', 'emergency_backup_battery', 'plugin_sensor']
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
    addons: 'Add-on Pricing',
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
          <div className="lg:col-span-1 space-y-6">
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
                    <span className="text-sm font-semibold">{product[key]}</span>
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
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">Complete Specifications</h2>
            
            {Object.entries(groupedKeys).map(([category, keys]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getKeyIcon(keys[0] || (category === 'addons' ? 'addons' : ''))}
                    {categoryTitles[category]}
                    <Badge variant="outline" className="ml-auto">
                      {category === 'addons' ? addonCostData.entries.length : keys.length} specs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {category === 'addons' && (
                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Base: {formatCurrency(baseCost)}</Badge>
                        <Badge variant="outline">Add-ons: {formatCurrency(addonCostData.totalAddons)}</Badge>
                        <Badge variant="default">Total: {formatCurrency(totalCostWithAddons)}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {addonCostData.entries.map(({ key, label, value }) => (
                          <div key={key} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                            <span className="text-sm font-medium text-muted-foreground">{label}</span>
                            <span className="text-sm font-semibold">{formatCurrency(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(category !== 'addons' || keys.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {keys.map((key) => (
                        <div key={key} className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">{formatFieldName(key)}</span>
                          <span className="text-sm font-semibold">
                            {product[key] !== null && product[key] !== undefined && product[key] !== '' ? (
                              typeof product[key] === 'boolean' ? (
                                product[key] ? 'Yes' : 'No'
                              ) : (
                                product[key].toString()
                              )
                            ) : (
                              <span className="text-muted-foreground italic">Not specified</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
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