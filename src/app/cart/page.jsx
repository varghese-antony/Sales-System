"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { ShoppingCart, Trash2, ArrowLeft, Package, Percent, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { EnquiryForm } from "@/components/EnquiryForm"
import { useCart } from "@/contexts/CartContext"
// import { useCoupon } from "@/contexts/CouponContext"
import { Input } from "@/components/ui/input"
import Link from "next/link"

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

const calculateItemPrice = (item) => {
  // Base cost: cost_china_ddp_usa or cost_thailand_vietnam
  const baseCost = parseCostValue(item.cost_china_ddp_usa ?? item.cost_thailand_vietnam ?? 0)
  
  // Addon costs
  const totalAddons = addonCostFields.reduce((sum, { key }) => {
    return sum + parseCostValue(item[key])
  }, 0)
  
  // Get markup percentage: use item.markup_percentage if it exists and is > 0, otherwise use default 10%
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
  
  // Calculate total cost: baseCost + addons, then add markup as percentage of total cost
  const totalCost = baseCost + totalAddons
  const markupAmount = totalCost * (markupPercentage / 100)
  const pricePerUnit = totalCost + markupAmount
  
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
    return selectedShipping === 'air' ? 30 : 35
  }

  // Calculate total cart price
  const cartTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const priceData = calculateItemPrice(item)
      return total + (priceData.pricePerUnit * item.quantity)
    }, 0)
  }, [items])

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
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
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
                          <h3 className="font-semibold text-lg">
                            {item.name || item.product_name || item.producttype || 'Lighting Product'}
                            {item.model_number && ` - ${item.model_number}`}
                            {!item.name && !item.product_name && !item.producttype && item.id && ` #${item.id}`}
                          </h3>
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
                              <div className="flex flex-wrap gap-2 text-xs">
                                {priceData.baseCost > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Base: {formatCurrency(priceData.baseCost)}
                                  </Badge>
                                )}
                                {priceData.totalAddons > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Add-ons: {formatCurrency(priceData.totalAddons)}
                                  </Badge>
                                )}
                                <Badge variant="default" className="text-xs">
                                  Unit: {formatCurrency(priceData.pricePerUnit)}
                                </Badge>
                              </div>
                              <div className="text-sm font-semibold text-primary">
                                Total ({item.quantity} {item.quantity === 1 ? 'item' : 'items'}): {formatCurrency(priceData.pricePerUnit * item.quantity)}
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

                        {/* Key Specifications */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                          {item.power_w && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Power:</span>
                              <span>{item.power_w}W</span>
                            </div>
                          )}
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
                          {item.warranty && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Warranty:</span>
                              <span>{item.warranty} years</span>
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
                            <span className="text-sm text-muted-foreground">15 days</span>
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
                            <span className="text-sm font-medium">Boat Shipping</span>
                            <span className="text-sm text-muted-foreground">35 days</span>
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
                        Total Delivery: {30 + getShippingTime()} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {/* Cart Total */}
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-lg font-semibold">Cart Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  
                  {/* Item Count */}
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Total Items:</span>
                    <span>{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}</span>
                  </div>
                  
                  {/* {appliedCoupon && !isCouponExpired(appliedCoupon) && (
                    <div className="flex justify-between items-center py-2 border-t border-dashed">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-lg font-bold">${getDiscountedTotal().toFixed(2)}</span>
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
                  onClick={() => setIsEnquiryOpen(true)}
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
