"use client"

import { motion } from "framer-motion"
import { Lightbulb } from "lucide-react"

export function LoadingSpinner({ size = "default" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-8 h-8",
    lg: "w-12 h-12"
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} text-primary`}
    >
      <Lightbulb className="w-full h-full" />
    </motion.div>
  )
}

export function LoadingDots() {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2
          }}
          className="w-2 h-2 bg-primary rounded-full"
        />
      ))}
    </div>
  )
}

export function LoadingPulse() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
    >
      <Lightbulb className="w-8 h-8 text-white" />
    </motion.div>
  )
}