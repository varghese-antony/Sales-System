"use client";

import { useState, useEffect } from 'react';
import { getAllProductsV2, updateProductPricesV2, getDistinctProductTypesV2 } from '@/lib/database/products-v2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  // Field configuration - updated to use v2 database column names
  const pricingFields = [
    { key: 'power_w', label: 'Power (W)', dbColumn: 'power_w' },
    { key: 'voltage', label: 'Voltage', dbColumn: 'voltage' },
    { key: 'cct', label: 'CCT (K)', dbColumn: 'cct' },
    { key: 'cri_ra', label: 'CRI (Ra)', dbColumn: 'cri_ra' },
    { key: 'lumen', label: 'Lumen', dbColumn: 'lumen' },
    { key: 'efficacy_lumen_per_w', label: 'Efficacy (lm/W)', dbColumn: 'efficacy_lumen_per_w' },
    { key: 'dimming_type', label: 'Dimming Type', dbColumn: 'dimming_type' },
    { key: 'material_finish', label: 'Material Finish', dbColumn: 'material_finish' },
    { key: 'mounting', label: 'Mounting', dbColumn: 'mounting' },
    { key: 'adjustment_dial', label: 'Adjustment Dial', dbColumn: 'adjustment_dial' },
    { key: 'certifications', label: 'Certifications', dbColumn: 'certifications' },
    { key: 'sensor_cost', label: 'Sensor Cost', dbColumn: 'sensor_cost' },
    { key: 'sensor_price', label: 'Sensor Price', dbColumn: 'sensor_price' },
    { key: 'remote_control_bluetooth_cost', label: 'Remote Control/Bluetooth Cost', dbColumn: 'remote_control_bluetooth_cost' },
    { key: 'remote_control_bluetooth_price', label: 'Remote Control/Bluetooth Price', dbColumn: 'remote_control_bluetooth_price' },
    { key: 'plugin_sensor_cost', label: 'Plugin Sensor Cost', dbColumn: 'plugin_sensor_cost' },
    { key: 'plugin_sensor_price', label: 'Plugin Sensor Price', dbColumn: 'plugin_sensor_price' },
    { key: 'emergency_backup_battery_cost', label: 'Emergency Backup Battery Cost', dbColumn: 'emergency_backup_battery_cost' },
    { key: 'emergency_backup_battery_price', label: 'Emergency Backup Battery Price', dbColumn: 'emergency_backup_battery_price' },
    { key: 'installation_kits_cost', label: 'Installation Kits Cost', dbColumn: 'installation_kits_cost' },
    { key: 'installation_kits_price', label: 'Installation Kits Price', dbColumn: 'installation_kits_price' }
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

      // Filter products without prices (using v2 field name: price_per_piece)
      const productsWithoutPrices = allProducts.filter(product =>
        !product.price_per_piece || product.price_per_piece.trim() === ''
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
      const { data: productTypes, error: typesError } = await getDistinctProductTypesV2(table);
      if (typesError) throw typesError;

      const allProducts = [];
      for (const productType of productTypes || []) {
        const { data: products, error } = await getAllProductsV2(table, {
          productName: productType.product_name
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
      const { data: productTypes, error } = await getDistinctProductTypesV2(type);
      if (!error) {
        setAvailableProductTypes(productTypes || []);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const handleProductTypeSelection = (productType) => {
    setSelectedProductType(productType);

    // Filter products based on selections (using v2 field names)
    let filtered = products.filter(product =>
      (!selectedType || product.type === selectedType) &&
      (!productType || product.product_name === productType) &&
      (!product.price_per_piece || product.price_per_piece.trim() === '')
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
      const { results, error } = await updateProductPricesV2(priceVariations);

      if (error) throw error;

      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;

      if (successful > 0) {
        // Store the count before clearing
        setUpdatedProductsCount(successful);

        // Update local state (using v2 field name: price_per_piece)
        setProducts(prev => prev.map(p => {
          const update = priceVariations.find(u => u.id === p.id);
          return update ? { ...p, price_per_piece: update.price } : p;
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

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/50 via-yellow-50/30 to-amber-50/50 dark:from-orange-950/20 dark:via-yellow-950/10 dark:to-amber-950/20'>
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading products for pricing...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-yellow-50/30 to-amber-50/50 dark:from-orange-950/20 dark:via-yellow-950/10 dark:to-amber-950/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="price-variation-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#price-variation-grid)" />
        </svg>
      </div>

      <div className="container mx-auto py-6 px-3 sm:px-4 lg:py-8 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <motion.div
              animate={{
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Calculator className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Bulk Price Variation Setup
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Set prices for multiple products using filters and custom increment amounts. Configure different prices for each variation option.
          </p>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0">
            <div className="flex justify-between items-center mb-3 sm:mb-4 gap-1 sm:gap-0">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : completedSteps.has(step)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {completedSteps.has(step) ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-8 sm:w-12 lg:w-16 h-1 mx-1 sm:mx-2 ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 px-2 sm:px-0">
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
          <Alert variant="destructive" className="mb-4 sm:mb-6 mx-2 sm:mx-0">
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
              <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Filter className="w-5 h-5" />
                    Step 1: Select Product Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Type Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-foreground">Indoor/Outdoor</label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {['indoor', 'outdoor'].map((type) => (
                          <Button
                            key={type}
                            variant={selectedType === type ? "default" : "outline"}
                            onClick={() => handleTypeSelection(type)}
                            className="capitalize h-11 sm:h-10"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-medium text-foreground">Product Type</label>
                      <div className="grid grid-cols-1 gap-2 max-h-64 sm:max-h-48 overflow-y-auto">
                        {availableProductTypes.map((pt) => (
                          <Button
                            key={pt.producttype}
                            variant={selectedProductType === pt.producttype ? "default" : "outline"}
                            onClick={() => setSelectedProductType(pt.producttype)}
                            size="sm"
                            className="h-11 sm:h-9 w-full justify-start text-left"
                          >
                            {pt.producttype}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Results Preview */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                    <h4 className="text-sm sm:text-base font-medium mb-2 text-foreground">Products Found:</h4>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {filteredProducts.length} products without prices
                      </Badge>
                      {selectedType && (
                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{selectedType}</Badge>
                      )}
                      {selectedProductType && (
                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{selectedProductType}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between sm:justify-end gap-2">
                    <Button
                      onClick={() => handleProductTypeSelection(selectedProductType)}
                      disabled={!selectedProductType}
                      className="min-w-32 h-11 sm:h-10 w-full sm:w-auto"
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
              <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <DollarSign className="w-5 h-5" />
                    Step 2: Set Base Price
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-foreground">Base Price per Product ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter base price"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="text-center text-base sm:text-lg bg-background border-border"
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                        This base price will be applied to all {filteredProducts.length} selected products.
                        In the next step, you'll set custom increment amounts for each variation option.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 h-11 sm:h-10 w-full sm:w-auto order-2 sm:order-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Filters
                    </Button>
                    <Button
                      onClick={handleBasePriceSubmit}
                      disabled={!basePrice || basePrice <= 0}
                      className="min-w-32 h-11 sm:h-10 w-full sm:w-auto order-1 sm:order-2"
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
              <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader className="p-4 sm:p-5 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                    <Settings className="w-5 h-5" />
                    Step 3: Configure Field Variations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">
                  <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                          <h3 className="text-base sm:text-lg font-medium text-foreground">
                            {currentField.label}
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-2">
                              ({currentFieldIndex + 1} of {pricingFields.length})
                            </span>
                          </h3>
                          <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            {fieldValues.size} unique options
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-96 sm:max-h-64 overflow-y-auto">
                          {Array.from(fieldValues).map((value) => {
                            const currentIncrement = fieldVariations[currentField.key]?.[value] || '';
                            
                            // Find products that have this specific variation value
                            const productsWithThisValue = filteredProducts.filter(product => {
                              const productValue = product[currentField.dbColumn];
                              if (productValue !== null && productValue !== undefined) {
                                if (typeof productValue === 'string') {
                                  return productValue.split(',').some(v => v.trim() === value);
                                } else {
                                  return String(productValue) === value;
                                }
                              }
                              return false;
                            });
                            
                            return (
                              <div key={value} className="flex flex-col space-y-2 p-3 sm:p-4 border border-border rounded-lg bg-card">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1">
                                    <label className="text-xs sm:text-sm font-medium block mb-1 text-foreground">
                                      {value}
                                    </label>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">$</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={currentIncrement === null ? '' : currentIncrement}
                                        onChange={(e) => handleFieldVariation(currentField.key, value, e.target.value)}
                                        className="w-24 h-11 text-sm bg-background border-border"
                                      />
                                    </div>
                                  </div>
                                  {currentIncrement > 0 && (
                                    <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                      +${currentIncrement}
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Model numbers for products with this variation */}
                                {productsWithThisValue.length > 0 && (
                                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      Model Numbers ({productsWithThisValue.length}):
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {[...new Set(productsWithThisValue.map(product => product.model_number))].map((modelNumber, idx) => (
                                        <Badge 
                                          key={idx} 
                                          variant="outline" 
                                          className="text-xs px-1 py-0 h-5 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                                        >
                                          {modelNumber}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentFieldIndex(Math.max(0, currentFieldIndex - 1))}
                            disabled={currentFieldIndex === 0}
                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 h-11 sm:h-10 w-full sm:w-auto order-2 sm:order-1"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous Field
                          </Button>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                            <Button
                              variant="secondary"
                              onClick={handleNextField}
                              className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 h-11 sm:h-10 w-full sm:w-auto"
                            >
                              Skip This Field
                            </Button>
                            <Button
                              onClick={handleNextField}
                              className="min-w-32 h-11 sm:h-10 w-full sm:w-auto"
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
              <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader className="p-4 sm:p-5 lg:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                    <CheckCircle className="w-5 h-5" />
                    Step 4: Review and Apply Changes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-sm sm:text-base font-medium mb-2 sm:mb-3 text-foreground">Configuration Summary</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Price:</span>
                          <span className="font-medium text-foreground">${basePrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Products to Update:</span>
                          <span className="font-medium text-foreground">{filteredProducts.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custom Increments Set:</span>
                          <span className="font-medium text-foreground">
                            {Object.values(fieldVariations).flatMap(field => Object.values(field)).filter(inc => inc > 0).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-medium mb-2 sm:mb-3 text-foreground">Sample Price Calculations</h3>
                      <div className="space-y-2 text-xs sm:text-sm">
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
                            <div key={index} className="flex justify-between items-start p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                              <div className="flex-1">
                                <div className="font-medium text-foreground">
                                  {product.product_name} - {product.model_number}
                                </div>
                                {variations.length > 0 && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {variations.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-foreground">${finalPrice.toFixed(2)}</div>
                                {totalIncrement > 0 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
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

                  <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
                    <Button variant="outline" onClick={() => setCurrentStep(3)} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 h-11 sm:h-10 w-full sm:w-auto order-2 sm:order-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Variations
                    </Button>
                    <Button
                      onClick={handleBulkUpdate}
                      disabled={loading}
                      className="min-w-32 h-11 sm:h-10 w-full sm:w-auto order-1 sm:order-2"
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
              <Card className="border border-border/50">
                <CardContent className="p-6 sm:p-8 lg:p-12">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Price Update Complete!</h3>

                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                    Successfully updated prices for {updatedProductsCount} products using your variation rules.
                  </p>

                  <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-green-800 dark:text-green-200">
                      <strong>Summary:</strong> Base price of ${basePrice} with custom increment amounts for each variation option.
                      All products now have pricing information based on your custom configuration.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 px-4 sm:px-0">
                    <Button variant="outline" onClick={resetProcess} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 h-11 sm:h-10 w-full sm:w-auto">
                      Set Up More Prices
                    </Button>
                    <Button onClick={() => window.location.href = '/'} className="h-11 sm:h-10 w-full sm:w-auto">
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
