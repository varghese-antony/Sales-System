"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [message, setMessage] = useState('');
  const [variationCount, setVariationCount] = useState(0);

  // Function to calculate variations from comma-separated fields
  const calculateVariations = (formData) => {
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

    const fieldsWithVariations = variationFields
      .map(field => {
        if (!field.value || field.value.trim() === '') {
          return { name: field.name, values: [''] }; // Empty field = single empty value
        }
        const values = field.value.split(',').map(v => v.trim()).filter(v => v.length > 0);
        return { name: field.name, values: values.length > 0 ? values : [''] };
      })
      .filter(field => field.values.length > 0);

    if (fieldsWithVariations.length === 0) return 0;

    // Calculate total combinations
    return fieldsWithVariations.reduce((total, field) => total * field.values.length, 1);
  };

  // Function to generate all variations
  const generateVariations = (formData) => {
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

    const fieldsWithVariations = variationFields
      .map(field => {
        if (!field.value || field.value.trim() === '') {
          return { name: field.name, values: [''] };
        }
        const values = field.value.split(',').map(v => v.trim()).filter(v => v.length > 0);
        return { name: field.name, values: values.length > 0 ? values : [''] };
      })
      .filter(field => field.values.length > 0);

    if (fieldsWithVariations.length === 0) return [];

    // Generate all combinations using a recursive approach
    const generateCombinations = (fields) => {
      if (fields.length === 0) return [{}];

      const [firstField, ...restFields] = fields;
      const restCombinations = generateCombinations(restFields);

      const combinations = [];
      for (const value of firstField.values) {
        for (const restCombo of restCombinations) {
          combinations.push({
            [firstField.name]: value,
            ...restCombo
          });
        }
      }
      return combinations;
    };

    const baseProduct = {
      type: formData.type,
      productType: formData.productType,
      modelNumber: formData.modelNumber,
    };

    const combinations = generateCombinations(fieldsWithVariations);
    return combinations.map(combo => ({ ...baseProduct, ...combo }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Processing data...');

    const formData = {
      type,
      productType,
      modelNumber,
      sizes,
      powerW,
      voltage,
      cct,
      criRa,
      lumen,
      beamAngle,
      pf,
      dimmable,
      finish,
      ledType,
      driverBrand,
      adjustmentDial,
      certifications,
    };

    const variations = generateVariations(formData);

    if (variations.length === 0) {
      setMessage('Please enter at least some data.');
      return;
    }

    try {
      const response = await fetch('https://n8n.werposolutions.com/webhook/post-data-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variations),
      });

      if (response.ok) {
        setMessage(`Data successfully sent to webhook! Created ${variations.length} product variations.`);
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
        setVariationCount(0);
      } else {
        setMessage(`Failed to send data: ${response.statusText}`);
      }
    } catch (error) {
      setMessage(`Error sending data: ${error.message}`);
    }
  };

  // Update variation count when form changes
  const updateVariationCount = () => {
    const formData = {
      type,
      productType,
      modelNumber,
      sizes,
      powerW,
      voltage,
      cct,
      criRa,
      lumen,
      beamAngle,
      pf,
      dimmable,
      finish,
      ledType,
      driverBrand,
      adjustmentDial,
      certifications,
    };
    setVariationCount(calculateVariations(formData));
  };

  // Update variation count whenever form data changes
  useEffect(() => {
    updateVariationCount();
  }, [type, productType, modelNumber, sizes, powerW, voltage, cct, criRa, lumen, beamAngle, pf, dimmable, finish, ledType, driverBrand, adjustmentDial, certifications]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Lighting Product Data Entry</CardTitle>
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
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  Will create <span className="font-bold text-blue-900">{variationCount}</span> product variation{variationCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-medium">Indoor/Outdoor</label>
                    <Select value={type} onValueChange={setType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="productType" className="text-sm font-medium">Product Type</label>
                    <Input
                      id="productType"
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                      placeholder="e.g., Downlight, Track Light"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="modelNumber" className="text-sm font-medium">Model Number</label>
                    <Input
                      id="modelNumber"
                      value={modelNumber}
                      onChange={(e) => setModelNumber(e.target.value)}
                      placeholder="e.g., DL-100"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="sizes" className="text-sm font-medium">Sizes (comma-separated)</label>
                    <Input
                      id="sizes"
                      value={sizes}
                      onChange={(e) => setSizes(e.target.value)}
                      placeholder="e.g., 4 inch, 6 inch, 8 inch"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="powerW" className="text-sm font-medium">Power (W)</label>
                    <Input
                      id="powerW"
                      value={powerW}
                      onChange={(e) => setPowerW(e.target.value)}
                      placeholder="e.g., 15W, 20W, 25W (comma-separated for variations)"
      
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="voltage" className="text-sm font-medium">Voltage</label>
                    <Input
                      id="voltage"
                      value={voltage}
                      onChange={(e) => setVoltage(e.target.value)}
                      placeholder="e.g., 220V, 240V (comma-separated for variations)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cct" className="text-sm font-medium">CCT (K)</label>
                    <Input
                      id="cct"
                      value={cct}
                      onChange={(e) => setCct(e.target.value)}
                      placeholder="e.g., 3000K, 4000K, 6000K (comma-separated for variations)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="criRa" className="text-sm font-medium">CRI (Ra)</label>
                    <Input
                      id="criRa"
                      value={criRa}
                      onChange={(e) => setCriRa(e.target.value)}
                      placeholder="e.g., 80, 90, 95 (comma-separated for variations)"
                    
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lumen" className="text-sm font-medium">Lumen</label>
                    <Input
                      id="lumen"
                      value={lumen}
                      onChange={(e) => setLumen(e.target.value)}
                      placeholder="e.g., 1000, 1200, 1500 (comma-separated for variations)"
                     
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="beamAngle" className="text-sm font-medium">Beam Angle</label>
                    <Input
                      id="beamAngle"
                      value={beamAngle}
                      onChange={(e) => setBeamAngle(e.target.value)}
                      placeholder="e.g., 30°, 60°, 90° (comma-separated for variations)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="pf" className="text-sm font-medium">Power Factor</label>
                    <Input
                      id="pf"
                      value={pf}
                      onChange={(e) => setPf(e.target.value)}
                      placeholder="e.g., 0.9, 0.95, 0.98 (comma-separated for variations)"
                      
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dimmable" className="text-sm font-medium">Dimmable</label>
                    <Input
                      id="dimmable"
                      value={dimmable}
                      onChange={(e) => setDimmable(e.target.value)}
                      placeholder="e.g., Yes, No (comma-separated for variations)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="finish" className="text-sm font-medium">Finish</label>
                    <Input
                      id="finish"
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                      placeholder="e.g., White, Black, Chrome (comma-separated for variations)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LED & Driver Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">LED & Driver Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="ledType" className="text-sm font-medium">LED Type</label>
                    <Input
                      id="ledType"
                      value={ledType}
                      onChange={(e) => setLedType(e.target.value)}
                      placeholder="e.g., COB, SMD, LED Chip (comma-separated for variations)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="driverBrand" className="text-sm font-medium">Driver Brand</label>
                    <Input
                      id="driverBrand"
                      value={driverBrand}
                      onChange={(e) => setDriverBrand(e.target.value)}
                      placeholder="e.g., Mean Well, Philips (comma-separated for variations)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="adjustmentDial" className="text-sm font-medium">Adjustment Dial</label>
                  <Input
                    id="adjustmentDial"
                    value={adjustmentDial}
                    onChange={(e) => setAdjustmentDial(e.target.value)}
                    placeholder="e.g., Yes, 0-10V, DALI (comma-separated for variations)"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="certifications" className="text-sm font-medium">Certifications</label>
                  <Input
                    id="certifications"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="e.g., CE, RoHS, UL, IP65 (comma-separated for variations)"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                {variationCount > 1 ? `Create ${variationCount} Variations` : 'Add Product'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {message && (
        <Card>
          <CardContent className="pt-6">
            <p className={`text-sm text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}