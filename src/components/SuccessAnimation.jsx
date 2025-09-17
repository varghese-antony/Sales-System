"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Sparkles, Heart } from "lucide-react"
import { useEffect, useState } from "react"

export function SuccessAnimation({ isVisible, onComplete }) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true)
      const timer = setTimeout(() => {
        onComplete?.()
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  const confettiItems = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    x: Math.random() * 100,
    rotation: Math.random() * 360,
    color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)]
  }))

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        >
          {/* Confetti */}
          {showConfetti && confettiItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ 
                opacity: 0, 
                y: -100, 
                x: `${item.x}vw`,
                rotate: 0,
                scale: 0
              }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: "100vh", 
                rotate: item.rotation,
                scale: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: item.duration, 
                delay: item.delay,
                ease: "easeOut"
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          ))}

          {/* Main Success Card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.2
            }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md mx-4 text-center relative overflow-hidden"
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 opacity-50" />
            
            {/* Floating Sparkles */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute top-4 right-4 text-yellow-400"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>

            <motion.div
              animate={{ 
                rotate: -360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute top-4 left-4 text-pink-400"
            >
              <Heart className="w-5 h-5" />
            </motion.div>

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                delay: 0.5
              }}
              className="relative z-10 mb-6"
            >
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.8,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
              </div>
              
              {/* Ripple Effect */}
              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ 
                  duration: 1.5,
                  delay: 0.6,
                  ease: "easeOut"
                }}
                className="absolute inset-0 bg-green-400 rounded-full"
              />
            </motion.div>

            {/* Success Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="relative z-10"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Enquiry Submitted!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Thank you for your interest. We'll get back to you soon with pricing and availability.
              </p>
              
              {/* Animated Success Message */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ✨
                </motion.div>
                Cart cleared successfully
              </motion.div>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, delay: 1.5 }}
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-500"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}