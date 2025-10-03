"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Send, User, Mail, Phone, MessageSquare, Building, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SuccessAnimation } from "./SuccessAnimation"

export function EnquiryForm({ isOpen, onClose, product, cartItems, onSuccess, /* appliedCoupon, */ selectedShipping }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Prepare customer details with coupon and shipping information
      const customerDetails = {
        ...formData,
        // couponCode: appliedCoupon?.coupon_code || null,
        deliveryMethod: selectedShipping || null,
        deliveryTime: selectedShipping === 'air' ? '30 days' : selectedShipping === 'boat' ? '35 days' : null
      }

      const payload = {
        cartItems: cartItems || [],
        customerDetails
      }

      // Send to both n8n webhook and local Supabase API
      const [n8nResponse, localResponse] = await Promise.allSettled([
        fetch("https://n8n.werposolutions.com/webhook/inquiry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        }),
        fetch("/api/enquiries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        })
      ])

      // Check if at least one succeeded
      const n8nSuccess = n8nResponse.status === 'fulfilled' && n8nResponse.value.ok
      const localSuccess = localResponse.status === 'fulfilled' && localResponse.value.ok

      if (n8nSuccess || localSuccess) {
        setSubmitStatus("success")
        // Close the dialog first
        onClose()
        // Show success animation (cart will be cleared when animation completes)
        setShowSuccessAnimation(true)
        
        // Log any failures for debugging
        if (!n8nSuccess) {
          console.warn('N8N webhook failed:', n8nResponse.reason || 'Unknown error')
        }
        if (!localSuccess) {
          console.warn('Local API failed:', localResponse.reason || 'Unknown error')
        }
      } else {
        setSubmitStatus("error")
        console.error('Both n8n and local API failed')
      }
    } catch (error) {
      console.error("Error submitting enquiry:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name && formData.email && formData.phone

  const handleSuccessAnimationComplete = () => {
    setShowSuccessAnimation(false)
    // Clear cart after animation completes
    if (onSuccess) {
      onSuccess()
    }
    // Reset form after animation completes
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      message: ""
    })
    setSubmitStatus(null)
  }

  return (
    <>
      <SuccessAnimation
        isVisible={showSuccessAnimation}
        onComplete={handleSuccessAnimationComplete}
      />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <MessageSquare className="w-5 h-5" />
              </div>
              Product Enquiry
            </DialogTitle>
            <DialogDescription>
              {cartItems && cartItems.length > 0
                ? `Fill in your details below and we'll get back to you with pricing and availability for ${cartItems.length} selected ${cartItems.length === 1 ? 'product' : 'products'}.`
                : 'Fill in your details below and we\'ll get back to you with pricing and availability information.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </label>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              {/* Company Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company Name
                </label>
                <Input
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter your company name (optional)"
                />
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address (optional)"
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Additional Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Any specific requirements or questions?"
                  className="flex min-h-[80px] w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-primary/50 resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Status */}
            {submitStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm ${submitStatus === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  }`}
              >
                {submitStatus === "success"
                  ? "✅ Enquiry submitted successfully! We'll contact you soon."
                  : "❌ Failed to submit enquiry. Please try again."}
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-1"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Enquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}