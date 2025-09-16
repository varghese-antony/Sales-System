"use client"

import { motion } from "framer-motion"
import { Check, Zap, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  totalSteps 
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

  return (
    <div className="space-y-8">
      {/* Header */}
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
                  relative w-full h-auto p-6 flex flex-col items-center gap-3 text-center
                  transition-all duration-300 group
                  ${isSelected 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 border-transparent' 
                    : 'hover:border-primary/50 hover:shadow-md hover:bg-accent/50'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => !isLoading && onSelect(value === 'N/A' ? null : value)}
                disabled={isLoading}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                {/* Icon */}
                {icon && (
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

                {/* Value */}
                <div className="space-y-1">
                  <div className={`
                    font-semibold text-sm md:text-base leading-tight
                    ${isSelected ? 'text-white' : 'text-foreground'}
                  `}>
                    {value === 'N/A' ? 'Not Specified' : value}
                  </div>
                  
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