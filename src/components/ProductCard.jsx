"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRight, Zap, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { getOptimizedImageUrl, getPlaceholderImage } from "@/lib/image-utils"
import { ImageWithLoading } from "@/components/ui/image-with-loading"

export function ProductCard({ title, description, link, icon, gradient = "from-blue-500 to-purple-600", image }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const optimizedImageUrl = image ? getOptimizedImageUrl(image) : null

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
