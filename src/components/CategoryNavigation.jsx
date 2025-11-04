"use client"
import { useState, useEffect } from 'react'
import { getProductTypesByCategory } from '@/lib/database/products'
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Lightbulb, Sun, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export function CategoryNavigation({ type, categories, categoriesWithProducts, isOpen, onToggle, currentPath, currentCategory, activeSection }) {
  const [productTypes, setProductTypes] = useState([])

  // Debug logging for props
  useEffect(() => {
    console.log('📊 [CATEGORY_NAV] Props received:', {
      type,
      categoriesCount: categories?.length || 0,
      currentCategory,
      activeSection,
      currentPath,
      isOpen
    })
  }, [type, categories, currentCategory, activeSection, currentPath, isOpen])

  useEffect(() => {
    async function fetchProductTypes() {
      try {
        const { data, error } = await getProductTypesByCategory(type)
        console.log('CategoryNavigation - Product types by category data for', type, ':', data)
        console.log('CategoryNavigation - Product types by category error:', error)
        if (!error) {
          setProductTypes(data || [])
        }
      } catch (error) {
        console.error('Error fetching product types by category:', error)
      }
    }
    fetchProductTypes()
  }, [type])

  const getProductTypesForCategory = (categoryName) => {
    console.log('CategoryNavigation - getProductTypesForCategory called with:', categoryName)
    console.log('CategoryNavigation - productTypes:', productTypes)
    if (!productTypes || productTypes.length === 0) {
      console.log('CategoryNavigation - No productTypes data available')
      return []
    }
    
    const categoryData = productTypes.find(item => {
      // V2 tables use 'sub_category' column
      return item.sub_category === categoryName
    })
    
    console.log('CategoryNavigation - Found category data for', categoryName, ':', categoryData)
    return categoryData ? categoryData.producttypes.map(pt => ({ producttype: pt })) : []
  }

  const Icon = type === 'indoor' ? Lightbulb : Sun
  const gradientClass = type === 'indoor' ? 'from-blue-500 to-purple-600' : 'from-green-500 to-teal-600'

  const isActiveSection = currentPath && currentPath.includes(`/${type}`)

  return (
    <>
      {/* Floating Open Button - Shows when sidebar is closed */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          variant="ghost"
          size="icon"
          className="fixed left-4 top-30 z-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-accent/50"
        >
          <Menu className="w-5 h-5 text-primary transition-transform duration-300" />
        </Button>
      )}

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
            className="fixed left-0 top-16 h-[100vh] w-80 bg-background/95 backdrop-blur-sm border-r border-border/50 z-50 shadow-xl overflow-y-auto pb-20"
          >
            {/* Toggle Button - Full Width at Top */}
            <div className="w-full px-4 py-3 border-b border-border/50 bg-background/80">
              <Button
                onClick={onToggle}
                variant="ghost"
                className="w-full justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-accent/50"
              >
                {isOpen ? (
                  <ChevronLeft className="w-5 h-5 text-primary transition-transform duration-300" />
                ) : (
                  <Menu className="w-5 h-5 text-primary transition-transform duration-300" />
                )}
                <span className="ml-2 text-sm font-medium">Close Menu</span>
              </Button>
            </div>

            {/* Header */}
            <div className={`p-6 border-b border-border/50 ${isActiveSection ? 'bg-primary/5 border-primary/20' : ''}`}>
              <div className="flex items-center justify-center mb-2">
                <div className="flex items-center justify-center">
                  <Icon className={`w-6 h-6 mr-3 ${isActiveSection ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className={`text-lg font-semibold capitalize text-center mx-auto ${isActiveSection ? 'text-primary' : ''}`}>
                    {type} Categories
                  </h3>
                </div>
                
              </div>
              <p className={`text-sm text-center ${isActiveSection ? 'text-primary/80' : 'text-muted-foreground'}`}>
                Navigate through our {type} lighting collection
              </p>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="p-6 space-y-6">
                {categories.map((category, index) => {
                  const categoryName = category[type === 'indoor' ? 'Indoor' : 'Outdoor']
                  const categoryProductTypes = getProductTypesForCategory(categoryName)
                  // Use activeSection for scroll-based highlighting, fallback to currentCategory for hash-based
                  // Handle case-insensitive matching
                  const isActiveCategory = (activeSection &&
                    (activeSection.toLowerCase() === categoryName.toLowerCase() ||
                     activeSection === categoryName)) ||
                   (!activeSection && currentCategory === categoryName)

                  console.log('📊 [CATEGORY_NAV] Rendering category:', {
                    index,
                    categoryName,
                    isActiveCategory,
                    activeSection,
                    currentCategory,
                    categoryProductTypesCount: categoryProductTypes.length,
                    categoryNameLower: categoryName.toLowerCase(),
                    activeSectionLower: activeSection?.toLowerCase(),
                    type
                  })

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`space-y-3 rounded-lg p-3 transition-all duration-300 ${
                        isActiveCategory 
                          ? 'bg-gradient-to-r from-primary/15 to-primary/5 border-l-4 border-primary shadow-lg shadow-primary/10' 
                          : 'hover:bg-accent/30 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`#${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`text-base font-semibold transition-all duration-300 group ${
                            isActiveCategory 
                              ? 'text-primary drop-shadow-sm' 
                              : 'hover:text-primary text-foreground'
                          }`}
                          onClick={() => {
                            // Close sidebar on mobile after navigation
                            if (window.innerWidth < 1024) {
                              onToggle()
                            }
                          }}
                        >
                          <span className={`transition-all duration-300 ${
                            isActiveCategory 
                              ? 'underline decoration-primary decoration-2 underline-offset-4' 
                              : 'group-hover:underline decoration-primary decoration-2 underline-offset-4'
                          }`}>
                            {categoryName}
                          </span>
                        </Link>
                        <Badge 
                          variant={isActiveCategory ? "default" : "secondary"} 
                          className={`text-xs transition-all duration-300 ${
                            isActiveCategory 
                              ? 'bg-primary text-primary-foreground shadow-md' 
                              : 'hover:bg-primary/20'
                          }`}
                        >
                          {categoryProductTypes.length}
                        </Badge>
                      </div>

                      <div className={`ml-4 space-y-2 border-l-2 pl-4 transition-all duration-300 ${
                        isActiveCategory ? 'border-primary/50' : 'border-border/30'
                      }`}>
                        {categoryProductTypes.map((productType, ptIndex) => (
                          <Link
                            key={ptIndex}
                            href={`/${type}/${productType['producttype']}`}
                            className={`block text-sm transition-all duration-300 py-1 px-2 rounded-md -ml-2 ${
                              isActiveCategory 
                                ? 'text-primary/90 hover:text-primary hover:bg-primary/10 font-medium' 
                                : 'text-muted-foreground hover:text-primary hover:bg-accent/50'
                            }`}
                            onClick={() => {
                              // Close sidebar on mobile after navigation
                              if (window.innerWidth < 1024) {
                                onToggle()
                              }
                            }}
                          >
                            {productType['producttype']}
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