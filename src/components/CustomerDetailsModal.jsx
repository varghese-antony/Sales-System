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
import { getCustomerWithEnquiries, updateCustomerDiscount } from '@/lib/database/profiles';
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
      const { data, error } = await getCustomerWithEnquiries(customer.id);
      if (error) throw new Error(error);
      setCustomerEnquiries(data?.enquiries || []);
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

      const discountValue = newDiscount === '' || newDiscount === null ? null : parseFloat(newDiscount);
      
      if (discountValue !== null && (isNaN(discountValue) || discountValue < 0 || discountValue > 100)) {
        toast({
          title: 'Invalid discount',
          description: 'Discount must be between 0 and 100.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await updateCustomerDiscount(customer.id, discountValue);
      if (error) throw new Error(error);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl">{customer.full_name}</DialogTitle>
              <Badge variant="secondary">Customer</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Customer ID: {customer.id.slice(0, 8)}... • Member since {format(new Date(customer.created_at), 'PPP')}
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
                    <span>{customer.full_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(customer.full_name)}
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
                    <span>{customer.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(customer.email)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Registration Date
                  </label>
                  <div className="p-2 bg-muted/30 rounded">
                    {format(new Date(customer.created_at), 'PPP')}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Discount Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  {editingDiscount ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={newDiscount || ''}
                          onChange={(e) => setNewDiscount(e.target.value)}
                          placeholder="Enter discount percentage"
                          className="max-w-xs"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter a value between 0 and 100, or leave empty to remove discount
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">Current Discount</p>
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
                <div className="flex space-x-2">
                  {editingDiscount ? (
                    <>
                      <Button onClick={handleDiscountUpdate} size="sm" disabled={savingDiscount}>
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
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setEditingDiscount(true)} size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        {customer.discount_percentage ? 'Edit Discount' : 'Set Discount'}
                      </Button>
                      {customer.discount_percentage && (
                        <Button
                          variant="outline"
                          onClick={handleDiscountRemove}
                          size="sm"
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Enquiries ({customerEnquiries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEnquiries ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : customerEnquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No enquiries from this customer yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {customerEnquiries.map((enquiry) => {
                    const statusMeta = STATUS_LABELS[enquiry.status];
                    const productTypes = enquiry.cart_items && Array.isArray(enquiry.cart_items)
                      ? [...new Set(enquiry.cart_items.map(item => item?.productType || item?.["Product Type"]).filter(Boolean))]
                      : [];

                    return (
                      <div key={enquiry.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg border">
                        <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {format(new Date(enquiry.created_at), 'MMM dd, yyyy')}
                              </span>
                              <Badge variant={STATUS_COLORS[enquiry.status] || 'default'} size="sm">
                                {statusMeta || enquiry.status}
                              </Badge>
                            </div>
                          </div>
                          {productTypes.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Products: {productTypes.join(', ')}
                            </div>
                          )}
                          {enquiry.message && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
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
          <div className="flex justify-end items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
