/*
 * TEMPORARILY DISABLED COUPON ENTRY PAGE
 *
 * This file contains the complete coupon management page including:
 * - Coupon creation form with code, discount percentage, and expiry date
 * - Coupon listing with active/inactive status and delete functionality
 * - Full UI with cards, badges, and responsive design
 *
 * To restore coupon functionality, uncomment the entire block below.
 * All imports, state management, form handling, and UI rendering are preserved.
 */

/*
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCoupon } from '@/contexts/CouponContext';
import { Trash2, Plus, Percent } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';

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

/*
 * TEMPORARILY DISABLED COUPON ENTRY PAGE
 *
 * This file contains the complete coupon management page including:
 * - Coupon creation form with code, discount percentage, and expiry date
 * - Coupon listing with active/inactive status and delete functionality
 * - Full UI with cards, badges, and responsive design
 *
 * To restore coupon functionality, uncomment the entire block below.
 * All imports, state management, form handling, and UI rendering are preserved.
 */

/*
"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCoupon } from '@/contexts/CouponContext';
import { Trash2, Plus, Percent } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';

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
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/50 via-teal-50/30 to-emerald-50/50 dark:from-green-950/20 dark:via-teal-950/10 dark:to-emerald-950/20'>
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-teal-50/30 to-emerald-50/50 dark:from-green-950/20 dark:via-teal-950/10 dark:to-emerald-950/20 relative">
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="coupon-entry-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#coupon-entry-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-4 max-w-4xl relative z-10">
        <Card className="mb-6 border border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3 text-foreground">
              <Percent className="w-8 h-8 text-primary" />
              Coupon Code Management
            </CardTitle>
            <p className="text-muted-foreground text-center">
              Create and manage discount coupons for your lighting products
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Plus className="w-5 h-5" />
                    Create New Coupon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="coupon_code" className="text-sm font-medium text-foreground">
                        Coupon Code
                      </label>
                      <Input
                        id="coupon_code"
                        value={newCoupon.coupon_code}
                        onChange={(e) => setNewCoupon({...newCoupon, coupon_code: e.target.value.toUpperCase()})}
                        placeholder="e.g., SAVE10"
                        className="bg-background border-border"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="change" className="text-sm font-medium text-foreground">
                        Discount/Change (%)
                      </label>
                      <Input
                        id="change"
                        type="number"
                        step="0.01"
                        value={newCoupon.change}
                        onChange={(e) => setNewCoupon({...newCoupon, change: e.target.value})}
                        placeholder="e.g., -10 for 10% off, +5 for 5% increase"
                        className="bg-background border-border"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Use negative values for discounts (e.g., -10 = 10% off), positive for price increases
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="expiry" className="text-sm font-medium text-foreground">
                        Expiry Date
                      </label>
                      <Input
                        id="expiry"
                        type="date"
                        value={newCoupon.expiry}
                        onChange={(e) => setNewCoupon({...newCoupon, expiry: e.target.value})}
                        className="bg-background border-border"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Coupon'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Active Coupons ({coupons.length})</CardTitle>
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
                          className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
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
                                <Badge variant="outline" className="text-xs border-destructive text-destructive">
                                  Expired
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">
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
          <Card className="border border-border/50">
            <CardContent className="pt-6">
              <p className={`text-sm text-center ${
                message.includes('successfully') ? 'text-green-600 dark:text-green-400' :
                message.includes('Failed') ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {message}
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-center text-red-600 dark:text-red-400">
                Error loading coupons: {error}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
*/

// Placeholder component for disabled coupon functionality
export default function CouponEntryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-teal-50/30 to-emerald-50/50 dark:from-green-950/20 dark:via-teal-950/10 dark:to-emerald-950/20 relative">
      <div className="container mx-auto p-4 max-w-4xl relative z-10">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Coupon Management</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Coupon functionality is temporarily disabled. The complete coupon management system
                is preserved in the commented code above and can be restored when needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
