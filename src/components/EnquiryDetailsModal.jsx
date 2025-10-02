import React, { useCallback, useEffect, useState } from 'react';
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
  Copy
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
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
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

  // Early return after all hooks are called
  if (!enquiry) return null;

  const loadTimeline = useCallback(async () => {
    if (!enquiry?.id) return;

    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const { data, error } = await getEnquiryTimeline(enquiry.id);
      if (error) throw new Error(error);
      setTimeline(data || []);
    } catch (error) {
      console.error('Error loading enquiry timeline:', error);
      setTimelineError(error.message || 'Unable to load timeline');
      toast({
        title: 'Timeline unavailable',
        description: error.message || 'Could not load the timeline for this enquiry.',
        variant: 'destructive'
      });
    } finally {
      setTimelineLoading(false);
    }
  }, [enquiry?.id, toast]);

  useEffect(() => {
    if (isOpen && enquiry?.id) {
      loadTimeline();
    }
  }, [isOpen, enquiry?.id, loadTimeline]);

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
      await loadTimeline();
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
    if (!cartItems || !Array.isArray(cartItems)) return [];

    return cartItems.map((item, index) => (
      <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
        <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <div className="font-medium">{item.productType || 'Product'}</div>
          <div className="text-sm text-muted-foreground">
            Quantity: {item.quantity || 1}
          </div>
          {item.specifications && Object.keys(item.specifications).length > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              {Object.entries(item.specifications).map(([key, value]) => (
                <div key={key} className="inline-block mr-3">
                  <span className="font-medium">{key}:</span> {value}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ));
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

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineLoading ? (
                <p className="text-sm text-muted-foreground">Loading timeline...</p>
              ) : timelineError ? (
                <p className="text-sm text-destructive">{timelineError}</p>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No updates recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((entry) => {
                    const statusMeta = STATUS_OPTIONS.find(option => option.value === entry.status);
                    return (
                      <div key={entry.id} className="flex items-start space-x-3 rounded-lg border p-3">
                        <Badge variant={statusMeta?.color || 'default'}>
                          {statusMeta?.label || entry.status}
                        </Badge>
                        <div className="flex-1 space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'PPP p')}
                          </div>
                          {entry.note && (
                            <div className="text-sm text-foreground whitespace-pre-wrap">
                              {entry.note}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Enquiry
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
