"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { ShoppingCart, Trash2, ArrowLeft, Package, Percent, X, Download } from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { EnquiryForm } from "@/components/EnquiryForm"
import { useCart } from "@/contexts/CartContext"
// import { useCoupon } from "@/contexts/CouponContext"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { productNameToSlug } from "@/lib/utils/slug"
import { getProductPriceSummaryPerUnit, getProductPriceSummary, CONTAINER_TYPE_20FT, CONTAINER_TYPE_40FT_HQ } from "../../../lib/utils.js"
import { ContainerPriceBreakdown } from '@/components/ContainerPriceBreakdown'
import { Alert, AlertDescription } from '@/components/ui/alert'

const MARKUP_PERCENTAGE_DEFAULT = 30 // 30% default markup

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
  const [selectedShipping, setSelectedShipping] = useState('boat')
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [customerDetails, setCustomerDetails] = useState(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const componentRef = useRef(null)

  useEffect(() => {
    // Check if dark mode is active
    setIsDarkMode(document.documentElement.classList.contains('dark'))
    
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `cart-${new Date().toISOString().split('T')[0]}`,
    onBeforeGetContent: () => {
      // Ensure dark class is preserved on html element for printing
      const isDark = document.documentElement.classList.contains('dark')
      if (isDark) {
        document.documentElement.classList.add('dark')
      }
      return Promise.resolve()
    },
    onAfterPrint: () => {
      // Cleanup if needed
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body, .print-container, .print-container * {
          background: white !important;
          color: black !important;
        }
        .print-container [class*="text-primary"],
        .print-container [class*="text-muted"] {
          color: black !important;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-container {
          max-width: 100% !important;
          padding: 0 !important;
        }
        .print-grid {
          display: block !important;
        }
        .print-cart-summary {
          display: none !important;
        }
        .print-cart-items {
          display: block !important;
        }
        .print-cart-items .group {
          margin-bottom: 1.5rem !important;
          break-inside: avoid;
        }
        .print-cart-items .border {
          border: 1px solid #000 !important;
        }
        .print-container [data-slot="card"],
        .print-container [class*="Card"] {
          box-shadow: none !important;
          border: 1px solid #000 !important;
          margin-bottom: 1.25rem !important;
          break-inside: avoid;
        }
        .print-container .bg-gradient-to-br,
        .print-container [class*="gradient"] {
          background: white !important;
          border: 1px solid #000 !important;
        }
        .print-container .bg-gradient-to-br svg,
        .print-container [class*="gradient"] svg {
          color: black !important;
          stroke: black !important;
        }
        .print-container a {
          color: black !important;
        }
        .sticky {
          position: relative !important;
          top: 0 !important;
        }
        .break-inside-avoid {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .print-hide-on-print {
          display: none !important;
        }
        .print-summary-box {
          display: block !important;
          margin-top: 2rem !important;
          padding: 1rem 1.5rem !important;
          border: 2px solid #000 !important;
          background: white !important;
          color: black !important;
          break-inside: avoid;
        }
        .print-title-container {
          margin-bottom: 1.5rem !important;
          page-break-after: avoid !important;
        }
        .print-title-container h1 {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.75rem !important;
          margin-bottom: 0 !important;
          color: black !important;
        }
        .print-hide-icon {
          display: none !important;
        }
        .print-hide-subtitle {
          display: none !important;
        }
        .print-title .title-text {
          display: none !important;
        }
        .print-order-summary {
          display: block !important;
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin: 0 !important;
          padding: 0 !important;
          color: black !important;
        }
        button,
        .print-hide-buttons,
        .print-hide-buttons * {
          display: none !important;
          visibility: hidden !important;
        }
        .print-only {
          display: block !important;
        }
        .print-customer-details {
          display: block !important;
          page-break-inside: avoid;
          break-inside: avoid;
          background: white !important;
          color: black !important;
          border: 1px solid #000 !important;
        }
      }
    `
  })

  const handleQuantityChange = (item, newQuantity) => {
    const productId = item.id || item.ID
    updateQuantity(productId, newQuantity)
  }

  // Helper function to get product link
  const getProductLink = (item) => {
    const productId = item.id || item.ID
    if (!productId) return null

    // Determine product type (indoor or outdoor)
    const productType = item.type?.toLowerCase() === 'outdoor' || 
                       item.indoor_outdoor?.toLowerCase() === 'outdoor' 
                       ? 'outdoor' 
                       : 'indoor'

    // Get product name and convert to slug
    const productName = item.name || item.product_name || item.producttype
    if (!productName) return null

    const slug = productNameToSlug(productName)
    return `/${productType}/${slug}/product-details/${productId}`
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

  const totalPieces = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  // Container allocation removed - shipping calculations removed
  const containerAllocation = { hasValidItems: false }

  // Calculate final total (cart total only)
  const finalTotal = useMemo(() => {
    return cartTotal
  }, [cartTotal])

  // Helper function to get price per unit summary for a cart item
  const getItemPricePerUnitSummary = (item) => {
    if (!item || !item.cubic_m_per_pc) return null
    return getProductPriceSummaryPerUnit(item, item.quantity)
  }

  // Calculate price breakdown for each item
  const getItemPriceData = (item) => {
    return calculateItemPrice(item)
  }

  // Calculate price summaries for all products in cart
  const cartPriceSummaries = useMemo(() => {
    return items.map(item => {
      if (!item || !item.cubic_m_per_pc) return null
      return {
        item,
        summary: getProductPriceSummary(item, item.quantity)
      }
    }).filter(Boolean)
  }, [items])

  // Calculate aggregated totals for each container type
  const aggregatedTotals = useMemo(() => {
    const totals = {
      [CONTAINER_TYPE_20FT]: {
        product_price: 0,
        tarrif: 0,
        shipment_cost: 0,
        admin_consolidation_fee: 0,
        space_occupied_cubic_meters: 0,
        total: 0
      },
      [CONTAINER_TYPE_40FT_HQ]: {
        product_price: 0,
        tarrif: 0,
        shipment_cost: 0,
        admin_consolidation_fee: 0,
        space_occupied_cubic_meters: 0,
        total: 0
      }
    }

    cartPriceSummaries.forEach(({ summary }) => {
      if (!summary) return

      // Process 20ft container
      if (summary[CONTAINER_TYPE_20FT] && Object.keys(summary[CONTAINER_TYPE_20FT]).length > 0) {
        totals[CONTAINER_TYPE_20FT].product_price += summary[CONTAINER_TYPE_20FT].product_price || 0
        totals[CONTAINER_TYPE_20FT].tarrif += summary[CONTAINER_TYPE_20FT].tarrif || 0
        totals[CONTAINER_TYPE_20FT].shipment_cost += summary[CONTAINER_TYPE_20FT].shipment_cost || 0
        totals[CONTAINER_TYPE_20FT].admin_consolidation_fee += summary[CONTAINER_TYPE_20FT].admin_consolidation_fee || 0
        totals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters += summary[CONTAINER_TYPE_20FT].space_occupied_cubic_meters || 0
      }

      // Process 40ft container
      if (summary[CONTAINER_TYPE_40FT_HQ] && Object.keys(summary[CONTAINER_TYPE_40FT_HQ]).length > 0) {
        totals[CONTAINER_TYPE_40FT_HQ].product_price += summary[CONTAINER_TYPE_40FT_HQ].product_price || 0
        totals[CONTAINER_TYPE_40FT_HQ].tarrif += summary[CONTAINER_TYPE_40FT_HQ].tarrif || 0
        totals[CONTAINER_TYPE_40FT_HQ].shipment_cost += summary[CONTAINER_TYPE_40FT_HQ].shipment_cost || 0
        totals[CONTAINER_TYPE_40FT_HQ].admin_consolidation_fee += summary[CONTAINER_TYPE_40FT_HQ].admin_consolidation_fee || 0
        totals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters += summary[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters || 0
      }
    })

    // Calculate totals
    totals[CONTAINER_TYPE_20FT].total = totals[CONTAINER_TYPE_20FT].product_price + totals[CONTAINER_TYPE_20FT].tarrif + totals[CONTAINER_TYPE_20FT].shipment_cost + totals[CONTAINER_TYPE_20FT].admin_consolidation_fee
    totals[CONTAINER_TYPE_40FT_HQ].total = totals[CONTAINER_TYPE_40FT_HQ].product_price + totals[CONTAINER_TYPE_40FT_HQ].tarrif + totals[CONTAINER_TYPE_40FT_HQ].shipment_cost + totals[CONTAINER_TYPE_40FT_HQ].admin_consolidation_fee

    return totals
  }, [cartPriceSummaries])

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
      <div 
        ref={componentRef} 
        className={`container mx-auto py-8 px-4 sm:px-6 lg:px-8 print-container ${isDarkMode ? 'dark' : ''}`}
        data-theme={isDarkMode ? 'dark' : 'light'}
      >
        {/* Header - hidden when printing */}
        <div className="flex items-center justify-between mb-8 print-hide-buttons">
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
        <div className="text-center mb-12 print-title-container">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3 print-title">
            <ShoppingCart className="w-10 h-10 text-primary print-hide-icon" />
            <span className="title-text">Shopping Cart</span>
            <span className="print-order-summary">Order Summary</span>
          </h1>
          <p className="text-muted-foreground print-hide-subtitle">
            Review your selected lighting products and submit an enquiry
          </p>
        </div>
        
        {/* Customer Details Section - Only shown when generating PDF */}
        {customerDetails && (
          <div className="mb-8 p-4 border rounded-lg bg-card print-customer-details print-only">
            <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {customerDetails.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {customerDetails.email}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {customerDetails.phone}
              </div>
              {customerDetails.company && (
                <div>
                  <span className="font-medium">Company:</span> {customerDetails.company}
                </div>
              )}
              {customerDetails.address && (
                <div className="md:col-span-2">
                  <span className="font-medium">Address:</span> {customerDetails.address}
                </div>
              )}
              {customerDetails.deliveryMethod && (
                <div>
                  <span className="font-medium">Delivery Method:</span> {customerDetails.deliveryMethod === 'air' ? 'Air Shipping' : 'Sea Shipping'}
                </div>
              )}
              {customerDetails.deliveryTime && (
                <div>
                  <span className="font-medium">Delivery Time:</span> {customerDetails.deliveryTime}
                </div>
              )}
              {customerDetails.message && (
                <div className="md:col-span-2">
                  <span className="font-medium">Message:</span> {customerDetails.message}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-grid">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 print-cart-items">
            {items.map((item) => (
              <motion.div
                key={item.id || item.ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="group"
              >
                <Card className="hover:shadow-lg transition-all duration-300 print:shadow-none print:border print:border-black">
                  <CardContent className="p-6 print:p-4">
                    <div className="flex items-start gap-4">
                      {/* Product Image Placeholder */}
                      {getProductLink(item) ? (
                        <Link href={getProductLink(item)} className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                            <Package className="w-8 h-8 text-white" />
                          </div>
                        </Link>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            {getProductLink(item) ? (
                              <Link href={getProductLink(item)}>
                                <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
                                  {item.name || item.product_name || item.producttype || 'Lighting Product'}
                                  {!item.name && !item.product_name && !item.producttype && item.id && ` #${item.id}`}
                                </h3>
                              </Link>
                            ) : (
                              <h3 className="font-semibold text-lg">
                                {item.name || item.product_name || item.producttype || 'Lighting Product'}
                                {!item.name && !item.product_name && !item.producttype && item.id && ` #${item.id}`}
                              </h3>
                            )}
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
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Qty:</span>
                                <QuantitySelector
                                  value={item.quantity}
                                  onChange={(newQuantity) => handleQuantityChange(item, newQuantity)}
                                  size="sm"
                                  min={1}
                                  step={item.pcs_per_box && item.pcs_per_box > 0 ? item.pcs_per_box : 1}
                                />
                              </div>
                              {item.pcs_per_box && item.pcs_per_box > 0 && (
                                <span className="text-xs text-muted-foreground ml-12">
                                  Increments by {item.pcs_per_box} pcs/box
                                </span>
                              )}
                            </div>
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

                        {/* Container Price Breakdown - hidden when printing to reduce congestion */}
                        {getItemPricePerUnitSummary(item) && (
                          <div className="mt-4 print-hide-on-print">
                            <ContainerPriceBreakdown 
                              priceSummary={getItemPricePerUnitSummary(item)} 
                              quantity={item.quantity} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Print-only: Total and Container Usage at bottom */}
            <div className="hidden print-only print-summary-box">
              <h3 className="text-base font-bold mb-3" style={{ color: 'black' }}>Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: 'black' }}>Total Price:</span>
                  <span className="font-bold" style={{ color: 'black' }}>
                    {(() => {
                      const total20ft = aggregatedTotals[CONTAINER_TYPE_20FT].total
                      const total40ft = aggregatedTotals[CONTAINER_TYPE_40FT_HQ].total
                      const space20ft = aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters
                      const space40ft = aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters
                      const has20ft = space20ft > 0 && space20ft <= 33
                      const has40ft = space40ft > 0 && space40ft <= 76.4
                      if (has20ft) return formatCurrency(total20ft)
                      if (has40ft) return formatCurrency(total40ft)
                      return formatCurrency(finalTotal)
                    })()}
                  </span>
                </div>
                {(aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters > 0 || aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters > 0) && (
                  <div className="flex justify-between">
                    <span style={{ color: 'black' }}>Container Usage:</span>
                    <span style={{ color: 'black' }}>
                      {[
                        aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters > 0 && aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters <= 33
                          ? `20ft: ${aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters.toFixed(2)} m³`
                          : null,
                        aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters > 0 && aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters <= 76.4
                          ? `40ft HQ: ${aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters.toFixed(2)} m³`
                          : null
                      ].filter(Boolean).join(' | ') || 'N/A'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-black mt-2">
                  <span style={{ color: 'black' }}>Total Items:</span>
                  <span style={{ color: 'black' }}>{formatInteger(getTotalItems())} {getTotalItems() === 1 ? 'item' : 'items'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Summary - hidden when printing */}
          <div className="lg:col-span-1 print-cart-summary">
            <Card className="sticky top-8 pb-6">
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

                    </div>
                  </div>
                )}

                {items.length > 0 && items.some(item => !item.cubic_m_per_pc || item.cubic_m_per_pc === 0) && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        Container calculation requires cubic meter data (cubic_m_per_pc) for items. Some items in your cart may not have this information.
                      </p>
                    </div>
                  </div>
                )}

                {/* Price Breakdown by Container */}
                {cartPriceSummaries.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Price Breakdown by Container
                    </h4>

                    {/* Individual Product Breakdowns */}
                    <div className="space-y-3">
                      {cartPriceSummaries.map(({ item, summary }, index) => {
                        if (!summary) return null
                        const productName = item.name || item.product_name || item.producttype || `Product ${index + 1}`
                        const has20ft = summary[CONTAINER_TYPE_20FT] && Object.keys(summary[CONTAINER_TYPE_20FT]).length > 0
                        const has40ft = summary[CONTAINER_TYPE_40FT_HQ] && Object.keys(summary[CONTAINER_TYPE_40FT_HQ]).length > 0

                        if (!has20ft && !has40ft) return null

                        return (
                          <div key={item.id || item.ID} className="p-3 border rounded-lg bg-muted/30">
                            <h5 className="text-sm font-semibold mb-2">{productName}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* 20ft Container */}
                              {has20ft && (
                                <div className="space-y-1">
                                  <h6 className="text-xs font-medium text-muted-foreground">20ft Container</h6>
                                  <div className="space-y-0.5 text-xs">
                                    {summary[CONTAINER_TYPE_20FT].space_occupied_cubic_meters !== undefined && (
                                      <div className="flex justify-between mb-1 pb-1 border-b border-border/30">
                                        <span className="text-muted-foreground">Space Occupied:</span>
                                        <span className="font-medium">{summary[CONTAINER_TYPE_20FT].space_occupied_cubic_meters.toFixed(2)} m³</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Product:</span>
                                      <span>{formatCurrency(summary[CONTAINER_TYPE_20FT].product_price)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Tariff:</span>
                                      <span>{formatCurrency(summary[CONTAINER_TYPE_20FT].tarrif)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Shipping Fee:</span>
                                      <span>{formatCurrency(summary[CONTAINER_TYPE_20FT].shipment_cost + summary[CONTAINER_TYPE_20FT].admin_consolidation_fee)}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-border/50">
                                      <span className="font-medium">Subtotal:</span>
                                      <span className="font-semibold">
                                        {formatCurrency(
                                          summary[CONTAINER_TYPE_20FT].product_price +
                                          summary[CONTAINER_TYPE_20FT].tarrif +
                                          summary[CONTAINER_TYPE_20FT].shipment_cost +
                                          summary[CONTAINER_TYPE_20FT].admin_consolidation_fee
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 40ft Container */}
                              {has40ft && (
                                <div className="space-y-1">
                                  <h6 className="text-xs font-medium text-muted-foreground">40ft Container</h6>
                                  <div className="space-y-0.5 text-xs">
                                    {summary[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters !== undefined && (
                                      <div className="flex justify-between mb-1 pb-1 border-b border-border/30">
                                        <span className="text-muted-foreground">Space Occupied:</span>
                                        <span className="font-medium">{summary[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters.toFixed(2)} m³</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Product:</span>
                                      <span>{formatCurrency(summary[CONTAINER_TYPE_40FT_HQ].product_price)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Tariff:</span>
                                      <span>{formatCurrency(summary[CONTAINER_TYPE_40FT_HQ].tarrif)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Shipping Fee:</span>
                                      <span>{formatCurrency(summary[CONTAINER_TYPE_40FT_HQ].shipment_cost + summary[CONTAINER_TYPE_40FT_HQ].admin_consolidation_fee)}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-border/50">
                                      <span className="font-medium">Subtotal:</span>
                                      <span className="font-semibold">
                                        {formatCurrency(
                                          summary[CONTAINER_TYPE_40FT_HQ].product_price +
                                          summary[CONTAINER_TYPE_40FT_HQ].tarrif +
                                          summary[CONTAINER_TYPE_40FT_HQ].shipment_cost +
                                          summary[CONTAINER_TYPE_40FT_HQ].admin_consolidation_fee
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Aggregated Totals */}
                    <div className="p-3 border-2 border-primary/30 rounded-lg bg-primary/5">
                      <h5 className="text-sm font-semibold mb-3">Total Summary</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 20ft Total */}
                        {aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters > 0 && 
                         aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters <= 33 && (
                          <div className="space-y-1">
                            <h6 className="text-xs font-semibold text-muted-foreground">20ft Container Total</h6>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-muted-foreground">Space Occupied:</span>
                              <span className="text-xs font-medium">{aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters.toFixed(2)} m³</span>
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(aggregatedTotals[CONTAINER_TYPE_20FT].total)}
                            </div>
                          </div>
                        )}

                        {/* 40ft Total */}
                        {aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters > 0 && 
                         aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters <= 76.4 && (
                          <div className="space-y-1">
                            <h6 className="text-xs font-semibold text-muted-foreground">40ft Container Total</h6>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-muted-foreground">Space Occupied:</span>
                              <span className="text-xs font-medium">{aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters.toFixed(2)} m³</span>
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(aggregatedTotals[CONTAINER_TYPE_40FT_HQ].total)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Admin Consolidation Fee Explanation - Show once if any fee exists */}
                    {(aggregatedTotals[CONTAINER_TYPE_20FT].admin_consolidation_fee > 0 || aggregatedTotals[CONTAINER_TYPE_40FT_HQ].admin_consolidation_fee > 0) && (
                      <Alert className="mt-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                          <strong>Admin Consolidation Fee:</strong> This fee covers administrative costs for consolidating your order with other shipments when your order doesn't fill a full container (less than 97% utilization).
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  {/* Final Total - Always prioritize 20ft container, fallback to 40ft */}
                  {cartPriceSummaries.length > 0 && (
                    <div className="flex justify-between items-center py-3 border-t-2 border-primary/20">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        {(() => {
                          const total20ft = aggregatedTotals[CONTAINER_TYPE_20FT].total
                          const total40ft = aggregatedTotals[CONTAINER_TYPE_40FT_HQ].total
                          const space20ft = aggregatedTotals[CONTAINER_TYPE_20FT].space_occupied_cubic_meters
                          const space40ft = aggregatedTotals[CONTAINER_TYPE_40FT_HQ].space_occupied_cubic_meters
                          const has20ft = space20ft > 0 && space20ft <= 33
                          const has40ft = space40ft > 0 && space40ft <= 76.4
                          
                          // Always prioritize 20ft container cost
                          if (has20ft) {
                            return formatCurrency(total20ft)
                          } else if (has40ft) {
                            return formatCurrency(total40ft)
                          } else {
                            return formatCurrency(finalTotal)
                          }
                        })()}
                      </span>
                    </div>
                  )}
                  
                  {cartPriceSummaries.length === 0 && (
                    <div className="flex justify-between items-center py-3 border-t-2 border-primary/20">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                  )}
                  
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

                <div className="flex gap-3 print-hide-buttons">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => {
                      setIsEnquiryOpen(true)
                    }}
                    // disabled={appliedCoupon && isCouponExpired(appliedCoupon)}
                  >
                    Submit Enquiry
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    size="lg"
                    variant="outline"
                    onClick={handlePrint}
                    disabled={items.length === 0}
                  >
                    <Download className="w-5 h-5" />
                    Download Report
                  </Button>
                </div>

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



      {/* Enquiry Form Modal */}
      <EnquiryForm
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        cartItems={items}
        onSuccess={(savedCustomerDetails) => {
          if (savedCustomerDetails) {
            // Save customer details for PDF
            setCustomerDetails(savedCustomerDetails)
            // Trigger PDF download after a short delay to ensure customer details are rendered
            setTimeout(() => {
              handlePrint()
              // Clear cart and customer details after PDF is generated
              setTimeout(() => {
                clearCart()
                setCustomerDetails(null)
              }, 2000)
            }, 1000)
          } else {
            // If no customer details, just clear cart
            clearCart()
          }
        }}
        // appliedCoupon={appliedCoupon}
        selectedShipping={selectedShipping}
      />
    </div>
  )
}
