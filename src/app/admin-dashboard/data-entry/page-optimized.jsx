"use client";

import { useState, useEffect, useCallback } from 'react';
import { createProductsBatch, clearCache } from '@/lib/database/products-optimized';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/contexts/ToastContext';
import { useCache } from '@/hooks/useCache';
import { Package, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function DataEntryPage() {
  const [type, setType] = useState('');
  const [productType, setProductType] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [sizes, setSizes] = useState('');
  const [powerW, setPowerW] = useState('');
  const [voltage, setVoltage] = useState('');
  const [cct, setCct] = useState('');
  const [criRa, setCriRa] = useState('');
  const [lumen, setLumen] = useState('');
  const [beamAngle, setBeamAngle] = useState('');
  const [pf, setPf] = useState('');
  const [dimmable, setDimmable] = useState('');
  const [finish, setFinish] = useState('');
  const [ledType, setLedType] = useState('');
  const [driverBrand, setDriverBrand] = useState('');
  const [adjustmentDial, setAdjustmentDial] = useState('');
  const [certifications, setCertifications] = useState('');
  const [pricePc, setPricePc] = useState('');
  const [indoor, setIndoor] = useState('');
  const [emergencyBackupBattery, setEmergencyBackupBattery] = useState('');
  const [pluginSensor, setPluginSensor] = useState('');
  const [leadTime, setLeadTime] = useState('');

  const [message, setMessage] = useState('');
  const [variationCount, setVariationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const cache = useCache(5 * 60 * 1000); // 5 minutes cache

  // Function to calculate variations from comma-separated fields
  const calculateVariations = useCallback((formData) => {
    // ALL fields support variations now
    const variationFields = [
      { name: 'sizes', value: formData.sizes },
      { name: 'voltage', value: formData.voltage },
      { name: 'cct', value: formData.cct },
      { name: 'finish', value: formData.finish },
      { name: 'ledType', value: formData.ledType },
      { name: 'driverBrand', value: formData.driverBrand },
      { name: 'adjustmentDial', value: formData.adjustmentDial },
      { name: 'certifications', value: formData.certifications },
      { name: 'powerW', value: formData.powerW },
      { name: 'criRa', value: formData.criRa },
      { name: 'lumen', value: formData.lumen },
      { name: 'beamAngle', value: formData.beamAngle },
      { name: 'pf', value: formData.pf },
      { name: 'dimmable', value: formData.dimmable },
    ];

    // Filter out empty fields
    const fieldsWithValues = variationFields.filter(field => field.value && field.value.trim());

    if (fieldsWithValues.length === 0) {
      return 1;
    }

    // Calculate total combinations
    const totalVariations = fieldsWithValues.reduce((total, field) => {
      const values = field.value.split(',').map(v => v.trim()).filter(v => v);
      return total * (values.length || 1);
    }, 1);

    return totalVariations;
  }, []);

  // Update variation count when form fields change
  useEffect(() => {
    const formData = {
      sizes, voltage, cct, finish, ledType, driverBrand,
      adjustmentDial, certifications, powerW, criRa, lumen,
      beamAngle, pf, dimmable
    };

    const count = calculateVariations(formData);
    setVariationCount(count);
  }, [sizes, voltage, cct, finish, ledType, driverBrand, adjustmentDial, certifications, powerW, criRa, lumen, beamAngle, pf, dimmable, calculateVariations]);

  // Optimized form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!type || !productType || !modelNumber) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Type, Product Type, Model Number)',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      // Generate all product variations
      const baseProduct = {
        type,
        producttype: productType,
        model_number: modelNumber,
        price_pc: pricePc || null,
        Indoor: type === 'indoor' ? indoor : null,
        Outdoor: type === 'outdoor' ? indoor : null,
        emergency_backup_battery: emergencyBackupBattery || null,
        plugin_sensor: pluginSensor || null,
        lead_time: leadTime || null,
      };

      // Parse comma-separated values for variation fields
      const variationFields = {
        sizes: sizes.split(',').map(s => s.trim()).filter(s => s),
        voltage: voltage.split(',').map(v => v.trim()).filter(v => v),
        cct: cct.split(',').map(c => c.trim()).filter(c => c),
        finish: finish.split(',').map(f => f.trim()).filter(f => f),
        ledType: ledType.split(',').map(l => l.trim()).filter(l => l),
        driverBrand: driverBrand.split(',').map(d => d.trim()).filter(d => d),
        adjustmentDial: adjustmentDial.split(',').map(a => a.trim()).filter(a => a),
        certifications: certifications.split(',').map(c => c.trim()).filter(c => c),
        powerW: powerW.split(',').map(p => p.trim()).filter(p => p),
        criRa: criRa.split(',').map(c => c.trim()).filter(c => c),
        lumen: lumen.split(',').map(l => l.trim()).filter(l => l),
        beamAngle: beamAngle.split(',').map(b => b.trim()).filter(b => b),
        pf: pf.split(',').map(p => p.trim()).filter(p => p),
        dimmable: dimmable.split(',').map(d => d.trim()).filter(d => d),
      };

      // Generate all combinations
      const products = [];
      const fieldNames = Object.keys(variationFields);
      const fieldValues = Object.values(variationFields);

      // Generate combinations recursively
      function generateCombinations(currentIndex, currentProduct) {
        if (currentIndex === fieldNames.length) {
          products.push({
            ...baseProduct,
            ...currentProduct
          });
          return;
        }

        const fieldName = fieldNames[currentIndex];
        const values = fieldValues[currentIndex];

        if (values.length === 0) {
          // No values for this field, use empty string
          generateCombinations(currentIndex + 1, {
            ...currentProduct,
            [fieldName]: ''
          });
        } else {
          // Generate combination for each value
          values.forEach(value => {
            generateCombinations(currentIndex + 1, {
              ...currentProduct,
              [fieldName]: value
            });
          });
        }
      }

      generateCombinations(0, {});

      if (products.length === 0) {
        // No variations, create single product
        products.push(baseProduct);
      }

      // Use batch creation for better performance
      const result = await createProductsBatch(products);

      if (result.error) {
        throw new Error(result.error);
      }

      // Clear cache after successful creation
      clearCache();

      toast({
        title: 'Success',
        description: `Successfully created ${products.length} product${products.length !== 1 ? 's' : ''}`,
      });

      // Reset form
      setType('');
      setProductType('');
      setModelNumber('');
      setSizes('');
      setPowerW('');
      setVoltage('');
      setCct('');
      setCriRa('');
      setLumen('');
      setBeamAngle('');
      setPf('');
      setDimmable('');
      setFinish('');
      setLedType('');
      setDriverBrand('');
      setAdjustmentDial('');
      setCertifications('');
      setPricePc('');
      setIndoor('');
      setEmergencyBackupBattery('');
      setPluginSensor('');
      setLeadTime('');
      setMessage('');

    } catch (error) {
      console.error('Error creating products:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create products',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [type, productType, modelNumber, sizes, powerW, voltage, cct, criRa, lumen, beamAngle, pf, dimmable, finish, ledType, driverBrand, adjustmentDial, certifications, pricePc, indoor, emergencyBackupBattery, pluginSensor, leadTime, toast]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
      setType('');
      setProductType('');
      setModelNumber('');
      setSizes('');
      setPowerW('');
      setVoltage('');
      setCct('');
      setCriRa('');
      setLumen('');
      setBeamAngle('');
      setPf('');
      setDimmable('');
      setFinish('');
      setLedType('');
      setDriverBrand('');
      setAdjustmentDial('');
      setCertifications('');
      setPricePc('');
      setIndoor('');
      setEmergencyBackupBattery('');
      setPluginSensor('');
      setLeadTime('');
      setMessage('');
      setVariationCount(0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/50">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <Card className="border border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Product Data Entry</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Create new lighting products with automatic variation generation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {variationCount} variation{variationCount !== 1 ? 's' : ''}
                  </Badge>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    disabled={saving}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Type *</label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Category</label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="downlight">Downlight</SelectItem>
                        <SelectItem value="panel">Panel</SelectItem>
                        <SelectItem value="strip">Strip</SelectItem>
                        <SelectItem value="track">Track Light</SelectItem>
                        <SelectItem value="flood">Flood Light</SelectItem>
                        <SelectItem value="highbay">High Bay</SelectItem>
                        <SelectItem value="street">Street Light</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Model Number *</label>
                    <Input
                      value={modelNumber}
                      onChange={(e) => setModelNumber(e.target.value)}
                      placeholder="Enter model number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price (PC)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pricePc}
                      onChange={(e) => setPricePc(e.target.value)}
                      placeholder="Enter price per piece"
                    />
                  </div>
                </div>

                {type && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {type === 'indoor' ? 'Indoor Category' : 'Outdoor Category'}
                    </label>
                    <Input
                      value={type === 'indoor' ? indoor : (type === 'outdoor' ? indoor : '')}
                      onChange={(e) => setIndoor(e.target.value)}
                      placeholder={`Enter ${type} category`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Technical Specifications</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Separate multiple values with commas to create variations
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sizes</label>
                    <Input
                      value={sizes}
                      onChange={(e) => setSizes(e.target.value)}
                      placeholder="e.g., 4inch, 6inch, 8inch"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Power (W)</label>
                    <Input
                      value={powerW}
                      onChange={(e) => setPowerW(e.target.value)}
                      placeholder="e.g., 10, 15, 20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Voltage</label>
                    <Input
                      value={voltage}
                      onChange={(e) => setVoltage(e.target.value)}
                      placeholder="e.g., 220-240V, 100-277V"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">CCT</label>
                    <Input
                      value={cct}
                      onChange={(e) => setCct(e.target.value)}
                      placeholder="e.g., 3000K, 4000K, 6000K"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">CRI (Ra)</label>
                    <Input
                      value={criRa}
                      onChange={(e) => setCriRa(e.target.value)}
                      placeholder="e.g., 80, 90, 95"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lumen</label>
                    <Input
                      value={lumen}
                      onChange={(e) => setLumen(e.target.value)}
                      placeholder="e.g., 1000, 1500, 2000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Beam Angle</label>
                    <Input
                      value={beamAngle}
                      onChange={(e) => setBeamAngle(e.target.value)}
                      placeholder="e.g., 60°, 90°, 120°"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Power Factor</label>
                    <Input
                      value={pf}
                      onChange={(e) => setPf(e.target.value)}
                      placeholder="e.g., 0.9, 0.95"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dimmable</label>
                    <Select value={dimmable} onValueChange={setDimmable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dimmable option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="0-10V">0-10V</SelectItem>
                        <SelectItem value="DALI">DALI</SelectItem>
                        <SelectItem value="Triac">Triac</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Material Finish</label>
                    <Input
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                      placeholder="e.g., White, Black, Silver"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">LED Type</label>
                    <Input
                      value={ledType}
                      onChange={(e) => setLedType(e.target.value)}
                      placeholder="e.g., SMD2835, SMD3030, COB"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Driver Brand</label>
                    <Input
                      value={driverBrand}
                      onChange={(e) => setDriverBrand(e.target.value)}
                      placeholder="e.g., Philips, Osram, Meanwell"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Adjustment Dial</label>
                    <Input
                      value={adjustmentDial}
                      onChange={(e) => setAdjustmentDial(e.target.value)}
                      placeholder="e.g., Yes, No, Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Certifications</label>
                    <Input
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      placeholder="e.g., CE, RoHS, UL, DLC"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lead Time (days)</label>
                    <Input
                      type="number"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      placeholder="Enter lead time in days"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emergency Backup Battery</label>
                    <Select value={emergencyBackupBattery} onValueChange={setEmergencyBackupBattery}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plugin Sensor</label>
                    <Select value={pluginSensor} onValueChange={setPluginSensor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <Card className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {variationCount} product{variationCount !== 1 ? 's' : ''} will be created
                      </span>
                    </div>

                    {saving && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Creating products...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={saving}
                    >
                      Reset Form
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !type || !productType || !modelNumber}
                      className="min-w-[120px]"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Products
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Success/Error Messages */}
          {message && (
            <Card className={`border ${message.includes('Error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {message.includes('Error') ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  <p className={`text-sm ${message.includes('Error') ? 'text-red-700' : 'text-green-700'}`}>
                    {message}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
