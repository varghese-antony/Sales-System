"use client";

import { useState, useEffect } from 'react';

import { createProducts, fieldMapping } from '@/lib/database/products'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';

const FORM_FIELD_KEYS = [
  'type',
  'productType',
  'category',
  'name',
  'description',
  'modelNumber',
  'sizes',
  'mounting',
  'voltage',
  'powerW',
  'cct',
  'criRa',
  'lumen',
  'efficacyLmw',
  'beamAngle',
  'powerFactor',
  'dimmingType',
  'dimmable',
  'emergencyBackupBattery',
  'pluginSensor',
  'sensorMicrowaveBluetooth',
  'junctionCover',
  'remoteControl',
  'installationKits',
  'materialFinish',
  'ledType',
  'driverBrand',
  'adjustmentDial',
  'certifications',
  'leadTime',
  'warranty',
  'moq',
  'pricePc',
  'costChinaDdpUsa',
  'costThailandVietnam',
  'photo',
  'imageUrl',
  'cutSheet',
  'ipRating',
  'ikRating',
];

const VARIATION_FIELD_KEYS = [
  'sizes',
  'mounting',
  'voltage',
  'powerW',
  'cct',
  'criRa',
  'lumen',
  'efficacyLmw',
  'beamAngle',
  'powerFactor',
  'dimmingType',
  'dimmable',
  'emergencyBackupBattery',
  'pluginSensor',
  'sensorMicrowaveBluetooth',
  'junctionCover',
  'remoteControl',
  'installationKits',
  'materialFinish',
  'ledType',
  'driverBrand',
  'adjustmentDial',
  'certifications',
  'leadTime',
  'warranty',
  'moq',
  'pricePc',
  'costChinaDdpUsa',
  'costThailandVietnam',
  'photo',
  'imageUrl',
  'cutSheet',
  'ipRating',
  'ikRating',
];
export default function DataEntryPage() {
  const [type, setType] = useState('');
  const [productType, setProductType] = useState('');
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [sizes, setSizes] = useState('');
  const [mounting, setMounting] = useState('');
  const [powerW, setPowerW] = useState('');
  const [voltage, setVoltage] = useState('');
  const [cct, setCct] = useState('');
  const [criRa, setCriRa] = useState('');
  const [lumen, setLumen] = useState('');
  const [efficacyLmw, setEfficacyLmw] = useState('');
  const [beamAngle, setBeamAngle] = useState('');
  const [powerFactor, setPowerFactor] = useState('');
  const [dimmingType, setDimmingType] = useState('');
  const [dimmable, setDimmable] = useState('');
  const [emergencyBackupBattery, setEmergencyBackupBattery] = useState('');
  const [pluginSensor, setPluginSensor] = useState('');
  const [sensorMicrowaveBluetooth, setSensorMicrowaveBluetooth] = useState('');
  const [junctionCover, setJunctionCover] = useState('');
  const [remoteControl, setRemoteControl] = useState('');
  const [installationKits, setInstallationKits] = useState('');
  const [adjustmentDial, setAdjustmentDial] = useState('');
  const [materialFinish, setMaterialFinish] = useState('');
  const [ledType, setLedType] = useState('');
  const [driverBrand, setDriverBrand] = useState('');
  const [certifications, setCertifications] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [warranty, setWarranty] = useState('');
  const [moq, setMoq] = useState('');
  const [pricePc, setPricePc] = useState('');
  const [costChinaDdpUsa, setCostChinaDdpUsa] = useState('');
  const [costThailandVietnam, setCostThailandVietnam] = useState('');
  const [photo, setPhoto] = useState('');
  const [cutSheet, setCutSheet] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ipRating, setIpRating] = useState('');
  const [ikRating, setIkRating] = useState('');
  const [message, setMessage] = useState('');
  const [variationCount, setVariationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const buildFormState = () => ({
    type,
    productType,
    category,
    name,
    description,
    modelNumber,
    sizes,
    mounting,
    voltage,
    powerW,
    cct,
    criRa,
    lumen,
    efficacyLmw,
    beamAngle,
    powerFactor,
    dimmingType,
    dimmable,
    emergencyBackupBattery,
    pluginSensor,
    sensorMicrowaveBluetooth,
    junctionCover,
    remoteControl,
    installationKits,
    materialFinish,
    ledType,
    driverBrand,
    adjustmentDial,
    certifications,
    leadTime,
    warranty,
    moq,
    pricePc,
    costChinaDdpUsa,
    costThailandVietnam,
    photo,
    imageUrl,
    cutSheet,
    ipRating,
    ikRating,
  });

  const parseFieldValues = (value) => {
    if (typeof value !== 'string') return [''];

    const trimmed = value.trim();
    if (!trimmed) return [''];

    const values = trimmed.split(',').map((entry) => entry.trim()).filter(Boolean);
    return values.length > 0 ? values : [''];
  };

  const calculateVariations = (formData) => {
    if (!formData) return 0;

    const variationFields = VARIATION_FIELD_KEYS.map((name) => ({
      name,
      values: parseFieldValues(formData[name] ?? ''),
    }));

    if (variationFields.length === 0) return 0;

    return variationFields.reduce((total, field) => total * field.values.length, 1);
  };

  const generateVariations = (formData) => {
    if (!formData) return [];

    const variationFields = VARIATION_FIELD_KEYS.map((name) => ({
      name,
      values: parseFieldValues(formData[name] ?? ''),
    }));

    const baseFields = FORM_FIELD_KEYS.filter((key) => !VARIATION_FIELD_KEYS.includes(key));
    const baseProduct = baseFields.reduce((acc, key) => {
      const value = formData[key];
      acc[key] = typeof value === 'string' ? value.trim() : value ?? '';
      return acc;
    }, {});

    const buildCombinations = (fields, index = 0) => {
      if (index >= fields.length) {
        return [{}];
      }

      const { name, values } = fields[index];
      const restCombinations = buildCombinations(fields, index + 1);
      const combinations = [];

      values.forEach((value) => {
        restCombinations.forEach((combo) => {
          combinations.push({
            ...combo,
            [name]: value,
          });
        });
      });

      return combinations;
    };

    const combinations = buildCombinations(variationFields);
    return combinations.map((combo) => ({ ...baseProduct, ...combo }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Processing data...');

    const formData = buildFormState();

    // Ensure required fields are present
    if (!formData.type || !formData.productType || !formData.modelNumber) {
      setMessage('Please select type and fill in product type and model number.');
      return;
    }

    const variations = generateVariations(formData);

    if (variations.length === 0) {
      setMessage('Please enter at least some data.');
      return;
    }

    try {
      const variationsWithType = variations.map(variation => {
        const mappedVariation = {}
        Object.entries(variation).forEach(([key, value]) => {
          if (key === 'category') {
            return
          }

          const dbColumn = fieldMapping[key] || key
          mappedVariation[dbColumn] = value
        })

        if (formData.category) {
          const categoryColumn = formData.type === 'indoor' ? 'Indoor' : 'Outdoor'
          mappedVariation[categoryColumn] = formData.category
        }

        if (formData.name) {
          mappedVariation[fieldMapping.name] = formData.name
        }

        if (formData.description) {
          mappedVariation[fieldMapping.description] = formData.description
        }

        mappedVariation.producttype = formData.productType
        mappedVariation.type = formData.type
        mappedVariation.model_number = formData.modelNumber

        return mappedVariation
      })

      const { data, error } = await createProducts(variationsWithType)
      if (error) {
        throw new Error(error)
      }

      if (data) {
        setMessage(`Data successfully created! Created ${variations.length} product variations.`)
        // Reset form
        setType('')
        setProductType('')
        setCategory('')
        setName('')
        setDescription('')
        setModelNumber('')
        setSizes('')
        setMounting('')
        setPowerW('')
        setVoltage('')
        setCct('')
        setCriRa('')
        setLumen('')
        setEfficacyLmw('')
        setBeamAngle('')
        setPowerFactor('')
        setDimmingType('')
        setDimmable('')
        setEmergencyBackupBattery('')
        setPluginSensor('')
        setSensorMicrowaveBluetooth('')
        setJunctionCover('')
        setRemoteControl('')
        setInstallationKits('')
        setMaterialFinish('')
        setLedType('')
        setDriverBrand('')
        setAdjustmentDial('')
        setCertifications('')
        setLeadTime('')
        setWarranty('')
        setMoq('')
        setPricePc('')
        setCostChinaDdpUsa('')
        setCostThailandVietnam('')
        setPhoto('')
        setImageUrl('')
        setCutSheet('')
        setIpRating('')
        setIkRating('')
        setVariationCount(0)
      }
    } catch (error) {
      setMessage(`Failed to create products: ${error.message}`)
    }
  };

  // Update variation count when form changes
  const updateVariationCount = () => {
    const formState = buildFormState();
    setVariationCount(calculateVariations(formState));
  };

  useEffect(() => {
    updateVariationCount();
  }, [
    type,
    productType,
    category,
    name,
    description,
    modelNumber,
    sizes,
    mounting,
    voltage,
    powerW,
    cct,
    criRa,
    lumen,
    efficacyLmw,
    beamAngle,
    powerFactor,
    dimmingType,
    dimmable,
    emergencyBackupBattery,
    pluginSensor,
    sensorMicrowaveBluetooth,
    junctionCover,
    remoteControl,
    installationKits,
    materialFinish,
    ledType,
    driverBrand,
    adjustmentDial,
    certifications,
    leadTime,
    warranty,
    moq,
    pricePc,
    costChinaDdpUsa,
    costThailandVietnam,
    photo,
    imageUrl,
    cutSheet,
    ipRating,
    ikRating,
  ]);

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

      <div className="container mx-auto p-4 max-w-4xl relative z-10">
        <Card className="mb-6 border border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-foreground">Lighting Product Data Entry</CardTitle>
            <p className="text-muted-foreground text-center">Add new lighting products to your catalog</p>
            <div className="text-center mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Universal Variation System:</strong> Use commas to separate multiple values in ANY field to create product variations.
                <br />
                <span className="text-xs">
                  Example: Voltage "220V, 240V" × Power "15W, 20W" × CCT "3000K, 4000K" = 8 variations
                </span>
              </p>
              {variationCount > 0 && (
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Will create <span className="font-bold text-blue-900 dark:text-blue-100">{variationCount}</span> product variation{variationCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="type" className="text-sm font-medium text-foreground">Indoor/Outdoor</label>
                      <Select value={type} onValueChange={setType} required>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="productType" className="text-sm font-medium text-foreground">Product Type</label>
                      <Input
                        id="productType"
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        placeholder="e.g., Downlight, Track Light"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="modelNumber" className="text-sm font-medium text-foreground">Model Number</label>
                      <Input
                        id="modelNumber"
                        value={modelNumber}
                        onChange={(e) => setModelNumber(e.target.value)}
                        placeholder="e.g., DL-100"
                        className="bg-background border-border"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sizes" className="text-sm font-medium text-foreground">Sizes (comma-separated)</label>
                      <Input
                        id="sizes"
                        value={sizes}
                        onChange={(e) => setSizes(e.target.value)}
                        placeholder="e.g., 4 inch, 6 inch, 8 inch"
                        className="bg-background border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="category" className="text-sm font-medium text-foreground">Category</label>
                      <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Residential Lighting"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">Product Name</label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Aurora LED Downlight"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-foreground">Description</label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide a brief description of the product"
                      className="bg-background border-border"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mounting" className="text-sm font-medium text-foreground">Mounting</label>
                    <Input
                      id="mounting"
                      value={mounting}
                      onChange={(e) => setMounting(e.target.value)}
                      placeholder="e.g., Recessed, Surface"
                      className="bg-background border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Technical Specifications */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="powerW" className="text-sm font-medium text-foreground">Power (W)</label>
                      <Input
                        id="powerW"
                        value={powerW}
                        onChange={(e) => setPowerW(e.target.value)}
                        placeholder="e.g., 15W, 20W, 25W (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="voltage" className="text-sm font-medium text-foreground">Voltage</label>
                      <Input
                        id="voltage"
                        value={voltage}
                        onChange={(e) => setVoltage(e.target.value)}
                        placeholder="e.g., 220V, 240V (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="cct" className="text-sm font-medium text-foreground">CCT (K)</label>
                      <Input
                        id="cct"
                        value={cct}
                        onChange={(e) => setCct(e.target.value)}
                        placeholder="e.g., 3000K, 4000K, 6000K (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="criRa" className="text-sm font-medium text-foreground">CRI (Ra)</label>
                      <Input
                        id="criRa"
                        value={criRa}
                        onChange={(e) => setCriRa(e.target.value)}
                        placeholder="e.g., 80, 90, 95 (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lumen" className="text-sm font-medium text-foreground">Lumen</label>
                      <Input
                        id="lumen"
                        value={lumen}
                        onChange={(e) => setLumen(e.target.value)}
                        placeholder="e.g., 1000, 1200, 1500 (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="beamAngle" className="text-sm font-medium text-foreground">Beam Angle</label>
                      <Input
                        id="beamAngle"
                        value={beamAngle}
                        onChange={(e) => setBeamAngle(e.target.value)}
                        placeholder="e.g., 30°, 60°, 90° (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="efficacyLmw" className="text-sm font-medium text-foreground">Efficacy (lm/W)</label>
                      <Input
                        id="efficacyLmw"
                        value={efficacyLmw}
                        onChange={(e) => setEfficacyLmw(e.target.value)}
                        placeholder="e.g., 80, 95"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="powerFactor" className="text-sm font-medium text-foreground">Power Factor</label>
                      <Input
                        id="powerFactor"
                        value={powerFactor}
                        onChange={(e) => setPowerFactor(e.target.value)}
                        placeholder="e.g., 0.9, 0.95, 0.98 (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="dimmingType" className="text-sm font-medium text-foreground">Dimming Type</label>
                      <Input
                        id="dimmingType"
                        value={dimmingType}
                        onChange={(e) => setDimmingType(e.target.value)}
                        placeholder="e.g., 0-10V, DALI"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="dimmable" className="text-sm font-medium text-foreground">Dimmable</label>
                      <Input
                        id="dimmable"
                        value={dimmable}
                        onChange={(e) => setDimmable(e.target.value)}
                        placeholder="e.g., Yes, No (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="emergencyBackupBattery" className="text-sm font-medium text-foreground">Emergency Backup Battery</label>
                      <Input
                        id="emergencyBackupBattery"
                        value={emergencyBackupBattery}
                        onChange={(e) => setEmergencyBackupBattery(e.target.value)}
                        placeholder="e.g., Optional"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="pluginSensor" className="text-sm font-medium text-foreground">Plug-in Sensor</label>
                      <Input
                        id="pluginSensor"
                        value={pluginSensor}
                        onChange={(e) => setPluginSensor(e.target.value)}
                        placeholder="e.g., Yes, No"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sensorMicrowaveBluetooth" className="text-sm font-medium text-foreground">Sensor (Microwave/Bluetooth)</label>
                      <Input
                        id="sensorMicrowaveBluetooth"
                        value={sensorMicrowaveBluetooth}
                        onChange={(e) => setSensorMicrowaveBluetooth(e.target.value)}
                        placeholder="e.g., Microwave, Bluetooth"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="junctionCover" className="text-sm font-medium text-foreground">Junction Cover</label>
                      <Input
                        id="junctionCover"
                        value={junctionCover}
                        onChange={(e) => setJunctionCover(e.target.value)}
                        placeholder="e.g., Included"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="remoteControl" className="text-sm font-medium text-foreground">Remote Control</label>
                      <Input
                        id="remoteControl"
                        value={remoteControl}
                        onChange={(e) => setRemoteControl(e.target.value)}
                        placeholder="e.g., Included"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="installationKits" className="text-sm font-medium text-foreground">Installation Kits</label>
                      <Input
                        id="installationKits"
                        value={installationKits}
                        onChange={(e) => setInstallationKits(e.target.value)}
                        placeholder="e.g., Surface Mount Kit"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LED & Driver Information */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">LED & Driver Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="ledType" className="text-sm font-medium text-foreground">LED Type</label>
                      <Input
                        id="ledType"
                        value={ledType}
                        onChange={(e) => setLedType(e.target.value)}
                        placeholder="e.g., COB, SMD, LED Chip (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="driverBrand" className="text-sm font-medium text-foreground">Driver Brand</label>
                      <Input
                        id="driverBrand"
                        value={driverBrand}
                        onChange={(e) => setDriverBrand(e.target.value)}
                        placeholder="e.g., Mean Well, Philips (comma-separated for variations)"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="adjustmentDial" className="text-sm font-medium text-foreground">Adjustment Dial</label>
                    <Input
                      id="adjustmentDial"
                      value={adjustmentDial}
                      onChange={(e) => setAdjustmentDial(e.target.value)}
                      placeholder="e.g., Yes, 0-10V, DALI (comma-separated for variations)"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="materialFinish" className="text-sm font-medium text-foreground">Material Finish</label>
                    <Input
                      id="materialFinish"
                      value={materialFinish}
                      onChange={(e) => setMaterialFinish(e.target.value)}
                      placeholder="e.g., White, Black, Chrome"
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="certifications" className="text-sm font-medium text-foreground">Certifications</label>
                    <Input
                      id="certifications"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      placeholder="e.g., CE, RoHS, UL, IP65 (comma-separated for variations)"
                      className="bg-background border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Commercial Information */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Commercial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="leadTime" className="text-sm font-medium text-foreground">Lead Time</label>
                      <Input
                        id="leadTime"
                        value={leadTime}
                        onChange={(e) => setLeadTime(e.target.value)}
                        placeholder="e.g., 30 days"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="warranty" className="text-sm font-medium text-foreground">Warranty</label>
                      <Input
                        id="warranty"
                        value={warranty}
                        onChange={(e) => setWarranty(e.target.value)}
                        placeholder="e.g., 3 years"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="moq" className="text-sm font-medium text-foreground">MOQ</label>
                      <Input
                        id="moq"
                        value={moq}
                        onChange={(e) => setMoq(e.target.value)}
                        placeholder="e.g., 100 pcs"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="pricePc" className="text-sm font-medium text-foreground">Price per piece</label>
                      <Input
                        id="pricePc"
                        type="number"
                        step="0.01"
                        value={pricePc}
                        onChange={(e) => setPricePc(e.target.value)}
                        placeholder="e.g., 25.50"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="costChinaDdpUsa" className="text-sm font-medium text-foreground">Cost China DDP USA</label>
                      <Input
                        id="costChinaDdpUsa"
                        type="number"
                        step="0.01"
                        value={costChinaDdpUsa}
                        onChange={(e) => setCostChinaDdpUsa(e.target.value)}
                        placeholder="e.g., 18.75"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="costThailandVietnam" className="text-sm font-medium text-foreground">Cost Thailand/Vietnam</label>
                      <Input
                        id="costThailandVietnam"
                        type="number"
                        step="0.01"
                        value={costThailandVietnam}
                        onChange={(e) => setCostThailandVietnam(e.target.value)}
                        placeholder="e.g., 17.25"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Media Assets */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Media Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="photo" className="text-sm font-medium text-foreground">Photo URL</label>
                      <Input
                        id="photo"
                        value={photo}
                        onChange={(e) => setPhoto(e.target.value)}
                        placeholder="e.g., https://"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="imageUrl" className="text-sm font-medium text-foreground">Image URL</label>
                      <Input
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="e.g., https://"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cutSheet" className="text-sm font-medium text-foreground">Cut Sheet URL</label>
                    <Input
                      id="cutSheet"
                      value={cutSheet}
                      onChange={(e) => setCutSheet(e.target.value)}
                      placeholder="e.g., https://"
                      className="bg-background border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ratings */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Ratings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="ipRating" className="text-sm font-medium text-foreground">IP Rating</label>
                      <Input
                        id="ipRating"
                        value={ipRating}
                        onChange={(e) => setIpRating(e.target.value)}
                        placeholder="e.g., IP65"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="ikRating" className="text-sm font-medium text-foreground">IK Rating</label>
                      <Input
                        id="ikRating"
                        value={ikRating}
                        onChange={(e) => setIkRating(e.target.value)}
                        placeholder="e.g., IK08"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {variationCount > 1 ? `Create ${variationCount} Variations` : 'Add Product'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {message && (
          <Card className="border border-border/50">
            <CardContent className="pt-6">
              <p className={`text-sm text-center ${message.includes('successfully') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {message}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}