"use client";

import { useCallback, useEffect, useMemo, useState } from 'react'

import { createProductsV2, sanitizeProductForInsert } from '@/lib/database/products-v2'
import { validateProductDataV2 } from '@/lib/database/v2-validation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'

const TEXT_VARIATION_FIELDS = [
  'subCategory',
  'productName',
  'modelNumber',
  'size',
  'mounting',
  'powerW',
  'voltage',
  'cct',
  'criRa',
  'lumen',
  'efficacyLumenPerW',
  'dimmingType',
  'materialFinish',
  'installationKits',
  'adjustmentDial',
  'certifications',
  'leadTime',
  'warranty',
  'moq',
  'pricePerPiece',
  'costChinaDdpUsa',
  'costThailandVietnam',
  'photo',
  'cutSheet',
  'ipRating',
  'sensorCost',
  'remoteControlBluetoothCost',
  'pluginSensorCost',
  'emergencyBackupBatteryCost',
  'installationKitsCost'
]

const BOOLEAN_VARIATION_FIELDS = [
  'sensorsAndControls',
  'occupancy',
  'biLevel',
  'pir',
  'microwave',
  'remoteControlBluetooth',
  'pluginSensor',
  'emergencyBackupBattery',
  'junctionCover'
]

const INITIAL_STATE = {
  type: 'indoor',
  subCategory: '',
  productName: '',
  modelNumber: '',
  size: '',
  mounting: '',
  voltage: '',
  powerW: '',
  cct: '',
  criRa: '',
  lumen: '',
  efficacyLumenPerW: '',
  dimmingType: '',
  materialFinish: '',
  installationKits: '',
  adjustmentDial: '',
  certifications: '',
  leadTime: '',
  warranty: '',
  moq: '',
  pricePerPiece: '',
  costChinaDdpUsa: '',
  costThailandVietnam: '',
  photo: '',
  cutSheet: '',
  ipRating: '',
  sensorCost: '',
  remoteControlBluetoothCost: '',
  pluginSensorCost: '',
  emergencyBackupBatteryCost: '',
  installationKitsCost: '',
  sensorsAndControls: '',
  occupancy: '',
  biLevel: '',
  pir: '',
  microwave: '',
  remoteControlBluetooth: '',
  pluginSensor: '',
  emergencyBackupBattery: '',
  junctionCover: ''
}

const VARIATION_FIELD_KEYS = [...TEXT_VARIATION_FIELDS]

export default function DataEntryPage() {
  const [formState, setFormState] = useState(INITIAL_STATE)
  const [message, setMessage] = useState('')
  const [variationCount, setVariationCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const handleInputChange = useCallback((field) => (event) => {
    const value = event?.target?.value ?? ''
    setFormState((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleBooleanSelectChange = useCallback((field) => (value) => {
    // Convert "NONE" to empty string for storage
    const normalizedValue = value === 'NONE' ? '' : value
    setFormState((prev) => ({ ...prev, [field]: normalizedValue }))
  }, [])

  const handleSelectChange = useCallback((field) => (value) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }, [])

  const parseFieldValues = useCallback((value) => {
    if (typeof value !== 'string') return ['']

    const trimmed = value.trim()
    if (!trimmed) return ['']

    const values = trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)

    return values.length > 0 ? values : ['']
  }, [])

  const variationFields = useMemo(() => {
    return VARIATION_FIELD_KEYS.map((name) => ({
      name,
      values: parseFieldValues(formState[name] ?? '')
    }))
  }, [formState, parseFieldValues])

  useEffect(() => {
    if (variationFields.length === 0) {
      setVariationCount(0)
      return
    }

    const totalVariations = variationFields.reduce((total, field) => total * field.values.length, 1)
    setVariationCount(totalVariations)
  }, [variationFields])

  const validateFormData = useCallback((state) => {
    const errors = []

    if (!state.type) {
      errors.push('Product type (Indoor/Outdoor) is required')
    }

    if (!state.subCategory || state.subCategory.trim() === '') {
      errors.push('Sub-category is required')
    }

    if (!state.productName || state.productName.trim() === '') {
      errors.push('Product name is required')
    }

    if (!state.modelNumber || state.modelNumber.trim() === '') {
      errors.push('Model number is required (model_number is NOT NULL in database)')
    }

    // size is nullable in database, so it's optional
    // All other fields are nullable, so no additional validation needed

    return errors
  }, [])

  const generateVariations = useCallback(() => {
    if (variationFields.length === 0) return []

    const baseFields = new Set(['type', 'subCategory', 'productName', 'modelNumber'])

    const baseProduct = Array.from(baseFields).reduce((acc, key) => {
      const value = formState[key]
      acc[key] = typeof value === 'string' ? value.trim() : value ?? ''
      return acc
    }, {})

    BOOLEAN_VARIATION_FIELDS.forEach((key) => {
      const value = formState[key]
      // Convert 'TRUE'/'FALSE' string to boolean for variations
      if (value === 'TRUE') {
        baseProduct[key] = true
      } else if (value === 'FALSE') {
        baseProduct[key] = false
      } else {
        // Empty string means not set, will be converted to null by sanitizeProductForInsert
        baseProduct[key] = value === '' ? null : value
      }
    })

    const buildCombinations = (fields, index = 0) => {
      if (index >= fields.length) {
        return [{}]
      }

      const { name, values } = fields[index]
      const restCombinations = buildCombinations(fields, index + 1)
      const combinations = []

      values.forEach((value) => {
        restCombinations.forEach((combo) => {
          combinations.push({
            ...combo,
            [name]: value
          })
        })
      })

      return combinations
    }

    const combinations = buildCombinations(variationFields)
    return combinations.map((combo) => ({ ...baseProduct, ...combo }))
  }, [formState, variationFields])

  const resetForm = useCallback(() => {
    setFormState(INITIAL_STATE)
    setVariationCount(0)
  }, [])

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault()
    setMessage('Processing data...')

    const validationErrors = validateFormData(formState)
    if (validationErrors.length > 0) {
      setMessage(`Validation errors: ${validationErrors.join(', ')}`)
      return
    }

    const variations = generateVariations()
    if (variations.length === 0) {
      setMessage('Please enter at least some data.')
      return
    }

    const sanitizedVariations = variations.map((variation) => {
      const { type, ...rest } = variation
      const product = {
        type,
        ...rest
      }

      const sanitized = sanitizeProductForInsert(product)
      sanitized.sub_category = variation.subCategory
      sanitized.product_name = variation.productName
      sanitized.model_number = variation.modelNumber

      return sanitized
    })

    const variationValidationErrors = sanitizedVariations.flatMap((variation, index) => {
      const errors = validateProductDataV2(formState.type, variation, 'create')
      return errors.map((error) => `Variation ${index + 1}: ${error.message}`)
    })

    if (variationValidationErrors.length > 0) {
      setMessage(`Validation errors: ${variationValidationErrors.join('; ')}`)
      return
    }

    try {
      const { error } = await createProductsV2(formState.type, sanitizedVariations)
      if (error) {
        throw new Error(error)
      }

      setMessage(`Data successfully created! Created ${sanitizedVariations.length} product variation${sanitizedVariations.length > 1 ? 's' : ''}.`)
      resetForm()
    } catch (error) {
      setMessage(`Failed to create products: ${error.message}`)
    }
  }, [formState, generateVariations, resetForm, validateFormData])

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Small delay to show loading animation
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20'>
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading data entry form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="data-entry-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#data-entry-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-3 sm:p-4 max-w-3xl relative z-10">
        <Card className="mb-4 sm:mb-6 border border-border/50 hover:border-primary/30 transition-all duration-300 dark:border-border/60 dark:hover:border-primary/40 dark:bg-card/80">
          <CardHeader className="card-spacing">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center text-foreground">Lighting Product Data Entry</CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground text-center">Add new lighting products to your catalog</p>
            <div className="text-center mt-3 sm:mt-4 space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                💡 <strong>Variation Builder:</strong> Use commas to list multiple values in text fields below. We'll create every combination automatically.
                <br />
                <span className="text-[10px] sm:text-xs">
                  Example: Voltage "AC 120V" × Power "15W, 20W" × CCT "3000K, 4000K" = 8 variations
                </span>
              </p>
              {variationCount > 0 && (
                <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                    Will create <span className="font-bold text-blue-900 dark:text-blue-100">{variationCount}</span> product variation{variationCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <Card className="border border-border/50 dark:border-border/60 dark:bg-card/60">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-foreground">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="type" className="text-xs sm:text-sm font-medium text-foreground">Indoor/Outdoor</label>
                      <Select value={formState.type} onValueChange={handleSelectChange('type')} required>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="subCategory" className="text-xs sm:text-sm font-medium text-foreground">Sub-category *</label>
                      <Input
                        id="subCategory"
                        value={formState.subCategory}
                        onChange={handleInputChange('subCategory')}
                        placeholder="e.g., Downlights"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="productName" className="text-xs sm:text-sm font-medium text-foreground">Product Name *</label>
                      <Input
                        id="productName"
                        value={formState.productName}
                        onChange={handleInputChange('productName')}
                        placeholder="e.g., Aurora LED Downlight"
                        className="bg-background border-border"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="modelNumber" className="text-xs sm:text-sm font-medium text-foreground">Model Number *</label>
                      <Input
                        id="modelNumber"
                        value={formState.modelNumber}
                        onChange={handleInputChange('modelNumber')}
                        placeholder="e.g., DL-100"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="size" className="text-xs sm:text-sm font-medium text-foreground">Size (comma-separated) *</label>
                      <Input
                        id="size"
                        value={formState.size}
                        onChange={handleInputChange('size')}
                        placeholder="e.g., 4 inch, 6 inch, 8 inch"
                        className="bg-background border-border"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="mounting" className="text-xs sm:text-sm font-medium text-foreground">Mounting</label>
                      <Input
                        id="mounting"
                        value={formState.mounting}
                        onChange={handleInputChange('mounting')}
                        placeholder="e.g., Recessed, Surface"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Performance & Electrical */}
              <Card className="border border-border/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-foreground">Performance & Electrical</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="powerW" className="text-xs sm:text-sm font-medium text-foreground">Power (W)</label>
                      <Input
                        id="powerW"
                        value={formState.powerW}
                        onChange={handleInputChange('powerW')}
                        placeholder="e.g., 15W, 20W"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="voltage" className="text-xs sm:text-sm font-medium text-foreground">Voltage</label>
                      <Input
                        id="voltage"
                        value={formState.voltage}
                        onChange={handleInputChange('voltage')}
                        placeholder="e.g., AC 120V"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="cct" className="text-xs sm:text-sm font-medium text-foreground">CCT (K)</label>
                      <Input
                        id="cct"
                        value={formState.cct}
                        onChange={handleInputChange('cct')}
                        placeholder="e.g., 3000K, 4000K"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="criRa" className="text-xs sm:text-sm font-medium text-foreground">CRI (Ra)</label>
                      <Input
                        id="criRa"
                        value={formState.criRa}
                        onChange={handleInputChange('criRa')}
                        placeholder="e.g., 80, 90"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="lumen" className="text-xs sm:text-sm font-medium text-foreground">Lumen</label>
                      <Input
                        id="lumen"
                        value={formState.lumen}
                        onChange={handleInputChange('lumen')}
                        placeholder="e.g., 1000, 1500"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="efficacyLumenPerW" className="text-xs sm:text-sm font-medium text-foreground">Efficacy (lm/W)</label>
                      <Input
                        id="efficacyLumenPerW"
                        value={formState.efficacyLumenPerW}
                        onChange={handleInputChange('efficacyLumenPerW')}
                        placeholder="e.g., 95"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="dimmingType" className="text-xs sm:text-sm font-medium text-foreground">Dimming Type</label>
                      <Input
                        id="dimmingType"
                        value={formState.dimmingType}
                        onChange={handleInputChange('dimmingType')}
                        placeholder="e.g., 0-10V, DALI"
                        className="bg-background border-border"
                      />
                    </div>


                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="installationKits" className="text-xs sm:text-sm font-medium text-foreground">Installation Kits</label>
                      <Input
                        id="installationKits"
                        value={formState.installationKits}
                        onChange={handleInputChange('installationKits')}
                        placeholder="e.g., Surface Mount Kit"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="adjustmentDial" className="text-xs sm:text-sm font-medium text-foreground">Adjustment Dial</label>
                      <Input
                        id="adjustmentDial"
                        value={formState.adjustmentDial}
                        onChange={handleInputChange('adjustmentDial')}
                        placeholder="e.g., CCT Switch"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="materialFinish" className="text-xs sm:text-sm font-medium text-foreground">Material Finish</label>
                      <Input
                        id="materialFinish"
                        value={formState.materialFinish}
                        onChange={handleInputChange('materialFinish')}
                        placeholder="e.g., White, Black"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="certifications" className="text-xs sm:text-sm font-medium text-foreground">Certifications</label>
                      <Input
                        id="certifications"
                        value={formState.certifications}
                        onChange={handleInputChange('certifications')}
                        placeholder="e.g., CE, RoHS"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boolean Fields */}
              <Card className="border border-border/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-foreground">Boolean Features</CardTitle>
                  <p className="text-xs text-muted-foreground">Select TRUE or FALSE for each boolean feature.</p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="sensorsAndControls" className="text-xs sm:text-sm font-medium text-foreground">Sensors & Controls</label>
                      <Select value={formState.sensorsAndControls || 'NONE'} onValueChange={handleBooleanSelectChange('sensorsAndControls')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="occupancy" className="text-xs sm:text-sm font-medium text-foreground">Occupancy</label>
                      <Select value={formState.occupancy || 'NONE'} onValueChange={handleBooleanSelectChange('occupancy')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="biLevel" className="text-xs sm:text-sm font-medium text-foreground">Bi-level</label>
                      <Select value={formState.biLevel || 'NONE'} onValueChange={handleBooleanSelectChange('biLevel')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="pir" className="text-xs sm:text-sm font-medium text-foreground">PIR</label>
                      <Select value={formState.pir || 'NONE'} onValueChange={handleBooleanSelectChange('pir')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="microwave" className="text-xs sm:text-sm font-medium text-foreground">Microwave</label>
                      <Select value={formState.microwave || 'NONE'} onValueChange={handleBooleanSelectChange('microwave')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="remoteControlBluetooth" className="text-xs sm:text-sm font-medium text-foreground">Remote Control / Bluetooth</label>
                      <Select value={formState.remoteControlBluetooth || 'NONE'} onValueChange={handleBooleanSelectChange('remoteControlBluetooth')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="pluginSensor" className="text-xs sm:text-sm font-medium text-foreground">Plug-in Sensor</label>
                      <Select value={formState.pluginSensor || 'NONE'} onValueChange={handleBooleanSelectChange('pluginSensor')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="emergencyBackupBattery" className="text-xs sm:text-sm font-medium text-foreground">Emergency Backup Battery</label>
                      <Select value={formState.emergencyBackupBattery || 'NONE'} onValueChange={handleBooleanSelectChange('emergencyBackupBattery')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="junctionCover" className="text-xs sm:text-sm font-medium text-foreground">Junction Cover</label>
                      <Select value={formState.junctionCover || 'NONE'} onValueChange={handleBooleanSelectChange('junctionCover')}>
                        <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary dark:bg-background dark:border-border dark:hover:border-primary/50 dark:focus:border-primary">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Not Set --</SelectItem>
                          <SelectItem value="TRUE">TRUE</SelectItem>
                          <SelectItem value="FALSE">FALSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commercial Information */}
              <Card className="border border-border/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-foreground">Commercial Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="leadTime" className="text-xs sm:text-sm font-medium text-foreground">Lead Time</label>
                      <Input
                        id="leadTime"
                        value={formState.leadTime}
                        onChange={handleInputChange('leadTime')}
                        placeholder="e.g., 30 days"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="warranty" className="text-xs sm:text-sm font-medium text-foreground">Warranty</label>
                      <Input
                        id="warranty"
                        value={formState.warranty}
                        onChange={handleInputChange('warranty')}
                        placeholder="e.g., 3 years"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="moq" className="text-xs sm:text-sm font-medium text-foreground">MOQ</label>
                      <Input
                        id="moq"
                        value={formState.moq}
                        onChange={handleInputChange('moq')}
                        placeholder="e.g., 100 pcs"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="pricePerPiece" className="text-xs sm:text-sm font-medium text-foreground">Price per piece</label>
                      <Input
                        id="pricePerPiece"
                        type="number"
                        step="0.01"
                        value={formState.pricePerPiece}
                        onChange={handleInputChange('pricePerPiece')}
                        placeholder="e.g., 25.50"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="costChinaDdpUsa" className="text-xs sm:text-sm font-medium text-foreground">Cost China DDP USA</label>
                      <Input
                        id="costChinaDdpUsa"
                        type="number"
                        step="0.01"
                        value={formState.costChinaDdpUsa}
                        onChange={handleInputChange('costChinaDdpUsa')}
                        placeholder="e.g., 18.75"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="costThailandVietnam" className="text-xs sm:text-sm font-medium text-foreground">Cost Thailand/Vietnam</label>
                      <Input
                        id="costThailandVietnam"
                        type="number"
                        step="0.01"
                        value={formState.costThailandVietnam}
                        onChange={handleInputChange('costThailandVietnam')}
                        placeholder="e.g., 17.25"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">Additional Costs</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label htmlFor="sensorCost" className="text-xs sm:text-sm font-medium text-foreground">Sensor Cost</label>
                        <Input
                          id="sensorCost"
                          value={formState.sensorCost}
                          onChange={handleInputChange('sensorCost')}
                          placeholder="e.g., 5.00"
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label htmlFor="remoteControlBluetoothCost" className="text-xs sm:text-sm font-medium text-foreground">Remote Control/Bluetooth Cost</label>
                        <Input
                          id="remoteControlBluetoothCost"
                          value={formState.remoteControlBluetoothCost}
                          onChange={handleInputChange('remoteControlBluetoothCost')}
                          placeholder="e.g., 8.00"
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label htmlFor="pluginSensorCost" className="text-xs sm:text-sm font-medium text-foreground">Plugin Sensor Cost</label>
                        <Input
                          id="pluginSensorCost"
                          value={formState.pluginSensorCost}
                          onChange={handleInputChange('pluginSensorCost')}
                          placeholder="e.g., 6.00"
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label htmlFor="emergencyBackupBatteryCost" className="text-xs sm:text-sm font-medium text-foreground">Emergency Backup Battery Cost</label>
                        <Input
                          id="emergencyBackupBatteryCost"
                          value={formState.emergencyBackupBatteryCost}
                          onChange={handleInputChange('emergencyBackupBatteryCost')}
                          placeholder="e.g., 15.00"
                          className="bg-background border-border"
                        />
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label htmlFor="installationKitsCost" className="text-xs sm:text-sm font-medium text-foreground">Installation Kits Cost</label>
                        <Input
                          id="installationKitsCost"
                          value={formState.installationKitsCost}
                          onChange={handleInputChange('installationKitsCost')}
                          placeholder="e.g., 10.00"
                          className="bg-background border-border"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media Assets */}
              <Card className="border border-border/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-foreground">Media Assets</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="photo" className="text-xs sm:text-sm font-medium text-foreground">Photo URL</label>
                      <Input
                        id="photo"
                        value={formState.photo}
                        onChange={handleInputChange('photo')}
                        placeholder="e.g., https://"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <label htmlFor="cutSheet" className="text-xs sm:text-sm font-medium text-foreground">Cut Sheet URL</label>
                      <Input
                        id="cutSheet"
                        value={formState.cutSheet}
                        onChange={handleInputChange('cutSheet')}
                        placeholder="e.g., https://"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ratings */}
              <Card className="border border-border/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-foreground">Ratings</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="ipRating" className="text-xs sm:text-sm font-medium text-foreground">IP Rating</label>
                    <Input
                      id="ipRating"
                      value={formState.ipRating}
                      onChange={handleInputChange('ipRating')}
                      placeholder="e.g., IP65"
                      className="bg-background border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center pt-3 sm:pt-4 px-3 sm:px-0">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex justify-center py-3 px-6 sm:px-8 min-h-[44px] border border-transparent shadow-sm text-sm sm:text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {variationCount > 1 ? `Create ${variationCount} Variations` : 'Add Product'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {message && (
          <Card className="border border-border/50 mx-3 sm:mx-0">
            <CardContent className="p-4 sm:pt-6">
              <p className={`text-xs sm:text-sm text-center ${message.includes('successfully') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {message}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}