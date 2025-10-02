"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { updateProduct, deleteProduct } from '@/lib/database/products';
import { fieldMapping } from '@/lib/database/products';
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

export function EditProductModal({ product, isOpen, onClose, onSave, isCreate = false }) {
  const [formData, setFormData] = useState({});
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
    { key: 'powerW', label: 'Power (W)', placeholder: 'e.g., 15W, 20W' },
    { key: 'voltage', label: 'Voltage', placeholder: 'e.g., 220V, 240V' },
    { key: 'cct', label: 'CCT (K)', placeholder: 'e.g., 3000K, 4000K' },
    { key: 'criRa', label: 'CRI (Ra)', placeholder: 'e.g., 80, 90, 95' },
    { key: 'lumen', label: 'Lumen', placeholder: 'e.g., 1000, 1200' },
    { key: 'efficacyLmw', label: 'Efficacy (lm/W)', placeholder: 'e.g., 90, 110' },
    { key: 'beamAngle', label: 'Beam Angle', placeholder: 'e.g., 30°, 60°' },
    { key: 'powerFactor', label: 'Power Factor', placeholder: 'e.g., 0.9, 0.95' },
    { key: 'dimmingType', label: 'Dimming Type', placeholder: 'e.g., 0-10V, DALI' },
    { key: 'emergencyBackupBattery', label: 'Emergency Backup Battery', placeholder: 'e.g., Optional' },
    { key: 'pluginSensor', label: 'Plug-in Sensor', placeholder: 'e.g., Yes, No' },
    { key: 'sensorMicrowaveBluetooth', label: 'Sensor (Microwave/Bluetooth)', placeholder: 'e.g., Microwave, Bluetooth' },
    { key: 'junctionCover', label: 'Junction Cover', placeholder: 'e.g., Included' },
    { key: 'remoteControl', label: 'Remote Control', placeholder: 'e.g., Optional' },
    { key: 'installationKits', label: 'Installation Kits', placeholder: 'e.g., Surface Mount Kit' },
    { key: 'materialFinish', label: 'Material Finish', placeholder: 'e.g., White, Black, Chrome' }
  ];
  const designFields = [
    { key: 'ledType', label: 'LED Type', placeholder: 'e.g., COB, SMD' },
    { key: 'driverBrand', label: 'Driver Brand', placeholder: 'e.g., Mean Well, Philips' },
    { key: 'adjustmentDial', label: 'Adjustment Dial', placeholder: 'e.g., Yes, 0-10V, DALI' },
    { key: 'certifications', label: 'Certifications', placeholder: 'e.g., CE, RoHS, UL' }
  ];
  const logisticsFields = [
    { key: 'leadTime', label: 'Lead Time', placeholder: 'e.g., 30 days' },
    { key: 'warranty', label: 'Warranty', placeholder: 'e.g., 5 years' },
    { key: 'moq', label: 'MOQ', placeholder: 'e.g., 100' },
    { key: 'pricePc', label: 'Price per Piece', placeholder: 'e.g., 25.50', type: 'number', step: '0.01' },
    { key: 'costChinaDdpUsa', label: 'Cost (China DDP USA)', placeholder: 'e.g., 18.75', type: 'number', step: '0.01' },
    { key: 'costThailandVietnam', label: 'Cost (Thailand/Vietnam)', placeholder: 'e.g., 19.50', type: 'number', step: '0.01' }
  ];
  const mediaFields = [
    { key: 'photo', label: 'Photo URL', placeholder: 'https://...' },
    { key: 'imageUrl', label: 'Image URL', placeholder: 'https://...' },
    { key: 'cutSheet', label: 'Cut Sheet URL', placeholder: 'https://...' }
  ];
  const outdoorFields = [
    { key: 'ipRating', label: 'IP Rating', placeholder: 'e.g., IP65' },
    { key: 'ikRating', label: 'IK Rating', placeholder: 'e.g., IK08' }
  ];

  const reverseFieldMapping = useMemo(() => {
    const mapping = {};
    Object.entries(fieldMapping).forEach(([frontend, db]) => {
      mapping[db] = frontend;
    });
    return mapping;
  }, []);

  const allFieldKeys = useMemo(() => {
    const keys = new Set(Object.keys(fieldMapping));
    keys.add('type');
    keys.add('category');
    keys.add('modelNumber');
    keys.add('productType');
    keys.add('name');
    keys.add('description');
    return Array.from(keys);
  }, []);

  const buildInitialFormData = useCallback((productData = {}) => {
    const initial = {};
    allFieldKeys.forEach((key) => {
      initial[key] = '';
    });

    const inferredType = productData.type || (isCreate ? 'indoor' : initial.type);
    initial.type = inferredType || 'indoor';

    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'Indoor' || key === 'Outdoor') {
        if (!initial.category && value) {
          initial.category = value || '';
        }
        return;
      }

      const frontendKey = reverseFieldMapping[key] || key;
      if (frontendKey in initial) {
        initial[frontendKey] = value ?? '';
      }
    });

    if (!initial.category && productData.type) {
      const categoryColumn = productData.type === 'outdoor' ? 'Outdoor' : 'Indoor';
      initial.category = productData[categoryColumn] || '';
    }

    return initial;
  }, [allFieldKeys, isCreate, reverseFieldMapping]);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      const initial = buildInitialFormData(product);
      initialFormDataRef.current = initial;
      setFormData(initial);
    } else if (isCreate) {
      const initial = buildInitialFormData({ type: 'indoor' });
      initialFormDataRef.current = initial;
      setFormData(initial);
    }
  }, [buildInitialFormData, isCreate, product]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const mapFormDataToDbColumns = useCallback((data) => {
    const mapped = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        return;
      }

      if (key === 'type' || key === 'category') {
        return;
      }

      const dbColumn = fieldMapping[key] || key;
      mapped[dbColumn] = value;
    });

    if (data.category) {
      const categoryColumn = (data.type || 'indoor') === 'outdoor' ? 'Outdoor' : 'Indoor';
      mapped[categoryColumn] = data.category;
    }

    mapped.type = data.type || 'indoor';

    return mapped;
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
      if (isCreate) {
        const payload = mapFormDataToDbColumns(formData);

        if (!payload.producttype || !payload.model_number) {
          throw new Error('Product type and model number are required.');
        }

        onSave(payload);
        triggerSuccessClose();
        return;
      }

      const updateData = { ...formData };
      delete updateData.type;
      delete updateData.category;

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const result = await updateProduct(product.type, product.id, updateData);
      if (result.error) throw result.error;

      const updatedProduct = { ...product };
      Object.entries(updateData).forEach(([key, value]) => {
        const dbColumn = fieldMapping[key] || key;
        updatedProduct[dbColumn] = value;
      });

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
      const result = await deleteProduct(product.type, product.id);
      if (result.error) throw result.error;

      onSave(null); // Signal deletion
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
    const initial = initialFormDataRef.current || buildInitialFormData(product || { type: 'indoor' });
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
      <DialogContent className="max-w-4xl max-h-[10vh] glass-effect border-2 border-primary/20 shadow-2xl animate-modal-slide-up">
        {(saving || loading) && (
          <div className="inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
              <p className="text-sm font-medium text-muted-foreground">
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

        <DialogHeader className="pb-4 border-b border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <DialogTitle className="flex items-center gap-2 text-gradient">
            <Badge variant={badgeVariant} className="animate-scale-in">
              {badgeLabel}
            </Badge>
            {isCreate ? 'Create New Product' : `Edit Product: ${product?.model_number ?? ''}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift">
            <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="space-y-2" variants={gridItemVariants}>
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
                <motion.div className="space-y-2" variants={gridItemVariants}>
                  <label className={labelClass}>
                    Product Type <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.productType || ''}
                    onChange={(e) => handleInputChange('productType', e.target.value)}
                    placeholder="e.g., Downlight, Track Light"
                    required
                    className={inputClass}
                  />
                </motion.div>
              </motion.div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="space-y-2" variants={gridItemVariants}>
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
                <motion.div className="space-y-2" variants={gridItemVariants}>
                  <label className={labelClass}>Product Name</label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Aurora LED Downlight"
                    className={inputClass}
                  />
                </motion.div>
              </motion.div>

              <motion.div className="space-y-2" variants={gridItemVariants} initial="hidden" animate="visible">
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
                <motion.div className="space-y-2" variants={gridItemVariants}>
                  <label className={labelClass}>Sizes</label>
                  <Input
                    value={formData.sizes || ''}
                    onChange={(e) => handleInputChange('sizes', e.target.value)}
                    placeholder="e.g., 4 inch, 6 inch, 8 inch"
                    className={inputClass}
                  />
                </motion.div>
                <motion.div className="space-y-2" variants={gridItemVariants}>
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
                  <motion.div key={field.key} className="space-y-2" variants={gridItemVariants}>
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
            <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Design & Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {designFields.slice(0, 2).map((field) => (
                  <motion.div key={field.key} className="space-y-2" variants={gridItemVariants}>
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
              {designFields.slice(2).map((field) => (
                <motion.div key={field.key} className="space-y-2" variants={gridItemVariants} initial="hidden" animate="visible">
                  <label className={labelClass}>{field.label}</label>
                  <Input
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                </motion.div>
              ))}
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
                  <motion.div key={field.key} className="space-y-2" variants={gridItemVariants}>
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
            <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Media & Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {mediaFields.slice(0, 2).map((field) => (
                  <motion.div key={field.key} className="space-y-2" variants={gridItemVariants}>
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
              {mediaFields.slice(2).map((field) => (
                <motion.div key={field.key} className="space-y-2" variants={gridItemVariants} initial="hidden" animate="visible">
                  <label className={labelClass}>{field.label}</label>
                  <Input
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                </motion.div>
              ))}
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
                    <motion.div key={field.key} className="space-y-2" variants={gridItemVariants}>
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
            <CardHeader className="bg-gradient-to-r from-transparent via-primary/5 to-transparent">
              <CardTitle className="text-lg font-semibold text-gradient flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className={labelClass}>Indoor/Outdoor Category</label>
                {isCreate ? (
                  <Input
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="e.g., Residential Lighting"
                    className={inputClass}
                  />
                ) : (
                  <div className={readOnlyFieldClass}>
                    {product?.[modalType === 'indoor' ? 'Indoor' : 'Outdoor'] || 'Not categorized'}
                  </div>
                )}
                {!isCreate && (
                  <p className="text-xs text-muted-foreground">
                    Category is managed through bulk operations in the data management page
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-primary/10 pt-4 mt-6">
          <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving || loading}
              className="transition-all hover:border-primary/50 hover:shadow-md"
            >
              Reset
            </Button>
            {!isCreate && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving || loading}
                className="transition-all hover:shadow-lg hover:shadow-destructive/20 hover:-translate-y-0.5"
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
              className="transition-all hover:border-primary/50 hover:shadow-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              variant="gradient"
              className="shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {saving ? 'Saving...' : isCreate ? 'Create Product' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
