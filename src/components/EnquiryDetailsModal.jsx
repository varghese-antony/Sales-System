import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  MessageSquare,
  Calendar,
  Package,
  Truck,
  Clock,
  Edit,
  Trash2,
  Download,
  Copy,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { formatEnquiryForExport, exportEnquiriesCustom } from '@/lib/utils/export';
import { useToast } from '@/contexts/ToastContext';
import { ProductLink } from '@/components/ui/product-link';
import { addEnquiryNote } from '@/lib/database/enquiries';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'warning' },
  { value: 'contacted', label: 'Contacted', color: 'secondary' },
  { value: 'quoted', label: 'Quoted', color: 'outline' },
  { value: 'won', label: 'Won', color: 'success' },
  { value: 'lost', label: 'Lost', color: 'destructive' }
];

export function EnquiryDetailsModal({ isOpen, onClose, enquiry, onStatusUpdate, onDelete }) {
  // All hooks must be called before any conditional logic
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(enquiry?.status || 'new');
  const [notes, setNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const { toast } = useToast();

  // Move useEffect here, before any early returns
  useEffect(() => {
    if (enquiry) {
      setNewStatus(enquiry?.status || 'new');
      setNotes('');
      setEditingStatus(false);
    }
  }, [enquiry?.status, enquiry?.id]);

  if (!enquiry) return null;

  const handleStatusUpdate = async () => {
    if (!onStatusUpdate || savingStatus) return;

    try {
      setSavingStatus(true);

      const updateResult = await onStatusUpdate(enquiry.id, newStatus, { suppressToast: true });
      if (updateResult?.error) {
        throw new Error(updateResult.error);
      }

      const noteResult = await addEnquiryNote(enquiry.id, newStatus, notes);
      if (noteResult.error) {
        throw new Error(noteResult.error);
      }

      toast({
        title: 'Status updated',
        description: 'The enquiry status and notes have been saved successfully.'
      });

      setEditingStatus(false);
      setNotes('');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Status update failed',
        description: error.message || 'Unable to update enquiry status.',
        variant: 'destructive'
      });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = confirm('Are you sure you want to delete this enquiry?');
    if (!confirmed) return;

    try {
      const result = await onDelete(enquiry.id, { suppressToast: true });
      if (result?.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Enquiry deleted',
        description: `Enquiry #${enquiry.id} has been removed.`,
        variant: 'success'
      });
      onClose();
    } catch (error) {
      console.error('Failed to delete enquiry:', error);
      toast({
        title: 'Deletion failed',
        description: error.message || 'Unable to delete enquiry.',
        variant: 'destructive'
      });
    }
  };

  const handleExport = () => {
    try {
      const formattedEnquiry = formatEnquiryForExport(enquiry);
      const result = exportEnquiriesCustom([enquiry], null, `enquiry-${enquiry.id}.csv`);

      if (result.success) {
        toast({
          title: 'Export successful',
          description: `Enquiry #${enquiry.id} has been exported successfully.`
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to export enquiry:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'Unable to export enquiry.',
        variant: 'destructive'
      });
    }
  };

  const formatCartItems = (cartItems) => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return [];

    const SPEC_FIELD_CONFIG = [
      { label: 'Size', keys: ['Size', 'size', 'sizes'] },
      { label: 'Power (W)', keys: ['Power (W)', 'power_w', 'power', 'powerW'] },
      { label: 'Voltage', keys: ['Voltage', 'voltage'] },
      { label: 'CCT', keys: ['CCT', 'cct'] },
      { label: 'CRI (Ra)', keys: ['CRI (Ra)', 'cri_ra', 'cri', 'criRa'] },
      { label: 'Lumen', keys: ['Lumen', 'lumen'] },
      { label: 'Beam Angle', keys: ['Beam Angle', 'beam_angle', 'beamAngle'] },
      { label: 'Power Factor', keys: ['Power Factor', 'power_factor', 'powerFactor'] },
      { label: 'Material Finish', keys: ['Material Finish', 'material_finish', 'materialFinish'] },
      { label: 'Mounting', keys: ['Mounting', 'mounting'] },
      { label: 'Driver Brand', keys: ['Driver Brand', 'driver_brand', 'driverBrand'] },
      { label: 'LED Type', keys: ['LED Type', 'led_type', 'ledType'] },
      { label: 'Dimming Type', keys: ['Dimming Type', 'dimming_type', 'dimmingType'] },
      { label: 'Sensor / Controls', keys: ['Sensor / Controls', 'sensor', 'sensor_controls', 'sensor_microwave_bluetooth', 'sensorMicrowaveBluetooth'] },
      { label: 'Emergency Backup Battery', keys: ['Emergency Backup Battery', 'emergency_backup_battery', 'emergencyBackupBattery'] },
      { label: 'Plug-in Sensor', keys: ['Plug-in Sensor', 'plugin_sensor', 'pluginSensor'] },
      { label: 'Adjustment Dial', keys: ['Adjustment Dial', 'adjustment_dial', 'adjustmentDial'] },
      { label: 'Certifications', keys: ['Certifications', 'certifications'] },
      { label: 'IP Rating', keys: ['IP Rating', 'ip_rating', 'ipRating'] },
      { label: 'IK Rating', keys: ['IK Rating', 'ik_rating', 'ikRating'] },
      { label: 'Warranty', keys: ['Warranty', 'warranty'] },
      { label: 'Lead Time', keys: ['Lead Time', 'lead_time', 'leadTime'] }
    ];

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
        return Number.isFinite(value) ? value.toString() : '';
      }

      if (typeof value === 'string') {
        return value.trim();
      }

      return value ?? '';
    };

    const formatLabel = (label) => {
      if (!label) return '';
      return label
        .toString()
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

    return cartItems.map((item = {}, index) => {
      const product = item.product || item || {};
      const sources = [
        item.specifications,
        product.specifications,
        item,
        product
      ];

      const productType =
        item.producttype ||
        item.productType ||
        product.producttype ||
        product.productType ||
        'Product';

      const productName =
        product.name ||
        product.ProductName ||
        item.name ||
        item.product_name ||
        null;

      const modelNumber =
        item.model_number ||
        item.modelNumber ||
        product.model_number ||
        product.modelNumber ||
        null;

      const quantity = Number(item.quantity ?? item.qty ?? 1) || 1;

      const tableRaw =
        item.table ||
        product.table ||
        (product.Indoor ? 'indoor' : null) ||
        (product.Outdoor ? 'outdoor' : null);
      const table = typeof tableRaw === 'string' ? tableRaw.toLowerCase() : tableRaw;

      const productId =
        item.productId ??
        item.product_id ??
        item.id ??
        product.id ??
        product.ID ??
        null;

      const specEntries = [];
      const usedLabels = new Set();

      SPEC_FIELD_CONFIG.forEach(({ label, keys }) => {
        const value = findValue(sources, keys);
        if (value) {
          usedLabels.add(label);
          specEntries.push({ label, value });
        }
      });

      if (item.selectedOptions && typeof item.selectedOptions === 'object') {
        Object.entries(item.selectedOptions).forEach(([rawLabel, rawValue]) => {
          if (!rawValue) return;
          const label = formatLabel(rawLabel);
          if (usedLabels.has(label)) return;
          const value = normalizeValue(rawValue);
          if (!value) return;
          usedLabels.add(label);
          specEntries.push({ label, value });
        });
      }

      if (item.specifications && typeof item.specifications === 'object') {
        Object.entries(item.specifications).forEach(([rawLabel, rawValue]) => {
          if (!rawValue) return;
          const label = formatLabel(rawLabel);
          if (usedLabels.has(label)) return;
          const value = normalizeValue(rawValue);
          if (!value) return;
          usedLabels.add(label);
          specEntries.push({ label, value });
        });
      }

      if (product.specifications && typeof product.specifications === 'object') {
        Object.entries(product.specifications).forEach(([rawLabel, rawValue]) => {
          if (!rawValue) return;
          const label = formatLabel(rawLabel);
          if (usedLabels.has(label)) return;
          const value = normalizeValue(rawValue);
          if (!value) return;
          usedLabels.add(label);
          specEntries.push({ label, value });
        });
      }

      const hasProductLink = Boolean(table && productType && productId);

      return (
        <div
          key={`${productId || index}-${table || 'unknown'}`}
          className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">
                    {productName || productType}
                  </p>
                  {modelNumber && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {modelNumber}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{productType}</span>
                  {table && (
                    <Badge variant="outline" className="text-xs uppercase tracking-wide">
                      {formatLabel(table)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Qty: {quantity}
              </Badge>
              {hasProductLink ? (
                <ProductLink
                  table={table}
                  productType={productType}
                  productId={productId}
                  modelNumber={modelNumber}
                  size="sm"
                  className="text-xs"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Product
                  </span>
                </ProductLink>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Product link unavailable
                </Badge>
              )}
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          )}

          {specEntries.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {specEntries.map(({ label, value }) => (
                <div
                  key={`${label}-${value}`}
                  className="rounded-md border border-border/40 bg-background px-3 py-2"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>
          )}

          {!hasProductLink && (
            <p className="text-xs text-destructive">
              Product reference missing. This item may have been deleted.
            </p>
          )}
        </div>
      );
    });
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === enquiry.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl">Enquiry Details</DialogTitle>
              <Badge variant={currentStatus?.color || 'default'}>
                {currentStatus?.label || enquiry.status}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Enquiry #{enquiry.id} • Created {format(new Date(enquiry.created_at), 'PPP')}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </label>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>{enquiry.customer_name || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(enquiry.customer_name)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>{enquiry.email || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(enquiry.email)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>{enquiry.phone || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(enquiry.phone)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company
                  </label>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>{enquiry.company || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(enquiry.company)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {enquiry.address && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </label>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>{enquiry.address}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(enquiry.address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Enquiry Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {enquiry.message && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <div className="p-3 bg-muted/30 rounded-lg whitespace-pre-wrap">
                    {enquiry.message}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Method
                  </label>
                  <div className="p-2 bg-muted/30 rounded">
                    {enquiry.delivery_method ? (
                      <Badge variant="outline">
                        {enquiry.delivery_method === 'air' ? 'Air Shipping (30 days)' :
                         enquiry.delivery_method === 'boat' ? 'Boat Shipping (35 days)' :
                         enquiry.delivery_method}
                      </Badge>
                    ) : 'N/A'}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last Updated
                  </label>
                  <div className="p-2 bg-muted/30 rounded">
                    {format(new Date(enquiry.updated_at || enquiry.created_at), 'PPP p')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          {enquiry.cart_items && enquiry.cart_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({enquiry.cart_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formatCartItems(enquiry.cart_items)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Update Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Status Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  {editingStatus ? (
                    <div className="space-y-3">
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Add notes about this status change..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <Badge variant={currentStatus?.color || 'default'} className="mt-1">
                        {currentStatus?.label || enquiry.status}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {editingStatus ? (
                    <>
                      <Button onClick={handleStatusUpdate} size="sm" disabled={savingStatus}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingStatus(false);
                          setNewStatus(enquiry.status);
                          setNotes('');
                        }}
                        size="sm"
                        disabled={savingStatus}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditingStatus(true)} size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
