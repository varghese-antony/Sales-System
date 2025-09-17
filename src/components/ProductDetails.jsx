"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Download, FileText, Award, ExternalLink, Zap, Shield, Settings, Info, ShoppingCart, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/contexts/CartContext"

export function ProductDetails({ product, onBack }) {
  const { addToCart, items } = useCart()
  const [isAdded, setIsAdded] = useState(false)
  
  const isInCart = items.some(item => item.id === product.id || item.ID === product.ID)
  
  const handleAddToCart = () => {
    addToCart(product)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }
  
  const excludedKeys = ['MOQ', 'COST-China/DDP-USA', 'COST-Thailand/Vietnam', 'Photo', 'Cut Sheet']
  const productKeys = Object.keys(product).filter(key => !excludedKeys.includes(key))
  
  // Key specifications to highlight
  const keySpecs = ['Size', 'Power (W)', 'Voltage', 'CCT', 'Lumen', 'Material Finish']
  const highlightedSpecs = keySpecs.filter(key => product[key]).slice(0, 4)
  
  const getKeyIcon = (key) => {
    if (key.toLowerCase().includes('power') || key.toLowerCase().includes('watt') || key.toLowerCase().includes('voltage')) return <Zap className="w-4 h-4" />
    if (key.toLowerCase().includes('certification')) return <Award className="w-4 h-4" />
    if (key.toLowerCase().includes('warranty') || key.toLowerCase().includes('backup')) return <Shield className="w-4 h-4" />
    if (key.toLowerCase().includes('dimming') || key.toLowerCase().includes('sensor') || key.toLowerCase().includes('remote')) return <Settings className="w-4 h-4" />
    return <Info className="w-4 h-4" />
  }

  const getKeyCategory = (key) => {
    const powerKeys = ['Power (W)', 'Voltage', 'Efficacy (lm/W)', 'Lumen']
    const designKeys = ['Size', 'Material Finish', 'Mounting', 'CCT', 'CRI/RA']
    const featureKeys = ['Dimming Type', 'Sensor(Microwave/Bluetooth)', 'Remote Control', 'Eme. Backup-Battery', 'Plug-in Sensor', 'Junction Cover', 'Adjustment Dial']
    const certKeys = ['Certifications', 'Installation Kits']

    if (powerKeys.includes(key)) return 'power'
    if (designKeys.includes(key)) return 'design'
    if (featureKeys.includes(key)) return 'features'
    if (certKeys.includes(key)) return 'certification'
    return 'general'
  }

  // Group keys by category
  const groupedKeys = productKeys.reduce((acc, key) => {
    const category = getKeyCategory(key)
    if (!acc[category]) acc[category] = []
    acc[category].push(key)
    return acc
  }, {})

  const categoryTitles = {
    power: 'Power & Performance',
    design: 'Design & Specifications',
    features: 'Smart Features',
    certification: 'Certifications & Installation',
    general: 'Additional Information'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack} className="group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Selection
          </Button>
          
          <div className="flex gap-2">
            {product['Cut Sheet'] && (
              <Button variant="outline" asChild>
                <a href={product['Cut Sheet']} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" />
                  View Cut Sheet
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
            <Button 
              variant="default"
              onClick={handleAddToCart}
              disabled={isAdded}
              className="min-w-[120px]"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Added!
                </>
              ) : isInCart ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add Another
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Key Specs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Title */}
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {product['Product Type'] || 'Lighting Product'}
              </h1>
              <div className="flex flex-wrap gap-2">
                {product['Indoor'] && (
                  <Badge variant="secondary">{product['Indoor']}</Badge>
                )}
                {product['Outdoor'] && (
                  <Badge variant="secondary">{product['Outdoor']}</Badge>
                )}
              </div>
            </div>

            {/* Key Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {highlightedSpecs.map((key) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
                    <span className="text-sm font-medium text-muted-foreground">{key}</span>
                    <span className="text-sm font-semibold">{product[key]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Downloads Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product['Cut Sheet'] && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={product['Cut Sheet']} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Product Cut Sheet
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  IES File (Coming Soon)
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Award className="w-4 h-4 mr-2" />
                  Certifications (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Specs */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">Complete Specifications</h2>
            
            {Object.entries(groupedKeys).map(([category, keys]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getKeyIcon(keys[0])}
                    {categoryTitles[category]}
                    <Badge variant="outline" className="ml-auto">
                      {keys.length} specs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {keys.map((key) => (
                      <div key={key} className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">{key}</span>
                        <span className="text-sm font-semibold">
                          {product[key] || (
                            <span className="text-muted-foreground italic">Not specified</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>


    </div>
  )
}