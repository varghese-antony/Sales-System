'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProductsByType } from '@/lib/database/products';

// Column mapping for database queries
const columnMapping = {
  'Size': 'Size',
  'Power (W)': 'power_w',
  'Voltage': 'Voltage',
  'CCT': 'CCT',
  'CRI/RA': 'cri_ra',
  'Lumen': 'Lumen',
  'Efficacy (lm/W)': 'efficacy_lmw',  // FIXED: was 'efficacy_lm_w'
  'Dimming Type': 'Dimming Type',     // FIXED: was 'dimming_type'
  'Material Finish': 'Material Finish', // FIXED: was 'material_finish'
  'Mounting': 'Mounting',
  'Certifications': 'Certifications',
  'Plug-in Sensor': 'plugin_sensor',  // FIXED: was 'plug_in_sensor'
  'Emergency Backup': 'emergency_backup_battery', // FIXED: was 'emergency_backup'
  'Junction Cover': 'junction_cover',
  'Remote Control': 'remote_control_bluetooth',
  'Installation Kits': 'installation_kits',
  'Adjustment Dial': 'adjustment_dial'
};

// Fields to extract from products for filtering
const desiredKeys = [
  'Size', 'Power (W)', 'Voltage', 'CCT', 'CRI/RA', 'Lumen', 'Efficacy (lm/W)',
  'Dimming Type', 'Material Finish', 'Mounting', 'Certifications',
  'Plug-in Sensor', 'Emergency Backup', 'Junction Cover',
  'Remote Control', 'Installation Kits', 'Adjustment Dial'
];

export const useProductFilters = (type, productType, initialProducts = []) => {
  const [selectedFilters, setSelectedFilters] = useState({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [availableOptions, setAvailableOptions] = useState({});
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);
  const [filteredProductCount, setFilteredProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Convert frontend filter keys to database column names
  const buildSupabaseFilters = useCallback((filters) => {
    const supabaseFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && columnMapping[key]) {
        supabaseFilters[columnMapping[key]] = value;
      }
    });
    return supabaseFilters;
  }, []);

  // Compute available filter options from products
  const computeAvailableOptions = useCallback((products) => {
    const options = {};
    
    desiredKeys.forEach(key => {
      const uniqueValues = new Set();
      const mappedKey = columnMapping[key];
      
      products.forEach(product => {
        const value = product[key] || product[mappedKey];
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(String(value).trim());
        }
      });
      
      options[key] = Array.from(uniqueValues).sort((a, b) => {
        // Try to sort numerically if possible, otherwise alphabetically
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.localeCompare(b);
      });
    });
    
    return options;
  }, []);

  // Fetch filtered products from database
  const fetchFilteredProducts = useCallback(async (filters) => {
    if (!type || !productType) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabaseFilters = buildSupabaseFilters(filters);
      const result = await getProductsByType(type, productType, { filters: supabaseFilters });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setFilteredProducts(result.data || []);
      setFilteredProductCount(result.data?.length ?? 0);
    } catch (err) {
      console.error('Error fetching filtered products:', err);
      setError(err.message);
      setFilteredProducts([]);
      setFilteredProductCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [type, productType, buildSupabaseFilters]);

  // Modal controls
  const openFilterModal = useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const closeFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  // Apply filters and fetch new products
  const applyFilters = useCallback(async (newFilters) => {
    setSelectedFilters(newFilters);
    await fetchFilteredProducts(newFilters);
    closeFilterModal();
  }, [fetchFilteredProducts, closeFilterModal]);

  // Reset all filters
  const resetFilters = useCallback(async () => {
    setSelectedFilters({});
    await fetchFilteredProducts({});
  }, [fetchFilteredProducts]);

  // Get count of active filters
  const getFilterCount = useCallback(() => {
    return Object.values(selectedFilters).filter(value => 
      value !== null && value !== undefined && value !== ''
    ).length;
  }, [selectedFilters]);

  // Update available options when products change
  useEffect(() => {
    if (initialProducts.length > 0) {
      const options = computeAvailableOptions(initialProducts);
      setAvailableOptions(options);
      setFilteredProducts(initialProducts);
      setFilteredProductCount(initialProducts.length);
    }
  }, [initialProducts, computeAvailableOptions]);

  // Update filtered product count when filters change
  useEffect(() => {
    setFilteredProductCount(filteredProducts.length);
  }, [filteredProducts]);

  return {
    // State
    selectedFilters,
    isFilterModalOpen,
    availableOptions,
    filteredProducts,
    filteredProductCount,
    isLoading,
    error,
    
    // Actions
    openFilterModal,
    closeFilterModal,
    applyFilters,
    resetFilters,
    getFilterCount,
    
    // Utilities
    buildSupabaseFilters,
    computeAvailableOptions
  };
};
