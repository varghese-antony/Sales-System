'use client'
import { useState, useEffect } from 'react'
import { getDistinctCategoriesV2, getProductNamesByCategoryV2, getProductsByCategoryV2 } from '@/lib/database/products-v2'
import { ProductCard } from "@/components/ProductCard"
import { Sun, Home, ArrowLeft, Shield, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CategoryNavigation } from '@/components/CategoryNavigation'

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

export default function Outdoor() {
  const [categories, setCategories] = useState([])
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([])
  const [categoryMinPrices, setCategoryMinPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState('')
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    // Function to get current category from hash
    const getCurrentCategory = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash
        if (hash) {
          // Convert hash back to category name
          const categoryFromHash = decodeURIComponent(hash.substring(1)).replace(/-/g, ' ')
          return categoryFromHash
        }
      }
      return ''
    }

    setCurrentCategory(getCurrentCategory())

    // Listen for hash changes
    const handleHashChange = () => {
      setCurrentCategory(getCurrentCategory())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Intersection Observer for scroll-based section detection
  useEffect(() => {
    if (categories.length === 0) return

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.1
    }

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          const sectionId = entry.target.id
          if (sectionId && sectionId !== 'outdoor-grid') {
            const categoryName = decodeURIComponent(sectionId).replace(/-/g, ' ')
            setActiveSection(categoryName)
          }
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    const sections = document.querySelectorAll('[id]')

    sections.forEach((section) => {
      if (section.id && section.id !== 'outdoor-grid') {
        observer.observe(section)
      }
    })

    return () => {
      sections.forEach((section) => {
        if (section.id && section.id !== 'outdoor-grid') {
          observer.unobserve(section)
        }
      })
    }
  }, [categories])

  useEffect(() => {
    if (categories.length === 0) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.3 // 30% from top

      // Find the section that's currently in view
      let currentActiveSection = ''

      categories.forEach((category) => {
        const categoryName = category['sub_category']
        const elementId = categoryName.toLowerCase().replace(/\s+/g, '-')
        const element = document.getElementById(elementId)

        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY
          const elementBottom = elementTop + rect.height

          // Check if scroll position is within the element bounds
          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            currentActiveSection = categoryName
          }
        }
      })

      // Only update if we found a section and it's different from current
      if (currentActiveSection && currentActiveSection !== activeSection) {
        setActiveSection(currentActiveSection)
      }
    }

    // Throttle scroll events for better performance
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

    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScrollThrottled)
    }
  }, [categories, activeSection]) // Include activeSection to prevent infinite loops

  useEffect(() => {
    async function fetchCategoriesAndProducts() {
      try {
        setLoading(true)
        
        // First fetch: Get distinct categories from v2 table
        const { data: categoriesData, error: categoriesError } = await getDistinctCategoriesV2('outdoor')
        if (categoriesError) {
          throw new Error(`Failed to fetch categories: ${categoriesError}`)
        }
        const categories = categoriesData || []

        setCategories(categories)

        const { data: productNamesData, error: productNamesError } = await getProductNamesByCategoryV2('outdoor')
        if (productNamesError) {
          throw new Error(`Failed to fetch product names by category: ${productNamesError}`)
        }
        const productNames = productNamesData || []
        
        // Fetch sample images for each product name
        const productNamesWithImages = await Promise.all(
          productNames.flatMap(categoryData => 
            categoryData.product_names.map(async (productName) => {
              try {
                const { data: sampleProducts, error: sampleError } = await getProductsByCategoryV2('outdoor', categoryData.sub_category, { 
                  limit: 1,
                  filters: { productName: productName }
                })
                if (sampleError) {
                  console.error('Error fetching sample product:', sampleError)
                  return {
                    sub_category: categoryData.sub_category,
                    product_name: productName,
                    sampleImage: null
                  }
                }
                const sampleProduct = sampleProducts?.[0]
                return {
                  sub_category: categoryData.sub_category,
                  product_name: productName,
                  sampleImage: sampleProduct?.photo || null
                }
              } catch (error) {
                console.error('Error fetching sample image:', error)
                return {
                  sub_category: categoryData.sub_category,
                  product_name: productName,
                  sampleImage: null
                }
              }
            })
          )
        )

        // Combine categories with their product names
        setCategoriesWithProducts(productNamesWithImages)

        // Calculate minimum prices for each category
        const pricesMap = {}
        await Promise.all(
          categories.map(async (category) => {
            const { data: allProducts } = await getProductsByCategoryV2('outdoor', category.sub_category)
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
        console.error('Error fetching outdoor data:', error)
        setError('Failed to load outdoor products. Please try again later.')
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
          <p className="text-muted-foreground">Loading outdoor lighting collection...</p>
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
    <div className='min-h-screen bg-gradient-to-br from-green-50/50 via-teal-50/30 to-emerald-50/50 dark:from-green-950/20 dark:via-teal-950/10 dark:to-emerald-950/20 relative'>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="outdoor-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#outdoor-grid)" />
        </svg>
      </div>

      <CategoryNavigation
        type="outdoor"
        categories={categories}
        categoriesWithProducts={categoriesWithProducts}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/outdoor'}
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
            <span className="text-primary font-medium">Outdoor Lighting</span>
          </div>

          {/* Title */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sun className="w-16 h-16 text-primary" />
            </motion.div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-gradient bg-gradient-to-r from-green-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Outdoor Lighting
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Illuminate your exterior spaces with our weather-resistant outdoor lighting collection. 
            From landscape lighting to security fixtures, create stunning outdoor environments.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="gradient" size="lg" className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600">
              <Shield className="w-4 h-4" />
              Weather Resistant
            </Badge>
            <Badge variant="outline" size="lg" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Durable Design
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
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <Sun className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 
                      id={category['sub_category'].toLowerCase().replace(/\s+/g, '-')} 
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categoriesWithProducts
                    .filter(productType => productType.sub_category === category.sub_category)
                    .map((productType, typeIndex) => (
                      <motion.div
                        key={typeIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: typeIndex * 0.1 }}
                      >
                        <ProductCard 
                          title={productType['product_name']} 
                          description={`Explore our ${productType['product_name'].toLowerCase()} options`}
                          link={`/outdoor/${encodeURIComponent(productType['product_name'])}`}
                          icon={<Sun className="w-6 h-6" />}
                          gradient="from-green-500 to-teal-600"
                          image={productType.sampleImage}
                          startingPrice={categoryMinPrices[category.sub_category]}
                        />
                      </motion.div>
                    ))
                  }
                </div>

                {/* Empty State */}
                {categoriesWithProducts.filter(productType => productType.sub_category === category.sub_category).length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Sun className="w-8 h-8 text-muted-foreground" />
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
