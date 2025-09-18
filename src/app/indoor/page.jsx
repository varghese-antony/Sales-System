'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ProductCard } from "@/components/ProductCard"
import { CategoryNavigation } from "@/components/CategoryNavigation"
import { Lightbulb, Home, ArrowLeft, Zap, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from 'next/link'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

export default function Indoor() {
  const [categories, setCategories] = useState([])
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    async function fetchCategoriesAndProducts() {
      try {
        setLoading(true)

        // First fetch: Get distinct categories
        const categoriesResponse = await fetch('https://n8n.werposolutions.com/webhook/get-distinct?table=indoor&column=Indoor')
        if (!categoriesResponse.ok) {
          throw new Error(`HTTP error! status: ${categoriesResponse.status}`)
        }
        const categoriesData = await categoriesResponse.json()

        // Set categories immediately for UI
        setCategories(categoriesData)

        // Second fetch: Get distinct product types for each category with sample images
        const productTypesResponse = await fetch('https://n8n.werposolutions.com/webhook/get-distinct?table=indoor&column=Product Type')
        if (!productTypesResponse.ok) {
          throw new Error(`HTTP error! status: ${productTypesResponse.status}`)
        }
        const productTypesData = await productTypesResponse.json()

        // Fetch sample images for each product type
        const productTypesWithImages = await Promise.all(
          productTypesData.map(async (productType) => {
            try {
              const sampleResponse = await fetch(`https://n8n.werposolutions.com/webhook/get-product?table=indoor&product=${productType['Product Type']}&limit=1`)
              if (sampleResponse.ok) {
                const sampleData = await sampleResponse.json()
                const sampleProduct = sampleData[0]
                return {
                  ...productType,
                  sampleImage: sampleProduct?.Photo || null
                }
              }
            } catch (error) {
              console.error('Error fetching sample image:', error)
            }
            return productType
          })
        )

        // Combine categories with their product types
        setCategoriesWithProducts(productTypesWithImages)

      } catch (error) {
        console.error('Error fetching indoor data:', error)
        setError('Failed to load indoor products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCategoriesAndProducts()
  }, [])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading indoor lighting collection...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto py-12'>
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20'>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="indoor-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#indoor-grid)" />
        </svg>
      </div>

      {/* Category Navigation Sidebar */}
      <CategoryNavigation 
        type="indoor" 
        categories={categories} 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className={`py-12 px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-300 ${
        isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'
      }`}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-primary font-medium">Indoor Lighting</span>
          </div>

          {/* Title */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Lightbulb className="w-16 h-16 text-primary" />
            </motion.div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Indoor Lighting
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Transform your interior spaces with our premium indoor lighting collection.
            From elegant chandeliers to modern pendant lights, find the perfect illumination for every room.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="gradient" size="lg" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Premium Quality
            </Badge>
            <Badge variant="outline" size="lg" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Energy Efficient
            </Badge>
            <Badge variant="secondary" size="lg">
              {categories.length} Categories
            </Badge>
          </div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {categories.map((category, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group"
            >
              <div className='glass-effect border border-border/50 hover:border-primary/30 rounded-3xl p-8 md:p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10'>
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <Lightbulb className="w-8 h-8" />
                  </div>
                  <div>
                    <h2
                      id={category['Indoor'].toLowerCase().replace(/\s+/g, '-')}
                      className="text-3xl md:text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-300"
                    >
                      {category.Indoor}
                    </h2>
                    <p className="text-muted-foreground mt-2">
                      Discover our {category.Indoor.toLowerCase()} collection
                    </p>
                  </div>
                </div>

                {/* Decorative Line */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categoriesWithProducts
                    .filter(productType => productType.Indoor === category.Indoor)
                    .map((productType, typeIndex) => (
                      <motion.div
                        key={typeIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: typeIndex * 0.1 }}
                      >
                        <ProductCard
                          title={productType['Product Type']}
                          description={`Explore our ${productType['Product Type'].toLowerCase()} options`}
                          link={`/indoor/${productType['Product Type']}`}
                          icon={<Lightbulb className="w-6 h-6" />}
                          gradient="from-blue-500 to-purple-600"
                          image={productType.sampleImage}
                        />
                      </motion.div>
                    ))
                  }
                </div>

                {/* Empty State */}
                {categoriesWithProducts.filter(productType => productType.Indoor === category.Indoor).length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Lightbulb className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No products available in this category yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16"
        >
          <Link href="/">
            <Button variant="outline" size="lg" className="group">
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
