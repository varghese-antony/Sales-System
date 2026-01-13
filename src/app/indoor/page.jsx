'use client'
import { useState, useEffect } from 'react'
import { getDistinctCategoriesV2, getProductNamesByCategoryV2, getProductsByCategoryV2 } from '@/lib/database/products-v2'
import { ProductCard } from "@/components/ProductCard"
import { Lightbulb, Home, ArrowLeft, Zap, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { LoadingSpinner } from "@/components/ui/loading"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from 'framer-motion'
import { CategoryNavigation } from "@/components/CategoryNavigation"


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

const MARKUP_PERCENTAGE_DEFAULT = 30 // 30% default markup

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

const calculateBasePriceWithMarkup = (product) => {
  // Get base cost
  const baseCost = parseCostValue(product.cost_china_ddp_usa ?? product.cost_thailand_vietnam ?? 0)
  
  // Get markup percentage
  const productMarkup = product.markup_percentage
  let markupPercentage = MARKUP_PERCENTAGE_DEFAULT
  if (productMarkup !== null && productMarkup !== undefined) {
    const parsed = typeof productMarkup === 'number' 
      ? productMarkup 
      : parseFloat(productMarkup)
    if (Number.isFinite(parsed) && parsed > 0) {
      markupPercentage = parsed
    }
  }
  
  // Apply markup to base cost
  const baseCostWithMarkup = baseCost * (1 + markupPercentage / 100)
  
  return baseCostWithMarkup
}

export default function Indoor() {
  
  const [categories, setCategories] = useState([])
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([])
  const [categoryMinPrices, setCategoryMinPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState('')
  const [activeSection, setActiveSection] = useState('')

  // Handle hash-based category navigation
  useEffect(() => {
    const getCurrentCategory = () => {
      if (typeof window === 'undefined') return ''
      const hash = window.location.hash
      return hash ? decodeURIComponent(hash.substring(1)).replace(/-/g, ' ') : ''
    }

    setCurrentCategory(getCurrentCategory())
    const handleHashChange = () => setCurrentCategory(getCurrentCategory())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Scroll-based active section detection
  useEffect(() => {
    if (categories.length === 0) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.3
      let currentActiveSection = ''

      categories.forEach((category) => {
        const elementId = category.sub_category.toLowerCase().replace(/\s+/g, '-')
        const element = document.getElementById(elementId)
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY
          const elementBottom = elementTop + rect.height
          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            currentActiveSection = category.sub_category
          }
        }
      })

      if (currentActiveSection && currentActiveSection !== activeSection) {
        setActiveSection(currentActiveSection)
      }
    }

    let ticking = false
    const handleScrollThrottled = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScrollThrottled, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScrollThrottled)
  }, [categories, activeSection])

  // Fetch categories and products
  useEffect(() => {
    
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await getDistinctCategoriesV2('indoor')
        
        if (categoriesError) {
          console.error('[Indoor Page] Categories error:', categoriesError)
          throw new Error(`Failed to fetch categories: ${categoriesError}`)
        }
        setCategories(categoriesData || [])

        // Fetch product names by category
        const { data: productNamesData, error: productNamesError } = await getProductNamesByCategoryV2('indoor')
        
        if (productNamesError) {
          console.error('[Indoor Page] Product names error:', productNamesError)
          throw new Error(`Failed to fetch product names: ${productNamesError}`)
        }

        // Fetch sample images for each product
        const productNamesWithImages = await Promise.all(
          productNamesData.flatMap(categoryData =>
            categoryData.product_names.map(async (productName) => {
              const { data: sampleProducts } = await getProductsByCategoryV2('indoor', categoryData.sub_category, {
                limit: 1,
                filters: { productName }
              })
              return {
                sub_category: categoryData.sub_category,
                product_name: productName,
                sampleImage: sampleProducts?.[0]?.photo || null
              }
            })
          )
        )

        setCategoriesWithProducts(productNamesWithImages)

        // Calculate minimum prices for each category
        const pricesMap = {}
        await Promise.all(
          categoriesData.map(async (category) => {
            const { data: allProducts } = await getProductsByCategoryV2('indoor', category.sub_category)
            if (allProducts && allProducts.length > 0) {
              const prices = allProducts
                .map(product => calculateBasePriceWithMarkup(product))
                .filter(price => price > 0)
              
              if (prices.length > 0) {
                pricesMap[category.sub_category] = Math.min(...prices)
              }
            }
          })
        )
        setCategoryMinPrices(pricesMap)
      } catch (error) {
        console.error('[Indoor Page] Error fetching indoor data:', error)
        console.error('[Indoor Page] Error stack:', error.stack)
        setError('Failed to load indoor products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
    <div className='min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 relative'>
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

      <CategoryNavigation
        type="indoor"
        categories={categories}
        categoriesWithProducts={categoriesWithProducts}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/indoor'}
        currentCategory={currentCategory}
        activeSection={activeSection}
      />

      <div className={`py-4 px-4 sm:px-6 lg:px-8 relative z-10 transition-all duration-300 ${
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
                      id={category.sub_category.toLowerCase().replace(/\s+/g, '-')}
                      className="text-3xl md:text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-300"
                    >
                      {category.sub_category}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-muted-foreground">
                        Discover our {category.sub_category.toLowerCase()} collection
                      </p>
                      {categoryMinPrices[category.sub_category] && (
                        <Badge variant="secondary" className="ml-auto">
                          Starting from ${categoryMinPrices[category.sub_category].toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decorative Line */}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

                {/* Products Grid */}
                {(() => {
                  const categoryProducts = categoriesWithProducts.filter(
                    productType => productType.sub_category === category.sub_category
                  )
                  
                  if (categoryProducts.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Lightbulb className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No products available in this category yet.</p>
                      </div>
                    )
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {categoryProducts.map((productType, typeIndex) => (
                        <motion.div
                          key={typeIndex}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: typeIndex * 0.1 }}
                        >
                          <ProductCard
                            title={productType.product_name}
                            description={`Explore our ${productType.product_name.toLowerCase()} options`}
                            link={`/indoor/${encodeURIComponent(productType.product_name)}`}
                            icon={<Lightbulb className="w-6 h-6" />}
                            gradient="from-blue-500 to-purple-600"
                            image={productType.sampleImage}
                            startingPrice={categoryMinPrices[category.sub_category]}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )
                })()}
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
