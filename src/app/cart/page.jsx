"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShoppingCart, Trash2, ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { EnquiryForm } from "@/components/EnquiryForm"
import { useCart } from "@/contexts/CartContext"
import Link from "next/link"

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart()
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false)

  const handleQuantityChange = (item, newQuantity) => {
    const productId = item.id || item.ID
    updateQuantity(productId, newQuantity)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
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
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {item['Product Type'] || 'Lighting Product'}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item['Indoor'] && (
                            <Badge variant="secondary" className="text-xs">
                              Indoor: {item['Indoor']}
                            </Badge>
                          )}
                          {item['Outdoor'] && (
                            <Badge variant="secondary" className="text-xs">
                              Outdoor: {item['Outdoor']}
                            </Badge>
                          )}
                        </div>

                        {/* Key Specs */}
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                          {item['Power (W)'] && (
                            <div>Power: {item['Power (W)']}</div>
                          )}
                          {item['Size'] && (
                            <div>Size: {item['Size']}</div>
                          )}
                          {item['CCT'] && (
                            <div>CCT: {item['CCT']}</div>
                          )}
                          {item['Lumen'] && (
                            <div>Lumen: {item['Lumen']}</div>
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
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Items:</span>
                  <span className="font-semibold">{getTotalItems()}</span>
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
                >
                  Submit Enquiry
                </Button>

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
      />
    </div>
  )
}