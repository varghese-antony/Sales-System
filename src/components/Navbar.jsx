"use client"

import * as React from "react"
import Link from "next/link"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const components = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
]

import { useEffect, useState } from "react"

export function Navbar() {
  const [indoorCategories, setIndoorCategories] = useState([])
  const [outdoorCategories, setOutdoorCategories] = useState([])

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
    <div className="flex items-center justify-between p-4 m-8 border-2 rounded-md shadow-md bg-white">
      <Link href={'/'} className="text-2xl font-bold">Lighting Catalogue</Link>
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Indoor</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                    href="/indoor"
                  >
                    <div className="mt-4 mb-2 text-lg font-medium">
                      Indoor
                    </div>
                    <p className="text-muted-foreground text-sm leading-tight">
                      Beautiful Indoor Lights!
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {indoorCategories.map((category, index) => (
                <ListItem key={index} href={`/indoor#${category['Indoor'].toLowerCase().replace(/\s+/g, '-')}`} title={category['Indoor']}>
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Outdoor</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                    href="/outdoor"
                  >
                    <div className="mt-4 mb-2 text-lg font-medium">
                      Outdoor
                    </div>
                    <p className="text-muted-foreground text-sm leading-tight">
                      Beautiful Outdoor Lights!
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {outdoorCategories.map((category, index) => (
                <ListItem key={index} href={`/outdoor#${category['Outdoor'].toLowerCase().replace(/\s+/g, '-')}`} title={category['Outdoor']}>
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
    </div>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
