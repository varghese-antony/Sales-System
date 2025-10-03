import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Copy,
  Eye,
  Info,
  Settings,
  Tag,
  Calendar,
  Hash,
  Layers,
  Palette,
  Zap,
  Lightbulb,
  Database,
  Shield,
  Clock,
  Truck,
  DollarSign,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Badge
} from 'lucide-react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Dialog } from '@radix-ui/react-dialog';

const SPEC_FIELD_CONFIG = [
  { label: 'Size', keys: ['Size', 'size', 'sizes'], icon: Layers, category: 'physical' },
  { label: 'Power (W)', keys: ['Power (W)', 'power_w', 'power', 'powerW'], icon: Zap, category: 'electrical' },
  { label: 'Voltage', keys: ['Voltage', 'voltage'], icon: Zap, category: 'electrical' },
  { label: 'CCT', keys: ['CCT', 'cct'], icon: Palette, category: 'optical' },
  { label: 'CRI (Ra)', keys: ['CRI (Ra)', 'cri_ra', 'cri', 'criRa'], icon: Lightbulb, category: 'optical' },
  { label: 'Lumen', keys: ['Lumen', 'lumen'], icon: Lightbulb, category: 'optical' },
  { label: 'Beam Angle', keys: ['Beam Angle', 'beam_angle', 'beamAngle'], icon: Settings, category: 'optical' },
  { label: 'Power Factor', keys: ['Power Factor', 'power_factor', 'powerFactor'], icon: Zap, category: 'electrical' },
  { label: 'Material Finish', keys: ['Material Finish', 'material_finish', 'materialFinish'], icon: Palette, category: 'physical' },
  { label: 'Mounting', keys: ['Mounting', 'mounting'], icon: Settings, category: 'installation' },
  { label: 'Driver Brand', keys: ['Driver Brand', 'driver_brand', 'driverBrand'], icon: Database, category: 'components' },
  { label: 'LED Type', keys: ['LED Type', 'led_type', 'ledType'], icon: Lightbulb, category: 'components' },
  { label: 'Dimming Type', keys: ['Dimming Type', 'dimming_type', 'dimmingType'], icon: Settings, category: 'control' },
  { label: 'Sensor / Controls', keys: ['Sensor / Controls', 'sensor', 'sensor_controls', 'sensor_microwave_bluetooth', 'sensorMicrowaveBluetooth'], icon: Settings, category: 'control' },
  { label: 'Emergency Backup Battery', keys: ['Emergency Backup Battery', 'emergency_backup_battery', 'emergencyBackupBattery'], icon: Shield, category: 'safety' },
  { label: 'Plug-in Sensor', keys: ['Plug-in Sensor', 'plugin_sensor', 'pluginSensor'], icon: Settings, category: 'control' },
  { label: 'Adjustment Dial', keys: ['Adjustment Dial', 'adjustment_dial', 'adjustmentDial'], icon: Settings, category: 'control' },
  { label: 'Certifications', keys: ['Certifications', 'certifications'], icon: Shield, category: 'compliance' },
  { label: 'IP Rating', keys: ['IP Rating', 'ip_rating', 'ipRating'], icon: Shield, category: 'protection' },
  { label: 'IK Rating', keys: ['IK Rating', 'ik_rating', 'ikRating'], icon: Shield, category: 'protection' },
  { label: 'Warranty', keys: ['Warranty', 'warranty'], icon: Shield, category: 'warranty' },
  { label: 'Lead Time', keys: ['Lead Time', 'lead_time', 'leadTime'], icon: Clock, category: 'logistics' }
];

const CATEGORY_ICONS = {
  physical: Layers,
  electrical: Zap,
  optical: Lightbulb,
  installation: Settings,
  components: Database,
  control: Settings,
  safety: Shield,
  compliance: CheckCircle,
  protection: Shield,
  warranty: Shield,
  logistics: Truck,
  general: Info
};

export function ProductDetailsModal({ isOpen, onClose, productData, cartItem }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!productData && !cartItem) return null;

  // Extract product information from either productData or cartItem
  const product = productData || cartItem?.product || cartItem || {};
  const itemSpecs = cartItem?.specifications || {};
  const productSpecs = product.specifications || {};

  // Merge all sources for comprehensive data
  const allSources = [
    itemSpecs,
    productSpecs,
    cartItem,
    product
  ];

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const normalizeValue = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(', ');
    }

    if (value && typeof value === 'object') {
      const values = Object.values(value).filter(Boolean);
      return values.join(', ');
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? String(value) : '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    return String(value ?? '');
  };

  const formatLabel = (label) => {
    if (!label) return '';
    const labelStr = String(label);
    return labelStr
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const findValue = (sources, keys = []) => {
    for (const key of keys) {
      for (const source of sources) {
        if (!source) continue;

        if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
          const formatted = normalizeValue(source[key]);
          if (formatted) return formatted;
        }

        if (typeof key === 'string') {
          const lowerKey = key.toLowerCase();
          if (lowerKey && source[lowerKey] !== undefined && source[lowerKey] !== null && source[lowerKey] !== '') {
            const formatted = normalizeValue(source[lowerKey]);
            if (formatted) return formatted;
          }
        }
      }
    }

    return null;
  };

  // Get product type
  const productType =
    cartItem?.producttype ||
    cartItem?.productType ||
    product.producttype ||
    product.productType ||
    'Product';

  // Get product name
  const productName =
    product.name ||
    product.ProductName ||
    cartItem?.name ||
    cartItem?.product_name ||
    'Unnamed Product';

  // Get model number
  const modelNumber =
    cartItem?.model_number ||
    cartItem?.modelNumber ||
    product.model_number ||
    product.modelNumber ||
    null;

  // Get quantity
  const quantity = Number(cartItem?.quantity ?? cartItem?.qty ?? 1) || 1;

  // Get table/category
  const tableRaw =
    cartItem?.table ||
    product.table ||
    (product.Indoor ? 'indoor' : null) ||
    (product.Outdoor ? 'outdoor' : null);
  const table = typeof tableRaw === 'string' ? tableRaw.toLowerCase() : tableRaw;

  // Get product ID
  const productId =
    cartItem?.productId ??
    cartItem?.product_id ??
    cartItem?.id ??
    product.id ??
    product.ID ??
    null;

  // Get description
  const description = product.description || '';

  // Get creation/update dates
  const createdAt = product.created_at || product.CreatedAt || null;
  const updatedAt = product.updated_at || product.UpdatedAt || createdAt;

  // Collect all specifications
  const allSpecs = {};
  const specCategories = {};

  SPEC_FIELD_CONFIG.forEach(({ label, keys, category = 'general' }) => {
    const value = findValue(allSources, keys);
    if (value) {
      allSpecs[label] = value;
      if (!specCategories[category]) {
        specCategories[category] = [];
      }
      specCategories[category].push({ label, value, icon: CATEGORY_ICONS[category] });
    }
  });

  // Add any additional specifications not covered by the config
  const additionalSpecs = {};

  if (cartItem?.selectedOptions && typeof cartItem.selectedOptions === 'object') {
    Object.entries(cartItem.selectedOptions).forEach(([rawLabel, rawValue]) => {
      if (!rawValue) return;
      const label = formatLabel(rawLabel);
      if (allSpecs[label]) return; // Skip if already captured
      const value = normalizeValue(rawValue);
      if (value) {
        additionalSpecs[label] = value;
      }
    });
  }

  if (itemSpecs && typeof itemSpecs === 'object') {
    Object.entries(itemSpecs).forEach(([rawLabel, rawValue]) => {
      if (!rawValue) return;
      const label = formatLabel(rawLabel);
      if (allSpecs[label]) return; // Skip if already captured
      const value = normalizeValue(rawValue);
      if (value) {
        additionalSpecs[label] = value;
      }
    });
  }

  if (productSpecs && typeof productSpecs === 'object') {
    Object.entries(productSpecs).forEach(([rawLabel, rawValue]) => {
      if (!rawValue) return;
      const label = formatLabel(rawLabel);
      if (allSpecs[label]) return; // Skip if already captured
      const value = normalizeValue(rawValue);
      if (value) {
        additionalSpecs[label] = value;
      }
    });
  }

  const formatProductId = (id) => {
    if (!id) return 'N/A';
    const idStr = String(id);
    return `${idStr.slice(0, 8)}${idStr.length > 8 ? '...' : ''}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'PPP p');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Package className="h-6 w-6" />
                {productName}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  ID: {formatProductId(productId)}
                </Badge>
                {modelNumber && (
                  <Badge variant="outline" className="font-mono text-xs">
                    Model: {modelNumber}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs uppercase tracking-wide">
                  {productType}
                </Badge>
                {table && (
                  <Badge variant="outline" className="text-xs uppercase tracking-wide">
                    {formatLabel(table)}
                  </Badge>
                )}
              </div>
              {cartItem && (
                <Badge variant="default" className="text-xs">
                  Quantity: {quantity}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6">
            {/* Description */}
            {description && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Product ID
                    </label>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-mono text-sm">{productId || 'N/A'}</span>
                      {productId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(String(productId), 'productId')}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className={`h-3 w-3 ${copiedField === 'productId' ? 'text-green-500' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Model Number
                    </label>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-mono text-sm">{modelNumber || 'N/A'}</span>
                      {modelNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(modelNumber, 'modelNumber')}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className={`h-3 w-3 ${copiedField === 'modelNumber' ? 'text-green-500' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Product Type
                    </label>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">{productType}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(productType, 'productType')}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className={`h-3 w-3 ${copiedField === 'productType' ? 'text-green-500' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Category
                    </label>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">{formatLabel(table) || 'N/A'}</span>
                      {table && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(table, 'table')}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className={`h-3 w-3 ${copiedField === 'table' ? 'text-green-500' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {createdAt && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created
                      </label>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">{formatDate(createdAt)}</span>
                      </div>
                    </div>
                  )}

                  {updatedAt && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Last Updated
                      </label>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">{formatDate(updatedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Specifications by Category */}
            {Object.keys(specCategories).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(specCategories).map(([category, specs]) => {
                    const IconComponent = CATEGORY_ICONS[category] || Info;
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            {formatLabel(category)}
                          </h4>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {specs.map(({ label, value, icon: SpecIcon }) => (
                            <div key={`${label}-${value}`} className="space-y-2">
                              <label className="text-sm font-medium flex items-center gap-2">
                                {SpecIcon && <SpecIcon className="h-3 w-3" />}
                                {label}
                              </label>
                              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <span className="text-sm font-medium">{value}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(value, `${label}-${value}`)}
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy className={`h-3 w-3 ${copiedField === `${label}-${value}` ? 'text-green-500' : ''}`} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Additional Specifications */}
            {Object.keys(additionalSpecs).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Additional Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(additionalSpecs).map(([label, value]) => (
                      <div key={`${label}-${value}`} className="space-y-2">
                        <label className="text-sm font-medium">{label}</label>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm font-medium">{value}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(value, `additional-${label}`)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className={`h-3 w-3 ${copiedField === `additional-${label}` ? 'text-green-500' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Data (for debugging/advanced users) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Raw Product Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    View raw product data (for technical reference)
                  </summary>
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify({ product, cartItem }, null, 2)}
                    </pre>
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 pt-0 border-t">
          <div className="text-xs text-muted-foreground">
            {Object.keys(allSpecs).length + Object.keys(additionalSpecs).length} specifications shown
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
