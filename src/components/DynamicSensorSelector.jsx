'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Zap, 
  Eye, 
  Sun, 
  X, 
  Bluetooth, 
  Camera,
  Battery,
  Plug,
  CheckSquare,
} from 'lucide-react'

const sensorIcons = {
  'PIR': <Zap className="w-4 h-4" />,
  'Microwave': <Zap className="w-4 h-4" />,
  'Bluetooth': <Bluetooth className="w-4 h-4" />,
  'Photo cell': <Camera className="w-4 h-4" />,
  'None': <X className="w-4 h-4" />
}

const controlTypeIcons = {
  'Occupancy': <Eye className="w-5 h-5" />,
  'Bi-Level': <Zap className="w-5 h-5" />,
  'B-Level': <Zap className="w-5 h-5" />,
  'Daylight': <Sun className="w-5 h-5" />,
  'None': <X className="w-5 h-5" />,
  'no': <X className="w-5 h-5" />
}

const controlTypeDescriptions = {
  'Occupancy': 'Automatically turns lights on when motion is detected',
  'Bi-Level': 'Provides two levels of lighting - dim and bright',
  'B-Level': 'Provides two levels of lighting - dim and bright',
  'Daylight': 'Automatically adjusts based on ambient light levels',
  'None': 'Manual control only - no automatic sensors',
  'no': 'Manual control only - no automatic sensors'
}

export function DynamicSensorSelector({ 
  productName,
  type,
  onSelectionChange, 
  initialSelection = null,
  className = "" 
}) {
  const [sensorOptions, setSensorOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [selectedControl, setSelectedControl] = useState(initialSelection?.sensorsAndControls || '')
  const [selectedSensor, setSelectedSensor] = useState(initialSelection?.sensorType || '')
  const [hasRemote, setHasRemote] = useState(initialSelection?.remoteControl || false)
  const [hasEmergencyBackup, setHasEmergencyBackup] = useState(initialSelection?.emergencyBackupBattery || false)
  const [hasPluginSensor, setHasPluginSensor] = useState(initialSelection?.pluginSensor || false)

  // Fetch available sensor options for this product
  useEffect(() => {
    async function fetchSensorOptions() {
      if (!productName || !type) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/products/sensor-options?productName=${encodeURIComponent(productName)}&type=${type}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch sensor options')
        }

        const data = await response.json()
        setSensorOptions(data.sensorOptions || [])
      } catch (err) {
        console.error('Error fetching sensor options:', err)
        setError('Failed to load sensor options. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchSensorOptions()
  }, [productName, type])

  console.log("$$$$$$$$$$$$$$$$$$$ SELETCED SENSORS $$$$$$$$$$$, s",selectedSensor)

  // Auto-submit when "None" is selected
  useEffect(() => {
    if (selectedControl === 'None' && onSelectionChange) {
      // Auto-submit when None is selected
      onSelectionChange({
        sensorsAndControls: 'None',
        sensorType: 'None',
        remoteControl: false,
        emergencyBackupBattery: false,
        pluginSensor: false
      })
    }
  }, [selectedControl, onSelectionChange])

  const handleControlChange = (controlType, checked) => {
    if (!checked) {
      setSelectedControl('')
      setSelectedSensor('')
      setHasRemote(false)
      setHasEmergencyBackup(false)
      setHasPluginSensor(false)
      return
    }

    setSelectedControl(controlType)
    setSelectedSensor('')
    
    const controlOption = sensorOptions.find(opt => opt.controlType === controlType)

    if (controlOption && controlOption.sensorTypes.length === 1) {
      setSelectedSensor(controlOption.sensorTypes[0])
    }

    setHasRemote(!!controlOption?.hasRemoteControl)
    setHasEmergencyBackup(!!controlOption?.hasEmergencyBackup)
    setHasPluginSensor(!!controlOption?.hasPluginSensor)
  }

  const handleSubmit = () => {
    if (onSelectionChange && selectedControl) {
      onSelectionChange({
        sensorsAndControls: selectedControl,
        sensorType: selectedControl === 'None' ? 'None' : selectedSensor,
        remoteControl: selectedControl === 'None' ? false : hasRemote,
        emergencyBackupBattery: selectedControl === 'None' ? false : hasEmergencyBackup,
        pluginSensor: false // Always false as plugin sensor is commented out
      })
    }
  }

  const currentControlOption = sensorOptions.find(opt => opt.controlType === selectedControl)

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Loading sensor options...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (sensorOptions.length === 0) {
    return (
      <Alert className={className}>
        <AlertDescription>No sensor options available for this product.</AlertDescription>
      </Alert>
    )
  }

  console.log("############# selectedControl ", selectedControl)
  console.log("################# currentControlOption",currentControlOption)
  console.log("Has remote control", hasRemote)
  console.log("Has emergency backup", hasEmergencyBackup)
  console.log("Has plugin sensor", hasPluginSensor)
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Control Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Sensors + Controls
          </CardTitle>
          <CardDescription>
            Choose the type of automatic control for your lighting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sensorOptions.map((option) => (
              <div key={option.controlType} className="flex items-center space-x-2">
                <Checkbox 
                  id={option.controlType}
                  checked={selectedControl === option.controlType}
                  onCheckedChange={(checked) => handleControlChange(option.controlType, checked)}
                />
                <Label 
                  htmlFor={option.controlType} 
                  className="flex-1 cursor-pointer p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {controlTypeIcons[option.controlType] || <Zap className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.controlType}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {controlTypeDescriptions[option.controlType] || 'Lighting control option'}
                      </div>
                      {option.sensorTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {option.sensorTypes.map(sensor => (
                            <Badge key={sensor} variant="outline" className="text-xs">
                              {sensor}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sensor Type Selection (single via checkbox) - Hide when None is selected */}
      {selectedControl && selectedControl !== 'None' && currentControlOption && currentControlOption.sensorTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {controlTypeIcons[selectedControl]}
              {selectedControl} Sensor Options
            </CardTitle>
            <CardDescription>
              Select the specific sensor technology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentControlOption.sensorTypes.map((sensorType) => (
                <div key={sensorType} className="flex items-center space-x-2">
                  <Checkbox
                    id={sensorType}
                    checked={selectedSensor === sensorType}
                    onCheckedChange={(checked) => setSelectedSensor(checked ? sensorType : '')}
                  />
                  <Label 
                    htmlFor={sensorType} 
                    className="flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {sensorIcons[sensorType] || <Zap className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{sensorType}</div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Options - Only show if control is not "None" */}
      {selectedControl && selectedControl !== 'None' && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Features</CardTitle>
            <CardDescription>
              Customize your lighting setup with these optional features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remote-control" 
                  checked={hasRemote}
                  onCheckedChange={(checked) => setHasRemote(checked === true)}
                />
                <Label htmlFor="remote-control" className="flex items-center gap-2 cursor-pointer">
                  Remote Control
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="emergency-backup" 
                  checked={hasEmergencyBackup}
                  onCheckedChange={(checked) => setHasEmergencyBackup(checked === true)}
                />
                <Label htmlFor="emergency-backup" className="flex items-center gap-2 cursor-pointer">
                  Emergency Backup Battery
                </Label>
              </div>

              {/* Plugin Sensor - Commented out as per requirements */}
              {/* <div className="flex items-center space-x-2">
                <Checkbox 
                  id="plugin-sensor" 
                  checked={hasPluginSensor}
                  onCheckedChange={(checked) => setHasPluginSensor(checked === true)}
                />
                <Label htmlFor="plugin-sensor" className="flex items-center gap-2 cursor-pointer">
                  Plugin Sensor
                </Label>
              </div> */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      {selectedControl && (selectedSensor || selectedControl === 'None') && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Selection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">{selectedControl}</Badge>
                {selectedControl !== 'None' && selectedSensor && (
                  <>
                    <span className="text-sm">with</span>
                    <Badge variant="secondary">{selectedSensor}</Badge>
                  </>
                )}
              </div>
              
              {(hasRemote || hasEmergencyBackup) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {hasRemote && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      Remote Control
                    </Badge>
                  )}
                  {hasEmergencyBackup && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      Emergency Backup
                    </Badge>
                  )}
                  {/* Plugin Sensor - Commented out as per requirements */}
                  {/* {hasPluginSensor && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Plug className="w-3 h-3" />
                      Plugin Sensor
                    </Badge>
                  )} */}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit button - Hide when None is selected (auto-submitted) */}
      {selectedControl !== 'None' && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedControl || !selectedSensor}
          >
            Submit Selection
          </Button>
        </div>
      )}
    </div>
  )
}
