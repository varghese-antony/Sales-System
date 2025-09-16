"use client"

import { motion } from "framer-motion"
import { Lightbulb, Sparkles, Star, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
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

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <Badge variant="gradient" size="lg" className="inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Premium Lighting Collection
            <Sparkles className="w-4 h-4" />
          </Badge>
        </motion.div>

        {/* Main Heading */}
        <motion.div variants={itemVariants} className="mb-8">
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
              <Lightbulb className="w-16 h-16 md:w-20 md:h-20 text-primary" />
            </motion.div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            <span className="text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
              Illuminate
            </span>
            <br />
            <span className="text-foreground">Your Space</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div variants={itemVariants} className="mb-12">
          <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light">
            Discover our curated collection of premium indoor and outdoor lighting solutions. 
            <span className="text-primary font-medium"> Modern designs</span> that transform spaces with 
            <span className="text-primary font-medium"> exceptional quality</span> and style.
          </p>
        </motion.div>

        {/* Trust Indicators */}
        {/* <motion.div variants={itemVariants} className="mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </motion.div>
              ))}
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                4.9/5 from 10,000+ customers
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>2-Year Warranty</span>
              </div>
            </div>
          </div>
        </motion.div> */}

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/indoor">
            <Button size="lg" variant="gradient" className="group">
              <Lightbulb className="w-5 h-5 mr-2" />
              Explore Indoor Lighting
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <Link href="/outdoor">
            <Button size="lg" variant="outline" className="group">
              <Sparkles className="w-5 h-5 mr-2" />
              Discover Outdoor Collection
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          variants={itemVariants}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}