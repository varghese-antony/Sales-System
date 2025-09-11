"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function IndoorProductPage({ params }) {
  const {slug} = React.use(params)
  console.log(params)
  
  const [products, setProducts] = useState([])
  const [selectedFilters, setSelectedFilters] = useState({})
  const [currentStep, setCurrentStep] = useState(0)
  const [finalProduct, setFinalProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const productType = slug.replace("%20", ' ')

  const desiredKeys = [
    'Size', 'Power (W)', 'Voltage', 'CCT', 'CRI/RA', 'Lumen','Efficacy (lm/W)',
    'Dimming Type', 'Material Finish', 'Sensor(Microwave/Bluetooth)', 'Plug-in Sensor',
    'Eme. Backup-Battery', 'Junction Cover', 'Remote Control', 'Mounting',
    'Installation Kits', 'Adjustment Dial', 'Certifications'
  ]

  useEffect(() => {
    fetchInitialProducts()
  }, [])

  const fetchData = async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch')
    const data = await response.json()
    return Array.isArray(data) ? data : []
  }

  const buildPostgresQuery = (filters = {}, key, value) => {
    const allFilters = { ...filters, [key]: value }
    const conditions = Object.entries(allFilters)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `"${k}"=eq.${v}`)
      .join('&')
    
    return conditions
  }

  const fetchInitialProducts = async () => {
    setIsLoading(true)
    try {
      const data = await fetchData(`https://n8n.werposolutions.com/webhook/get-product?table=indoor&product=${productType}`)
      setProducts(data)
    } catch (error) {
      console.error('Error:', error)
      setProducts([])
    }
    setIsLoading(false)
  }

  const filterProducts = async (key, value) => {
    setIsLoading(true)
    setSelectedFilters(prev => ({ ...prev, [key]: value }))
    
    const query = buildPostgresQuery(selectedFilters, key, value)
    
    try {
      const filtered = await fetchData(`https://n8n.werposolutions.com/webhook/get-model?table=indoor&query=${encodeURIComponent(query)}`)
      if (filtered.length === 1) {
        setFinalProduct(filtered[0])
      } else {
        setProducts(filtered)
        setCurrentStep(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (finalProduct) {
    return (
      <div className='container mx-auto py-8'>
        <h1 className='text-3xl font-bold mb-8'>Product Details</h1>
        <div className='grid gap-6 border rounded-lg p-6 shadow-sm'>
          {Object.keys(finalProduct).map(key => (
            <div key={key} className='flex justify-between'>
              <span className='font-semibold'>{key}:</span>
              <span>{finalProduct[key] ? finalProduct[key] : 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const currentKey = desiredKeys[currentStep]
  const currentValues = [...new Set(products.map(p => { const value = p[currentKey]; return value === null || value === undefined ? 'N/A' : value; }))]
    .filter(v => v?.toString().trim())

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-3xl font-bold mb-8'>Select {currentKey}</h1>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className='grid gap-6'>
          {currentValues.map((value, index) => (
            <Button 
              key={index} 
              className="p-6 text-lg"
              onClick={() => filterProducts(currentKey, value === 'N/A' ? null : value)}
              disabled={isLoading}
            >
              {value}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
