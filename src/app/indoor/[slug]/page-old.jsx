"use client"
import React, {useState, useEffect} from 'react'
import { SensorSelector } from "@/components/SensorSelector"

export default function IndoorProductPage({ params }) {
  const [slug, setSlug] = useState(null)
  const [showSensorSelector, setShowSensorSelector] = useState(true)
  
  // Force refresh timestamp: 2024-11-04T20:30:00Z
  console.log('Component rendered at', new Date().toISOString(), 'showSensorSelector:', showSensorSelector)

  const productName = slug ? decodeURIComponent(slug).replace(/%20/g, ' ') : ''

  useEffect(() => {
    // Handle async params
    const resolveParams = async () => {
      const resolvedParams = await params
      setSlug(resolvedParams.slug)
    }
    resolveParams()
  }, [params])

  const handleSensorSelection = (selection) => {
    console.log('Sensor selection received:', JSON.stringify(selection, null, 2))
    // Only hide if we have a valid selection
    if (selection && selection.sensorsAndControls) {
      console.log('Valid selection, hiding sensor selector')
      setShowSensorSelector(false)
    } else {
      console.log('Invalid or empty selection, keeping sensor selector visible')
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 relative'>
      <div className='container mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10'>
        <h1 className="text-3xl font-bold mb-8 text-center">
          {productName || 'Loading...'}
        </h1>
        
        {/* Debug info */}
        <div className="text-center text-sm text-muted-foreground mb-8">
          Debug: showSensorSelector={showSensorSelector.toString()}, slug={slug || 'null'}
        </div>

        {/* Sensor Selection */}
        {showSensorSelector && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Configure Sensors & Controls</h2>
              <p className="text-muted-foreground">
                Choose your preferred sensor and control options for this lighting product
              </p>
            </div>
            <SensorSelector onSelectionChange={handleSensorSelection} />
          </div>
        )}
        
        {!showSensorSelector && (
          <div className="text-center">
            <p>Sensor selection completed!</p>
          </div>
        )}
      </div>
    </div>
  )
}