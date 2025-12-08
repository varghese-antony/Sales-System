'use client'
import { useState } from 'react'
import { SensorSelector } from '@/components/SensorSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'

export default function TestSensorSelector() {
  const [sensorSelection, setSensorSelection] = useState(null)
  const [showJson, setShowJson] = useState(false)

  const handleSelectionChange = (selection) => {
    setSensorSelection(selection)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Sensor Selector Test</h1>
              <p className="text-muted-foreground">
                Test the new sensor selection flow for lighting products
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sensor Selector */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Configure Your Lighting</h2>
            <SensorSelector 
              onSelectionChange={handleSelectionChange}
              className="max-w-2xl"
            />
          </div>

          {/* Selection Output */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Selection</CardTitle>
                <CardDescription>
                  Real-time preview of your sensor configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sensorSelection ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Control Type</h4>
                      <Badge variant="default" size="lg">
                        {sensorSelection.sensorsAndControls || 'None selected'}
                      </Badge>
                    </div>

                    {sensorSelection.sensorType && (
                      <div>
                        <h4 className="font-medium mb-2">Sensor Type</h4>
                        <Badge variant="secondary" size="lg">
                          {sensorSelection.sensorType}
                        </Badge>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Additional Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {sensorSelection.remoteControl && (
                          <Badge variant="outline">Remote Control</Badge>
                        )}
                        {sensorSelection.emergencyBackupBattery && (
                          <Badge variant="outline">Emergency Backup</Badge>
                        )}
                        {sensorSelection.pluginSensor && (
                          <Badge variant="outline">Plugin Sensor</Badge>
                        )}
                        {!sensorSelection.remoteControl && 
                         !sensorSelection.emergencyBackupBattery && 
                         !sensorSelection.pluginSensor && (
                          <span className="text-muted-foreground text-sm">None selected</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowJson(!showJson)}
                      >
                        {showJson ? 'Hide' : 'Show'} JSON Output
                      </Button>
                    </div>

                    {showJson && (
                      <div className="mt-4">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                          {JSON.stringify(sensorSelection, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Make a selection to see the configuration preview
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Model Number Preview */}
            {sensorSelection?.sensorsAndControls && sensorSelection?.sensorType && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Model Number</CardTitle>
                  <CardDescription>
                    Example of how the model number would be generated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-sm bg-muted p-3 rounded">
                    BASE-MODEL-{sensorSelection.sensorsAndControls.substring(0,3).toUpperCase()}-
                    {sensorSelection.sensorType.substring(0,3).toUpperCase()}-
                    {sensorSelection.remoteControl ? 'RC' : 'NRC'}-
                    {sensorSelection.emergencyBackupBattery ? 'EB' : 'NEB'}-
                    {sensorSelection.pluginSensor ? 'PS' : 'NPS'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This shows how product variations would be generated based on sensor selections
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Database Query Preview */}
            {sensorSelection?.sensorsAndControls && (
              <Card>
                <CardHeader>
                  <CardTitle>Database Query Preview</CardTitle>
                  <CardDescription>
                    How products would be filtered in the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">sensors_and_controls:</span> 
                      <code className="ml-2 bg-muted px-2 py-1 rounded">
                        "{sensorSelection.sensorsAndControls}"
                      </code>
                    </div>
                    {sensorSelection.sensorType && (
                      <div>
                        <span className="font-medium">pir_microwave:</span> 
                        <code className="ml-2 bg-muted px-2 py-1 rounded">
                          "{sensorSelection.sensorType}"
                        </code>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">remote_control_bluetooth:</span> 
                      <code className="ml-2 bg-muted px-2 py-1 rounded">
                        {sensorSelection.remoteControl.toString()}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">emergency_backup_battery:</span> 
                      <code className="ml-2 bg-muted px-2 py-1 rounded">
                        {sensorSelection.emergencyBackupBattery.toString()}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">plugin_sensor:</span> 
                      <code className="ml-2 bg-muted px-2 py-1 rounded">
                        {sensorSelection.pluginSensor.toString()}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}