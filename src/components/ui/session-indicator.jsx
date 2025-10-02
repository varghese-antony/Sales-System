"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function SessionIndicator({ 
  mode = 'inline', 
  showOnRestore = true,
  position = 'top-right',
  autoHide = true 
}) {
  const { user, sessionRestored, authStateChange } = useAuth()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (showOnRestore && sessionRestored && user && authStateChange === null) {
      // Show welcome back toast
      setToastMessage('Welcome back! Session restored.')
      setShowToast(true)

      if (autoHide) {
        setTimeout(() => {
          setShowToast(false)
        }, 3000)
      }
    }
  }, [sessionRestored, user, authStateChange, showOnRestore, autoHide])

  // Inline mode - small dot indicator
  if (mode === 'inline') {
    if (!user) return null

    return (
      <div className="flex items-center space-x-2" title="Session Active">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full"
          />
        </motion.div>
      </div>
    )
  }

  // Badge mode - larger badge with text
  if (mode === 'badge') {
    if (!user) return null

    return (
      <Badge 
        variant="secondary" 
        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center space-x-1"
      >
        <CheckCircle2 className="w-3 h-3" />
        <span>Session Active</span>
      </Badge>
    )
  }

  // Toast mode - notification that appears temporarily
  if (mode === 'toast') {
    const positionClasses = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4'
    }

    return (
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: position.includes('top') ? -20 : 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position.includes('top') ? -20 : 20, scale: 0.9 }}
            className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
          >
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4 flex items-start space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {toastMessage}
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return null
}

// Session expiry warning component
export function SessionExpiryWarning({ minutesRemaining = 5 }) {
  const { user } = useAuth()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!user) {
      setShowWarning(false)
      return
    }

    // This is a placeholder - you would need to implement actual session expiry tracking
    // based on your Supabase token expiry time
    const checkSessionExpiry = () => {
      // Check if session is about to expire
      // For now, this is just a demo
      setShowWarning(false)
    }

    checkSessionExpiry()
    const interval = setInterval(checkSessionExpiry, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [user])

  if (!showWarning) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg p-4 flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Session Expiring Soon
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
            Your session will expire in {minutesRemaining} minutes. Please save your work.
          </p>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          className="flex-shrink-0 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
