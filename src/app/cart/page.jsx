"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { ShoppingCart, Trash2, ArrowLeft, Package, Percent, X, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { EnquiryForm } from "@/components/EnquiryForm"
import { useCart } from "@/contexts/CartContext"
// import { useCoupon } from "@/contexts/CouponContext"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
  const numeric = (typeof value === 'number' && Number.isFinite(value))
    ? value
    : (parseFloat(String(value || 0).replace(/[^\d.-]/g, '')) || 0)
  return `$${numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatInteger = (value) => {
  const n = Math.round((typeof value === 'number' && Number.isFinite(value))
    ? value
    : (parseFloat(String(value || 0).replace(/[^\d.-]/g, '')) || 0))
  return n.toLocaleString('en-US')
}

const CUBIC_M_TO_CUBIC_FT = 35.3147
const SHIPPING_MIN_THRESHOLD = 3000
const CONSOLIDATION_FEE = 650

const calculateItemPrice = (item) => {
  // Base cost: cost_china_ddp_usa or cost_thailand_vietnam
  const baseCost = parseCostValue(item.cost_china_ddp_usa ?? item.cost_thailand_vietnam ?? 0)
  
  // Addon costs
  const totalAddons = addonCostFields.reduce((sum, { key }) => {
    return sum + parseCostValue(item[key])
  }, 0)
  
  // Get markup percentage: use item.markup_percentage if it exists and is > 0, otherwise use default 30%
  const productMarkup = item.markup_percentage
  let markupPercentage = MARKUP_PERCENTAGE_DEFAULT
  if (productMarkup !== null && productMarkup !== undefined) {
    const parsed = typeof productMarkup === 'number' 
      ? productMarkup 
      : parseFloat(productMarkup)
    if (Number.isFinite(parsed) && parsed > 0) {
      markupPercentage = parsed
    }
  }
  
  // Calculate total cost: apply markup percentage to each item separately (base price and each addon), then sum
  // Apply markup to base cost
  const baseCostWithMarkup = baseCost * (1 + markupPercentage / 100)
  
  // Apply markup to each addon separately, then sum
  const addonsWithMarkup = addonCostFields.reduce((sum, { key }) => {
    const addonCost = parseCostValue(item[key])
    const addonWithMarkup = addonCost * (1 + markupPercentage / 100)
    return sum + addonWithMarkup
  }, 0)
  
  // Sum all marked-up items
  const pricePerUnit = baseCostWithMarkup + addonsWithMarkup
  
  return {
    baseCost,
    totalAddons,
    markupPercentage, // Keep for reference but don't display
    pricePerUnit,
    hasPrice: baseCost > 0 || totalAddons > 0
  }
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart()
  // const { coupons, loading, error, appliedCoupon, applyCoupon, removeCoupon } = useCoupon()
  // const [couponCode, setCouponCode] = useState('')
  const [selectedShipping, setSelectedShipping] = useState('air')
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false)
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false)

  const handleQuantityChange = (item, newQuantity) => {
    const productId = item.id || item.ID
    updateQuantity(productId, newQuantity)
  }

  // const handleApplyCoupon = (e) => {
  //   e.preventDefault()
  //   if (couponCode.trim()) {
  //     applyCoupon(couponCode.trim())
  //     setCouponCode('')
  //   }
  // }

  // const handleRemoveCoupon = () => {
  //   removeCoupon()
  // }

  // // Auto-remove expired coupons on mount and when appliedCoupon changes
  // useEffect(() => {
  //   if (appliedCoupon && isCouponExpired(appliedCoupon)) {
  //     removeCoupon()
  //   }
  // }, [appliedCoupon])

  // const isCouponExpired = (coupon) => {
  //   if (!coupon) return false
  //   const now = new Date()
  //   const expiry = new Date(coupon.expiry)
  //   return now > expiry
  // }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  // const calculateDiscount = () => {
  //   if (!appliedCoupon) return 0
  //   const change = parseFloat(appliedCoupon.change)
  //   if (isNaN(change)) return 0

  //   // For now, we'll assume a base total of $1000 for demo purposes
  //   // In a real app, this would be the actual cart total
  //   const baseTotal = 1000
  //   const discount = change > 0 ? baseTotal * (change / 100) : baseTotal * Math.abs(change) / 100
  //   return change > 0 ? discount : -discount
  // }

  // const getDiscountedTotal = () => {
  //   const baseTotal = 1000 // This should be calculated from actual cart items
  //   const discount = calculateDiscount()
  //   return Math.max(0, baseTotal + discount)
  // }

  const getShippingTime = () => {
    if (selectedShipping === 'air') return null // Air: custom order pricing TBD
    return 45 // Sea shipping: 45 days default
  }

  // Calculate total cart price
  const cartTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const priceData = calculateItemPrice(item)
      return total + (priceData.pricePerUnit * item.quantity)
    }, 0)
  }, [items])

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

  // Calculate total cubic meters required for all items
  const totalCubicMeters = useMemo(() => {
    return items.reduce((total, item) => {
      const cubicMPerPc = parseCubicMValue(item.cubic_m_per_pc)
      if (cubicMPerPc > 0) {
        return total + (cubicMPerPc * item.quantity)
      }
      return total
    }, 0)
  }, [items])

  const totalPieces = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  // Calculate container allocation and shipping costs
  const containerAllocation = useMemo(() => {
    if (totalCubicMeters === 0) {
      return {
        hasValidItems: false,
        totalCubicMeters: 0,
        container20ft: null,
        container40ft: null,
        shippingCost: 0,
        consolidationFee: 0,
        effectiveShippingCost: 0,
        shippingPerUnit: 0
      }
    }

    // Filter items that have valid cubic_m_per_pc
    const itemsWithCubicM = items.filter(item => parseCubicMValue(item.cubic_m_per_pc) > 0)
    
    if (itemsWithCubicM.length === 0) {
      return {
        hasValidItems: false,
        totalCubicMeters: 0,
        container20ft: null,
        container40ft: null,
        shippingCost: 0,
        consolidationFee: 0,
        effectiveShippingCost: 0,
        shippingPerUnit: 0
      }
    }

    // Find the smallest cubic_m_per_pc to check if adding one more piece would overflow
    const smallestCubicMPerPc = Math.min(...itemsWithCubicM.map(item => parseCubicMValue(item.cubic_m_per_pc)))
    
    // 97% threshold for consolidation fee (97% of total container size)
    const CONTAINER_20FT_97_PERCENT = CONTAINER_20FT.totalCubicM * 0.97

    // Always prioritize 20ft container first
    // Check if items fit in 20ft container
    if (totalCubicMeters <= CONTAINER_20FT.maxCapacity) {
      // Check if adding one more piece would cause overflow
      const wouldOverflow = (totalCubicMeters + smallestCubicMPerPc) > CONTAINER_20FT.maxCapacity
      // Check if already overflowing (shouldn't happen in this branch, but just in case)
      const isOverflowing = totalCubicMeters > CONTAINER_20FT.maxCapacity
      
      // Check if utilization is less than 97%
      const utilizationPercentage = (totalCubicMeters / CONTAINER_20FT.maxCapacity) * 100
      const isLessThan97Percent = totalCubicMeters < CONTAINER_20FT_97_PERCENT
      
      // If overflowing or would overflow, use full container price
      const shippingCost = (isOverflowing || wouldOverflow) 
        ? CONTAINER_20FT.price 
        : (totalCubicMeters / CONTAINER_20FT.totalCubicM) * CONTAINER_20FT.price

      const pieces = itemsWithCubicM.reduce((sum, item) => sum + item.quantity, 0)
      
      // Consolidation fee: only add if:
      // 1. Utilization is less than 97% of max capacity
      // 2. Can fit one more piece without overflowing
      const consolidationFee = isLessThan97Percent && !wouldOverflow && !isOverflowing && totalCubicMeters < CONTAINER_20FT.maxCapacity ? CONSOLIDATION_FEE : 0
      const effectiveShippingCost = shippingCost + consolidationFee
      const shippingPerUnit = pieces > 0 ? effectiveShippingCost / pieces : 0

      // Calculate optimization suggestions
      let optimizationSuggestions = null
      if (consolidationFee > 0) {
        // Calculate how many pieces to add to reach 97% threshold (to remove consolidation fee)
        const spaceTo97Percent = CONTAINER_20FT_97_PERCENT - totalCubicMeters
        const piecesToAddFor97Percent = spaceTo97Percent > 0 && smallestCubicMPerPc > 0 
          ? Math.ceil(spaceTo97Percent / smallestCubicMPerPc)
          : 0
        
        optimizationSuggestions = {
          hasConsolidationFee: true,
          piecesToAddToRemoveFee: piecesToAddFor97Percent > 0 ? piecesToAddFor97Percent : null,
          currentShippingCost: effectiveShippingCost,
          optimizedShippingCost: shippingCost, // Without consolidation fee
          savings: consolidationFee
        }
      }

      return {
        hasValidItems: true,
        totalCubicMeters,
        container20ft: {
          used: totalCubicMeters,
          capacity: CONTAINER_20FT.maxCapacity,
          totalCapacity: CONTAINER_20FT.totalCubicM,
          pieces,
          cost: shippingCost,
          percentage: (totalCubicMeters / CONTAINER_20FT.totalCubicM) * 100,
          isFullPrice: isOverflowing || wouldOverflow,
          utilizationPercentage
        },
        container40ft: null,
        shippingCost,
        consolidationFee,
        effectiveShippingCost,
        shippingPerUnit,
        optimizationSuggestions
      }
    } else {
      // Quantities exceed 20ft container - use 40ft container (not split)
      // Check if adding one more piece would cause overflow in 40ft
      const wouldOverflow40ft = (totalCubicMeters + smallestCubicMPerPc) > CONTAINER_40FT.maxCapacity
      const isOverflowing40ft = totalCubicMeters > CONTAINER_40FT.maxCapacity
      
      // 97% threshold for consolidation fee (97% of total container size)
      const CONTAINER_40FT_97_PERCENT = CONTAINER_40FT.totalCubicM * 0.97
      const isLessThan97Percent40ft = totalCubicMeters < CONTAINER_40FT_97_PERCENT
      
      // Calculate shipping cost for 40ft container
      const shippingCost = (isOverflowing40ft || wouldOverflow40ft) 
        ? CONTAINER_40FT.price 
        : (totalCubicMeters / CONTAINER_40FT.totalCubicM) * CONTAINER_40FT.price

      const pieces = itemsWithCubicM.reduce((sum, item) => sum + item.quantity, 0)
      
      // Consolidation fee: only add if:
      // 1. Utilization is less than 97% of max capacity
      // 2. Can fit one more piece without overflowing
      const consolidationFee = isLessThan97Percent40ft && !wouldOverflow40ft && !isOverflowing40ft && totalCubicMeters < CONTAINER_40FT.maxCapacity ? CONSOLIDATION_FEE : 0
      const effectiveShippingCost = shippingCost + consolidationFee
      const shippingPerUnit = pieces > 0 ? effectiveShippingCost / pieces : 0

      // Calculate optimization suggestions
      let optimizationSuggestions = null
      
      if (consolidationFee > 0) {
        // Calculate how many pieces to add to reach 97% threshold (to remove consolidation fee)
        const spaceTo97Percent = CONTAINER_40FT_97_PERCENT - totalCubicMeters
        const piecesToAddFor97Percent = spaceTo97Percent > 0 && smallestCubicMPerPc > 0 
          ? Math.ceil(spaceTo97Percent / smallestCubicMPerPc)
          : null
        
        optimizationSuggestions = {
          hasConsolidationFee: true,
          piecesToAddToRemoveFee: piecesToAddFor97Percent,
          currentShippingCost: effectiveShippingCost,
          optimizedShippingCost: shippingCost,
          savings: consolidationFee
        }
      } else {
        // Using 40ft container - suggest reducing quantity to fit in 20ft
        const spaceAvailableIn20ft = CONTAINER_20FT.maxCapacity
        const excessCubicM = totalCubicMeters - spaceAvailableIn20ft
        
        if (excessCubicM > 0 && smallestCubicMPerPc > 0) {
          // Calculate how many pieces to reduce to fit in 20ft container
          const piecesToReduce = Math.ceil(excessCubicM / smallestCubicMPerPc)
          
          // Calculate what shipping cost would be with 20ft only
          const newTotalCubicM = totalCubicMeters - (piecesToReduce * smallestCubicMPerPc)
          const wouldOverflow20ft = (newTotalCubicM + smallestCubicMPerPc) > CONTAINER_20FT.maxCapacity
          const newShippingCost20ft = wouldOverflow20ft 
            ? CONTAINER_20FT.price 
            : (newTotalCubicM / CONTAINER_20FT.totalCubicM) * CONTAINER_20FT.price
          
          const newConsolidationFee20ft = newTotalCubicM < CONTAINER_20FT_97_PERCENT && !wouldOverflow20ft ? CONSOLIDATION_FEE : 0
          const newEffectiveShippingCost20ft = newShippingCost20ft + newConsolidationFee20ft
          
          optimizationSuggestions = {
            using40ftContainer: true,
            piecesToReduceFor20ft: piecesToReduce,
            currentShippingCost: effectiveShippingCost,
            optimizedShippingCost: newEffectiveShippingCost20ft,
            savings: effectiveShippingCost - newEffectiveShippingCost20ft
          }
        }
      }

      return {
        hasValidItems: true,
        totalCubicMeters,
        container20ft: null,
        container40ft: {
          used: totalCubicMeters,
          capacity: CONTAINER_40FT.maxCapacity,
          totalCapacity: CONTAINER_40FT.totalCubicM,
          pieces,
          cost: shippingCost,
          percentage: (totalCubicMeters / CONTAINER_40FT.totalCubicM) * 100,
          isFullPrice: isOverflowing40ft || wouldOverflow40ft
        },
        shippingCost,
        consolidationFee,
        effectiveShippingCost,
        shippingPerUnit,
        optimizationSuggestions
      }
    }
  }, [items, totalCubicMeters])

  // Calculate tariff amount (35% of cart total)
  const tariffAmount = useMemo(() => {
    return cartTotal * (TARIFF_PERCENTAGE / 100)
  }, [cartTotal])

  // Calculate final total (cart total + tariff + effective shipping including consolidation when < $3000)
  const finalTotal = useMemo(() => {
    return cartTotal + tariffAmount + (containerAllocation.effectiveShippingCost ?? containerAllocation.shippingCost ?? 0)
  }, [cartTotal, tariffAmount, containerAllocation.effectiveShippingCost, containerAllocation.shippingCost])

  // Calculate price breakdown for each item
  const getItemPriceData = (item) => {
    return calculateItemPrice(item)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <Button variant="outline" className="group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Empty Cart */}
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Looks like you haven't added any lighting products to your cart yet.
              Browse our collection to find the perfect lighting solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/indoor">
                <Button size="lg">
                  Browse Indoor Lighting
                </Button>
              </Link>
              <Link href="/outdoor">
                <Button variant="outline" size="lg">
                  Browse Outdoor Lighting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" className="group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Continue Shopping
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {formatInteger(getTotalItems())} {getTotalItems() === 1 ? 'item' : 'items'}
            </Badge>
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <ShoppingCart className="w-10 h-10 text-primary" />
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">
            Review your selected lighting products and submit an enquiry
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.id || item.ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="group"
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Product Image Placeholder */}
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-white" />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {item.name || item.product_name || item.producttype || 'Lighting Product'}
                              {!item.name && !item.product_name && !item.producttype && item.id && ` #${item.id}`}
                            </h3>
                            {item.model_number && (
                              <p className="text-sm text-muted-foreground mt-0.5">{item.model_number}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Price Breakdown */}
                        {(() => {
                          const priceData = getItemPriceData(item)
                          if (!priceData.hasPrice) {
                            return (
                              <div className="text-sm text-muted-foreground mb-3">
                                Price on request
                              </div>
                            )
                          }
                          return (
                            <div className="mb-3 space-y-1">
                              <div className="text-sm font-semibold text-primary">
                                Total ({formatInteger(item.quantity)} {item.quantity === 1 ? 'item' : 'items'}): {formatCurrency(priceData.pricePerUnit * item.quantity)}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Product Type Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.type && (
                            <Badge variant="outline" className="text-xs bg-blue-50">
                              {item.type}
                            </Badge>
                          )}
                          {item.indoor_outdoor && (
                            <Badge variant="outline" className="text-xs bg-green-50">
                              {item.indoor_outdoor}
                            </Badge>
                          )}
                          {item.ip_rating && (
                            <Badge variant="outline" className="text-xs bg-amber-50">
                              IP{item.ip_rating}
                            </Badge>
                          )}
                          {item.certification && (
                            <Badge variant="outline" className="text-xs bg-purple-50">
                              {item.certification}
                            </Badge>
                          )}
                        </div>

                        {/* Key Specifications - power and warranty removed per requirements */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                          {item.voltage_v && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Voltage:</span>
                              <span>{item.voltage_v}V</span>
                            </div>
                          )}
                          {item.cct_k && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">CCT:</span>
                              <span>{item.cct_k}K</span>
                            </div>
                          )}
                          {item.lm && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Lumen:</span>
                              <span>{item.lm}lm</span>
                            </div>
                          )}
                          {item.cri && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">CRI:</span>
                              <span>Ra {item.cri}</span>
                            </div>
                          )}
                          {item.beam_angle && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Beam:</span>
                              <span>{item.beam_angle}°</span>
                            </div>
                          )}
                          {item.dimmable && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Dimmable:</span>
                              <span>{item.dimmable === 'Yes' ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                          {item.driver_brand && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Driver:</span>
                              <span>{item.driver_brand}</span>
                            </div>
                          )}
                          {item.material && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Material:</span>
                              <span>{item.material}</span>
                            </div>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Qty:</span>
                            <QuantitySelector
                              value={item.quantity}
                              onChange={(newQuantity) => handleQuantityChange(item, newQuantity)}
                              size="sm"
                              min={1}
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id || item.ID)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Cart Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Section - Temporarily Disabled */}
                {/* <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Coupon Code
                  </h4>

                  {appliedCoupon ? (
                    <div className={`p-3 border rounded-lg ${isCouponExpired(appliedCoupon) ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isCouponExpired(appliedCoupon) ? 'text-red-800' : 'text-green-800'}`}>
                            {isCouponExpired(appliedCoupon) ? 'Coupon expired' : `${appliedCoupon.coupon_code} applied`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className={isCouponExpired(appliedCoupon) ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="text-sm"
                      />
                      <Button type="submit" size="sm" className="w-full">
                        Apply Coupon
                      </Button>
                    </form>
                  )}

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div> */}

                {/* Shipping Options Section */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Shipping & Manufacturing
                  </h4>

                  {/* Manufacturing Time */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">
                        Manufacturing: 30 days
                      </span>
                    </div>
                  </div>

                  {/* Shipping Options */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Shipping Method:</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="shipping"
                          value="air"
                          checked={selectedShipping === 'air'}
                          onChange={(e) => setSelectedShipping(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Air Shipping</span>
                            <span className="text-sm text-muted-foreground">TBD (custom order pricing)</span>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="shipping"
                          value="boat"
                          checked={selectedShipping === 'boat'}
                          onChange={(e) => setSelectedShipping(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Sea Shipping</span>
                            <span className="text-sm text-muted-foreground">45 days</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Total Delivery Time */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">
                        Total Delivery: {getShippingTime() == null ? 'TBD' : `${30 + getShippingTime()} days`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Container Size and Utilization Section */}
                {containerAllocation.hasValidItems && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Container Size and Utilization
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Total Space Required: <span className="font-semibold text-foreground">{totalCubicMeters.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³ ({(totalCubicMeters * CUBIC_M_TO_CUBIC_FT).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ft³)</span>
                      </div>

                      {containerAllocation.container20ft && (
                        <div className={`p-3 border rounded-lg ${containerAllocation.container20ft.isFullPrice ? 'bg-orange-50 border-orange-300' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold ${containerAllocation.container20ft.isFullPrice ? 'text-orange-800' : 'text-blue-800'}`}>
                              20ft Container
                              {containerAllocation.container20ft.isFullPrice && (
                                <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-300">
                                  Full Price
                                </Badge>
                              )}
                            </span>
                            <span className={`text-xs ${containerAllocation.container20ft.isFullPrice ? 'text-orange-600' : 'text-blue-600'}`}>
                              {containerAllocation.container20ft.used.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {containerAllocation.container20ft.totalCapacity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³ ({(containerAllocation.container20ft.used * CUBIC_M_TO_CUBIC_FT).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ft³)
                            </span>
                          </div>
                          <div className={`space-y-1 text-xs ${containerAllocation.container20ft.isFullPrice ? 'text-orange-700' : 'text-blue-700'}`}>
                            <div>Pieces: {containerAllocation.container20ft.pieces.toLocaleString('en-US')}</div>
                            <div>Utilization: {containerAllocation.container20ft.percentage.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
                            <div className="font-semibold">Cost: {formatCurrency(containerAllocation.container20ft.cost)}</div>
                            {containerAllocation.container20ft.isFullPrice && (
                              <div className="text-xs italic mt-1">
                                Full container price applied (overflowing or near capacity)
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {containerAllocation.container40ft && (
                        <div className={`p-3 border rounded-lg ${containerAllocation.container40ft.isFullPrice ? 'bg-orange-50 border-orange-300' : 'bg-purple-50 border-purple-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold ${containerAllocation.container40ft.isFullPrice ? 'text-orange-800' : 'text-purple-800'}`}>
                              40ft Container
                              {containerAllocation.container40ft.isFullPrice && (
                                <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-300">
                                  Full Price
                                </Badge>
                              )}
                            </span>
                            <span className={`text-xs ${containerAllocation.container40ft.isFullPrice ? 'text-orange-600' : 'text-purple-600'}`}>
                              {containerAllocation.container40ft.used.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {containerAllocation.container40ft.totalCapacity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³ ({(containerAllocation.container40ft.used * CUBIC_M_TO_CUBIC_FT).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ft³)
                            </span>
                          </div>
                          <div className={`space-y-1 text-xs ${containerAllocation.container40ft.isFullPrice ? 'text-orange-700' : 'text-purple-700'}`}>
                            <div>Pieces: {containerAllocation.container40ft.pieces.toLocaleString('en-US')}</div>
                            <div>Utilization: {containerAllocation.container40ft.percentage.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>
                            <div className="font-semibold">Cost: {formatCurrency(containerAllocation.container40ft.cost)}</div>
                            {containerAllocation.container40ft.isFullPrice && (
                              <div className="text-xs italic mt-1">
                                Full container price applied (overflowing or near capacity)
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Shipping per unit and consolidation fee */}
                      {containerAllocation.shippingPerUnit != null && containerAllocation.shippingPerUnit > 0 && (
                        <div className="p-3 border rounded-lg bg-muted/50">
                          <div className="text-sm">
                            <span className="font-medium text-muted-foreground">Shipping per unit: </span>
                            <span className="font-semibold">{formatCurrency(containerAllocation.shippingPerUnit)}</span>
                          </div>
                          {containerAllocation.consolidationFee > 0 && (
                            <div className="text-sm mt-1">
                              <span className="font-medium text-muted-foreground">Consolidation fee: </span>
                              <span className="font-semibold">{formatCurrency(containerAllocation.consolidationFee)}</span>
                              <span className="text-muted-foreground text-xs"> (applied when shipping &lt; $3,000)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!containerAllocation.hasValidItems && items.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        Container calculation requires cubic meter data (cubic_m_per_pc) for items. Some items in your cart may not have this information.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  {/* Cart Total */}
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-lg font-semibold">Cart Total:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  
                  {/* Tariff */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-muted-foreground">Tariff:</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(tariffAmount)}
                    </span>
                  </div>
                  
                  {/* Shipping Cost and Consolidation Fee */}
                  {containerAllocation.hasValidItems && (containerAllocation.shippingCost > 0 || (containerAllocation.consolidationFee ?? 0) > 0) && (
                    <>
                      {containerAllocation.shippingCost > 0 && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium text-muted-foreground">Shipping:</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(containerAllocation.shippingCost)}
                          </span>
                        </div>
                      )}
                      {(containerAllocation.consolidationFee ?? 0) > 0 && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium text-muted-foreground">Consolidation fee:</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(containerAllocation.consolidationFee)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Final Total */}
                  <div className="flex justify-between items-center py-3 border-t-2 border-primary/20">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                  
                  {/* Item Count */}
                  <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                    <span>Total Items:</span>
                    <span>{formatInteger(getTotalItems())} {getTotalItems() === 1 ? 'item' : 'items'}</span>
                  </div>
                  
                  {/* {appliedCoupon && !isCouponExpired(appliedCoupon) && (
                    <div className="flex justify-between items-center py-2 border-t border-dashed">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-bold">{formatCurrency(getDiscountedTotal())}</span>
                    </div>
                  )}

                  {appliedCoupon && isCouponExpired(appliedCoupon) && (
                    <div className="py-2 border-t border-dashed">
                      <p className="text-sm text-red-600 text-center">
                        This coupon has expired. Please remove it and try a different coupon code.
                      </p>
                    </div>
                  )} */}
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Ready to get pricing and availability for your selected products?
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    // Show optimization dialog if there are suggestions, otherwise go directly to enquiry form
                    if (containerAllocation.optimizationSuggestions) {
                      setShowOptimizationDialog(true)
                    } else {
                      setIsEnquiryOpen(true)
                    }
                  }}
                  // disabled={appliedCoupon && isCouponExpired(appliedCoupon)}
                >
                  Submit Enquiry
                </Button>

                {/* {appliedCoupon && isCouponExpired(appliedCoupon) && (
                  <p className="text-xs text-red-600 text-center">
                    Please remove the expired coupon before submitting your enquiry.
                  </p>
                )} */}

                <p className="text-xs text-muted-foreground text-center">
                  Our team will review your selection and get back to you with detailed pricing and availability information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Optimization Suggestions Dialog */}
      <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Shipping Cost Optimization
            </DialogTitle>
            <DialogDescription>
              We found opportunities to optimize your shipping costs
            </DialogDescription>
          </DialogHeader>
          
          {containerAllocation.optimizationSuggestions && (
            <div className="space-y-4 py-4">
              {containerAllocation.optimizationSuggestions.hasConsolidationFee && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Remove Consolidation Fee
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                        You're currently paying a consolidation fee of {formatCurrency(containerAllocation.optimizationSuggestions.savings)}.
                      </p>
                      {containerAllocation.optimizationSuggestions.piecesToAddToRemoveFee && (
                        <div className="bg-white dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Add {containerAllocation.optimizationSuggestions.piecesToAddToRemoveFee} more piece{containerAllocation.optimizationSuggestions.piecesToAddToRemoveFee !== 1 ? 's' : ''} to reach 97% container utilization and remove the consolidation fee.
                          </p>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-blue-700 dark:text-blue-300">Current shipping:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">{formatCurrency(containerAllocation.optimizationSuggestions.currentShippingCost)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-700 dark:text-blue-300">Optimized shipping:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(containerAllocation.optimizationSuggestions.optimizedShippingCost)}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700 flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">You save:</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(containerAllocation.optimizationSuggestions.savings)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {containerAllocation.optimizationSuggestions.using40ftContainer && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                        Reduce Shipping Cost with 20ft Container
                      </h4>
                      <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                        Your order currently requires a 40ft container. You can reduce the quantity to fit in a 20ft container and save on shipping.
                      </p>
                      {containerAllocation.optimizationSuggestions.piecesToReduceFor20ft && (
                        <div className="bg-white dark:bg-orange-900/30 p-3 rounded border border-orange-200 dark:border-orange-700">
                          <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                            Reduce {containerAllocation.optimizationSuggestions.piecesToReduceFor20ft} piece{containerAllocation.optimizationSuggestions.piecesToReduceFor20ft !== 1 ? 's' : ''} to fit in a 20ft container.
                          </p>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-orange-700 dark:text-orange-300">Current shipping (40ft):</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-100">{formatCurrency(containerAllocation.optimizationSuggestions.currentShippingCost)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-orange-700 dark:text-orange-300">Optimized shipping (20ft):</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(containerAllocation.optimizationSuggestions.optimizedShippingCost)}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-700 flex items-center justify-between">
                            <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">You save:</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(containerAllocation.optimizationSuggestions.savings)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOptimizationDialog(false)}
            >
              Continue with Current Order
            </Button>
            <Button
              onClick={() => {
                setShowOptimizationDialog(false)
                setIsEnquiryOpen(true)
              }}
            >
              Proceed to Submit Enquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enquiry Form Modal */}
      <EnquiryForm
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        cartItems={items}
        onSuccess={clearCart}
        // appliedCoupon={appliedCoupon}
        selectedShipping={selectedShipping}
      />
    </div>
  )
}
