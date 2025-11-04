"use client"

import { useMemo } from 'react'
import { motion } from "framer-motion"
import { Check, Zap, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getOptimizedImageUrl } from "@/lib/image-utils"
import { ImageWithLoading } from "@/components/ui/image-with-loading"
import { fieldMapping } from '@/lib/database/products'

/**
 * @deprecated This component was previously used for step-by-step product filtering.
 * The filtering system has been replaced with ProductFilterModal.
 * This component is kept for potential future use cases but is not currently used in the application.
 * Consider removing if no other use cases emerge.
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
}

export function OptionSelector({ 
  title, 
  options = [], 
  onSelect, 
  selectedValue, 
  isLoading = false,
  description,
  step,
  totalSteps,
  products = []
}) {
  const getOptionIcon = (value) => {
    if (value?.toString().toLowerCase().includes('led')) return <Zap className="w-4 h-4" />
    if (value?.toString().toLowerCase().includes('w')) return <Zap className="w-4 h-4" />
    return null
  }

  const getOptionVariant = (value, index) => {
    const variants = ['default', 'secondary', 'outline']
    return variants[index % variants.length]
  }

  const norm = v => (v ?? '').toString().trim().toLowerCase();

  const getModelNumbers = (value) => {
    // Find all products that match this option value and have model numbers
    const matchingProducts = products.filter(p => norm(p[title]) === norm(value) && p.model_number);

    // Extract unique model numbers
    const modelNumbers = [...new Set(matchingProducts.map(product => product.model_number))]

    return modelNumbers
  }

  const getProductImage = (value) => {
    // Find a product that matches this option value and has an image
    const normalizedValue = norm(value);
    const match = products.find(p => {
      const productValue = norm(p[title]);
      if (productValue !== normalizedValue) return false;
      
      // Check if product has any image field
      const imageFields = ['photo', 'Photo', 'image', 'image_url', 'thumbnail'];
      return imageFields.some(field => p[field]);
    });
    
    if (!match) return null;
    
    // Return the first available image
    return match.photo || match.Photo || match.image || match.image_url || match.thumbnail || null;
  };

  const modelMap = useMemo(() => {
    const map = {};
    products.forEach(product => {
      const normalizedTitle = norm(product[title]);
      if (product.model_number) {
        if (!map[normalizedTitle]) {
          map[normalizedTitle] = new Set();
        }
        map[normalizedTitle].add(product.model_number);
      }
    });
    // Convert sets to arrays
    Object.keys(map).forEach(key => {
      map[key] = Array.from(map[key]);
    });
    return map;
  }, [products, title]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        {/* Progress Indicator */}
        {step && totalSteps && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
            </div>
            <div className="w-full max-w-md mx-auto bg-muted rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Select <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{title}</span>
        </h2>
        
        {description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </motion.div>

      {/* Options Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto"
      >
        {options.map((value, index) => {
          const isSelected = selectedValue === value
          const icon = getOptionIcon(value)
          const productImage = getProductImage(value)
          const modelNumbers = modelMap[norm(value)] || []

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={isSelected ? "default" : "outline"}
                className={`
                  relative w-full h-auto p-4 flex flex-col items-center gap-3 text-center
                  transition-all duration-300 group overflow-hidden
                  ${isSelected
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 border-transparent'
                    : 'hover:border-primary/50 hover:shadow-md hover:bg-accent/50'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${productImage ? 'min-h-[200px]' : 'min-h-[120px]'}
                `}
                onClick={() => !isLoading && onSelect(value === 'N/A' ? null : value)}
                disabled={isLoading}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                {/* Product Image */}
                {productImage && (
                  <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden">
                    <ImageWithLoading
                      src={getOptimizedImageUrl(productImage)}
                      alt={`${value} example`}
                      className="w-full h-full object-contain"
                      containerClassName="w-full h-full rounded-lg"
                      loadingClassName="rounded-lg"
                    />
                    <div className={`
                      absolute inset-0 transition-opacity duration-300 pointer-events-none
                      ${isSelected
                        ? 'bg-blue-500/20'
                        : 'bg-black/0 group-hover:bg-black/10'
                      }
                    `} />
                  </div>
                )}

                {/* Icon (only show if no image) */}
                {!productImage && icon && (
                  <div className={`
                    p-2 rounded-lg transition-colors duration-300
                    ${isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                    }
                  `}>
                    {icon}
                  </div>
                )}

                {/* Value and Model Numbers */}
                <div className="space-y-2">
                  <div className={`
                    font-semibold text-sm md:text-base leading-tight
                    ${isSelected ? 'text-white' : 'text-foreground'}
                  `}>
                    {value === 'N/A' ? 'Not Specified' : value}
                  </div>

                  {/* Model Numbers */}
                  {modelNumbers.length > 0 && (
                    <div className={`
                      text-xs leading-relaxed
                      ${isSelected ? 'text-white/80' : 'text-muted-foreground'}
                    `}>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {modelNumbers.slice(0, 2).map((modelNumber, idx) => (
                          <span
                            key={idx}
                            className={`
                              px-2 py-1 rounded-md
                              ${isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-muted text-muted-foreground'
                              }
                            `}
                          >
                            {modelNumber}
                          </span>
                        ))}
                        {modelNumbers.length > 2 && (
                          <span
                            className={`
                              px-2 py-1 rounded-md text-xs
                              ${isSelected
                                ? 'bg-white/10 text-white/60'
                                : 'bg-muted/50 text-muted-foreground/60'
                              }
                            `}
                            title={`And ${modelNumbers.length - 2} more model${modelNumbers.length - 2 > 1 ? 's' : ''}`}
                          >
                            +{modelNumbers.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {value !== 'N/A' && value?.toString().includes('W') && (
                    <Badge
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      className={isSelected ? 'bg-white/20 text-white border-white/30' : ''}
                    >
                      Power Rating
                    </Badge>
                  )}
                </div>

                {/* Hover Effect */}
                <div className={`
                  absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  ${!isSelected ? 'bg-gradient-to-br from-blue-500/5 to-purple-600/5' : ''}
                `} />
              </Button>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Processing your selection...</span>
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Info className="w-4 h-4 mr-2" />
              Need help choosing?
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select the option that best matches your requirements. You can always go back to change your selection.</p>
          </TooltipContent>
        </Tooltip>
      </motion.div> */}
    </div>
  )
}