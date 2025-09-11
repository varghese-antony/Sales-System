'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from "@/components/ProductCard"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Outdoor() {
  const [categories, setCategories] = useState([])
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCategoriesAndProducts() {
      try {
        setLoading(true)
        
        // First fetch: Get distinct categories
        const categoriesResponse = await fetch('https://n8n.werposolutions.com/webhook/get-distinct?table=outdoor&column=Outdoor')
        if (!categoriesResponse.ok) {
          throw new Error(`HTTP error! status: ${categoriesResponse.status}`)
        }
        const categoriesData = await categoriesResponse.json()
        
        // Set categories immediately for UI
        setCategories(categoriesData)
        
        // Second fetch: Get distinct product types for each category
        const productTypesResponse = await fetch('https://n8n.werposolutions.com/webhook/get-distinct?table=outdoor&column=Product Type')
        if (!productTypesResponse.ok) {
          throw new Error(`HTTP error! status: ${productTypesResponse.status}`)
        }
        const productTypesData = await productTypesResponse.json()
        
        // Combine categories with their product types
        // Assuming product types are already grouped by their category context
        setCategoriesWithProducts(productTypesData)
        
      } catch (error) {
        console.error('Error fetching outdoor data:', error)
        setError('Failed to load outdoor products. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCategoriesAndProducts()
    
  }, [])

  if (loading) {
    return (
      <div className='container mx-auto space-y-4'>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className='container mx-auto'>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='container mx-auto'>
      <div
        className="w-full"
      >
        {categories.map((category, index) => (
          <div key={index} className='my-4 bg-gray-50 p-10 rounded-2xl'>
            <h1 id={category['Outdoor']} className="capitalize">{category.Outdoor}</h1>
            <hr className='my-4'/>
            <div className="flex gap-4 flex-wrap text-balance">
              {/* Filter product types by this specific category */}
              {categoriesWithProducts
                .filter(productType => productType.Outdoor === category.Outdoor)
                .map((productType, typeIndex) => (
                  <ProductCard 
                    key={typeIndex} 
                    title={productType['Product Type']} 
                    link={`/outdoor/${productType['Product Type']}`}
                  />
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
