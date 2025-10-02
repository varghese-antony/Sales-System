"use client"

import { getDistinctCategories } from '@/lib/database/products'
import * as React from "react"
import Link from "next/link"
import { Lightbulb, Home, Sun, Menu, LayoutDashboard, User, LogOut, UserCircle, Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { MobileMenu } from "@/components/MobileMenu"
import { CartButton } from "@/components/CartButton"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [indoorCategories, setIndoorCategories] = useState([])
  const [outdoorCategories, setOutdoorCategories] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, profile, isAdmin, loading, signOut } = useAuth()

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data: indoorData, error: indoorError } = await getDistinctCategories('indoor')
        if (!indoorError) {
          setIndoorCategories(indoorData || [])
        }

        const { data: outdoorData, error: outdoorError } = await getDistinctCategories('outdoor')
        if (!outdoorError) {
          setOutdoorCategories(outdoorData || [])
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }
    fetchCategories()
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="glass-effect border-b border-border/40">
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16">
          {/* Top Layer: Logo */}
          <div className="flex items-center justify-center w-full sm:w-auto py-2 sm:py-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Lightbulb className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gradient">
                BH Sourcing
              </span>
            </Link>
          </div>

          {/* Bottom Layer: Navigation and Buttons */}
          <div className="flex items-center justify-between w-full sm:w-auto space-x-0 sm:space-x-8 mt-2 sm:mt-0">
            {/* Desktop Navigation - Hidden on small screens */}
            <div className="hidden sm:flex items-center space-x-8">
              <NavigationMenu>
                <NavigationMenuList className="space-x-2">
                  <NavigationMenuItem>
                    <Link href="/" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors duration-200">
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </Link>
                  </NavigationMenuItem>

                  {!loading && isAdmin && (
                    <NavigationMenuItem>
                      <Link 
                        href="/admin-dashboard" 
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors duration-200 group"
                        title="Admin Dashboard - Manage products and enquiries"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dashboard</span>
                        <Badge variant="secondary" className="ml-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          Admin
                        </Badge>
                      </Link>
                    </NavigationMenuItem>
                  )}

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4" />
                      <span>Indoor</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[500px] p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3">
                            <NavigationMenuLink asChild>
                              <Link
                                className="group block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground gradient-primary text-white"
                                href="/indoor"
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <Lightbulb className="w-5 h-5" />
                                  <div className="text-lg font-medium">Indoor Lighting</div>
                                </div>
                                <p className="text-sm leading-tight text-white/80">
                                  Transform your interior spaces with elegant lighting solutions
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </div>
                          <div className="space-y-2">
                            {indoorCategories.slice(0, 6).map((category, index) => (
                              <ListItem
                                key={index}
                                href={`/indoor#${category['Indoor'].toLowerCase().replace(/\s+/g, '-')}`}
                                title={category['Indoor']}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center space-x-2">
                      <Sun className="w-4 h-4" />
                      <span>Outdoor</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[500px] p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3">
                            <NavigationMenuLink asChild>
                              <Link
                                className="group block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground gradient-secondary text-white"
                                href="/outdoor"
                              >
                                <div className="flex items-center space-x-2 mb-2">
                                  <Sun className="w-5 h-5" />
                                  <div className="text-lg font-medium">Outdoor Lighting</div>
                                </div>
                                <p className="text-sm leading-tight text-white/80">
                                  Illuminate your exterior spaces with weather-resistant solutions
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </div>
                          <div className="space-y-2">
                            {outdoorCategories.slice(0, 6).map((category, index) => (
                              <ListItem
                                key={index}
                                href={`/outdoor#${category['Outdoor'].toLowerCase().replace(/\s+/g, '-')}`}
                                title={category['Outdoor']}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              {/* Cart Button */}
              <CartButton />

              {/* Authentication Buttons */}
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {user ? (
                    // User is authenticated - show profile dropdown
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 relative">
                          <UserCircle className="w-4 h-4" />
                          <span className="hidden md:inline">
                            {profile?.full_name || user.email?.split('@')[0] || 'User'}
                          </span>
                          {isAdmin && (
                            <Badge variant="secondary" className="ml-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              Admin
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium leading-none">
                                {profile?.full_name || 'User'}
                              </p>
                              {isAdmin && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                            </p>
                            {profile?.user_type && (
                              <p className="text-xs leading-none text-muted-foreground pt-1">
                                Account: <span className="font-medium">{profile.user_type === 'admin' ? 'Administrator' : 'Customer'}</span>
                              </p>
                            )}
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin-dashboard" className="flex items-center justify-between cursor-pointer">
                              <div className="flex items-center space-x-2">
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Dashboard</span>
                              </div>
                              <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={signOut}
                          className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // User is not authenticated - show sign in/up buttons
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Link href="/register">Sign Up</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Mobile Buttons - Visible on small screens */}
            <div className="sm:hidden flex items-center space-x-2 w-full justify-center">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <CartButton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        indoorCategories={indoorCategories}
        outdoorCategories={outdoorCategories}
        isAdmin={isAdmin}
        loading={loading}
      />
    </nav>
  )
}

function ListItem({ title, href, ...props }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        {...props}
      >
        <div className="text-sm font-medium leading-none">{title}</div>
      </Link>
    </NavigationMenuLink>
  )
}
