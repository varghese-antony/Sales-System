"use client"

import * as React from "react"
import Link from "next/link"
import { Lightbulb, Home, Sparkles, Menu } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { MobileMenu } from "@/components/MobileMenu"
import { CartButton } from "@/components/CartButton"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export function Navbar() {
  const [indoorCategories, setIndoorCategories] = useState([])
  const [outdoorCategories, setOutdoorCategories] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const indoorResponse = await fetch('https://n8n.werposolutions.com/webhook/get-distinct?table=indoor&column=Indoor')
        const indoorData = await indoorResponse.json()
        setIndoorCategories(indoorData)

        const outdoorResponse = await fetch('https://n8n.werposolutions.com/webhook/get-distinct?table=outdoor&column=Outdoor')
        const outdoorData = await outdoorResponse.json()
        setOutdoorCategories(outdoorData)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }
    fetchCategories()
  }, [])



  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="glass-effect border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Lightbulb className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gradient">
                Lighting Catalogue
              </span>
            </Link>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <NavigationMenu>
                <NavigationMenuList className="space-x-2">
                  <NavigationMenuItem>
                    <Link href="/" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors duration-200">
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </Link>
                  </NavigationMenuItem>
                  
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
                      <Sparkles className="w-4 h-4" />
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
                                  <Sparkles className="w-5 h-5" />
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
              
              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <CartButton />
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
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
