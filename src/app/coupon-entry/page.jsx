"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCoupon } from '@/contexts/CouponContext';
import { Trash2, Plus, Percent } from 'lucide-react';

export default function CouponEntryPage() {
  const { coupons, loading, error, createCoupon, deleteCoupon } = useCoupon();
  const [newCoupon, setNewCoupon] = useState({
    coupon_code: '',
    change: '',
    expiry: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await createCoupon(newCoupon);
      if (result.success) {
        setMessage('Coupon created successfully!');
        setNewCoupon({ coupon_code: '', change: '', expiry: '' });
      } else {
        setMessage(`Failed to create coupon: ${result.error}`);
      }
    } catch (err) {
      setMessage(`Error creating coupon: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const result = await deleteCoupon(couponId);
      if (result.success) {
        setMessage('Coupon deleted successfully!');
      } else {
        setMessage(`Failed to delete coupon: ${result.error}`);
      }
    } catch (err) {
      setMessage(`Error deleting coupon: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiryDate) => {
    return new Date() > new Date(expiryDate);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
            <Percent className="w-8 h-8 text-primary" />
            Coupon Code Management
          </CardTitle>
          <p className="text-muted-foreground text-center">
            Create and manage discount coupons for your lighting products
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Coupon Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Coupon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="coupon_code" className="text-sm font-medium">
                      Coupon Code
                    </label>
                    <Input
                      id="coupon_code"
                      value={newCoupon.coupon_code}
                      onChange={(e) => setNewCoupon({...newCoupon, coupon_code: e.target.value.toUpperCase()})}
                      placeholder="e.g., SAVE10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="change" className="text-sm font-medium">
                      Discount/Change (%)
                    </label>
                    <Input
                      id="change"
                      type="number"
                      step="0.01"
                      value={newCoupon.change}
                      onChange={(e) => setNewCoupon({...newCoupon, change: e.target.value})}
                      placeholder="e.g., -10 for 10% off, +5 for 5% increase"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Use negative values for discounts (e.g., -10 = 10% off), positive for price increases
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="expiry" className="text-sm font-medium">
                      Expiry Date
                    </label>
                    <Input
                      id="expiry"
                      type="date"
                      value={newCoupon.expiry}
                      onChange={(e) => setNewCoupon({...newCoupon, expiry: e.target.value})}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Coupon'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Coupon List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Coupons ({coupons.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {coupons.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No coupons available. Create your first coupon above.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={isExpired(coupon.expiry) ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {coupon.coupon_code}
                            </Badge>
                            {isExpired(coupon.expiry) && (
                              <Badge variant="outline" className="text-xs">
                                Expired
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">
                              {coupon.change > 0 ? '+' : ''}{coupon.change}%
                            </span>
                            {' • '}
                            Expires: {formatDate(coupon.expiry)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {message && (
        <Card>
          <CardContent className="pt-6">
            <p className={`text-sm text-center ${
              message.includes('successfully') ? 'text-green-600' :
              message.includes('Failed') ? 'text-red-600' : 'text-blue-600'
            }`}>
              {message}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-center text-red-600">
              Error loading coupons: {error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
