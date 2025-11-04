'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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

const sensorOptions = {
  'Occupancy': {
    description: 'Automatically turns lights on when motion is detected',
    icon: <Eye className="w-5 h-5" />,
    sensors: [
      { 
        type: 'PIR', 
        name: 'PIR Sensor',
        description: 'Passive Infrared - detects body heat and movement',
        icon: <Radio className="w-4 h-4" />
      },
      { 
        type: 'Microwave', 
        name: 'Microwave Sensor',
        description: 'High-frequency motion detection through walls',
        icon: <Zap className="w-4 h-4" />
      },
      { 
        type: 'Bluetooth', 
        name: 'Bluetooth Sensor',
        description: 'Smart device proximity detection',
        icon: <Bluetooth className="w-4 h-4" />
      }
    ],
    requiresRemote: true
  },
  'Bi-Level': {
    description: 'Provides two levels of lighting - dim and bright',
    icon: <Zap className="w-5 h-5" />,
    sensors: [
      { 
        type: 'PIR', 
        name: 'PIR Sensor',
        description: 'Switches between dim and bright based on movement',
        icon: <Radio className="w-4 h-4" />
      },
      { 
        type: 'Microwave', 
        name: 'Microwave Sensor',
        description: 'Advanced bi-level control with microwave detection',
        icon: <Zap className="w-4 h-4" />
      },
      { 
        type: 'Bluetooth', 
        name: 'Bluetooth Sensor',
        description: 'Smart bi-level control via Bluetooth',
        icon: <Bluetooth className="w-4 h-4" />
      }
    ],
    requiresRemote: true
  },
  'Daylight': {
    description: 'Automatically adjusts based on ambient light levels',
    icon: <Sun className="w-5 h-5" />,
    sensors: [
      { 
        type: 'Photo cell', 
        name: 'Photo Cell',
        description: 'Light-sensitive sensor for daylight harvesting',
        icon: <Camera className="w-4 h-4" />
      }
    ],
    requiresRemote: false
  },
  'None': {
    description: 'Manual control only - no automatic sensors',
    icon: <X className="w-5 h-5" />,
    sensors: [
      { 
        type: 'None', 
        name: 'No Sensors',
        description: 'Traditional manual switching',
        icon: <X className="w-4 h-4" />
      }
    ],
    requiresRemote: false
  }
}

export function SensorSelector({ 
  onSelectionChange, 
  initialSelection = null,
  className = "" 
}) {
  const [selectedControl, setSelectedControl] = useState(initialSelection?.sensorsAndControls || '')
  const [selectedSensor, setSelectedSensor] = useState(initialSelection?.sensorType || '')
  const [hasRemote, setHasRemote] = useState(initialSelection?.remoteControl || false)
  const [hasEmergencyBackup, setHasEmergencyBackup] = useState(initialSelection?.emergencyBackupBattery || false)
  const [hasPluginSensor, setHasPluginSensor] = useState(initialSelection?.pluginSensor || false)

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
    setSelectedControl(controlType)
    // Reset sensor selection when control type changes
    setSelectedSensor('')
    // Reset remote control if not required
    if (!sensorOptions[controlType]?.requiresRemote) {
      setHasRemote(false)
    }
  }

  const currentSensorOptions = selectedControl ? sensorOptions[selectedControl] : null

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
          <RadioGroup value={selectedControl} onValueChange={handleControlChange}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(sensorOptions).map(([controlType, config]) => (
                <div key={controlType} className="flex items-center space-x-2">
                  <RadioGroupItem value={controlType} id={controlType} />
                  <Label 
                    htmlFor={controlType} 
                    className="flex-1 cursor-pointer p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{controlType}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {config.description}
                        </div>
                        {config.requiresRemote && (
                          <Badge variant="secondary" className="mt-2">
                            Remote Required
                          </Badge>
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
      {selectedControl && currentSensorOptions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentSensorOptions.icon}
              {selectedControl} Sensor Options
            </CardTitle>
            <CardDescription>
              Select the specific sensor technology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedSensor} onValueChange={setSelectedSensor}>
              <div className="space-y-3">
                {currentSensorOptions.sensors.map((sensor) => (
                  <div key={sensor.type} className="flex items-center space-x-2">
                    <RadioGroupItem value={sensor.type} id={sensor.type} />
                    <Label 
                      htmlFor={sensor.type} 
                      className="flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {sensor.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{sensor.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {sensor.description}
                          </div>
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
      {selectedControl && selectedSensor && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Features</CardTitle>
            <CardDescription>
              Customize your lighting setup with these optional features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Remote Control */}
            {currentSensorOptions?.requiresRemote && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remote-control" 
                  checked={hasRemote}
                  onCheckedChange={setHasRemote}
                />
                <Label htmlFor="remote-control" className="flex items-center gap-2 cursor-pointer">
                  <Radio className="w-4 h-4" />
                  Remote Control
                  <Badge variant="outline" size="sm">Mandatory</Badge>
                </Label>
              </div>
            )}

            <Separator />

            {/* Emergency Backup Battery */}
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

            {/* Plugin Sensor */}
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