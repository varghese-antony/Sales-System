"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getProductsWithPagination,
  getDistinctProductTypes,
  bulkUpdateProductsBatch,
  clearCache
} from '@/lib/database/products-optimized';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/loading-skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useCache } from '@/hooks/useCache';
import { useToast } from '@/contexts/ToastContext';
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Filter,
  Settings,
  CheckCircle,
  AlertCircle,
  Calculator,
  Search,
  RefreshCw
} from 'lucide-react';

export default function PriceVariationPage() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Data states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [selectedType, setSelectedType] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [availableProductTypes, setAvailableProductTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Pricing states
  const [basePrice, setBasePrice] = useState('');
  const [fieldVariations, setFieldVariations] = useState({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [processing, setProcessing] = useState(false);

  const { toast } = useToast();
  const cache = useCache(2 * 60 * 1000); // 2 minutes cache
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Field configuration for price variations
  const pricingFields = [
    { key: 'power_w', label: 'Power (W)', dbColumn: 'power_w' },
    { key: 'Voltage', label: 'Voltage', dbColumn: 'Voltage' },
    { key: 'CCT', label: 'CCT (K)', dbColumn: 'CCT' },
    { key: 'cri_ra', label: 'CRI (Ra)', dbColumn: 'cri_ra' },
    { key: 'lumen', label: 'Lumen', dbColumn: 'lumen' },
    { key: 'beam_angle', label: 'Beam Angle', dbColumn: 'beam_angle' },
    { key: 'sizes', label: 'Sizes', dbColumn: 'sizes' },
    { key: 'finish', label: 'Finish', dbColumn: 'finish' },
    { key: 'led_type', label: 'LED Type', dbColumn: 'led_type' },
    { key: 'driver_brand', label: 'Driver Brand', dbColumn: 'driver_brand' },
    { key: 'dimmable', label: 'Dimmable', dbColumn: 'dimmable' },
    { key: 'certifications', label: 'Certifications', dbColumn: 'certifications' }
  ];

  // Optimized data loading
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (selectedProductType && selectedProductType !== 'all') filters.productType = selectedProductType;
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;

      const cacheKey = `priceVariation:${selectedType}:${selectedProductType || 'none'}:${JSON.stringify(filters)}:${currentPage}:${pageSize}`;

      // Try cache first
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        setProducts(cachedData.data);
        setTotalItems(cachedData.count);
        setLoading(false);
        return;
      }

      // Fetch fresh data using optimized service
      const result = await getProductsWithPagination(selectedType, filters, {
        currentPage,
        pageSize
      });

      if (result.error) throw result.error;

      setProducts(result.data || []);
      setTotalItems(result.count || 0);

      // Cache the result
      cache.set(cacheKey, {
        data: result.data || [],
        count: result.count || 0
      });

    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedProductType, debouncedSearchTerm, currentPage, pageSize, cache]);

  // Load product types for filter
  const loadProductTypes = useCallback(async () => {
    try {
      const tables = ['indoor', 'outdoor'];
      const allProductTypes = new Set();

      const results = await Promise.allSettled(
        tables.map(table => getDistinctProductTypes(table))
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data) {
          result.value.data.forEach(pt => {
            if (pt.producttype) allProductTypes.add(pt.producttype);
          });
        }
      });

      setAvailableProductTypes(Array.from(allProductTypes).sort());
    } catch (error) {
      console.error('Error loading product types:', error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadData();
    loadProductTypes();
  }, []);

  // Reload data when filters change (debounced)
  useEffect(() => {
    if (currentPage === 1) {
      loadData();
    } else {
      setCurrentPage(1);
    }
  }, [selectedType, selectedProductType, debouncedSearchTerm, loadData]);

  // Load data when pagination changes
  useEffect(() => {
    if (currentPage > 1 || pageSize !== 25) {
      loadData();
    }
  }, [currentPage, pageSize, loadData]);

  // Optimized step navigation
  const goToStep = useCallback((step) => {
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
    }
  }, [currentStep, completedSteps]);

  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Optimized field variation handling
  const handleFieldVariation = useCallback((fieldKey, variationType, value) => {
    setFieldVariations(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [variationType]: value
      }
    }));
  }, []);

  // Optimized price calculation
  const calculatePriceVariations = useCallback(() => {
    const variations = {};

    pricingFields.forEach(field => {
      const fieldConfig = fieldVariations[field.key];
      if (fieldConfig) {
        const baseValue = fieldConfig.baseValue || '';
        const increasePercent = parseFloat(fieldConfig.increasePercent) || 0;
        const decreasePercent = parseFloat(fieldConfig.decreasePercent) || 0;

        if (baseValue && (increasePercent > 0 || decreasePercent > 0)) {
          variations[field.key] = {
            baseValue,
            increasePercent,
            decreasePercent
          };
        }
      }
    });

    return variations;
  }, [fieldVariations]);

  // Optimized bulk price update
  const handleBulkUpdate = useCallback(async () => {
    try {
      setProcessing(true);

      const priceVariations = calculatePriceVariations();
      if (Object.keys(priceVariations).length === 0) {
        toast({
          title: 'No Variations',
          description: 'Please configure price variations for at least one field',
          variant: 'destructive'
        });
        return;
      }

      // Generate price updates for all products
      const updates = products.map(product => {
        let newPrice = parseFloat(basePrice) || product.price_pc || 0;
        let appliedVariations = [];

        Object.entries(priceVariations).forEach(([fieldKey, config]) => {
          const fieldValue = product[fieldKey];
          if (fieldValue && fieldValue.toString().includes(config.baseValue)) {
            if (config.increasePercent > 0) {
              newPrice *= (1 + config.increasePercent / 100);
              appliedVariations.push(`+${config.increasePercent}% for ${fieldKey}`);
            }
            if (config.decreasePercent > 0) {
              newPrice *= (1 - config.decreasePercent / 100);
              appliedVariations.push(`-${config.decreasePercent}% for ${fieldKey}`);
            }
          }
        });

        return {
          id: product.id,
          price: Math.round(newPrice * 100) / 100, // Round to 2 decimal places
          type: product.type,
          variations: appliedVariations
        };
      }).filter(update => update.price !== update.price); // Only include changed prices

      if (updates.length === 0) {
        toast({
          title: 'No Changes',
          description: 'No price changes to apply based on current configuration',
          variant: 'destructive'
        });
        return;
      }

      // Use batch update for better performance
      const result = await bulkUpdateProductsBatch(updates[0]?.type, updates);

      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state
      setProducts(prev => prev.map(product => {
        const update = updates.find(u => u.id === product.id);
        return update ? { ...product, price_pc: update.price } : product;
      }));

      toast({
        title: 'Success',
        description: `Successfully updated ${updates.length} product${updates.length !== 1 ? 's' : ''}`,
      });

      // Clear cache and reload
      clearCache();
      await loadData();

    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update prices',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  }, [basePrice, fieldVariations, products, calculatePriceVariations, toast, loadData]);

  const handleRefresh = useCallback(async () => {
    cache.clear();
    await Promise.all([loadData(), loadProductTypes()]);
  }, [cache, loadData, loadProductTypes]);

  // Memoized filtered products for display
  const displayProducts = useMemo(() => {
    return products.slice(0, 10); // Show preview of products
  }, [products]);

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="space-y-6">
            <DataTableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="variation-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#variation-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-4 max-w-7xl relative z-10 space-y-6">
        {/* Header */}
        <Card className="border border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Price Variation Management</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure automatic price adjustments based on product specifications
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Step Progress */}
        <Card className="border border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : completedSteps.has(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {completedSteps.has(step) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        completedSteps.has(step) ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Step 1: Select Product Range</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Product Type</label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">Both Indoor & Outdoor</SelectItem>
                          <SelectItem value="indoor">Indoor Only</SelectItem>
                          <SelectItem value="outdoor">Outdoor Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Product Category</label>
                      <Select
                        value={selectedProductType || undefined}
                        onValueChange={(value) => setSelectedProductType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {availableProductTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Preview */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Product Preview ({totalItems} products)</h4>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                      {displayProducts.map(product => (
                        <div key={product.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <span className="font-medium">{product.model_number}</span>
                            <Badge variant="outline" className="ml-2">
                              {product.type === 'indoor' ? 'Indoor' : 'Outdoor'}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ${product.price_pc || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Step 2: Set Base Price</h3>
                  <div className="max-w-md">
                    <label className="text-sm font-medium">Base Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="Enter base price"
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      This will be the starting price for all selected products
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Step 3: Configure Field Variations</h3>
                  <div className="space-y-4">
                    {pricingFields.map((field, index) => (
                      <Card key={field.key} className="border border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{field.label}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-sm font-medium">Base Value</label>
                              <Input
                                value={fieldVariations[field.key]?.baseValue || ''}
                                onChange={(e) => handleFieldVariation(field.key, 'baseValue', e.target.value)}
                                placeholder="e.g., 10W, 3000K"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Price Increase (%)</label>
                              <Input
                                type="number"
                                step="0.1"
                                value={fieldVariations[field.key]?.increasePercent || ''}
                                onChange={(e) => handleFieldVariation(field.key, 'increasePercent', e.target.value)}
                                placeholder="e.g., 5.0"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Price Decrease (%)</label>
                              <Input
                                type="number"
                                step="0.1"
                                value={fieldVariations[field.key]?.decreasePercent || ''}
                                onChange={(e) => handleFieldVariation(field.key, 'decreasePercent', e.target.value)}
                                placeholder="e.g., 3.0"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Step 4: Review & Apply</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base">Configuration Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Product Type:</span>
                          <Badge variant="outline">{selectedType || 'Not selected'}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Category:</span>
                          <Badge variant="outline">{selectedProductType && selectedProductType !== 'all' ? selectedProductType : 'All'}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Base Price:</span>
                          <span className="font-medium">${basePrice || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Products Affected:</span>
                          <span className="font-medium">{totalItems}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base">Price Variations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {Object.entries(fieldVariations).map(([fieldKey, config]) => {
                          const field = pricingFields.find(f => f.key === fieldKey);
                          if (!config.baseValue || (!config.increasePercent && !config.decreasePercent)) return null;

                          return (
                            <div key={fieldKey} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{field?.label}:</span>
                              <div className="flex gap-2">
                                {config.increasePercent && (
                                  <Badge variant="default" className="text-xs">
                                    +{config.increasePercent}%
                                  </Badge>
                                )}
                                {config.decreasePercent && (
                                  <Badge variant="secondary" className="text-xs">
                                    -{config.decreasePercent}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                onClick={prevStep}
                disabled={currentStep === 1}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentStep < 4 ? (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleBulkUpdate}
                    disabled={processing || !basePrice}
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Apply Variations
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
