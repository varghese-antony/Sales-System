"use client";

import { useState, useEffect } from 'react';

import { getDistinctProductTypes, getAllProducts, updateProductPrices } from '@/lib/database/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Save, Check, X } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PriceEntryPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [priceInputs, setPriceInputs] = useState({});

  // Fetch all products from both indoor and outdoor tables
  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all product types for indoor
      const { data: indoorTypes, error: indoorTypesError } = await getDistinctProductTypes('indoor')
      if (indoorTypesError) {
        throw new Error(`Failed to fetch indoor product types: ${indoorTypesError}`)
      }

      // Fetch all product types for outdoor
      const { data: outdoorTypes, error: outdoorTypesError } = await getDistinctProductTypes('outdoor')
      if (outdoorTypesError) {
        throw new Error(`Failed to fetch outdoor product types: ${outdoorTypesError}`)
      }

      const indoorTypesList = indoorTypes || []
      const outdoorTypesList = outdoorTypes || []

      // Fetch products for each indoor product type
      const indoorProducts = []
      for (const productType of indoorTypesList) {
        try {
          const { data: products, error } = await getAllProducts('indoor', { producttype: productType.producttype })
          if (!error && products) {
            indoorProducts.push(...products.map(p => ({ ...p, type: 'indoor' })))
          }
        } catch (error) {
          console.error(`Error fetching indoor products for ${productType['producttype']}:`, error)
        }
      }

      // Fetch products for each outdoor product type
      const outdoorProducts = []
      for (const productType of outdoorTypesList) {
        try {
          const { data: products, error } = await getAllProducts('outdoor', { producttype: productType.producttype })
          if (!error && products) {
            outdoorProducts.push(...products.map(p => ({ ...p, type: 'outdoor' })))
          }
        } catch (error) {
          console.error(`Error fetching outdoor products for ${productType['producttype']}:`, error)
        }
      }

      // Combine all products
      const allProducts = [...indoorProducts, ...outdoorProducts];

      setProducts(allProducts);

      // Filter products with empty Price/pc
      const emptyPriceProducts = allProducts.filter(product =>
        !product['price_pc'] || product['price_pc'].trim() === ''
      );

      setFilteredProducts(emptyPriceProducts);

      // Initialize price inputs
      const initialPrices = {};
      emptyPriceProducts.forEach(product => {
        initialPrices[product.id] = '';
      });
      setPriceInputs(initialPrices);

    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Handle price input change
  const handlePriceChange = (productId, price) => {
    setPriceInputs(prev => ({
      ...prev,
      [productId]: price
    }));
  };

  // Save individual product price
  const saveIndividualPrice = async (product) => {
    const price = priceInputs[product.id];
    if (!price || price.trim() === '') return;

    try {
      const { results, error } = await updateProductPrices([{
        id: product.id,
        price: price,
        type: product.type
      }])
      if (error) {
        throw new Error(error)
      }

      const result = results[0]
      if (result && !result.error) {
        // Update local state
        setProducts(prev => prev.map(p =>
          p.id === product.id ? { ...p, "price_pc": price } : p
        ));
        setFilteredProducts(prev => prev.filter(p => p.id !== product.id));
        setPriceInputs(prev => {
          const updated = { ...prev };
          delete updated[product.id];
          return updated;
        });
        setSaveMessage(`Price updated for ${product.producttype} - ${product['model_number']}`);
      } else {
        setSaveMessage(`Failed to update price for ${product.producttype} - ${product['model_number']}`);
      }
    } catch (error) {
      setSaveMessage(`Error updating price for ${product['producttype']} - ${product['model_number']}`);
    }

    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Save all prices at once
  const saveAllPrices = async () => {
    const productsToUpdate = filteredProducts.filter(product =>
      priceInputs[product.id] && priceInputs[product.id].trim() !== ''
    );

    if (productsToUpdate.length === 0) return;

    setSaving(true);
    try {
      const { results, error } = await updateProductPrices(productsToUpdate)
      if (error) {
        throw new Error(error)
      }

      const successful = results.filter(r => !r.error).length
      if (successful > 0) {
        // Update local state
        setProducts(prev => prev.map(p => {
          const update = productsToUpdate.find(u => u.id === p.id);
          return update ? { ...p, "price_pc": update['price_pc'] } : p;
        }));
        setFilteredProducts(prev => prev.filter(p => !productsToUpdate.some(u => u.id === p.id)));
        setPriceInputs({});
        setSaveMessage(`${successful} prices updated successfully!`);
      }
    } catch (error) {
      setSaveMessage('Error updating prices');
    } finally {
      setSaving(false);
    }

    setTimeout(() => setSaveMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20'>
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading products without prices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="price-entry-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#price-entry-grid)" />
        </svg>
      </div>

      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-6">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <DollarSign className="w-12 h-12 text-green-600 dark:text-green-400" />
            </motion.div>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Price Entry
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Add prices for products that don't have pricing information yet.
          </p>

          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredProducts.length}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                products without prices
              </span>
            </div>

            {filteredProducts.length > 0 && (
              <Button
                onClick={saveAllPrices}
                disabled={saving || !Object.values(priceInputs).some(p => p.trim() !== '')}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : `Save All (${Object.values(priceInputs).filter(p => p.trim() !== '').length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Alert className="max-w-2xl mx-auto">
              <AlertDescription className="text-center">
                {saveMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Product Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={product.type === 'indoor' ? 'default' : 'secondary'} className="text-xs">
                        {product.type}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        ID: {product.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {product.producttype}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Model: {product['model_number']}
                    </p>
                  </div>

                  {/* Price Input */}
                  <div className="flex items-center gap-2 ml-4">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price/pc"
                      value={priceInputs[product.id] || ''}
                      onChange={(e) => handlePriceChange(product.id, e.target.value)}
                      className="w-24 h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => saveIndividualPrice(product)}
                      disabled={!priceInputs[product.id] || priceInputs[product.id].trim() === ''}
                      className="h-8 px-2"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Product Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
                  {product.Size && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Size:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.Size}</div>
                    </div>
                  )}

                  {product.power_w && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Power:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.power_w}</div>
                    </div>
                  )}

                  {product.Voltage && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Voltage:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.Voltage}</div>
                    </div>
                  )}

                  {product.CCT && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">CCT:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.CCT}</div>
                    </div>
                  )}

                  {product.cri_ra && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">CRI:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.cri_ra}</div>
                    </div>
                  )}

                  {product.Lumen && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Lumen:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.Lumen}</div>
                    </div>
                  )}

                  {product.efficacy_lmw && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Beam Angle:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.efficacy_lmw}</div>
                    </div>
                  )}

                  {product.material_finish && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Finish:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.material_finish}</div>
                    </div>
                  )}

                  {product['led_type'] && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">LED Type:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product['led_type']}</div>
                    </div>
                  )}

                  {product['driver_brand'] && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Driver:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product['driver_brand']}</div>
                    </div>
                  )}

                  {product.adjustment_dial && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Adjustment:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.adjustment_dial}</div>
                    </div>
                  )}

                  {product.certifications && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Certifications:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{product.certifications}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">All Products Have Prices!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Great job! All products in your catalog now have pricing information.
            </p>
            <Link href="/">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Back to Home
              </Button>
            </Link>
          </div>
        )}

        {/* Back Button */}
        {filteredProducts.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/">
              <Button variant="outline" size="lg" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <X className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
