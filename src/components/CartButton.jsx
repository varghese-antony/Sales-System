"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/CartContext"
import Link from "next/link"

export function CartButton() {
  const { getCartTotal } = useCart()
  const itemCount = getCartTotal()

  return (
    <Link href="/cart">
      <Button variant="outline" className="relative mr-2">
        <ShoppingCart className="w-4 h-4 mr-2" />
        Cart
        {itemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] font-bold border border-white shadow-md min-w-[16px]"
          >
            {itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}