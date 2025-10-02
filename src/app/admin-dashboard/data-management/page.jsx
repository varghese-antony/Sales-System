"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  MoreHorizontal,
  Package,
  Database,
  BarChart3,
  Settings,
  X,
  Filter,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import {  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading';
import { useDebounce } from '@/hooks/useDebounce';
import { useCache } from '@/hooks/useCache';
import { useToast } from '@/contexts/ToastContext';
import {
  getProductsWithPaginationClient,
  clearCacheClient,
  createProductsClient,
  updateProductClient,
  deleteProductClient,
  bulkDeleteProductsClient,
  updateProductPricesClient,
  bulkUpdateProductsClient,
  bulkSetCategoryClient,
  searchProductsClient
} from '@/lib/database/products-client';
import {
  formatProductForExport,
  exportProducts,
  exportProductsCustom
} from '@/lib/utils/export';
import { EditProductModal } from '@/components/EditProductModal';
import { BulkUpdateModal } from '@/components/BulkUpdateModal';
import { StatsCardsSkeleton, DataTableSkeleton } from '@/components/DataTableSkeletons';

const FALLBACK_EXPORT_PRODUCT = {
  type: 'indoor',
  Indoor: '',
  category: '',
  producttype: '',
  model_number: '',
  name: '',
  description: '',
  Size: '',
  Mounting: '',
  power_w: '',
  Voltage: '',
  CCT: '',
  cri_ra: '',
  Lumen: '',
  efficacy_lmw: '',
  beam_angle: '',
  power_factor: '',
  'Dimming Type': '',
  emergency_backup_battery: '',
  plugin_sensor: '',
  sensor_microwave_bluetooth: '',
  junction_cover: '',
  remote_control: '',
  installation_kits: '',
  adjustment_dial: '',
  'Material Finish': '',
  led_type: '',
  driver_brand: '',
  Certifications: '',
  Warranty: '',
  lead_time: '',
  MOQ: '',
  price_pc: '',
  cost_china_ddp_usa: '',
  cost_thailand_vietnam: '',
  Photo: '',
  cut_sheet: '',
  image_url: '',
  ip_rating: '',
  ik_rating: ''
};

export default function DataManagementPage() {
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestId, setRequestId] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filter states
  const [typeFilter, setTypeFilter] = useState('both');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [voltageFilter, setVoltageFilter] = useState('all');
  const [powerFilter, setPowerFilter] = useState('all');
  const [cctFilter, setCctFilter] = useState('all');
  const [criFilter, setCriFilter] = useState('all');
  const [dimmingTypeFilter, setDimmingTypeFilter] = useState('all');
  const [ledTypeFilter, setLedTypeFilter] = useState('all');
  const [driverBrandFilter, setDriverBrandFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('all');
  const [descriptionFilter, setDescriptionFilter] = useState('all');
  const [ipRatingFilter, setIpRatingFilter] = useState('all');
  const [ikRatingFilter, setIkRatingFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [countsByType, setCountsByType] = useState({ indoor: 0, outdoor: 0 });
  const [cachedFilterOptions, setCachedFilterOptions] = useState(null);

  // Selection states
  const [selectedRows, setSelectedRows] = useState([]);

  // Modal states
  const [editProduct, setEditProduct] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isCustomExportOpen, setIsCustomExportOpen] = useState(false);

  // Data states
  const [categories, setCategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [voltages, setVoltages] = useState([]);
  const [powers, setPowers] = useState([]);
  const [cctValues, setCctValues] = useState([]);
  const [criValues, setCriValues] = useState([]);
  const [dimmingTypeValues, setDimmingTypeValues] = useState([]);
  const [ledTypes, setLedTypes] = useState([]);
  const [driverBrands, setDriverBrands] = useState([]);
  const [names, setNames] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [ipRatings, setIpRatings] = useState([]);
  const [ikRatings, setIkRatings] = useState([]);

  const [customExportFields, setCustomExportFields] = useState(() => new Set());
  const [customExportScope, setCustomExportScope] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const cache = useCache(2 * 60 * 1000);
  const router = useRouter();
  const pendingRequestRef = useRef(null);
  const latestRequestIdRef = useRef(0);
  const wasCustomExportOpenRef = useRef(false);
  const { toast } = useToast();

  const normalizedFilters = useMemo(() => ({
    category: categoryFilter !== 'all' ? categoryFilter : '',
    productType: productTypeFilter !== 'all' ? productTypeFilter : '',
    voltage: voltageFilter !== 'all' ? voltageFilter : '',
    power_w: powerFilter !== 'all' ? powerFilter : '',
    CCT: cctFilter !== 'all' ? cctFilter : '',
    cri_ra: criFilter !== 'all' ? criFilter : '',
    'Dimming Type': dimmingTypeFilter !== 'all' ? dimmingTypeFilter : '',
    led_type: ledTypeFilter !== 'all' ? ledTypeFilter : '',
    driver_brand: driverBrandFilter !== 'all' ? driverBrandFilter : '',
    ip_rating: ipRatingFilter !== 'all' ? ipRatingFilter : '',
    ik_rating: ikRatingFilter !== 'all' ? ikRatingFilter : '',
    search: searchTerm || ''
  }), [
    categoryFilter,
    productTypeFilter,
    voltageFilter,
    powerFilter,
    cctFilter,
    criFilter,
    dimmingTypeFilter,
    ledTypeFilter,
    driverBrandFilter,
    ipRatingFilter,
    ikRatingFilter,
    searchTerm
  ]);

  const tableSelection = useMemo(
    () => (typeFilter === 'both' ? 'both' : typeFilter),
    [typeFilter]
  );

  const cacheKey = useMemo(
    () =>
      JSON.stringify({
        table: tableSelection,
        page: currentPage,
        pageSize,
        filters: normalizedFilters
      }),
    [tableSelection, currentPage, pageSize, normalizedFilters]
  );

  // Table columns configuration
  const columns = [
    // Type & Category
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
    // Identification
    {
      key: 'model_number',
      label: 'Model Number',
      sortable: true
    },
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => value ? value.slice(0, 120) + (value.length > 120 ? '…' : '') : '-'
    },

    // Dimensions
    {
      key: 'Size',
      label: 'Size',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'Mounting',
      label: 'Mounting',
      sortable: true,
      render: (value) => value || '-'
    },

    // Power & Performance
    {
      key: 'power_w',
      label: 'Power (W)',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'Voltage',
      label: 'Voltage',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'CCT',
      label: 'CCT',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'cri_ra',
      label: 'CRI (Ra)',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'Lumen',
      label: 'Lumen',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'efficacy_lmw',
      label: 'Efficacy (lm/W)',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'beam_angle',
      label: 'Beam Angle',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'power_factor',
      label: 'Power Factor',
      sortable: true,
      render: (value) => value || '-'
    },

    // Features
    {
      key: 'Dimming Type',
      label: 'Dimming Type',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'emergency_backup_battery',
      label: 'Emergency Backup Battery',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'plugin_sensor',
      label: 'Plug-in Sensor',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'sensor_microwave_bluetooth',
      label: 'Sensor / Microwave / Bluetooth',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'junction_cover',
      label: 'Junction Cover',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'remote_control',
      label: 'Remote Control',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'installation_kits',
      label: 'Installation Kits',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'adjustment_dial',
      label: 'Adjustment Dial',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'Material Finish',
      label: 'Material Finish',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'led_type',
      label: 'LED Type',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'driver_brand',
      label: 'Driver Brand',
      sortable: true,
      render: (value) => value || '-'
    },

    // Certifications & Warranty
    {
      key: 'Certifications',
      label: 'Certifications',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'Warranty',
      label: 'Warranty',
      sortable: true,
      render: (value) => value || '-'
    },

    // Logistics & Pricing
    {
      key: 'lead_time',
      label: 'Lead Time',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'MOQ',
      label: 'MOQ',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'price_pc',
      label: 'Price / PC',
      sortable: true,
      render: (value) => value ? `$${value}` : '-'
    },
    {
      key: 'cost_china_ddp_usa',
      label: 'Cost China DDP USA',
      sortable: true,
      render: (value) => value ? `${value}` : '-'
    },
    {
      key: 'cost_thailand_vietnam',
      label: 'Cost Thailand/Vietnam',
      sortable: true,
      render: (value) => value ? `${value}` : '-'
    },

    // Media & Documentation
    {
      key: 'Photo',
      label: 'Photo URL',
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ExternalLink className="h-4 w-4" />
          View Photo
        </a>
      ) : '-'
    },
    {
      key: 'cut_sheet',
      label: 'Cut Sheet',
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ExternalLink className="h-4 w-4" />
          View Cut Sheet
        </a>
      ) : '-'
    },
    {
      key: 'image_url',
      label: 'Image URL',
      sortable: false,
      render: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ExternalLink className="h-4 w-4" />
          View Image
        </a>
      ) : '-'
    },

    // Outdoor Specific
    {
      key: 'ip_rating',
      label: 'IP Rating',
      sortable: true,
      render: (value, row) => row.type === 'outdoor' ? (value || '-') : '-'
    },
    {
      key: 'ik_rating',
      label: 'IK Rating',
      sortable: true,
      render: (value, row) => row.type === 'outdoor' ? (value || '-') : '-'
    },

    // Actions
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditProduct(row)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteProduct(row)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const exportFieldLabelMap = useMemo(() => {
    const baseMapping = {
      type: 'Type',
      category: 'Category',
      producttype: 'Product Type',
      model_number: 'Model Number',
      name: 'Product Name',
      description: 'Description',
      Size: 'Sizes',
      Mounting: 'Mounting',
      power_w: 'Power (W)',
      Voltage: 'Voltage',
      CCT: 'CCT (K)',
      cri_ra: 'CRI (Ra)',
      Lumen: 'Lumen',
      efficacy_lmw: 'Efficacy (lm/W)',
      beam_angle: 'Beam Angle',
      power_factor: 'Power Factor',
      'Dimming Type': 'Dimming Type',
      emergency_backup_battery: 'Emergency Backup Battery',
      plugin_sensor: 'Plug-in Sensor',
      sensor_microwave_bluetooth: 'Sensor / Microwave / Bluetooth',
      junction_cover: 'Junction Cover',
      remote_control: 'Remote Control',
      installation_kits: 'Installation Kits',
      adjustment_dial: 'Adjustment Dial',
      'Material Finish': 'Material Finish',
      led_type: 'LED Type',
      driver_brand: 'Driver Brand',
      Certifications: 'Certifications',
      Warranty: 'Warranty',
      lead_time: 'Lead Time',
      MOQ: 'MOQ',
      price_pc: 'Price per piece',
      cost_china_ddp_usa: 'Cost China DDP USA',
      cost_thailand_vietnam: 'Cost Thailand/Vietnam',
      Photo: 'Photo',
      cut_sheet: 'Cut Sheet',
      image_url: 'Image URL',
      ip_rating: 'IP Rating',
      ik_rating: 'IK Rating'
    };

    const labelMap = new Map();
    columns.forEach(column => {
      if (!column?.key || column.key === 'select' || column.key === 'actions') {
        return;
      }

      const mappedLabel = baseMapping[column.key] || column.label || column.key;
      labelMap.set(column.key, mappedLabel);
    });

    return labelMap;
  }, [columns]);

  const productFieldOptions = useMemo(() => {
    return columns
      .filter(col => col.key !== 'select' && col.key !== 'actions')
      .map(col => ({
        key: col.key,
        label: exportFieldLabelMap.get(col.key) || (typeof col.label === 'string' ? col.label : col.key)
      }));
  }, [columns, exportFieldLabelMap]);

  // Clean up selectedRows when products change to remove orphaned selections
  useEffect(() => {
    setSelectedRows(prev => cleanSelectedRows(prev));
  }, [products]);

  useEffect(() => {
    setCurrentPage(prev => (prev === 1 ? prev : 1));
  }, [
    typeFilter,
    categoryFilter,
    productTypeFilter,
    voltageFilter,
    powerFilter,
    cctFilter,
    criFilter,
    dimmingTypeFilter,
    ledTypeFilter,
    driverBrandFilter,
    ipRatingFilter,
    ikRatingFilter,
    searchTerm
  ]);

  useEffect(() => {
    loadData();
  }, [typeFilter, categoryFilter, productTypeFilter, voltageFilter, powerFilter, cctFilter, criFilter, dimmingTypeFilter, ledTypeFilter, driverBrandFilter, ipRatingFilter, ikRatingFilter, searchTerm, currentPage, pageSize]);

  useEffect(() => {
    const wasOpen = wasCustomExportOpenRef.current;
    if (isCustomExportOpen && !wasOpen) {
      setCustomExportFields(new Set(productFieldOptions.map(field => field.key)));
      setCustomExportScope(selectedRows.length > 0 ? 'selected' : 'all');
    }
    wasCustomExportOpenRef.current = isCustomExportOpen;
  }, [isCustomExportOpen, productFieldOptions, selectedRows.length]);

  const cleanSelectedRows = useCallback((rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.filter(row => row && typeof row === 'object' && row.id);
  }, []);

  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput.trim());
  }, [searchInput]);

  const handleSearchKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const sanitizeOptions = useCallback((values) => {
    if (!Array.isArray(values)) return [];

    const seen = new Set();
    const sanitized = [];

    for (const rawValue of values) {
      if (rawValue === null || rawValue === undefined) continue;

      const normalized = typeof rawValue === 'string'
        ? rawValue.trim()
        : String(rawValue);

      if (!normalized) continue;
      if (seen.has(normalized)) continue;

      seen.add(normalized);
      sanitized.push(normalized);
    }

    return sanitized;
  }, []);

  const loadData = async (forceRefresh = false) => {
    let abortController;
    try {
      const cachedResult = !forceRefresh ? cache.get(cacheKey) : null;

      if (cachedResult) {
        const cachedProducts = (cachedResult.data || []).filter(p => p && p.id);
        setProducts(cachedProducts);
        setTotalItems(cachedResult.count || 0);
        setCountsByType(cachedResult.countsByType || { indoor: 0, outdoor: 0 });
        if (cachedResult.filterOptions) {
          updateFilterOptions(cachedResult.filterOptions, tableSelection);
        }
        setLoading(false);
        setRefreshing(true);
      } else if (!forceRefresh) {
        setLoading(true);
      }

      if (pendingRequestRef.current) {
        pendingRequestRef.current.abort();
      }

      abortController = new AbortController();
      pendingRequestRef.current = abortController;

      const nextRequestId = requestId + 1;
      setRequestId(nextRequestId);
      latestRequestIdRef.current = nextRequestId;
      const activeRequestId = nextRequestId;

      const result = await getProductsWithPaginationClient(
        tableSelection,
        currentPage,
        pageSize,
        normalizedFilters,
        abortController.signal
      );

      if (abortController.signal.aborted || activeRequestId !== latestRequestIdRef.current) {
        return;
      }

      if (result.error) {
        throw new Error(result.error);
      }

      const fetchedProducts = (result.data || []).filter(p => p && p.id);
      setProducts(fetchedProducts);
      setTotalItems(result.count || 0);
      setCountsByType(result.countsByType || { indoor: 0, outdoor: 0 });

      if (result.filterOptions) {
        updateFilterOptions(result.filterOptions, tableSelection);
      }

      cache.set(cacheKey, result, 2 * 60 * 1000);
    } catch (error) {
      if (error.name === 'AbortError') {
        setRefreshing(false);
        return;
      }
      console.error('Error loading products:', error);
    } finally {
      if (abortController && pendingRequestRef.current === abortController) {
        pendingRequestRef.current = null;
      }
      if (latestRequestIdRef.current === requestId + 1) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const updateFilterOptions = useCallback((options, table) => {
    if (!options) return;

    const nextOptions = {
      categories: sanitizeOptions(options.categories),
      producttypes: sanitizeOptions(options.producttypes),
      Voltage: sanitizeOptions(options.Voltage),
      power_w: sanitizeOptions(options.power_w),
      CCT: sanitizeOptions(options.CCT),
      cri_ra: sanitizeOptions(options.cri_ra),
      'Dimming Type': sanitizeOptions(options['Dimming Type']),
      led_type: sanitizeOptions(options.led_type),
      driver_brand: sanitizeOptions(options.driver_brand),
      ip_rating: table === 'indoor' ? [] : sanitizeOptions(options.ip_rating),
      ik_rating: table === 'indoor' ? [] : sanitizeOptions(options.ik_rating)
    };

    const serialized = JSON.stringify(nextOptions);
    if (cachedFilterOptions === serialized) {
      return;
    }

    setCachedFilterOptions(serialized);
    setCategories(nextOptions.categories);
    setProductTypes(nextOptions.producttypes);
    setVoltages(nextOptions.Voltage);
    setPowers(nextOptions.power_w);
    setCctValues(nextOptions.CCT);
    setCriValues(nextOptions.cri_ra);
    setDimmingTypeValues(nextOptions['Dimming Type']);
    setLedTypes(nextOptions.led_type);
    setDriverBrands(nextOptions.driver_brand);
    setIpRatings(nextOptions.ip_rating);
    setIkRatings(nextOptions.ik_rating);
  }, [cachedFilterOptions, sanitizeOptions]);

  const getDynamicOptions = useCallback((field) => {
    switch (field) {
      case 'producttype':
        return productTypes;
      case 'Voltage':
        return voltages;
      case 'power_w':
        return powers;
      case 'CCT':
        return cctValues;
      case 'cri_ra':
        return criValues;
      case 'Dimming Type':
        return dimmingTypeValues;
      case 'ledType':
        return ledTypes;
      case 'Driver Brand':
        return driverBrands;
      case 'ip_rating':
        return ipRatings;
      case 'ik_rating':
        return ikRatings;
      default:
        return [];
    }
  }, [productTypes, voltages, powers, cctValues, criValues, dimmingTypeValues, ledTypes, driverBrands, ipRatings, ikRatings]);

  const handleRefresh = async () => {
    cache.del(cacheKey);
    setRefreshing(true);
    await loadData(true);
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
  };

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Are you sure you want to delete ${product.model_number}?`)) return;

    try {
      const result = await deleteProductClient(product.type, product.id);
      if (result.error) throw result.error;

      // Update local state
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setTotalItems(prev => prev - 1);
      cache.clear();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Delete Failed',
        description: 'Could not delete the product. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedRows.length} products?`)) return;

    try {
      // Group by table
      const byTable = selectedRows.reduce((acc, product) => {
        if (!acc[product.type]) acc[product.type] = [];
        acc[product.type].push(product.id);
        return acc;
      }, {});

      // Delete from each table
      for (const [table, ids] of Object.entries(byTable)) {
        const result = await bulkDeleteProductsClient(table, ids);
        if (result.error) throw result.error;
      }

      // Update local state
      setProducts(prev => prev.filter(p => !selectedRows.some(s => s.id === p.id)));
      setTotalItems(prev => prev - selectedRows.length);
      setSelectedRows([]);
      cache.clear();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      toast({
        title: 'Bulk Delete Failed',
        description: error.message || 'Could not delete the selected products. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkSetCategory = async (categoryValue) => {
    if (selectedRows.length === 0) return;

    try {
      // Group by table
      const byTable = selectedRows.reduce((acc, product) => {
        if (!acc[product.type]) acc[product.type] = [];
        acc[product.type].push(product.id);
        return acc;
      }, {});

      // Update category for each table
      for (const [table, ids] of Object.entries(byTable)) {
        const result = await bulkSetCategoryClient(table, ids, categoryValue);
        if (result.error) throw result.error;
      }

      // Update local state
      setProducts(prev => prev.map(p =>
        selectedRows.some(s => s.id === p.id)
          ? { ...p, [p.type === 'indoor' ? 'Indoor' : 'Outdoor']: categoryValue }
          : p
      ));
      setSelectedRows([]);
      cache.clear();
    } catch (error) {
      console.error('Error bulk setting category:', error);
      toast({
        title: 'Category Update Failed',
        description: error.message || 'Could not update categories for the selected products.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkUpdate = async (updateData) => {
    if (selectedRows.length === 0) return;

    try {
      // Group by table
      const byTable = selectedRows.reduce((acc, product) => {
        if (!acc[product.type]) acc[product.type] = [];
        acc[product.type].push(product.id);
        return acc;
      }, {});

      // Update each table
      for (const [table, ids] of Object.entries(byTable)) {
        const result = await bulkUpdateProductsClient(table, ids, updateData);
        if (result.error) throw result.error;
      }

      // Refresh data
      cache.clear();
      await loadData(true);
      setSelectedRows([]);
    } catch (error) {
      console.error('Error bulk updating products:', error);
      toast({
        title: 'Bulk Update Failed',
        description: error.message || 'Could not update the selected products. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleExportAll = async () => {
    if (!products.length) {
      toast({
        title: 'No Products Available',
        description: 'Load products before exporting all rows.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await exportProducts(products, `products-${typeFilter}-${new Date().toISOString().split('T')[0]}.csv`);
      if (result.success) {
        toast({
          title: 'Export Successful',
          description: `Exported ${products.length} product${products.length !== 1 ? 's' : ''} to CSV.`
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'An error occurred while exporting.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Error',
        description: error.message || 'An unexpected error occurred while exporting.',
        variant: 'destructive'
      });
    }
  };

  const handleExportSelected = async () => {
    if (!selectedRows.length) {
      toast({
        title: 'No Products Selected',
        description: 'Select at least one product before exporting selected rows.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await exportProducts(selectedRows, `products-selected-${new Date().toISOString().split('T')[0]}.csv`);
      if (result.success) {
        toast({
          title: 'Export Successful',
          description: `Exported ${selectedRows.length} selected product${selectedRows.length !== 1 ? 's' : ''} to CSV.`
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'An error occurred while exporting selected rows.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Export selected error:', error);
      toast({
        title: 'Export Error',
        description: error.message || 'An unexpected error occurred while exporting selected rows.',
        variant: 'destructive'
      });
    }
  };

  const toggleCustomExportField = (fieldKey) => {
    setCustomExportFields(prev => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  };

  const handleSelectAllFields = () => {
    setCustomExportFields(new Set(productFieldOptions.map(field => field.key)));
  };

  const handleDeselectAllFields = () => {
    setCustomExportFields(new Set());
  };

  const handleCustomExport = async () => {
    setIsExporting(true);

    try {
      const selectedFieldKeys = Array.from(customExportFields);
      if (selectedFieldKeys.length === 0) {
        toast({
          title: 'No Fields Selected',
          description: 'Please select at least one column to export.',
          variant: 'destructive'
        });
        return;
      }

      const fieldsToExport = selectedFieldKeys.map(key => exportFieldLabelMap.get(key) || key);

      const dataSource = customExportScope === 'selected' ? selectedRows : products;

      if (!dataSource.length) {
        toast({
          title: 'No Products Available',
          description: customExportScope === 'selected'
            ? 'Please select at least one product to export.'
            : 'No products loaded. Try refreshing the page.',
          variant: 'destructive'
        });
        return;
      }

      const scopeLabel = customExportScope === 'selected' ? 'selected' : 'all';
      const result = await exportProductsCustom(
        dataSource,
        fieldsToExport,
        `products-${scopeLabel}-${new Date().toISOString().split('T')[0]}.csv`
      );

      if (result.success) {
        toast({
          title: 'Export Successful',
          description: `Successfully exported ${dataSource.length} product${dataSource.length !== 1 ? 's' : ''} with ${fieldsToExport.length} column${fieldsToExport.length !== 1 ? 's' : ''}.`
        });
        setIsCustomExportOpen(false);
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'An error occurred while exporting. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Custom export error:', error);
      toast({
        title: 'Export Error',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };


  const handleRowSelect = (rowId, checked) => {
    if (Array.isArray(rowId)) {
      // Bulk selection from select all
      if (checked) {
        const productsToAdd = products.filter(p => rowId.includes(p.id));
        setSelectedRows(prev => cleanSelectedRows([...prev, ...productsToAdd]));
      } else {
        setSelectedRows(prev => cleanSelectedRows(prev.filter(p => !rowId.includes(p.id))));
      }
    } else {
      // Single row selection
      if (checked) {
        const product = products.find(p => p.id === rowId);
        if (product) {
          setSelectedRows(prev => cleanSelectedRows([...prev, product]));
        }
      } else {
        setSelectedRows(prev => cleanSelectedRows(prev.filter(p => p.id !== rowId)));
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.length === products.filter(p => p && p.id).length) {
      setSelectedRows([]);
    } else {
      // Only select products that have valid IDs
      setSelectedRows(products.filter(p => p && p.id));
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    if (newPageSize === 'all' || newPageSize >= 1000) {
      // Set a very large page size to indicate "show all"
      setPageSize(10000);
    } else {
      setPageSize(newPageSize);
    }
    cache.clear();
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const getActiveFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'both') count++;
    if (categoryFilter !== 'all') count++;
    if (productTypeFilter !== 'all') count++;
    if (voltageFilter !== 'all') count++;
    if (powerFilter !== 'all') count++;
    if (cctFilter !== 'all') count++;
    if (criFilter !== 'all') count++;
    if (dimmingTypeFilter !== 'all') count++;
    if (ledTypeFilter !== 'all') count++;
    if (driverBrandFilter !== 'all') count++;
    if (searchTerm !== '') count++;
    return count;
  }, [typeFilter, categoryFilter, productTypeFilter, voltageFilter, powerFilter, cctFilter, criFilter, dimmingTypeFilter, ledTypeFilter, driverBrandFilter, searchTerm]);

  const totalSelectableProducts = useMemo(
    () => products.filter(product => product && product.id).length,
    [products]
  );

  const allSelectableSelected = totalSelectableProducts > 0 && selectedRows.length === totalSelectableProducts;

  const stats = useMemo(() => {
    const indoorCount = countsByType.indoor || 0;
    const outdoorCount = countsByType.outdoor || 0;
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price_pc) || 0), 0);

    return {
      totalProducts: totalItems,
      indoorProducts: indoorCount,
      outdoorProducts: outdoorCount,
      totalValue: totalValue.toFixed(2),
      selectedCount: selectedRows.length
    };
  }, [products, totalItems, selectedRows, countsByType]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20'>
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="space-y-6">
            <StatsCardsSkeleton count={5} />
            <DataTableSkeleton />
          </div>
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
            <pattern id="data-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#data-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-3 md:p-4 max-w-7xl relative z-10 space-y-3">
        {/* Consolidated Stats & Actions Card */}
        <Card density="compact" className="border border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardContent density="compact">
            <div className="flex items-center justify-between gap-4">
              {/* Stats Section - Compact Inline */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-[9px] text-muted-foreground leading-none">Total</p>
                    <p className="text-sm font-bold text-foreground leading-none mt-0.5">{stats.totalProducts}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-[9px] text-muted-foreground leading-none">Indoor</p>
                    <p className="text-sm font-bold text-foreground leading-none mt-0.5">{stats.indoorProducts}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-[9px] text-muted-foreground leading-none">Outdoor</p>
                    <p className="text-sm font-bold text-foreground leading-none mt-0.5">{stats.outdoorProducts}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-[9px] text-muted-foreground leading-none">Value</p>
                    <p className="text-sm font-bold text-foreground leading-none mt-0.5">${stats.totalValue}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[9px] text-muted-foreground leading-none">Selected</p>
                    <p className="text-sm font-bold text-foreground leading-none mt-0.5">{stats.selectedCount}</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border" />

              {/* Search Section */}
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="pl-10 h-8 text-sm"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  variant="outline"
                  size="compact"
                  title="Search"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
                {searchTerm && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSearchInput('');
                    }}
                    variant="ghost"
                    size="compact"
                    title="Clear Search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border" />

              {/* Actions Section */}
              <div className="flex items-center gap-1.5">
                <Button onClick={() => router.push('/admin-dashboard/data-entry')} variant="default" size="compact" title="Add Product">
                  <Plus className="h-3.5 w-3.5" />
                </Button>

                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="compact"
                  title="Refresh Data"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>

                {refreshing && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Updating…</span>
                  </div>
                )}

                <Button 
                  onClick={() => setIsFiltersOpen(true)} 
                  variant="outline" 
                  size="compact" 
                  className="relative"
                  title={`Filters${getActiveFilterCount > 0 ? ` (${getActiveFilterCount} active)` : ''}`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {getActiveFilterCount > 0 && (
                    <Badge variant="default" size="compact" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px]">
                      {getActiveFilterCount}
                    </Badge>
                  )}
                </Button>

                <Button 
                  onClick={handleSelectAll} 
                  variant="outline" 
                  size="compact"
                  title={allSelectableSelected ? 'Deselect All' : 'Select All'}
                >
                  {allSelectableSelected ? (
                    <Square className="h-3.5 w-3.5" />
                  ) : (
                    <CheckSquare className="h-3.5 w-3.5" />
                  )}
                </Button>

                <Button onClick={handleExportAll} variant="outline" size="compact" title="Export All as CSV">
                  <Download className="h-3.5 w-3.5" />
                </Button>

                <Button onClick={() => setIsCustomExportOpen(true)} variant="outline" size="compact" title="Custom Export Options">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Operations Toolbar */}
        {selectedRows.length > 0 && (
          <Card density="compact" className="border border-primary/50 bg-primary/5">
            <CardContent density="compact">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">
                    {selectedRows.length} product{selectedRows.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    onClick={() => setBulkAction('category')}
                    variant="outline"
                    size="compact"
                  >
                    Set Category
                  </Button>
                  <Button
                    onClick={() => setBulkAction('update')}
                    variant="outline"
                    size="compact"
                  >
                    Mass Update
                  </Button>
                  <Button
                    onClick={handleExportSelected}
                    variant="outline"
                    size="compact"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Export Selected
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="compact"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete Selected
                  </Button>
                </div>
                <Button
                  onClick={() => setSelectedRows([])}
                  variant="ghost"
                  size="compact"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        

        {/* Filters Dialog */}
        <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] w-full overflow-hidden flex flex-col glass-effect border-2 border-primary/20 shadow-2xl">
            <DialogHeader className="pb-4 border-b border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <DialogTitle className="text-2xl font-bold text-gradient flex items-center gap-2">
                <Filter className="h-6 w-6 text-primary" />
                Filter Products
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-base mt-1.5">
                  {getActiveFilterCount > 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <Badge variant="gradient" className="font-semibold animate-scale-in">
                        {getActiveFilterCount} filter{getActiveFilterCount !== 1 ? 's' : ''} active
                      </Badge>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No active filters</span>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-6 px-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="basic" className="text-sm font-medium">Basic Filters</TabsTrigger>
                  <TabsTrigger value="technical" className="text-sm font-medium">Technical Specs</TabsTrigger>
                  <TabsTrigger value="features" className="text-sm font-medium">Features</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-2 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-full shadow-lg shadow-primary/20 animate-glow" />
                      <h3 className="text-lg font-semibold text-gradient">Product Type & Category</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                      {/* Type Toggle */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">
                          Product Type
                        </label>
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
                              className={
                                typeFilter === type.value
                                  ? 'flex-1 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5'
                                  : 'flex-1 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-md'
                              }
                            >
                              {type.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {/* Category Filter */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">
                          Category
                        </label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              categoryFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category, index) => (
                              <SelectItem key={`category-${index}-${category}`} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Product Type Filter */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">
                          Product Type
                        </label>
                        <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              productTypeFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All Product Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Product Types</SelectItem>
                            {getDynamicOptions('producttype').map((type, index) => (
                              <SelectItem key={`producttype-${index}-${type}`} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-2 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-full shadow-lg shadow-primary/20 animate-glow" />
                      <h3 className="text-lg font-semibold text-gradient">Technical Specifications</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                      {/* Voltage Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Voltage
                        </label>
                        <Select value={voltageFilter} onValueChange={setVoltageFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              voltageFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All Voltages" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Voltages</SelectItem>
                            {getDynamicOptions('Voltage').map((voltage, index) => (
                              <SelectItem key={`voltage-${index}-${voltage}`} value={voltage}>{voltage}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Power Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Power (W)
                        </label>
                        <Select value={powerFilter} onValueChange={setPowerFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              powerFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All Powers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Powers</SelectItem>
                            {getDynamicOptions('power_w').map((power, index) => (
                              <SelectItem key={`power-${index}-${power}`} value={power}>{power}W</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* CCT Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          CCT (K)
                        </label>
                        <Select value={cctFilter} onValueChange={setCctFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              cctFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All CCT" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All CCT</SelectItem>
                            {getDynamicOptions('CCT').map((cct, index) => (
                              <SelectItem key={`cct-${index}-${cct}`} value={cct}>{cct}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* CRI Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          CRI (Ra)
                        </label>
                        <Select value={criFilter} onValueChange={setCriFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              criFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All CRI" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All CRI</SelectItem>
                            {getDynamicOptions('cri_ra').map((cri, index) => (
                              <SelectItem key={`cri-${index}-${cri}`} value={cri}>{cri}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="features" className="space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-2 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-full shadow-lg shadow-primary/20 animate-glow" />
                      <h3 className="text-lg font-semibold text-gradient">Features & Components</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-4">
                      {/* Dimmable Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Dimming Type
                        </label>
                        <Select value={dimmingTypeFilter} onValueChange={setDimmingTypeFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              dimmingTypeFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All Dimming Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Dimming Types</SelectItem>
                            {getDynamicOptions('Dimming Type').map((option, index) => (
                              <SelectItem key={`dimming-${index}-${option}`} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* LED Type Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          LED Type
                        </label>
                        <Select value={ledTypeFilter} onValueChange={setLedTypeFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              ledTypeFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All LED Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All LED Types</SelectItem>
                            {getDynamicOptions('ledType').map((ledType, index) => (
                              <SelectItem key={`ledType-${index}-${ledType}`} value={ledType}>{ledType}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Driver Brand Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Driver Brand
                        </label>
                        <Select value={driverBrandFilter} onValueChange={setDriverBrandFilter}>
                          <SelectTrigger
                            className={`h-9 transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20${
                              driverBrandFilter !== 'all' ? ' border-primary/50 bg-primary/5 shadow-md' : ''
                            }`}
                          >
                            <SelectValue placeholder="All Driver Brands" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Driver Brands</SelectItem>
                            {getDynamicOptions('Driver Brand').map((brand, index) => (
                              <SelectItem key={`driver-${index}-${brand}`} value={brand}>{brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="pt-4 border-t gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTypeFilter('both');
                  setCategoryFilter('all');
                  setProductTypeFilter('all');
                  setVoltageFilter('all');
                  setPowerFilter('all');
                  setCctFilter('all');
                  setCriFilter('all');
                  setDimmingTypeFilter('all');
                  setLedTypeFilter('all');
                  setDriverBrandFilter('all');
                  setSearchTerm('');
                  setSearchInput('');
                }}
                className="flex-1 sm:flex-none transition-all hover:border-destructive/50 hover:text-destructive hover:shadow-md"
              >
                Clear All Filters
              </Button>
              <Button
                onClick={() => setIsFiltersOpen(false)}
                variant="gradient"
                className="flex-1 sm:flex-none shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Data Table */}
        <Card density="compact" className="border border-border/50">
          <CardHeader density="compact">
            <CardTitle className="text-base">Product Data ({totalItems} total)</CardTitle>
          </CardHeader>
          <CardContent density="compact">
            <DataTable
              data={products}
              columns={columns}
              loading={loading && !refreshing}
              emptyMessage="No products found matching your criteria"
              pageSize={pageSize}
              currentPage={currentPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              isShowingAll={false}
              manualPagination
              showRowSelection={true}
              selectedRows={selectedRows}
              onRowSelect={handleRowSelect}
              density="compact"
            />
          </CardContent>
        </Card>

        {/* Modals */}
        <EditProductModal
          product={editProduct}
          isOpen={!!editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(updatedProduct) => {
            if (updatedProduct === null && editProduct) {
              setProducts(prev => prev.filter(p => p.id !== editProduct.id));
              setTotalItems(prev => Math.max(prev - 1, 0));
            } else if (updatedProduct) {
              setProducts(prev => prev.map(p =>
                p.id === updatedProduct.id ? updatedProduct : p
              ));
            }
            cache.clear();
            setEditProduct(null);
          }}
        />

        <BulkUpdateModal
          selectedProducts={selectedRows}
          action={bulkAction}
          isOpen={!!bulkAction}
          onClose={() => setBulkAction(null)}
          onComplete={(result) => {
            if (bulkAction === 'update') {
              handleBulkUpdate(result);
            } else if (bulkAction === 'category') {
              handleBulkSetCategory(result);
            }
            setBulkAction(null);
          }}
          availableCategories={categories}
        />

        <Dialog open={isCustomExportOpen} onOpenChange={setIsCustomExportOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Custom Export ({customExportFields.size} field{customExportFields.size !== 1 ? 's' : ''} selected)
              </DialogTitle>
              <DialogDescription>
                Choose the columns and scope for your export. Use the quick actions to manage selections faster.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {customExportFields.size} of {productFieldOptions.length} field{productFieldOptions.length !== 1 ? 's' : ''} selected.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAllFields}>
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllFields}
                      disabled={customExportFields.size === 0}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto rounded-md border border-border/50 p-3">
                  {productFieldOptions.map(field => (
                    <label key={field.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border/50"
                        checked={customExportFields.has(field.key)}
                        onChange={() => toggleCustomExportField(field.key)}
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium">Export Scope</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="custom-export-scope"
                      className="h-4 w-4"
                      value="all"
                      checked={customExportScope === 'all'}
                      onChange={() => setCustomExportScope('all')}
                    />
                    All loaded products ({products.length})
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="custom-export-scope"
                      className="h-4 w-4"
                      value="selected"
                      checked={customExportScope === 'selected'}
                      onChange={() => setCustomExportScope('selected')}
                      disabled={selectedRows.length === 0}
                    />
                    Selected products ({selectedRows.length})
                  </label>
                </div>
                {customExportScope === 'selected' && selectedRows.length === 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Select at least one product to export selected rows.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCustomExportOpen(false)} disabled={isExporting}>
                Cancel
              </Button>
              <Button onClick={handleCustomExport} disabled={isExporting}>
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </span>
                ) : (
                  'Export'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
