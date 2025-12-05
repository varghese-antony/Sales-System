"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading';
import { EnquiryDetailsModal } from '@/components/EnquiryDetailsModal';
import {
  getAllEnquiries,
  getEnquiryStats,
  updateEnquiryStatus,
  deleteEnquiry
} from '@/lib/database/enquiries';
import { exportEnquiries } from '@/lib/utils/export';
import { useToast } from '@/contexts/ToastContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays } from 'date-fns';

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

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function EnquiryManagementPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const statsRange = useMemo(() => {
    if (dateRange === 'all') {
      return { startDate: undefined, endDate: undefined };
    }

    const days = parseInt(dateRange, 10);
    const end = new Date();
    const start = subDays(end, days);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, [dateRange]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (searchTerm) filters.searchTerm = searchTerm;
      if (statsRange.startDate) filters.startDate = statsRange.startDate;
      if (statsRange.endDate) filters.endDate = statsRange.endDate;

      const [enquiriesResult, statsResult] = await Promise.all([
        getAllEnquiries(filters),
        getEnquiryStats(statsRange)
      ]);

      if (enquiriesResult.error) throw new Error(enquiriesResult.error);
      if (statsResult.error) throw new Error(statsResult.error);

      setEnquiries(enquiriesResult.data || []);
      setStats(statsResult.data);
    } catch (error) {
      console.error('Error loading enquiries:', error);
      toast({
        title: 'Failed to load enquiries',
        description: error?.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, statsRange, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleStatusUpdate = useCallback(async (enquiryId, newStatus, { suppressToast } = {}) => {
    try {
      const updateResult = await updateEnquiryStatus(enquiryId, newStatus);
      if (updateResult.error) throw new Error(updateResult.error);

      setEnquiries(prev => prev.map(enquiry => (
        enquiry.id === enquiryId
          ? { ...enquiry, status: newStatus, updated_at: new Date().toISOString() }
          : enquiry
      )));

      const statsResult = await getEnquiryStats(statsRange);
      if (statsResult.error) throw new Error(statsResult.error);
      setStats(statsResult.data);

      if (!suppressToast) {
        toast({
          title: 'Status updated',
          description: 'Enquiry status updated successfully.'
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Status update failed',
        description: error?.message || 'Unable to update enquiry status.',
        variant: 'destructive'
      });
      return { error: error?.message || 'Unknown error' };
    }
  }, [statsRange, toast]);

  const handleDeleteEnquiry = useCallback(async (enquiryId, { bypassConfirm, suppressToast } = {}) => {
    if (!bypassConfirm && !confirm('Are you sure you want to delete this enquiry?')) {
      return { error: 'cancelled' };
    }

    try {
      // Ensure we have a valid ID
      if (enquiryId === undefined || enquiryId === null) {
        throw new Error('No enquiry ID provided');
      }

      // Handle different ID formats
      let finalId;
      const idStr = String(enquiryId).trim();
      
      // Check if it's a numeric ID
      if (/^\d+$/.test(idStr)) {
        console.log('Numeric ID detected, converting to integer');
        finalId = parseInt(idStr, 10);
      } 
      // Check if it's a UUID
      else {
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
        const extractedUuid = idStr.match(uuidRegex)?.[0];
        
        if (extractedUuid) {
          console.log('UUID extracted from string:', extractedUuid);
          finalId = extractedUuid;
        } else if (uuidRegex.test(idStr)) {
          console.log('Valid UUID format detected');
          finalId = idStr;
        } else {
          console.error('Unrecognized ID format:', idStr);
          throw new Error('Invalid enquiry ID format. Please try again or contact support.');
        }
      }

      console.log('Deleting enquiry with ID:', finalId);
      const result = await deleteEnquiry(finalId);
      
      if (result.error) {
        console.error('Error from deleteEnquiry:', result.error);
        throw new Error(result.error);
      }

      // Update UI by removing the deleted enquiry
      setEnquiries(prev => {
        const updated = prev.filter(enquiry => {
          // Handle both string and object IDs
          const enquiryId = enquiry.id?.id || enquiry.id;
          const enquiryIdStr = String(enquiryId).toLowerCase();
          const finalIdStr = String(finalId).toLowerCase();
          return enquiryIdStr !== finalIdStr;
        });
        console.log('Updated enquiries after deletion:', updated.length, 'remaining');
        return updated;
      });

      // Refresh stats
      try {
        console.log('Refreshing stats...');
        const statsResult = await getEnquiryStats(statsRange);
        if (statsResult.data) {
          console.log('Stats refreshed successfully');
          setStats(statsResult.data);
        } else if (statsResult.error) {
          console.warn('Error in stats response:', statsResult.error);
        }
      } catch (statsError) {
        console.error('Error refreshing stats:', statsError);
        // Don't fail the operation if stats refresh fails
      }

      if (!suppressToast) {
        toast({
          title: 'Enquiry deleted',
          description: 'The enquiry has been successfully deleted.',
          variant: 'success'
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast({
        title: 'Deletion failed',
        description: error?.message || 'Unable to delete enquiry.',
        variant: 'destructive'
      });
      return { error: error?.message || 'Unknown error' };
    }
  }, [statsRange, toast]);

  const handleExport = useCallback(async () => {
    try {
      const result = await exportEnquiries(enquiries, 'enquiries.csv');
      if (result.success) {
        toast({
          title: 'Export ready',
          description: 'Enquiries exported successfully.'
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error?.message || 'Unable to export enquiries.',
        variant: 'destructive'
      });
    }
  }, [enquiries, toast]);

  const statusChartData = useMemo(() => {
    if (!stats?.statusCounts) return [];
    return Object.entries(stats.statusCounts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: CHART_COLORS[Object.keys(STATUS_LABELS).indexOf(status) % CHART_COLORS.length]
    }));
  }, [stats]);

  const trendsChartData = useMemo(() => {
    if (!stats?.trendsData) return [];
    return stats.trendsData.map(item => ({
      date: format(new Date(item.date), 'MMM dd'),
      enquiries: item.count
    }));
  }, [stats]);

  const columns = useMemo(() => {
    const formatProductSummary = (items = []) => {
      if (!Array.isArray(items) || items.length === 0) return '-';

      const summary = items.map((item) => {
        const name =
          item.model_number ||
          item.modelNumber ||
          item.producttype ||
          item.productType ||
          'Product';
        const quantity = item.quantity ?? item.qty ?? 1;
        return `${name} (qty: ${quantity})`;
      });

      const displayCount = 3;
      const visible = summary.slice(0, displayCount);
      const remaining = summary.length - visible.length;

      return remaining > 0 ? `${visible.join(', ')} + ${remaining} more` : visible.join(', ');
    };

    const formatDelivery = (method, time) => {
      if (!method && !time) return '-';
      if (!method) return time;
      if (!time) return method;
      return `${method} (${time})`;
    };

    return [
      {
        key: 'created_at',
        label: 'Date',
        sortable: true,
        render: (value) => format(new Date(value), 'MMM dd, yyyy')
      },
      {
        key: 'customer_name',
        label: 'Customer',
        sortable: true,
        render: (value, row) => (
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{row.company}</div>
          </div>
        )
      },
      {
        key: 'email',
        label: 'Contact',
        render: (value, row) => (
          <div>
            <div className="text-sm">{value}</div>
            <div className="text-sm text-muted-foreground">{row.phone}</div>
          </div>
        )
      },
      {
        key: 'address',
        label: 'Address',
        render: (value) => {
          if (!value) return '-';
          const displayValue = value.length > 60 ? `${value.slice(0, 57)}...` : value;
          return (
            <div className="text-sm text-muted-foreground max-w-xs truncate" title={value}>
              {displayValue}
            </div>
          );
        }
      },
      {
        key: 'cart_items',
        label: 'Products',
        render: (value) => formatProductSummary(value)
      },
      {
        key: 'delivery_method',
        label: 'Delivery',
        render: (value, row) => {
          const display = formatDelivery(value, row.delivery_time);
          if (display === '-') return display;
          return (
            <Badge variant="secondary" className="max-w-xs truncate" title={display}>
              {display}
            </Badge>
          );
        }
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => (
          <Badge variant={STATUS_COLORS[value] || 'default'} size="sm">
            {STATUS_LABELS[value] || value}
          </Badge>
        )
      }
    ];
  }, []);

  const actions = useMemo(() => ([
    {
      label: 'View',
      icon: Eye,
      onClick: (row) => {
        setSelectedEnquiry(row);
        setModalOpen(true);
      }
    },
    {
      label: 'Update Status',
      icon: Edit,
      onClick: (row) => {
        const newStatus = prompt('Enter new status (new, contacted, quoted, won, lost):', row.status);
        if (newStatus && Object.keys(STATUS_LABELS).includes(newStatus)) {
          handleStatusUpdate(row.id, newStatus);
        }
      }
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => {
        if (!row || !row.id) {
          toast({
            title: 'Error',
            description: 'Cannot delete: No valid enquiry selected',
            variant: 'destructive',
          });
          return;
        }
        handleDeleteEnquiry(row.id);
      }
    }
  ]), [handleStatusUpdate, handleDeleteEnquiry]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20">
        <div className="text-center space-y-4 flex items-center justify-center flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading enquiry dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-950/20 dark:via-indigo-950/10 dark:to-blue-950/20 relative">
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="enquiry-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#enquiry-grid)" />
        </svg>
      </div>

      <div className="container mx-auto p-4 max-w-7xl relative z-10 space-y-6">
        {/* Header */}
        <Card className="border border-border/50 hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Enquiry Management Dashboard
                </CardTitle>
                <p className="text-muted-foreground">Manage and track customer enquiries</p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Enquiries</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalEnquiries || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Enquiries</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.statusCounts?.new || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.conversionRate || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Won Deals</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.statusCounts?.won || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Enquiry Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="enquiries"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search enquiries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Enquiry List</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={enquiries}
              columns={columns}
              actions={actions}
              loading={false}
              emptyMessage="No enquiries found matching your criteria"
              pageSize={10}
            />
          </CardContent>
        </Card>

        <EnquiryDetailsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          enquiry={selectedEnquiry}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDeleteEnquiry}
        />
      </div>
    </div>
  );
}
