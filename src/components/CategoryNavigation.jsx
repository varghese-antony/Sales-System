"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Lightbulb, Sparkles, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export function CategoryNavigation({ type, categories, isOpen, onToggle }) {
  const [productTypes, setProductTypes] = useState([])

  useEffect(() => {
    async function fetchProductTypes() {
      try {
        const response = await fetch(`https://n8n.werposolutions.com/webhook/get-distinct?table=${type}&column=Product Type`)
        const data = await response.json()
        setProductTypes(data)
      } catch (error) {
        console.error('Error fetching product types:', error)
      }
    }
    fetchProductTypes()
  }, [type])

  const getProductTypesForCategory = (categoryName) => {
    return productTypes.filter(pt => pt[type === 'indoor' ? 'Indoor' : 'Outdoor'] === categoryName)
  }

  const Icon = type === 'indoor' ? Lightbulb : Sparkles
  const gradientClass = type === 'indoor' ? 'from-blue-500 to-purple-600' : 'from-green-500 to-teal-600'

  return (
    <>
      {/* Toggle Button - Always visible */}
      <Button
        onClick={onToggle}
        variant="outline"
        size="icon"
        className="fixed left-4 top-20 z-50 lg:left-4 lg:top-20 shadow-lg"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-background/95 backdrop-blur-sm border-r border-border/50 z-40 shadow-xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-center mb-2">
                <div className="flex items-center justify-center">
                  <h3 className="text-lg font-semibold capitalize text-center mx-auto">{type} Categories</h3>
                </div>
                
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Navigate through our {type} lighting collection
              </p>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="p-6 space-y-6">
                {categories.map((category, index) => {
                  const categoryName = category[type === 'indoor' ? 'Indoor' : 'Outdoor']
                  const categoryProductTypes = getProductTypesForCategory(categoryName)
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`#${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-base font-semibold hover:text-primary transition-colors group"
                          onClick={() => {
                            // Close sidebar on mobile after navigation
                            if (window.innerWidth < 1024) {
                              onToggle()
                            }
                          }}
                        >
                          <span className="group-hover:underline">{categoryName}</span>
                        </Link>
                        <Badge variant="secondary" className="text-xs">
                          {categoryProductTypes.length}
                        </Badge>
                      </div>
                      
                      <div className="ml-4 space-y-2 border-l-2 border-border/30 pl-4">
                        {categoryProductTypes.map((productType, ptIndex) => (
                          <Link
                            key={ptIndex}
                            href={`/${type}/${productType['Product Type']}`}
                            className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1 hover:bg-accent/50 px-2 rounded-md -ml-2"
                            onClick={() => {
                              // Close sidebar on mobile after navigation
                              if (window.innerWidth < 1024) {
                                onToggle()
                              }
                            }}
                          >
                            {productType['Product Type']}
                          </Link>
                        ))}
                        {categoryProductTypes.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            No products available
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
      </>

    )}