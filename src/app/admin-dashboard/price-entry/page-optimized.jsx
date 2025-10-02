"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getDistinctProductTypes,
  getProductsWithPagination,
  bulkUpdateProductsBatch
} from '@/lib/database/products-optimized';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { DataTableSkeleton } from '@/components/ui/loading-skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useCache } from '@/hooks/useCache';
import { useToast } from '@/contexts/ToastContext';
import { DollarSign, Save, Check, X, Search, RefreshCw } from 'lucide-react';

export default function PriceEntryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [priceInputs, setPriceInputs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('both');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [productTypes, setProductTypes] = useState([]);

  const { toast } = useToast();
  const cache = useCache(2 * 60 * 1000); // 2 minutes cache
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Optimized data loading
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (productTypeFilter !== 'all') filters.productType = productTypeFilter;
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;

      const cacheKey = `priceEntry:${typeFilter}:${JSON.stringify(filters)}:${currentPage}:${pageSize}`;

      // Try cache first
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        setProducts(cachedData.data);
        setTotalItems(cachedData.count);
        setLoading(false);
        return;
      }

      // Fetch fresh data using optimized service
      const result = await getProductsWithPagination(typeFilter, filters, {
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
  }, [typeFilter, productTypeFilter, debouncedSearchTerm, currentPage, pageSize, cache]);

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

      setProductTypes(Array.from(allProductTypes).sort());
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
  }, [typeFilter, productTypeFilter, debouncedSearchTerm, loadData]);

  // Load data when pagination changes
  useEffect(() => {
    if (currentPage > 1 || pageSize !== 50) {
      loadData();
    }
  }, [currentPage, pageSize, loadData]);

  // Optimized price update handler
  const handlePriceChange = useCallback((productId, newPrice) => {
    setPriceInputs(prev => ({
      ...prev,
      [productId]: newPrice
    }));
  }, []);

  // Optimized batch price update
  const handleBatchUpdate = useCallback(async () => {
    const updates = Object.entries(priceInputs)
      .filter(([_, price]) => price !== '' && price !== null && price !== undefined)
      .map(([productId, price]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          price: parseFloat(price),
          type: product?.type
        };
      });

    if (updates.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No price changes to save',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const result = await bulkUpdateProductsBatch(updates[0]?.type, updates);

      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state
      setProducts(prev => prev.map(product => {
        const update = updates.find(u => u.id === product.id);
        return update ? { ...product, price_pc: update.price } : product;
      }));

      // Clear price inputs
      setPriceInputs({});

      toast({
        title: 'Success',
        description: `Successfully updated ${updates.length} product${updates.length !== 1 ? 's' : ''}`,
      });

    } catch (error) {
      console.error('Error updating prices:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update prices',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [priceInputs, products, toast]);

  const handleRefresh = useCallback(async () => {
    cache.clear();
    await Promise.all([loadData(), loadProductTypes()]);
  }, [cache, loadData, loadProductTypes]);

  // Memoized table columns
  const columns = useMemo(() => [
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'indoor' ? 'secondary' : 'outline'} size="sm">
          {value === 'indoor' ? 'Indoor' : 'Outdoor'}
        </Badge>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (_, row) => row[row.type === 'indoor' ? 'Indoor' : 'Outdoor'] || '-'
    },
    {
      key: 'producttype',
      label: 'Product Type',
      sortable: true
    },
    {
      key: 'model_number',
      label: 'Model Number',
      sortable: true
    },
    {
      key: 'current_price',
      label: 'Current Price',
      render: (value) => value ? `$${value}` : '-'
    },
    {
      key: 'new_price',
      label: 'New Price',
      render: (_, row) => (
        <Input
          type="number"
          step="0.01"
          placeholder="Enter new price"
          value={priceInputs[row.id] || ''}
          onChange={(e) => handlePriceChange(row.id, e.target.value)}
          className="w-32"
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const currentPrice = row.price_pc;
        const newPrice = priceInputs[row.id];

        if (!newPrice || newPrice === '') return '-';

        const hasChanged = parseFloat(newPrice) !== currentPrice;
        return (
          <Badge variant={hasChanged ? 'default' : 'secondary'} size="sm">
            {hasChanged ? 'Modified' : 'Unchanged'}
          </Badge>
        );
      }
    }
  ], [priceInputs, handlePriceChange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const modifiedCount = Object.keys(priceInputs).length;
    const totalProducts = products.length;

    return {
      totalProducts,
      modifiedCount,
      pendingChanges: modifiedCount
    };
  }, [products, priceInputs]);

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="space-y-6">
            <DataTableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="price-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#price-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-4 max-w-7xl relative z-10 space-y-6">
        {/* Header */}
        <Card className="border border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Price Entry</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Update product prices in bulk with real-time validation
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={handleBatchUpdate}
                  disabled={saving || stats.modifiedCount === 0}
                  size="sm"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes ({stats.modifiedCount})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Modified</p>
                  <p className="text-2xl font-bold text-foreground">{stats.modifiedCount}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Changes</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingChanges}</p>
                </div>
                <X className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Type Filter */}
                <div className="flex gap-2">
                  {[
                    { value: 'both', label: 'Both' },
                    { value: 'indoor', label: 'Indoor' },
                    { value: 'outdoor', label: 'Outdoor' }
                  ].map(type => (
                    <Button
                      key={type.value}
                      onClick={() => setTypeFilter(type.value)}
                      variant={typeFilter === type.value ? 'default' : 'outline'}
                      size="sm"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>

                {/* Product Type Filter */}
                <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Product Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Product Types</SelectItem>
                    {productTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search model number or product type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Products ({totalItems} total)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={products}
              columns={columns}
              loading={loading}
              emptyMessage="No products found matching your criteria"
              pageSize={pageSize}
              currentPage={currentPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <X className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {saveMessage && (
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-700">{saveMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
