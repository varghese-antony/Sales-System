"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { updateProductClientV2, deleteProductClientV2 } from '@/lib/database/products-client';
import { sanitizeProductForInsert, getReverseFieldMappingV2 } from '@/lib/database/products-v2';
import { Info, Zap, Palette, DollarSign, Image, Shield, Tag, Check } from 'lucide-react';

const gridContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const TRUTHY_BOOLEAN_VALUES = new Set(['true', 'yes', '1', 'included', 'optional']);

const BOOLEAN_FIELD_KEYS = ['occupancy', 'biLevel', 'remoteControl', 'pluginSensor', 'emergencyBackupBattery', 'junctionCover'];

const FORM_FIELD_KEYS = [
  'subCategory',
  'productName',
  'modelNumber',
  'description',
  'size',
  'mounting',
  'powerW',
  'voltage',
  'cct',
  'criRa',
  'lumen',
  'efficacyLumenPerW',
  'dimmingType',
  'sensorsAndControls',
  'pir',
  'microwave',
  'installationKits',
  'adjustmentDial',
  'materialFinish',
  'certifications',
  'leadTime',
  'warranty',
  'moq',
  'pricePerPiece',
  'costChinaDdpUsa',
  'costThailandVietnam',
  'photo',
  'cutSheet',
  'ipRating',
  'occupancy',
  'biLevel',
  'remoteControl',
  'pluginSensor',
  'emergencyBackupBattery',
  'junctionCover',
  'sensorCost',
  'sensorPrice',
  'remoteControlBluetoothCost',
  'remoteControlBluetoothPrice',
  'pluginSensorCost',
  'pluginSensorPrice',
  'emergencyBackupBatteryCost',
  'emergencyBackupBatteryPrice',
  'installationKitsCost',
  'installationKitsPrice'
];

function createEmptyFormState(type = 'indoor') {
  const state = { type };
  FORM_FIELD_KEYS.forEach((key) => {
    state[key] = BOOLEAN_FIELD_KEYS.includes(key) ? false : '';
  });
  return state;
}

function parseBooleanValue(value) {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === '') return false;
  if (['false', 'no', '0'].includes(normalized)) return false;
  return TRUTHY_BOOLEAN_VALUES.has(normalized);
}

function normalizeFieldValue(field, value) {
  if (BOOLEAN_FIELD_KEYS.includes(field)) {
    return parseBooleanValue(value);
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function mapProductToFormData(product = {}, reverseMapping) {
  const type = product.type || 'indoor';
  const state = createEmptyFormState(type);

  Object.entries(product).forEach(([dbKey, value]) => {
    const frontendKey = reverseMapping[dbKey];
    if (!frontendKey) return;
    state[frontendKey] = normalizeFieldValue(frontendKey, value);
  });

  // Ensure description comes through even if stored under description key
  if (product.description && state.description === '') {
    state.description = String(product.description);
  }

  state.type = type;
  return state;
}

function mapFormToRequestPayload(type, formData) {
  const payload = { type };
  Object.entries(formData).forEach(([key, value]) => {
    if (key === 'type') return;
    if (BOOLEAN_FIELD_KEYS.includes(key)) {
      payload[key] = Boolean(value);
      return;
    }
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (trimmed === '' || trimmed === undefined || trimmed === null) {
      return;
    }
    payload[key] = trimmed;
  });

  return payload;
}

export function EditProductModal({ product, isOpen, onClose, onSave, isCreate = false }) {
  const reverseFieldMapping = useMemo(() => getReverseFieldMappingV2(), []);
  const [formData, setFormData] = useState(() => createEmptyFormState(product?.type || 'indoor'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialFormDataRef = useRef({});
  const successTimeoutRef = useRef(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const modalType = isCreate ? (formData.type === 'outdoor' ? 'outdoor' : 'indoor') : product?.type || 'indoor';
  const badgeVariant = isCreate ? 'gradient' : (modalType === 'indoor' ? 'secondary' : 'outline');
  const badgeLabel = modalType === 'outdoor' ? 'Outdoor' : 'Indoor';
  const labelClass = 'text-sm font-medium text-foreground/90 flex items-center gap-1.5';
  const inputClass = 'transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-lg focus:shadow-primary/10';
  const selectTriggerClass = 'transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20';
  const readOnlyFieldClass = 'p-2 bg-gradient-to-r from-muted/50 to-muted rounded-md text-sm border border-border/50';
  const technicalFields = [
    { key: 'powerW', label: 'Power (W)', placeholder: 'e.g., 15W' },
    { key: 'voltage', label: 'Voltage', placeholder: 'e.g., 220V' },
    { key: 'cct', label: 'CCT (K)', placeholder: 'e.g., 3000K' },
    { key: 'criRa', label: 'CRI (Ra)', placeholder: 'e.g., 80' },
    { key: 'lumen', label: 'Lumen', placeholder: 'e.g., 1200' },
    { key: 'efficacyLumenPerW', label: 'Efficacy (lm/W)', placeholder: 'e.g., 95' },
    { key: 'dimmingType', label: 'Dimming Type', placeholder: 'e.g., 0-10V' }
  ];

  const designFields = [
    { key: 'materialFinish', label: 'Material Finish', placeholder: 'e.g., White, Black' },
    { key: 'sensorsAndControls', label: 'Sensors & Controls', placeholder: 'e.g., Daylight Sensor' },
    { key: 'pir', label: 'PIR', placeholder: 'e.g., PIR Sensor' },
    { key: 'microwave', label: 'Microwave', placeholder: 'e.g., Microwave Sensor' },
    { key: 'installationKits', label: 'Installation Kits', placeholder: 'e.g., Surface Mount Kit' },
    { key: 'adjustmentDial', label: 'Adjustment Dial', placeholder: 'e.g., CCT Switch' },
    { key: 'certifications', label: 'Certifications', placeholder: 'e.g., CE, RoHS' }
  ];

  const logisticsFields = [
    { key: 'leadTime', label: 'Lead Time', placeholder: 'e.g., 30 days' },
    { key: 'warranty', label: 'Warranty', placeholder: 'e.g., 3 years' },
    { key: 'moq', label: 'MOQ', placeholder: 'e.g., 100 pcs' },
    { key: 'pricePerPiece', label: 'Price per piece', placeholder: 'e.g., 25.50', type: 'number', step: '0.01' },
    { key: 'costChinaDdpUsa', label: 'Cost China DDP USA', placeholder: 'e.g., 18.75', type: 'number', step: '0.01' },
    { key: 'costThailandVietnam', label: 'Cost Thailand/Vietnam', placeholder: 'e.g., 17.25', type: 'number', step: '0.01' }
  ];

  const addonFields = [
    { key: 'sensorCost', label: 'Sensor Cost', placeholder: 'e.g., 5.00', type: 'number', step: '0.01' },
    { key: 'sensorPrice', label: 'Sensor Price', placeholder: 'e.g., 12.50', type: 'number', step: '0.01' },
    { key: 'remoteControlBluetoothCost', label: 'Remote Control/Bluetooth Cost', placeholder: 'e.g., 3.50', type: 'number', step: '0.01' },
    { key: 'remoteControlBluetoothPrice', label: 'Remote Control/Bluetooth Price', placeholder: 'e.g., 8.99', type: 'number', step: '0.01' },
    { key: 'pluginSensorCost', label: 'Plugin Sensor Cost', placeholder: 'e.g., 4.00', type: 'number', step: '0.01' },
    { key: 'pluginSensorPrice', label: 'Plugin Sensor Price', placeholder: 'e.g., 9.99', type: 'number', step: '0.01' },
    { key: 'emergencyBackupBatteryCost', label: 'Emergency Backup Battery Cost', placeholder: 'e.g., 6.00', type: 'number', step: '0.01' },
    { key: 'emergencyBackupBatteryPrice', label: 'Emergency Backup Battery Price', placeholder: 'e.g., 14.99', type: 'number', step: '0.01' },
    { key: 'installationKitsCost', label: 'Installation Kits Cost', placeholder: 'e.g., 2.50', type: 'number', step: '0.01' },
    { key: 'installationKitsPrice', label: 'Installation Kits Price', placeholder: 'e.g., 6.99', type: 'number', step: '0.01' }
  ];

  const mediaFields = [
    { key: 'photo', label: 'Photo URL', placeholder: 'https://...' },
    { key: 'cutSheet', label: 'Cut Sheet URL', placeholder: 'https://...' }
  ];

  const outdoorFields = [
    { key: 'ipRating', label: 'IP Rating', placeholder: 'e.g., IP65' }
  ];

  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      const initial = mapProductToFormData(product, reverseFieldMapping);
      initialFormDataRef.current = initial;
      setFormData(initial);
    } else if (isCreate) {
      const initial = createEmptyFormState('indoor');
      initialFormDataRef.current = initial;
      setFormData(initial);
    }
  }, [isCreate, isOpen, product, reverseFieldMapping]);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleBooleanChange = useCallback((field, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Boolean(checked)
    }));
  }, []);

  const triggerSuccessClose = useCallback(() => {
    setShowSuccess(true);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 500);
  }, [onClose]);

  const handleSave = async () => {
    if (!isCreate && !product) return;

    setSaving(true);
    try {
      const type = isCreate ? (formData.type || 'indoor') : product.type;
      const payload = mapFormToRequestPayload(type, formData);
      const sanitized = sanitizeProductForInsert(payload, { fillBooleanDefaults: false });

      if (!sanitized.model_number) {
        throw new Error('Model number is required.');
      }

      if (!sanitized.sub_category && sanitized.product_name) {
        console.warn('Missing sub-category for product update');
      }

      if (isCreate) {
        onSave(sanitized);
        triggerSuccessClose();
        return;
      }

      const { data, error } = await updateProductClientV2(type, product.id, sanitized);
      if (error) {
        throw new Error(error);
      }

      const updatedRow = Array.isArray(data?.data) ? data.data[0] : data?.data || data;
      const updatedProduct = updatedRow
        ? { ...product, ...updatedRow }
        : { ...product, ...sanitized };

      onSave(updatedProduct);
      triggerSuccessClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (!confirm(`Are you sure you want to delete "${product.model_number}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteProductClientV2(product.type, product.id);
      if (result.error) throw new Error(result.error);

      onSave(null);
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!product && !isCreate) return;
    const initial = initialFormDataRef.current || createEmptyFormState(product?.type || 'indoor');
    setFormData(initial);
  };

  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
  }, []);

  if (!product && !isCreate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-2 border-primary/20 shadow-2xl animate-modal-slide-up p-4 sm:p-6">
        {(saving || loading) && (
          <div className="inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-primary border-t-transparent" />
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {saving ? 'Saving changes...' : 'Deleting product...'}
              </p>
            </div>
          </div>
        )}

        {showSuccess && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed inset-0 flex items-center justify-center z-[100] bg-background/80 backdrop-blur-sm"
          >
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-6 shadow-2xl">
              <Check className="h-12 w-12 text-white" />
            </div>
          </motion.div>
        )}

        <DialogHeader className="pb-3 sm:pb-4 border-b border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg sm:text-xl text-gradient">
            <Badge variant={badgeVariant} className="animate-scale-in">
              {badgeLabel}
            </Badge>
            {isCreate ? 'Create New Product' : `Edit Product: ${product?.model_number ?? ''}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Basic Information */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-base sm:text-lg font-semibold text-gradient flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                  <label className={labelClass}>Type</label>
                  {isCreate ? (
                    <Select
                      value={formData.type || 'indoor'}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className={readOnlyFieldClass}>
                      {modalType === 'indoor' ? 'Indoor' : 'Outdoor'} (readonly)
                    </div>
                  )}
                </motion.div>
                <motion.div className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                  <label className={labelClass}>
                    Model Number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.modelNumber || ''}
                    onChange={(e) => handleInputChange('modelNumber', e.target.value)}
                    placeholder="e.g., DL-100"
                    required
                    className={inputClass}
                  />
                </motion.div>
                <motion.div className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                  <label className={labelClass}>Product Name</label>
                  <Input
                    value={formData.productName || ''}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="e.g., Aurora LED Downlight"
                    className={inputClass}
                  />
                </motion.div>
              </motion.div>

              <motion.div className="space-y-1.5 sm:space-y-2" variants={gridItemVariants} initial="hidden" animate="visible">
                <label className={labelClass}>Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a brief description of the product"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </motion.div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                  <label className={labelClass}>Size</label>
                  <Input
                    value={formData.size || ''}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    placeholder="e.g., 4 inch"
                    className={inputClass}
                  />
                </motion.div>
                <motion.div className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                  <label className={labelClass}>Mounting</label>
                  <Input
                    value={formData.mounting || ''}
                    onChange={(e) => handleInputChange('mounting', e.target.value)}
                    placeholder="e.g., Recessed, Surface"
                    className={inputClass}
                  />
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {technicalFields.map((field) => (
                  <motion.div key={field.key} className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                    <label className={labelClass}>{field.label}</label>
                    <Input
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          {/* Design & Features */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-base sm:text-lg font-semibold text-gradient flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Design & Features
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <motion.div
                className="space-y-1.5 sm:space-y-2"
                variants={gridItemVariants}
                initial="hidden"
                animate="visible"
              >
                <label className={labelClass}>Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a brief description of the product"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </motion.div>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {designFields.map((field) => (
                  <motion.div key={field.key} className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                    <label className={labelClass}>{field.label}</label>
                    <Input
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          {/* Logistics & Costs */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Logistics & Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {logisticsFields.map((field) => (
                  <motion.div key={field.key} className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                    <label className={labelClass}>{field.label}</label>
                    <Input
                      type={field.type || 'text'}
                      step={field.step}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          {/* Add-on Pricing */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Add-on Pricing (Cost & Price)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Note: Users will only see prices, not costs. Costs are for internal tracking only.
              </p>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {addonFields.map((field) => (
                  <motion.div key={field.key} className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                    <label className={labelClass}>{field.label}</label>
                    <Input
                      type={field.type || 'text'}
                      step={field.step}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          {/* Media & Documentation */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-base sm:text-lg font-semibold text-gradient flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Media & Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {mediaFields.map((field) => (
                  <motion.div key={field.key} className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                    <label className={labelClass}>{field.label}</label>
                    <Input
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Feature Toggles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {[
                  { key: 'occupancy', label: 'Occupancy Sensor' },
                  { key: 'biLevel', label: 'Bi-level Dimming' },
                  { key: 'remoteControl', label: 'Remote Control' },
                  { key: 'pluginSensor', label: 'Plug-in Sensor' },
                  { key: 'emergencyBackupBattery', label: 'Emergency Backup Battery' },
                  { key: 'junctionCover', label: 'Junction Cover' }
                ].map(({ key, label }) => (
                  <motion.div key={key} className="flex items-center space-x-3 rounded-md border border-border/60 px-3 py-2" variants={gridItemVariants}>
                    <Checkbox
                      id={key}
                      checked={Boolean(formData[key])}
                      onCheckedChange={(checked) => handleBooleanChange(key, checked)}
                    />
                    <label htmlFor={key} className="text-sm text-foreground flex-1">
                      {label}
                    </label>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>

          {/* Outdoor Ratings */}
          {modalType === 'outdoor' && (
            <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
              <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
                <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Outdoor Ratings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  variants={gridContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {outdoorFields.map((field) => (
                    <motion.div key={field.key} className="space-y-1.5 sm:space-y-2" variants={gridItemVariants}>
                      <label className={labelClass}>{field.label}</label>
                      <Input
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={inputClass}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          )}

          {/* Category */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-base sm:text-lg font-semibold text-gradient flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className={labelClass}>Indoor/Outdoor Category</label>
                <Input
                  value={formData.subCategory || ''}
                  onChange={(e) => handleInputChange('subCategory', e.target.value)}
                  placeholder="e.g., Residential Lighting"
                  className={inputClass}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-between border-t border-primary/10 pt-3 sm:pt-4 mt-4 sm:mt-6">
          <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving || loading}
              className="w-full sm:w-auto transition-all hover:border-primary/50 hover:shadow-md"
            >
              Reset
            </Button>
            {!isCreate && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving || loading}
                className="w-full sm:w-auto transition-all hover:shadow-lg hover:shadow-destructive/20 hover:-translate-y-0.5"
              >
                {loading ? 'Deleting...' : 'Delete Product'}
              </Button>
            )}
          </div>
          <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving || loading}
              className="w-full sm:w-auto transition-all hover:border-primary/50 hover:shadow-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              variant="gradient"
              className="w-full sm:w-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {saving ? 'Saving...' : isCreate ? 'Create Product' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
