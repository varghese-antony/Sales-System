"use client";

import { useState, useEffect } from 'react';
import { getAllProducts, updateProductPrices, getDistinctProductTypes } from '@/lib/database/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Filter,
  Settings,
  CheckCircle,
  AlertCircle,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PriceVariationPage() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Data states
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedType, setSelectedType] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [availableProductTypes, setAvailableProductTypes] = useState([]);

  // Pricing states
  const [basePrice, setBasePrice] = useState('');
  const [fieldVariations, setFieldVariations] = useState({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [updatedProductsCount, setUpdatedProductsCount] = useState(0);

  // Field configuration
  const pricingFields = [
    { key: 'power_w', label: 'Power (W)', dbColumn: 'power_w' },
    { key: 'Voltage', label: 'Voltage', dbColumn: 'Voltage' },
    { key: 'CCT', label: 'CCT (K)', dbColumn: 'CCT' },
    { key: 'cri_ra', label: 'CRI (Ra)', dbColumn: 'cri_ra' },
    { key: 'Lumen', label: 'Lumen', dbColumn: 'Lumen' },
    { key: 'efficacy_lmw', label: 'Beam Angle', dbColumn: 'efficacy_lmw' },
    { key: 'Power Factor', label: 'Power Factor', dbColumn: 'Power Factor' },
    { key: 'Dimmable', label: 'Dimmable', dbColumn: 'Dimmable' },
    { key: 'Material Finish', label: 'Finish', dbColumn: 'material_finish' },
    { key: 'led_type', label: 'LED Type', dbColumn: 'led_type' },
    { key: 'Driver Brand', label: 'Driver Brand', dbColumn: 'driver_brand' },
    { key: 'adjustment_dial', label: 'Adjustment Dial', dbColumn: 'adjustment_dial' },
    { key: 'certifications', label: 'Certifications', dbColumn: 'certifications' }
  ];

  // Initialize component
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all products from both tables
      const indoorProducts = await fetchProductsByTable('indoor');
      const outdoorProducts = await fetchProductsByTable('outdoor');

      const allProducts = [...indoorProducts, ...outdoorProducts];

      // Filter products without prices
      const productsWithoutPrices = allProducts.filter(product =>
        !product.price_pc || product.price_pc.trim() === ''
      );

      setProducts(allProducts);
      setFilteredProducts(productsWithoutPrices);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByTable = async (table) => {
    try {
      const { data: productTypes, error: typesError } = await getDistinctProductTypes(table);
      if (typesError) throw typesError;

      const allProducts = [];
      for (const productType of productTypes || []) {
        const { data: products, error } = await getAllProducts(table, {
          producttype: productType.producttype
        });
        if (!error && products) {
          allProducts.push(...products.map(p => ({ ...p, type: table })));
        }
      }
      return allProducts;
    } catch (error) {
      console.error(`Error fetching ${table} products:`, error);
      return [];
    }
  };

  const handleTypeSelection = async (type) => {
    setSelectedType(type);
    setSelectedProductType('');

    try {
      const { data: productTypes, error } = await getDistinctProductTypes(type);
      if (!error) {
        setAvailableProductTypes(productTypes || []);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const handleProductTypeSelection = (productType) => {
    setSelectedProductType(productType);

    // Filter products based on selections
    let filtered = products.filter(product =>
      (!selectedType || product.type === selectedType) &&
      (!productType || product.producttype === productType) &&
      (!product.price_pc || product.price_pc.trim() === '')
    );

    setFilteredProducts(filtered);
    setCompletedSteps(prev => new Set([...prev, 1]));
    setCurrentStep(2);
  };

  const handleBasePriceSubmit = () => {
    if (!basePrice || basePrice <= 0) {
      setError('Please enter a valid base price');
      return;
    }

    setError(null);
    setCompletedSteps(prev => new Set([...prev, 2]));
    setCurrentStep(3);
  };

  const handleFieldVariation = (fieldKey, option, increment) => {
    setFieldVariations(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [option]: increment === '' ? null : parseFloat(increment) || 0
      }
    }));
  };

  const handleNextField = () => {
    if (currentFieldIndex < pricingFields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    } else {
      setCompletedSteps(prev => new Set([...prev, 3]));
      setCurrentStep(4);
    }
  };

  const calculatePriceVariations = () => {
    if (filteredProducts.length === 0) return [];

    const variations = [];

    filteredProducts.forEach(product => {
      let finalPrice = parseFloat(basePrice);
      let totalIncrement = 0;

      pricingFields.forEach(field => {
        const productValue = product[field.dbColumn];
        if (productValue !== null && productValue !== undefined) {
          // Handle both string and non-string values for comparison
          const valueKey = typeof productValue === 'string' ? productValue : String(productValue);

          if (fieldVariations[field.key]?.[valueKey] !== null && fieldVariations[field.key]?.[valueKey] !== undefined) {
            const increment = fieldVariations[field.key][valueKey];
            if (increment > 0) {
              totalIncrement += increment;
              finalPrice += increment;
            }
          }
        }
      });

      variations.push({
        id: product.id,
        type: product.type,
        price: finalPrice.toFixed(2),
        totalIncrement: totalIncrement.toFixed(2)
      });
    });

    return variations;
  };

  const handleBulkUpdate = async () => {
    const priceVariations = calculatePriceVariations();
    if (priceVariations.length === 0) return;

    try {
      setLoading(true);
      const { results, error } = await updateProductPrices(priceVariations);

      if (error) throw error;

      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;

      if (successful > 0) {
        // Store the count before clearing
        setUpdatedProductsCount(successful);

        // Update local state
        setProducts(prev => prev.map(p => {
          const update = priceVariations.find(u => u.id === p.id);
          return update ? { ...p, price_pc: update.price } : p;
        }));

        setFilteredProducts([]);
        setCompletedSteps(prev => new Set([...prev, 4]));
        setCurrentStep(5);
      } else if (failed > 0) {
        setError(`Failed to update ${failed} products. Please try again.`);
      } else {
        setError('No products were updated. Please check your configuration and try again.');
      }
    } catch (error) {
      setError('Failed to update prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetProcess = () => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setSelectedType('');
    setSelectedProductType('');
    setBasePrice('');
    setFieldVariations({});
    setCurrentFieldIndex(0);
    setUpdatedProductsCount(0);
    fetchInitialData();
  };

  if (loading && currentStep === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading products for pricing...</p>
        </div>
      </div>
    );
  }

  if (error && currentStep === 1) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-black">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-6">
            <Calculator className="w-12 h-12 text-blue-600" />
          </div>

          <h1 className="text-4xl font-bold mb-4 dark:text-white text-gray-900">
            Bulk Price Variation Setup
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Set prices for multiple products using filters and custom increment amounts. Configure different prices for each variation option.
          </p>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : completedSteps.has(step)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {completedSteps.has(step) ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600">
              {currentStep === 1 && "Select product filters"}
              {currentStep === 2 && "Set base price"}
              {currentStep === 3 && "Configure field variations"}
              {currentStep === 4 && "Review and apply changes"}
              {currentStep === 5 && "Complete!"}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && currentStep > 1 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Step 1: Select Product Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Type Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Indoor/Outdoor</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['indoor', 'outdoor'].map((type) => (
                          <Button
                            key={type}
                            variant={selectedType === type ? "default" : "outline"}
                            onClick={() => handleTypeSelection(type)}
                            className="capitalize"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-medium">Product Type</label>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {availableProductTypes.map((pt) => (
                          <Button
                            key={pt.producttype}
                            variant={selectedProductType === pt.producttype ? "default" : "outline"}
                            onClick={() => setSelectedProductType(pt.producttype)}
                            size="sm"
                            className="justify-start text-left"
                          >
                            {pt.producttype}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Results Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Products Found:</h4>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {filteredProducts.length} products without prices
                      </Badge>
                      {selectedType && (
                        <Badge variant="outline">{selectedType}</Badge>
                      )}
                      {selectedProductType && (
                        <Badge variant="outline">{selectedProductType}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleProductTypeSelection(selectedProductType)}
                      disabled={!selectedProductType}
                      className="min-w-32"
                    >
                      Next: Set Base Price
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Step 2: Set Base Price
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Base Price per Product ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter base price"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="text-center text-lg"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        This base price will be applied to all {filteredProducts.length} selected products.
                        In the next step, you'll set custom increment amounts for each variation option.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Filters
                    </Button>
                    <Button
                      onClick={handleBasePriceSubmit}
                      disabled={!basePrice || basePrice <= 0}
                      className="min-w-32"
                    >
                      Next: Configure Variations
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Step 3: Configure Field Variations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      For each field, set custom increment amounts for each option. Enter 0 or leave empty to skip an option.
                      Each product's final price will be: Base Price + Sum of all selected increments.
                    </p>
                  </div>

                  {(() => {
                    const currentField = pricingFields[currentFieldIndex];
                    const fieldValues = new Set();

                    // Collect all unique values for current field
                    filteredProducts.forEach(product => {
                      const value = product[currentField.dbColumn];
                      if (value !== null && value !== undefined) {
                        // Handle both string and non-string values
                        if (typeof value === 'string') {
                          value.split(',').forEach(v => {
                            const trimmed = v.trim();
                            if (trimmed) fieldValues.add(trimmed);
                          });
                        } else {
                          // For non-string values (numbers, etc.), add them directly
                          fieldValues.add(String(value));
                        }
                      }
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">
                            {currentField.label}
                            <span className="text-sm text-gray-500 ml-2">
                              ({currentFieldIndex + 1} of {pricingFields.length})
                            </span>
                          </h3>
                          <Badge variant="outline">
                            {fieldValues.size} unique options
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                          {Array.from(fieldValues).map((value) => {
                            const currentIncrement = fieldVariations[currentField.key]?.[value] || '';
                            return (
                              <div key={value} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <div className="flex-1">
                                  <label className="text-sm font-medium block mb-1">
                                    {value}
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={currentIncrement === null ? '' : currentIncrement}
                                      onChange={(e) => handleFieldVariation(currentField.key, value, e.target.value)}
                                      className="w-20 h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                {currentIncrement > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +${currentIncrement}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentFieldIndex(Math.max(0, currentFieldIndex - 1))}
                            disabled={currentFieldIndex === 0}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous Field
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              onClick={handleNextField}
                            >
                              Skip This Field
                            </Button>
                            <Button
                              onClick={handleNextField}
                              className="min-w-32"
                            >
                              {currentFieldIndex === pricingFields.length - 1 ? 'Review Changes' : 'Next Field'}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Step 4: Review and Apply Changes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Configuration Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Price:</span>
                          <span className="font-medium">${basePrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Products to Update:</span>
                          <span className="font-medium">{filteredProducts.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custom Increments Set:</span>
                          <span className="font-medium">
                            {Object.values(fieldVariations).flatMap(field => Object.values(field)).filter(inc => inc > 0).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Sample Price Calculations</h3>
                      <div className="space-y-2 text-sm">
                        {filteredProducts.slice(0, 3).map((product, index) => {
                          let finalPrice = parseFloat(basePrice);
                          let totalIncrement = 0;
                          let variations = [];

                          pricingFields.forEach(field => {
                            const value = product[field.dbColumn];
                            if (value !== null && value !== undefined && fieldVariations[field.key]?.[value] !== null && fieldVariations[field.key]?.[value] !== undefined) {
                              const increment = fieldVariations[field.key][value];
                              if (increment > 0) {
                                totalIncrement += increment;
                                finalPrice += increment;
                                variations.push(`${field.label}: +$${increment}`);
                              }
                            }
                          });

                          return (
                            <div key={index} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {product.producttype} - {product.model_number}
                                </div>
                                {variations.length > 0 && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {variations.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${finalPrice.toFixed(2)}</div>
                                {totalIncrement > 0 && (
                                  <div className="text-xs text-gray-500">
                                    (+${totalIncrement.toFixed(2)})
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(3)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Variations
                    </Button>
                    <Button
                      onClick={handleBulkUpdate}
                      disabled={loading}
                      className="min-w-32"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : 'Apply All Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>

                  <h3 className="text-2xl font-semibold mb-4">Price Update Complete!</h3>

                  <p className="text-gray-600 mb-6">
                    Successfully updated prices for {updatedProductsCount} products using your variation rules.
                  </p>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800">
                      <strong>Summary:</strong> Base price of ${basePrice} with custom increment amounts for each variation option.
                      All products now have pricing information based on your custom configuration.
                    </p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={resetProcess}>
                      Set Up More Prices
                    </Button>
                    <Button onClick={() => window.location.href = '/'}>
                      Back to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
