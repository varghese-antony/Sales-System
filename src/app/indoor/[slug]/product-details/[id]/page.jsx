"use client"

import { ProductDetails } from '@/components/ProductDetails'

export default function IndoorProductDetailsPage() {
  // ProductDetails now fetches its own data from URL params and derives sensorSelection
  // No props needed
  return <ProductDetails />
}
