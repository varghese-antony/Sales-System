'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Zap, 
  Eye, 
  Sun, 
  X, 
  Bluetooth, 
  Radio, 
  Camera,
  Battery,
  Plug
} from 'lucide-react'

const sensorIcons = {
  'PIR': <Radio className="w-4 h-4" />,
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

  // Update parent component when selection changes
  useEffect(() => {
    if (onSelectionChange && selectedControl && selectedSensor) {
      onSelectionChange({
        sensorsAndControls: selectedControl,
        sensorType: selectedSensor,
        remoteControl: hasRemote,
        emergencyBackupBattery: hasEmergencyBackup,
        pluginSensor: hasPluginSensor
      })
    }
  }, [selectedControl, selectedSensor, hasRemote, hasEmergencyBackup, hasPluginSensor, onSelectionChange])

  const handleControlChange = (controlType) => {
    console.log("############# handleControlChange ", controlType)
    setSelectedControl(controlType)
    setSelectedSensor('')
    
    // Find the selected control option
    const controlOption = sensorOptions.find(opt => opt.controlType === controlType)
    console.log("############# controlOption ", controlOption)

    // Auto-select sensor if only one option
    if (controlOption && controlOption.sensorTypes.length === 1) {
      setSelectedSensor(controlOption.sensorTypes[0])
    }
    // Reset features based on availability
    if (controlOption?.hasRemoteControl) setHasRemote(true)
    if (controlOption?.hasEmergencyBackup) setHasEmergencyBackup(true)
    if (controlOption?.hasPluginSensor) setHasPluginSensor(true)
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
          <RadioGroup value={selectedControl} onValueChange={(e)=>handleControlChange(e)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sensorOptions.map((option) => (
                <div key={option.controlType} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.controlType} id={option.controlType} />
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
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Sensor Type Selection */}
      {selectedControl && currentControlOption && currentControlOption.sensorTypes.length > 0 && (
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
            <RadioGroup value={selectedSensor} onValueChange={setSelectedSensor}>
              <div className="space-y-3">
                {currentControlOption.sensorTypes.map((sensorType) => (
                  <div key={sensorType} className="flex items-center space-x-2">
                    <RadioGroupItem value={sensorType} id={sensorType} />
                    <Label 
                      htmlFor={sensorType} 
                      className="flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {sensorIcons[sensorType] || <Radio className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{sensorType}</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Additional Options */}
      {selectedControl && selectedSensor && currentControlOption && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Features</CardTitle>
            <CardDescription>
              Customize your lighting setup with these optional features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Remote Control */}
            {currentControlOption.hasRemoteControl && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remote-control" 
                  checked={hasRemote}
                  onCheckedChange={setHasRemote}
                />
                <Label htmlFor="remote-control" className="flex items-center gap-2 cursor-pointer">
                  <Radio className="w-4 h-4" />
                  Remote Control
                </Label>
              </div>
            )}

            {(currentControlOption.hasEmergencyBackup || currentControlOption.hasPluginSensor) && (
              <Separator />
            )}

            {/* Emergency Backup Battery */}
            {currentControlOption.hasEmergencyBackup && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="emergency-backup" 
                  checked={hasEmergencyBackup}
                  onCheckedChange={setHasEmergencyBackup}
                />
                <Label htmlFor="emergency-backup" className="flex items-center gap-2 cursor-pointer">
                  <Battery className="w-4 h-4" />
                  Emergency Backup Battery
                </Label>
              </div>
            )}

            {/* Plugin Sensor */}
            {currentControlOption.hasPluginSensor && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="plugin-sensor" 
                  checked={hasPluginSensor}
                  onCheckedChange={setHasPluginSensor}
                />
                <Label htmlFor="plugin-sensor" className="flex items-center gap-2 cursor-pointer">
                  <Plug className="w-4 h-4" />
                  Plugin Sensor
                </Label>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      {selectedControl && selectedSensor && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Selection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">{selectedControl}</Badge>
                <span className="text-sm">with</span>
                <Badge variant="secondary">{selectedSensor}</Badge>
              </div>
              
              {(hasRemote || hasEmergencyBackup || hasPluginSensor) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {hasRemote && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      Remote Control
                    </Badge>
                  )}
                  {hasEmergencyBackup && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      Emergency Backup
                    </Badge>
                  )}
                  {hasPluginSensor && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Plug className="w-3 h-3" />
                      Plugin Sensor
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
