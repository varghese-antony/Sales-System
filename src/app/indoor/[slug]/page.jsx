"use client"
import React, {useState, useEffect} from 'react'
import { getProductsByType } from '@/lib/database/products'
import { motion } from "framer-motion"
import { ProductDetails } from "@/components/ProductDetails"
import ProductFilterModal from "@/components/ProductFilterModal"
import { ProductCard } from "@/components/ProductCard"
import { useProductFilters } from "@/hooks/useProductFilters"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Lightbulb, Home, ArrowLeft, RotateCcw, Filter, X } from "lucide-react"
import Link from "next/link"


export default function IndoorProductPage({ params }) {
  const { slug } = params;
  
  const [initialProducts, setInitialProducts] = useState([])
  const [finalProduct, setFinalProduct] = useState(null)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [error, setError] = useState(null)


  const productType = decodeURIComponent(slug).replace(/%20/g, ' ')

  const addIndoorTableField = (items) =>
    Array.isArray(items) ? items.map((item) => ({ ...item, table: 'indoor' })) : []

  // Initialize the product filters hook
  const {
    selectedFilters,
    isFilterModalOpen,
    availableOptions,
    filteredProducts,
    filteredProductCount,
    isLoading,
    openFilterModal,
    closeFilterModal,
    applyFilters,
    resetFilters,
    getFilterCount
  } = useProductFilters('indoor', productType, initialProducts)

  useEffect(() => {
    fetchInitialProducts()
  }, [])

  // Auto-select product if only one result after filtering
  useEffect(() => {
    if (filteredProducts.length === 1 && !finalProduct) {
      setFinalProduct(filteredProducts[0])
    }
  }, [filteredProducts, finalProduct])

  const fetchInitialProducts = async () => {
    setIsInitialLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await getProductsByType('indoor', productType)
      if (fetchError) throw fetchError
      const productsWithTable = addIndoorTableField(data || [])
      setInitialProducts(productsWithTable)
      if (productsWithTable.length === 0) {
        setError('No products found for this category.')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to load products. Please try again.')
      setInitialProducts([])
    }
    setIsInitialLoading(false)
  }

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...selectedFilters }
    delete newFilters[filterKey]
    applyFilters(newFilters)
  }

  const goBack = () => {
    if (finalProduct) {
      setFinalProduct(null)
      return
    }
  }

  // Show final product details
  if (finalProduct) {
    return <ProductDetails product={finalProduct} onBack={goBack} />
  }

  // Show loading state
  if (isInitialLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20'>
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading {productType} options...</p>
        </div>
      </div>
    )
  }

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
              Find your perfect lighting solution using our advanced filter system.
            </p>

            {/* Filter Button */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Button 
                onClick={openFilterModal}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter Products
                {getFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white text-blue-600">
                    {getFilterCount()}
                  </Badge>
                )}
              </Button>
              
              {getFilterCount() > 0 && (
                <Button variant="ghost" onClick={resetFilters} className="group">
                  <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" />
                  Reset All Filters
                </Button>
              )}
            </div>

            {/* Selected Filters */}
            {Object.keys(selectedFilters).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {Object.entries(selectedFilters).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="flex items-center gap-2 pr-1">
                    <span>{key}: {value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => handleRemoveFilter(key)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Product Count */}
            {!isLoading && (
              <p className="text-sm text-muted-foreground mb-6">
                {filteredProductCount} product{filteredProductCount !== 1 ? 's' : ''} available
              </p>
            )}
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

        {/* Filter Modal */}
        <ProductFilterModal
          isOpen={isFilterModalOpen}
          onClose={closeFilterModal}
          filters={selectedFilters}
          onApplyFilters={applyFilters}
          availableOptions={availableOptions}
          type="indoor"
          productType={productType}
        />

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-8"
          >
            <LoadingSpinner size="lg" />
          </motion.div>
        )}

        {/* Product Grid */}
        {!isLoading && !error && filteredProducts.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <ProductCard
                  variant="product"
                  product={product}
                  showSpecs={true}
                  onSelect={() => setFinalProduct(product)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredProducts.length === 0 && getFilterCount() > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Filter className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">No Products Match Your Filters</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Try adjusting your filter selections to see more products.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={openFilterModal} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Adjust Filters
              </Button>
              <Button onClick={resetFilters} variant="ghost">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All Filters
              </Button>
            </div>
          </motion.div>
        )}

        {/* No Products Available */}
        {!isInitialLoading && !error && initialProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Lightbulb className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">No Products Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any products in this category. Please try a different product type or contact our support team.
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </motion.div>
        )}


      </div>
    </div>
  )
}
