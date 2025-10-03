"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRight, Zap, Image as ImageIcon, Eye, Package } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { getOptimizedImageUrl, getPlaceholderImage } from "@/lib/image-utils"
import { ImageWithLoading } from "@/components/ui/image-with-loading"

export function ProductCard({ 
  title, 
  description, 
  link, 
  icon, 
  gradient = "from-blue-500 to-purple-600", 
  image,
  // New props for product variant
  product,
  onSelect,
  showSpecs = false,
  variant = "category"
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Determine image source based on variant
  let optimizedImageUrl = null;
  if (variant === "product" && product) {
    const productImage = product.Photo || product.image_url;
    optimizedImageUrl = productImage ? getOptimizedImageUrl(productImage) : null;
  } else if (image) {
    optimizedImageUrl = getOptimizedImageUrl(image);
  }
  
  // Product specifications to display
  const getProductSpecs = () => {
    if (!product || !showSpecs) return [];
    
    const specs = [];
    if (product.Size) specs.push({ label: 'Size', value: product.Size });
    if (product.power_w || product['Power (W)']) specs.push({ label: 'Power', value: `${product.power_w || product['Power (W)']}` });
    if (product.CCT) specs.push({ label: 'CCT', value: product.CCT });
    if (product.Lumen) specs.push({ label: 'Lumen', value: product.Lumen });
    
    return specs.slice(0, 4); // Show max 4 specs
  };
  
  const handleCardClick = (e) => {
    if (variant === "product" && onSelect) {
      e.preventDefault();
      onSelect(product);
    }
  };

  // Render different content based on variant
  if (variant === "product") {
    return (
      <Card 
        className="relative overflow-hidden transition-all duration-300 ease-out border-2 border-transparent hover:border-primary/50 glass-effect cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Animated Border */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-lg border-2 border-primary/30 animate-pulse" />
        </div>
        
        {/* Product Image */}
        <div className="h-48 bg-muted/20 rounded-t-lg relative overflow-hidden">
          {optimizedImageUrl ? (
            <ImageWithLoading
              src={optimizedImageUrl}
              alt={product?.model_number || product?.producttype || 'Product'}
              className="w-full h-full object-cover"
              containerClassName="h-full"
              loadingClassName="rounded-t-lg"
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/10 to-muted/20">
              <Package className="w-16 h-16 text-muted-foreground/40" />
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Eye className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        
        <CardHeader className="relative z-10 p-6">
          <CardTitle className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {product?.model_number || product?.producttype || 'Unknown Product'}
          </CardTitle>
          
          {product?.producttype && product?.model_number && (
            <p className="text-sm text-muted-foreground mb-3">
              {product.producttype}
            </p>
          )}
          
          {/* Product Specifications */}
          {showSpecs && getProductSpecs().length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {getProductSpecs().map((spec, index) => (
                <div key={index} className="text-xs">
                  <span className="text-muted-foreground">{spec.label}:</span>
                  <span className="ml-1 font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="relative z-10 p-6 pt-0">
          <Button 
            variant="ghost" 
            className="w-full group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <span className="mr-2">View Details</span>
            <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
          </Button>
        </CardContent>
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </Card>
    );
  }
  
  // Default category variant
  return (
    <Link href={link} className="block group">
      <Card 
        className="relative overflow-hidden transition-all duration-300 ease-out border-2 border-transparent hover:border-primary/50 glass-effect"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated Border */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-lg border-2 border-primary/30 animate-pulse" />
        </div>
        
        {/* Product Image */}
        {optimizedImageUrl && (
          <ImageWithLoading
            src={optimizedImageUrl}
            alt={title}
            className="w-full h-full object-contain"
            containerClassName="h-48 rounded-t-lg"
            loadingClassName="rounded-t-lg"
          />
        )}
        
        <CardHeader className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
              {icon}
            </div>
            {optimizedImageUrl ? (
              <ImageIcon className={`w-6 h-6 text-primary transition-all duration-300 ${isHovered ? 'scale-125 text-green-500' : ''}`} />
            ) : (
              <Zap className={`w-6 h-6 text-primary transition-all duration-300 ${isHovered ? 'scale-125 text-yellow-500' : ''}`} />
            )}
          </div>
          <CardTitle className="text-2xl font-bold mb-3 group-hover:text-gradient transition-all duration-300">
            {title}
          </CardTitle>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </CardHeader>
        
        <CardContent className="relative z-10 p-8 pt-0">
          <Button 
            variant="ghost" 
            className="w-full group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <span className="mr-2">Explore Collection</span>
            <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
          </Button>
        </CardContent>
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </Card>
    </Link>
  )
}
