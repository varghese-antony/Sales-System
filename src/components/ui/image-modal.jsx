"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageWithLoading } from "@/components/ui/image-with-loading"

export function ImageModal({ isOpen, onClose, src, alt, title }) {
  const [isZoomed, setIsZoomed] = useState(false)

  if (!isOpen) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = `${title || 'product'}-image.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExternalView = () => {
    window.open(src, '_blank')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-w-4xl max-h-[90vh] w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <h3 className="text-white font-medium text-sm">{title || alt}</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsZoomed(!isZoomed)}
                className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExternalView}
                className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div className={`relative bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}>
            <div 
              className={`relative transition-all duration-300 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <ImageWithLoading
                src={src}
                alt={alt}
                className="w-full h-auto max-h-[80vh] object-contain"
                containerClassName="w-full h-auto"
                loadingClassName="min-h-[400px] rounded-lg"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
              <p className="text-white text-xs">
                Click image to zoom • Press ESC to close
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}