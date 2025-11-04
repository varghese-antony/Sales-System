"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lightbulb, Sun, X, ChevronRight, User, LogOut, UserCircle, LogIn } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { CartButton } from "@/components/CartButton"
import { useAuth } from "@/contexts/AuthContext"

const menuVariants = {
  closed: {
    x: "100%",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  },
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  }
}

const itemVariants = {
  closed: { opacity: 0, x: 20 },
  open: { opacity: 1, x: 0 }
}

export function MobileMenu({ isOpen, onClose, indoorCategories = [], outdoorCategories = [], isAdmin, loading }) {
  const { user, profile, signOut } = useAuth()
  const [expandedSection, setExpandedSection] = useState(null)

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg">Menu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-6">
                <motion.div
                  variants={{
                    open: {
                      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                    }
                  }}
                  initial="closed"
                  animate="open"
                  className="space-y-4"
                >
                  {/* Indoor Section */}
                  <motion.div variants={itemVariants}>
                    <button
                      onClick={() => toggleSection('indoor')}
                      className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-accent transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        <span className="font-medium">Indoor Lighting</span>
                      </div>
                      <ChevronRight 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedSection === 'indoor' ? 'rotate-90' : ''
                        }`} 
                      />
                    </button>
                    
                    <AnimatePresence>
                      {expandedSection === 'indoor' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-8 mt-2 space-y-2">
                            <Link
                              href="/indoor"
                              onClick={onClose}
                              className="block p-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                            >
                              All Indoor Lighting
                            </Link>
                            {indoorCategories.slice(0, 5).map((category, index) => (
                              <Link
                                key={index}
                                href={`/indoor#${category.sub_category?.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={onClose}
                                className="block p-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                              >
                                {category.sub_category}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Outdoor Section */}
                  <motion.div variants={itemVariants}>
                    <button
                      onClick={() => toggleSection('outdoor')}
                      className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-accent transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Sun className="w-5 h-5 text-primary" />
                        <span className="font-medium">Outdoor Lighting</span>
                      </div>
                      <ChevronRight 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedSection === 'outdoor' ? 'rotate-90' : ''
                        }`} 
                      />
                    </button>
                    
                    <AnimatePresence>
                      {expandedSection === 'outdoor' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-8 mt-2 space-y-2">
                            <Link
                              href="/outdoor"
                              onClick={onClose}
                              className="block p-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                            >
                              All Outdoor Lighting
                            </Link>
                            {outdoorCategories.slice(0, 5).map((category, index) => (
                              <Link
                                key={index}
                                href={`/outdoor#${category.sub_category?.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={onClose}
                                className="block p-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                              >
                                {category.sub_category}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Authentication Section */}
                  {!loading && (
                    <motion.div variants={itemVariants} className="pt-4 border-t border-border">
                      {user ? (
                        // User is authenticated - show profile and sign out
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 rounded-xl bg-accent/50">
                            <UserCircle className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {profile?.full_name || 'User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <Link
                            href="/profile"
                            onClick={onClose}
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent transition-colors duration-200"
                          >
                            <User className="w-5 h-5 text-primary" />
                            <span className="font-medium">Profile</span>
                          </Link>
                          <button
                            onClick={() => {
                              signOut()
                              onClose()
                            }}
                            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-accent transition-colors duration-200 w-full text-left text-red-600"
                          >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      ) : (
                        // User is not authenticated - show sign in/up buttons
                        <div className="space-y-3">
                          <Link
                            href="/login"
                            onClick={onClose}
                            className="flex items-center justify-center space-x-2 p-3 rounded-xl border border-border hover:bg-accent transition-colors duration-200"
                          >
                            <LogIn className="w-5 h-5 text-primary" />
                            <span className="font-medium">Sign In</span>
                          </Link>
                          <Link
                            href="/register"
                            onClick={onClose}
                            className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors duration-200"
                          >
                            <UserCircle className="w-5 h-5" />
                            <span className="font-medium">Sign Up</span>
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border">
                <div className="text-center text-sm text-muted-foreground">
                  © 2024 BH Sourcing
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}