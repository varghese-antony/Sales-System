"use client";

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Tag, List, Edit, Eye, Loader2, DollarSign, Image } from 'lucide-react';

export function BulkUpdateModal({ selectedProducts, action, isOpen, onClose, onComplete, availableCategories = [] }) {
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [fieldValues, setFieldValues] = useState({});
  const [categoryValue, setCategoryValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const DialogIcon = action === 'update' ? Settings : Tag;
  const sectionIcons = {
    'Basic Information': List,
    'Technical Specifications': Settings,
    'Design & Features': Edit,
    'Commercial & Pricing': DollarSign,
    'Media': Image
  };
  const fieldGroupOrder = [
    { title: 'Basic Information', key: 'basic' },
    { title: 'Technical Specifications', key: 'technical' },
    { title: 'Design & Features', key: 'design' },
    { title: 'Commercial & Pricing', key: 'commercial' },
    { title: 'Media', key: 'media' }
  ];
  const gridVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };
  const cardClass = 'glass-effect-subtle border border-border/60 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover-lift';
  const selectTriggerClass = 'glass-effect-subtle transition-all hover:border-primary/50 hover:shadow-md focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20';
  const inputClass = 'glass-effect-subtle transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-lg focus:shadow-primary/10';
  const labelClass = 'text-sm font-medium text-foreground/90 flex items-center gap-2';

  // Field groups for organization - Updated with V2 schema fields
  const fieldGroups = {
    basic: [
      { key: 'productType', label: 'Product Type', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'name', label: 'Product Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'modelNumber', label: 'Model Number', type: 'text' },
      { key: 'sizes', label: 'Sizes', type: 'text' },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'mounting', label: 'Mounting', type: 'text' }
    ],
    technical: [
      { key: 'voltage', label: 'Voltage', type: 'text' },
      { key: 'powerW', label: 'Power (W)', type: 'text' },
      { key: 'cct', label: 'CCT (K)', type: 'text' },
      { key: 'criRa', label: 'CRI (Ra)', type: 'text' },
      { key: 'lumen', label: 'Lumen', type: 'text' },
      { key: 'efficacyLmw', label: 'Efficacy (lm/W)', type: 'text' },
      { key: 'beamAngle', label: 'Beam Angle', type: 'text' },
      { key: 'powerFactor', label: 'Power Factor', type: 'text' },
      { key: 'dimmingType', label: 'Dimming Type', type: 'text' },
      { key: 'ledType', label: 'LED Type', type: 'text' },
      { key: 'driverBrand', label: 'Driver Brand', type: 'text' },
      { key: 'emergencyBackupBattery', label: 'Emergency Backup Battery', type: 'text' },
      { key: 'pluginSensor', label: 'Plug-in Sensor', type: 'text' },
      { key: 'sensorMicrowaveBluetooth', label: 'Sensor (Microwave/Bluetooth)', type: 'text' },
      { key: 'junctionCover', label: 'Junction Cover', type: 'text' },
      { key: 'remoteControl', label: 'Remote Control', type: 'text' },
      { key: 'installationKits', label: 'Installation Kits', type: 'text' },
      { key: 'adjustmentDial', label: 'Adjustment Dial', type: 'text' },
      { key: 'ipRating', label: 'IP Rating', type: 'text' },
      { key: 'ikRating', label: 'IK Rating', type: 'text' },
      { key: 'efficacyLumenPerW', label: 'Efficacy Lumen/W', type: 'text' }
    ],
    design: [
      { key: 'materialFinish', label: 'Material Finish', type: 'text' },
      { key: 'sensorsAndControls', label: 'Sensors and Controls', type: 'text' },
      { key: 'occupancy', label: 'Occupancy', type: 'text' },
      { key: 'biLevel', label: 'Bi-level', type: 'text' },
      { key: 'pirMicrowaveBluetooth', label: 'PIR Microwave Bluetooth', type: 'text' },
      { key: 'certifications', label: 'Certifications', type: 'text' }
    ],
    media: [
      { key: 'photo', label: 'Photo URL', type: 'text' },
      { key: 'imageUrl', label: 'Image URL', type: 'text' },
      { key: 'cutSheet', label: 'Cut Sheet URL', type: 'text' }
    ],
    commercial: [
      { key: 'leadTime', label: 'Lead Time', type: 'text' },
      { key: 'warranty', label: 'Warranty', type: 'text' },
      { key: 'moq', label: 'MOQ', type: 'text' },
      { key: 'pricePc', label: 'Price per piece', type: 'number' },
      { key: 'costChinaDdpUsa', label: 'Cost China DDP USA', type: 'number' },
      { key: 'costThailandVietnam', label: 'Cost Thailand/Vietnam', type: 'number' },
      { key: 'sensorCost', label: 'Sensor Cost', type: 'number' },
      { key: 'sensorPrice', label: 'Sensor Price', type: 'number' },
      { key: 'remoteControlBluetoothCost', label: 'Remote Control/BT Cost', type: 'number' },
      { key: 'remoteControlBluetoothPrice', label: 'Remote Control/BT Price', type: 'number' },
      { key: 'pluginSensorCost', label: 'Plugin Sensor Cost', type: 'number' },
      { key: 'pluginSensorPrice', label: 'Plugin Sensor Price', type: 'number' },
      { key: 'emergencyBackupBatteryCost', label: 'Backup Battery Cost', type: 'number' },
      { key: 'emergencyBackupBatteryPrice', label: 'Backup Battery Price', type: 'number' },
      { key: 'installationKitsCost', label: 'Installation Kits Cost', type: 'number' },
      { key: 'installationKitsPrice', label: 'Installation Kits Price', type: 'number' }
    ]
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFields(new Set());
      setFieldValues({});
      setCategoryValue('');
      setPreview(null);
    }
  }, [isOpen, action]);

  const handleFieldToggle = (fieldKey) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
      // Remove value when field is deselected
      const newValues = { ...fieldValues };
      delete newValues[fieldKey];
      setFieldValues(newValues);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const handleValueChange = (fieldKey, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleSelectAllInGroup = (groupFields) => {
    const allSelected = groupFields.every(field => selectedFields.has(field.key));
    const newSelected = new Set(selectedFields);

    groupFields.forEach(field => {
      if (allSelected) {
        newSelected.delete(field.key);
        const newValues = { ...fieldValues };
        delete newValues[field.key];
        setFieldValues(newValues);
      } else {
        newSelected.add(field.key);
      }
    });

    setSelectedFields(newSelected);
  };

  const generatePreview = () => {
    if (action === 'update' && selectedFields.size === 0) return null;
    if (action === 'category' && !categoryValue) return null;

    const changes = [];

    if (action === 'update') {
      selectedFields.forEach(fieldKey => {
        const field = Object.values(fieldGroups).flat().find(f => f.key === fieldKey);
        if (field && fieldValues[fieldKey] !== undefined && fieldValues[fieldKey] !== '') {
          changes.push(`Set ${field.label} to "${fieldValues[fieldKey]}"`);
        }
      });
    } else if (action === 'category') {
      if (categoryValue) {
        changes.push(`Set category to "${categoryValue}"`);
      }
    }

    if (changes.length === 0) return null;

    return {
      changes,
      affectedCount: selectedProducts.length
    };
  };

  const handleApply = async () => {
    if (!selectedProducts || selectedProducts.length === 0) return;

    setLoading(true);
    try {
      if (action === 'update') {
        // Prepare update data with only selected fields that have values
        const updateData = {};
        selectedFields.forEach(fieldKey => {
          if (fieldValues[fieldKey] !== undefined && fieldValues[fieldKey] !== '') {
            updateData[fieldKey] = fieldValues[fieldKey];
          }
        });

        if (Object.keys(updateData).length === 0) {
          alert('Please select at least one field with a value to update.');
          return;
        }

        await onComplete(updateData);
      } else if (action === 'category') {
        if (!categoryValue) {
          alert('Please select a category.');
          return;
        }

        await onComplete(categoryValue);
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
      alert('Bulk operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update preview when selections change
  useEffect(() => {
    setPreview(generatePreview());
  }, [selectedFields, fieldValues, categoryValue, action, selectedProducts]);

  if (!selectedProducts || selectedProducts.length === 0) return null;

  const renderFieldInput = (field) => {
    if (!selectedFields.has(field.key)) return null;
    const fieldType = field.type || 'text';

    return (
      <div key={field.key} className="space-y-1.5 sm:space-y-2">
        <label className="text-xs sm:text-sm font-medium text-foreground">{field.label}</label>
        {field.type === 'select' ? (
          <Select
            value={fieldValues[field.key] || ''}
            onValueChange={(value) => handleValueChange(field.key, value)}
          >
            <SelectTrigger className={`${selectTriggerClass} w-full`}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map(option => (
                <SelectItem key={option} value={option}>
                  {option || 'Not specified'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={fieldType}
            value={fieldValues[field.key] || ''}
            onChange={(e) => handleValueChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className={inputClass}
          />
        )}
      </div>
    );
  };

  const renderFieldGroup = (title, fields) => {
    if (!fields || fields.length === 0) return null;
    const selectedInGroup = fields.filter(field => selectedFields.has(field.key)).length;
    const allSelected = fields.every(field => selectedFields.has(field.key));
    const Icon = sectionIcons[title];

    return (
      <motion.div key={title} variants={gridVariants}>
        <Card className={cardClass}>
          <CardHeader className="p-3 sm:p-4 pb-3 border-b border-border/60 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base text-gradient flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-primary" />}
                {title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {selectedInGroup}/{fields.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectAllInGroup(fields)}
                  className="transition-all hover:border-primary/40 hover:bg-primary/10"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 p-3 sm:p-4">
            {fields.map(field => (
              <div
                key={field.key}
                className="flex items-center space-x-3 rounded-md border border-border/50 bg-background/60 px-2 py-1.5 sm:px-3 sm:py-2 transition-colors hover:border-primary/40"
              >
                <input
                  type="checkbox"
                  id={field.key}
                  checked={selectedFields.has(field.key)}
                  onChange={() => handleFieldToggle(field.key)}
                  className="min-w-5 min-h-5 rounded border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <label
                  htmlFor={field.key}
                  className="text-xs sm:text-sm font-medium leading-none cursor-pointer text-foreground/90"
                >
                  {field.label}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-2 border-primary/20 shadow-2xl animate-modal-slide-up p-4 sm:p-6">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <DialogHeader className="pb-3 sm:pb-4 border-b border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-t-lg">
          <DialogTitle className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 text-gradient">
            <span className="flex items-center gap-2 capitalize text-lg sm:text-xl lg:text-2xl">
              <DialogIcon className="h-5 w-5 text-primary" />
              {action === 'update' ? 'Bulk Update Products' : 'Set Category for Products'}
            </span>
            <Badge variant="secondary" className="glass-effect-subtle border border-primary/30 text-[10px] sm:text-xs uppercase tracking-wide">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {action === 'update' ? (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Field Selection */}
            <motion.div className="space-y-3 sm:space-y-4" variants={gridVariants}>
              <h3 className="text-base sm:text-lg font-semibold text-gradient">Select Fields to Update</h3>
              <div className="space-y-3 sm:space-y-4">
                {fieldGroupOrder.map(({ title, key }) => (
                  renderFieldGroup(title, fieldGroups[key])
                ))}
              </div>
            </motion.div>

            {/* Value Input */}
            <motion.div className="space-y-3 sm:space-y-4" variants={gridVariants}>
              <h3 className="text-base sm:text-lg font-semibold text-gradient">Set Values</h3>
              <div className="space-y-3 sm:space-y-4">
                {selectedFields.size === 0 ? (
                  <div className="glass-effect-subtle rounded-lg border border-dashed border-muted-foreground/30 py-8 sm:py-10 text-center text-xs sm:text-sm text-muted-foreground">
                    Select fields on the left to set their values
                  </div>
                ) : (
                  <motion.div
                    className="space-y-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {Object.values(fieldGroups).flat().map(field => renderFieldInput(field))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Category Selection */
          <motion.div className="space-y-3 sm:space-y-4" variants={gridVariants} initial="hidden" animate="visible">
            <h3 className="text-base sm:text-lg font-semibold text-gradient">Select Category</h3>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">New Category</label>
              {availableCategories.length > 0 ? (
                <Select
                  value={categoryValue || undefined}
                  onValueChange={(value) => setCategoryValue(value)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="glass-effect-subtle rounded-md border border-dashed border-muted-foreground/30 p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">
                  No categories available. Please add categories first.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Preview */}
        {preview && (
          <>
            <Separator />
            <Card className={cardClass}>
              <CardHeader className="p-3 sm:p-4 border-b border-border/60 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
                <CardTitle className="text-sm sm:text-base text-gradient flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Preview Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    This will update {preview.affectedCount} product{preview.affectedCount !== 1 ? 's' : ''} with the following changes:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-foreground/90">
                    {preview.changes.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-2 sm:p-3 dark:border-yellow-800 dark:bg-yellow-950/20">
                    <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ This action cannot be undone. Please review the changes carefully.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <DialogFooter className="flex-col gap-2 sm:gap-3 border-t border-primary/10 pt-3 sm:pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto transition-all hover:border-primary/50 hover:shadow-md">
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading || !preview || (action === 'category' && !categoryValue)}
            variant="gradient"
            className="w-full sm:w-auto shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            {loading ? 'Applying...' : `Apply to ${selectedProducts.length} Product${selectedProducts.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
