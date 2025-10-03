"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Edit,
  Eye,
  Percent,
  Award,
  Calendar,
  UserCheck,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading';
import { CustomerDetailsModal } from '@/components/CustomerDetailsModal';
import { updateCustomerDiscount } from '@/lib/database/profiles';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [discountFilter, setDiscountFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [tempDiscount, setTempDiscount] = useState('');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (discountFilter === 'with-discount') params.append('hasDiscount', 'true');
      if (discountFilter === 'no-discount') params.append('hasDiscount', 'false');
      params.append('sortOrder', sortOrder);

      const response = await fetch(`/api/admin/customers?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customers');
      }

      const result = await response.json();

      setCustomers(result.customers || []);
      setStats(result.stats);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Failed to load customers',
        description: error?.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, discountFilter, sortBy, sortOrder, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleEditDiscount = (customer) => {
    setEditingDiscountId(customer.id);
    setTempDiscount(customer.discount_percentage || '');
  };

  const handleSaveDiscount = async (customerId) => {
    try {
      const discountValue = tempDiscount === '' ? null : Number(tempDiscount);

      if (discountValue !== null && (!Number.isFinite(discountValue) || !Number.isInteger(discountValue))) {
        toast({
          title: 'Invalid discount',
          description: 'Discount must be an integer. Positive values discount the price, negative values add markup.',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/admin/customers/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, discount: discountValue })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update discount');
      }

      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, discount_percentage: discountValue }
          : customer
      ));

      const statsResponse = await fetch('/api/admin/customers');
      if (statsResponse.ok) {
        const result = await statsResponse.json();
        setStats(result.stats);
      }

      toast({
        title: 'Discount updated',
        description: 'Customer discount has been saved successfully.'
      });

      setEditingDiscountId(null);
      setTempDiscount('');
    } catch (error) {
      console.error('Error updating discount:', error);
      toast({
        title: 'Update failed',
        description: error?.message || 'Unable to update customer discount.',
        variant: 'destructive'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingDiscountId(null);
    setTempDiscount('');
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const handleDiscountUpdate = async (customerId, newDiscount) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, discount_percentage: newDiscount }
        : customer
    ));

    const response = await fetch('/api/admin/customers');
    if (response.ok) {
      const result = await response.json();
      setStats(result.stats);
    }
  };

  const columns = useMemo(() => ([
    {
      key: 'created_at',
      label: 'Registration Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'full_name',
      label: 'Customer Name',
      sortable: true,
      render: (value) => <div className="font-medium">{value}</div>
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => <div className="text-sm">{value}</div>
    },
    {
      key: 'discount_percentage',
      label: 'Discount',
      sortable: true,
      render: (value, row) => {
        if (editingDiscountId === row.id) {
          return (
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                step="1"
                value={tempDiscount}
                onChange={(e) => setTempDiscount(e.target.value)}
                className="w-28 h-11"
                placeholder="Enter integer"
              />
              <span className="text-sm">%</span>
              <Button
                variant="ghost"
                onClick={() => handleSaveDiscount(row.id)}
                className="h-11 w-11 sm:h-9 sm:w-9 p-0"
              >
                <Save className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-11 w-11 sm:h-9 sm:w-9 p-0"
              >
                <X className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          );
        }

        return value ? (
          <Badge variant="success">{value}%</Badge>
        ) : (
          <Badge variant="outline">No discount</Badge>
        );
      }
    },
    {
      key: 'enquiry_count',
      label: 'Enquiries',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">{value || 0}</Badge>
      )
    }
  ]), [editingDiscountId, tempDiscount]);

  const actions = useMemo(() => ([
    {
      label: 'View Details',
      icon: Eye,
      onClick: handleViewDetails
    },
    {
      label: 'Edit Discount',
      icon: Edit,
      onClick: handleEditDiscount
    }
  ]), []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20">
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading customer management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20 relative">
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="customer-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#customer-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl relative z-10 space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Header */}
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Manage Customers
                </CardTitle>
                <p className="text-muted-foreground">View and manage customer accounts, discounts, and enquiries</p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="h-11 sm:h-9 w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Customers</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats?.totalCustomers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Customers with Discounts</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats?.customersWithDiscount || 0}</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Discount</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats?.averageDiscount || 0}%</p>
                </div>
                <Percent className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Recent Registrations</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats?.recentRegistrations || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-border/50">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4 items-stretch">
              <div className="flex flex-col gap-3 w-full">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <Select value={discountFilter} onValueChange={setDiscountFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by discount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="with-discount">With Discount</SelectItem>
                    <SelectItem value="no-discount">No Discount</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Registration Date</SelectItem>
                    <SelectItem value="full_name">Name</SelectItem>
                    <SelectItem value="discount_percentage">Discount</SelectItem>
                    <SelectItem value="enquiry_count">Enquiries</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="h-11 sm:h-9 w-full sm:w-auto"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border border-border/50">
          <CardHeader className="p-4 sm:p-5 lg:p-6">
            <CardTitle className="text-base sm:text-lg">Customer List</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <DataTable
              data={customers}
              columns={columns}
              actions={actions}
              loading={false}
              emptyMessage="No customers found matching your criteria"
              pageSize={10}
            />
          </CardContent>
        </Card>

        <CustomerDetailsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          customer={selectedCustomer}
          onDiscountUpdate={handleDiscountUpdate}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
