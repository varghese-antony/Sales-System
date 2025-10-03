import React, { useCallback, useEffect, useState } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Percent,
  Edit,
  Save,
  Package,
  MessageSquare,
  TrendingUp,
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

const STATUS_COLORS = {
  new: 'warning',
  contacted: 'secondary',
  quoted: 'outline',
  won: 'success',
  lost: 'destructive'
};

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost'
};

export function CustomerDetailsModal({ isOpen, onClose, customer, onDiscountUpdate, onRefresh }) {
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [newDiscount, setNewDiscount] = useState(null);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [customerEnquiries, setCustomerEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (customer) {
      setNewDiscount(customer.discount_percentage);
      setEditingDiscount(false);
    }
  }, [customer]);

  const loadCustomerEnquiries = useCallback(async () => {
    if (!customer?.id) return;

    setLoadingEnquiries(true);
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to load customer details');
      }

      const result = await response.json();
      setCustomerEnquiries(result?.enquiries || []);
    } catch (error) {
      console.error('Error loading customer enquiries:', error);
      toast({
        title: 'Failed to load enquiries',
        description: error.message || 'Unable to load customer enquiries.',
        variant: 'destructive'
      });
    } finally {
      setLoadingEnquiries(false);
    }
  }, [customer?.id, toast]);

  useEffect(() => {
    if (isOpen && customer?.id) {
      loadCustomerEnquiries();
    }
  }, [isOpen, customer?.id, loadCustomerEnquiries]);

  const handleDiscountUpdate = async () => {
    if (savingDiscount) return;

    try {
      setSavingDiscount(true);

      const discountValue = newDiscount === '' || newDiscount === null ? null : Number(newDiscount);

      if (discountValue !== null && (!Number.isFinite(discountValue) || !Number.isInteger(discountValue))) {
        toast({
          title: 'Invalid discount',
          description: 'Discount must be an integer. Positive values decrease price, negative values increase price.',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/admin/customers/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, discount: discountValue })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to update discount');
      }

      toast({
        title: 'Discount updated',
        description: 'Customer discount has been saved successfully.'
      });

      setEditingDiscount(false);
      if (onDiscountUpdate) {
        await onDiscountUpdate(customer.id, discountValue);
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Failed to update discount:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Unable to update customer discount.',
        variant: 'destructive'
      });
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleDiscountRemove = async () => {
    const confirmed = confirm('Are you sure you want to remove this customer\'s discount?');
    if (!confirmed) return;

    setNewDiscount(null);
    await handleDiscountUpdate();
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard.'
    });
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <DialogTitle className="text-lg sm:text-xl">{customer.full_name}</DialogTitle>
              <Badge variant="secondary">Customer</Badge>
            </div>
            {/* <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button> */}
          </div>
          <div className="text-sm text-muted-foreground">
            Customer ID: {customer.id.slice(0, 8)}... • Member since {format(new Date(customer.created_at), 'PPP')}
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </label>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>{customer.full_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(customer.full_name)}
                      className="h-9 w-9 sm:h-8 sm:w-8"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                  <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span>{customer.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(customer.email)}
                      className="h-9 w-9 sm:h-8 sm:w-8"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Registration Date
                  </label>
                  <div className="p-2 bg-muted/30 rounded">
                    {format(new Date(customer.created_at), 'PPP')}
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Type
                  </label>
                  <div className="p-2 bg-muted/30 rounded">
                    <Badge variant="secondary">{customer.user_type}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount Management */}
          <Card>
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Discount Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  {editingDiscount ? (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Input
                          type="number"
                          step="1"
                          value={newDiscount ?? ''}
                          onChange={(e) => setNewDiscount(e.target.value)}
                          placeholder="Enter integer percentage"
                          className="w-full sm:max-w-xs h-11"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Positive values discount the price, negative values add markup. Leave empty to remove discount.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Current Discount</p>
                      {customer.discount_percentage ? (
                        <Badge variant="success" className="mt-1">
                          {customer.discount_percentage}% Discount
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-1">
                          No discount
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {editingDiscount ? (
                    <>
                      <Button onClick={handleDiscountUpdate} size="sm" disabled={savingDiscount} className="h-11 sm:h-9 w-full sm:w-auto">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingDiscount(false);
                          setNewDiscount(customer.discount_percentage);
                        }}
                        size="sm"
                        disabled={savingDiscount}
                        className="h-11 sm:h-9 w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setEditingDiscount(true)} size="sm" className="h-11 sm:h-9 w-full sm:w-auto">
                        <Edit className="h-4 w-4 mr-2" />
                        {customer.discount_percentage ? 'Edit Discount' : 'Set Discount'}
                      </Button>
                      {customer.discount_percentage && (
                        <Button
                          variant="outline"
                          onClick={handleDiscountRemove}
                          size="sm"
                          className="h-11 sm:h-9 w-full sm:w-auto"
                        >
                          Remove
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Enquiries */}
          <Card>
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Enquiries ({customerEnquiries.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              {loadingEnquiries ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : customerEnquiries.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                  No enquiries from this customer yet.
                </p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {customerEnquiries.map((enquiry) => {
                    const statusMeta = STATUS_LABELS[enquiry.status];
                    const productTypes = enquiry.cart_items && Array.isArray(enquiry.cart_items)
                      ? [...new Set(enquiry.cart_items.map(item => item?.productType || item?.["Product Type"]).filter(Boolean))]
                      : [];

                    return (
                      <div key={enquiry.id} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg border">
                        <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs sm:text-sm">
                                {format(new Date(enquiry.created_at), 'MMM dd, yyyy')}
                              </span>
                              <Badge variant={STATUS_COLORS[enquiry.status] || 'default'} size="sm">
                                {statusMeta || enquiry.status}
                              </Badge>
                            </div>
                          </div>
                          {productTypes.length > 0 && (
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              Products: {productTypes.join(', ')}
                            </div>
                          )}
                          {enquiry.message && (
                            <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {enquiry.message}
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
          <div className="flex justify-end items-center pt-3 sm:pt-4 border-t px-4 sm:px-0">
            <Button variant="outline" onClick={onClose} className="h-11 sm:h-9 w-full sm:w-auto">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
