"use client"

import { motion } from "framer-motion"
import { Star, Lightbulb, Sparkles, Shield, Truck, Headphones, Leaf, Award } from "lucide-react"

const features = [
  {
    icon: Star,
    title: "Premium Quality",
    description: "Carefully selected lighting solutions from top manufacturers worldwide",
    gradient: "from-yellow-500 to-orange-600"
  },
  {
    icon: Lightbulb,
    title: "Energy Efficient",
    description: "LED technology for sustainable and cost-effective lighting solutions",
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    icon: Sparkles,
    title: "Modern Design",
    description: "Contemporary styles that complement any architectural vision",
    gradient: "from-purple-500 to-pink-600"
  },
  {
    icon: Shield,
    title: "2-Year Warranty",
    description: "Comprehensive warranty coverage for peace of mind",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Complimentary delivery on all orders over $100",
    gradient: "from-indigo-500 to-blue-600"
  },
  {
    icon: Headphones,
    title: "Expert Support",
    description: "Professional lighting consultants available 24/7",
    gradient: "from-teal-500 to-cyan-600"
  }
]

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
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center items-center gap-2 mb-4">
            <Award className="w-8 h-8 text-primary" />
            <Leaf className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why Choose Our 
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Lighting</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the perfect blend of innovation, quality, and design with our premium lighting solutions
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <div className="relative p-8 rounded-2xl glass-effect border border-border/50 hover:border-primary/30 transition-all duration-300 h-full">
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} p-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Trusted by 10,000+ satisfied customers worldwide</span>
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}