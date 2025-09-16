"use client"

import { motion } from "framer-motion"
import { Check, Download, Share2, Heart, ArrowLeft, Zap, Shield, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export function ProductDetails({ product, onBack }) {
  const excludedKeys = ['MOQ', 'COST-China/DDP-USA', 'COST-Thailand/Vietnam', 'Photo']
  const productKeys = Object.keys(product).filter(key => !excludedKeys.includes(key))
  
  const getKeyIcon = (key) => {
    if (key.toLowerCase().includes('power') || key.toLowerCase().includes('watt')) return <Zap className="w-4 h-4" />
    if (key.toLowerCase().includes('certification')) return <Award className="w-4 h-4" />
    if (key.toLowerCase().includes('warranty') || key.toLowerCase().includes('backup')) return <Shield className="w-4 h-4" />
    return null
  }

  const getKeyCategory = (key) => {
    const powerKeys = ['Power (W)', 'Voltage', 'Efficacy (lm/W)', 'Lumen']
    const designKeys = ['Size', 'Material Finish', 'Mounting', 'CCT', 'CRI/RA']
    const featureKeys = ['Dimming Type', 'Sensor(Microwave/Bluetooth)', 'Remote Control', 'Eme. Backup-Battery']
    const certKeys = ['Certifications', 'Installation Kits', 'Adjustment Dial']

    if (powerKeys.includes(key)) return 'power'
    if (designKeys.includes(key)) return 'design'
    if (featureKeys.includes(key)) return 'features'
    if (certKeys.includes(key)) return 'certification'
    return 'general'
  }

  const categoryColors = {
    power: 'from-yellow-500 to-orange-600',
    design: 'from-blue-500 to-purple-600',
    features: 'from-green-500 to-teal-600',
    certification: 'from-purple-500 to-pink-600',
    general: 'from-gray-500 to-slate-600'
  }

  const categoryNames = {
    power: 'Power & Performance',
    design: 'Design & Aesthetics',
    features: 'Smart Features',
    certification: 'Certifications',
    general: 'General Information'
  }

  // Group keys by category
  const groupedKeys = productKeys.reduce((acc, key) => {
    const category = getKeyCategory(key)
    if (!acc[category]) acc[category] = []
    acc[category].push(key)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <div className='container mx-auto py-12 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={onBack} className="group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Selection
            </Button>
          </div>

          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg"
              >
                <Check className="w-8 h-8" />
              </motion.div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Perfect Match Found!
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Here are the complete specifications for your selected lighting solution.
            </p>

            {/* Action Buttons */}
            {/* <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Button variant="gradient" size="lg" className="group">
                <Download className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Download Specs
              </Button>
              <Button variant="outline" size="lg" className="group">
                <Share2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Share Product
              </Button>
              <Button variant="ghost" size="lg" className="group">
                <Heart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Save to Favorites
              </Button>
            </div> */}
          </div>
        </motion.div>

        {/* Product Specifications */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {Object.entries(groupedKeys).map(([category, keys]) => (
            <motion.div key={category} variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardHeader className={`bg-gradient-to-r ${categoryColors[category]} text-white`}>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    {getKeyIcon(keys[0]) || <Award className="w-5 h-5" />}
                    {categoryNames[category]}
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {keys.length} specs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-0">
                    {keys.map((key, index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                          flex items-center justify-between p-6 border-b border-border/50 last:border-b-0
                          hover:bg-accent/50 transition-colors duration-200
                          ${index % 2 === 0 ? 'bg-muted/20' : 'bg-background'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {getKeyIcon(key) && (
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[category]} text-white`}>
                              {getKeyIcon(key)}
                            </div>
                          )}
                          <span className="font-semibold text-foreground">{key}:</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-medium">
                            {product[key] || (
                              <Badge variant="outline" className="text-muted-foreground">
                                Not Specified
                              </Badge>
                            )}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16 space-y-6"
        >
          <div className="p-6 glass-effect rounded-2xl border border-border/50 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-3">Ready to Order?</h3>
            {/* <p className="text-muted-foreground mb-4">
              Contact our lighting specialists for pricing, availability, and installation support.
            </p> */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="gradient" size="lg">
                Make Enquiry
              </Button>
              {/* <Button variant="outline" size="lg">
                Contact Support
              </Button> */}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}