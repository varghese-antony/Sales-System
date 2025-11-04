"use client";

import { useState, useEffect } from 'react';

import { getDistinctProductNamesV2, getAllProductsV2, updateProductV2 } from '@/lib/database/products-v2'
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

      // Fetch all product names for indoor
      const { data: indoorNames, error: indoorNamesError } = await getDistinctProductNamesV2('indoor')
      if (indoorNamesError) {
        throw new Error(`Failed to fetch indoor product names: ${indoorNamesError}`)
      }

      // Fetch all product names for outdoor
      const { data: outdoorNames, error: outdoorNamesError } = await getDistinctProductNamesV2('outdoor')
      if (outdoorNamesError) {
        throw new Error(`Failed to fetch outdoor product names: ${outdoorNamesError}`)
      }

      const indoorNamesList = indoorNames || []
      const outdoorNamesList = outdoorNames || []

      // Fetch products for each indoor product name
      const indoorProducts = []
      for (const productName of indoorNamesList) {
        try {
          const { data: products, error } = await getAllProductsV2('indoor', { productName: productName.product_name })
          if (!error && products) {
            indoorProducts.push(...products.map(p => ({ ...p, type: 'indoor' })))
          }
        } catch (error) {
          console.error(`Error fetching indoor products for ${productName.product_name}:`, error)
        }
      }

      // Fetch products for each outdoor product name
      const outdoorProducts = []
      for (const productName of outdoorNamesList) {
        try {
          const { data: products, error } = await getAllProductsV2('outdoor', { productName: productName.product_name })
          if (!error && products) {
            outdoorProducts.push(...products.map(p => ({ ...p, type: 'outdoor' })))
          }
        } catch (error) {
          console.error(`Error fetching outdoor products for ${productName.product_name}:`, error)
        }
      }

      // Combine all products
      const allProducts = [...indoorProducts, ...outdoorProducts];

      setProducts(allProducts);

      // Filter products with empty price_per_piece
      const emptyPriceProducts = allProducts.filter(product =>
        !product.price_per_piece || product.price_per_piece.toString().trim() === ''
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
      const { data, error } = await updateProductV2(product.type, product.id, {
        pricePerPiece: price
      })
      if (error) {
        throw new Error(error)
      }

      if (data) {
        // Update local state
        setProducts(prev => prev.map(p =>
          p.id === product.id ? { ...p, price_per_piece: price } : p
        ));
        setFilteredProducts(prev => prev.filter(p => p.id !== product.id));
        setPriceInputs(prev => {
          const updated = { ...prev };
          delete updated[product.id];
          return updated;
        });
        setSaveMessage(`Price updated for ${product.product_name} - ${product.model_number}`);
      } else {
        setSaveMessage(`Failed to update price for ${product.product_name} - ${product.model_number}`);
      }
    } catch (error) {
      setSaveMessage(`Error updating price for ${product.product_name} - ${product.model_number}`);
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
      const results = []
      
      // Update each product individually
      for (const product of productsToUpdate) {
        const price = priceInputs[product.id]
        const { data, error } = await updateProductV2(product.type, product.id, {
          pricePerPiece: price
        })
        results.push({ id: product.id, data, error })
      }

      const successful = results.filter(r => !r.error && r.data).length
      if (successful > 0) {
        // Update local state
        setProducts(prev => prev.map(p => {
          const update = productsToUpdate.find(u => u.id === p.id);
          return update ? { ...p, price_per_piece: priceInputs[update.id] } : p;
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
          <p className="text-sm sm:text-base text-muted-foreground">Loading products without prices...</p>
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

      <div className="container mx-auto py-6 px-3 sm:px-4 lg:py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
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

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Price Entry
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Add prices for products that don't have pricing information yet.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-700 w-full sm:w-auto text-center">
              <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
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
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 h-11 sm:h-10 w-full sm:w-auto"
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
            <Alert className="max-w-full sm:max-w-2xl mx-3 sm:mx-auto">
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
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-1 flex-wrap">
                      <Badge variant={product.type === 'indoor' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                        {product.type}
                      </Badge>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono">
                        ID: {product.id}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {product.product_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      Model: {product.model_number}
                    </p>
                  </div>

                  {/* Price Input */}
                  <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4 mt-2 sm:mt-0">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price/pc"
                      value={priceInputs[product.id] || ''}
                      onChange={(e) => handlePriceChange(product.id, e.target.value)}
                      className="w-full sm:w-28 h-11 text-sm"
                    />
                    <Button
                      onClick={() => saveIndividualPrice(product)}
                      disabled={!priceInputs[product.id] || priceInputs[product.id].trim() === ''}
                      className="h-11 sm:h-9 px-3 sm:px-2 min-w-[44px]"
                    >
                      <Check className="w-4 h-4 sm:w-3 sm:h-3" />
                    </Button>
                  </div>
                </div>

                {/* Product Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
                  {product.size && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Size:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.size}</div>
                    </div>
                  )}

                  {product.power_w && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Power:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.power_w}</div>
                    </div>
                  )}

                  {product.voltage && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Voltage:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.voltage}</div>
                    </div>
                  )}

                  {product.cct && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">CCT:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.cct}</div>
                    </div>
                  )}

                  {product.cri_ra && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">CRI:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.cri_ra}</div>
                    </div>
                  )}

                  {product.lumen && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Lumen:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.lumen}</div>
                    </div>
                  )}

                  {product.efficacy_lumen_per_w && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Efficacy (lm/W):</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.efficacy_lumen_per_w}</div>
                    </div>
                  )}

                  {product.material_finish && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Finish:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.material_finish}</div>
                    </div>
                  )}

                  {product.dimming_type && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Dimming:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.dimming_type}</div>
                    </div>
                  )}

                  {product.mounting && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Mounting:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.mounting}</div>
                    </div>
                  )}

                  {product.adjustment_dial && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Adjustment:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.adjustment_dial}</div>
                    </div>
                  )}

                  {product.certifications && (
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Certifications:</span>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{product.certifications}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 px-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">All Products Have Prices!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 px-3">
              Great job! All products in your catalog now have pricing information.
            </p>
            <Link href="/">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 w-full sm:w-auto max-w-xs">
                Back to Home
              </Button>
            </Link>
          </div>
        )}

        {/* Back Button */}
        {filteredProducts.length > 0 && (
          <div className="text-center mt-8 sm:mt-12 px-3">
            <Link href="/">
              <Button variant="outline" size="lg" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 h-11 sm:h-13 w-full sm:w-auto max-w-xs sm:max-w-none">
                <X className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
