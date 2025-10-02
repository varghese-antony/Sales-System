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
import { DataTableSkeleton, StatsCardsSkeleton, ChartSkeleton } from '@/components/ui/loading-skeleton';
import { EnquiryDetailsModal } from '@/components/EnquiryDetailsModal';
import { useDebounce } from '@/hooks/useDebounce';
import { useCache } from '@/hooks/useCache';
import {
  getEnquiriesWithPagination,
  getEnquiryStatsCached,
  batchUpdateEnquiryStatus,
  clearEnquiryCache
} from '@/lib/database/enquiries-optimized';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  const { toast } = useToast();
  const cache = useCache(2 * 60 * 1000); // 2 minutes cache
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized stats range calculation
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

  // Optimized data loading with caching
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const filters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (debouncedSearchTerm) filters.searchTerm = debouncedSearchTerm;
      if (statsRange.startDate) filters.startDate = statsRange.startDate;
      if (statsRange.endDate) filters.endDate = statsRange.endDate;

      // Use optimized pagination service
      const result = await getEnquiriesWithPagination(filters, {
        currentPage,
        pageSize
      });

      if (result.error) throw result.error;

      setEnquiries(result.data || []);
      setTotalItems(result.count || 0);
    } catch (error) {
      console.error('Error loading enquiries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enquiries',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearchTerm, statsRange, currentPage, pageSize, toast]);

  // Load stats with caching
  const loadStats = useCallback(async () => {
    try {
      const statsResult = await getEnquiryStatsCached(statsRange);
      if (statsResult.error) throw statsResult.error;
      setStats(statsResult.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [statsRange]);

  // Load initial data
  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  // Reload data when filters change (debounced)
  useEffect(() => {
    if (currentPage === 1) {
      loadData();
    } else {
      setCurrentPage(1);
    }
  }, [statusFilter, debouncedSearchTerm, statsRange.startDate, statsRange.endDate, loadData]);

  // Load data when pagination changes
  useEffect(() => {
    if (currentPage > 1 || pageSize !== 25) {
      loadData();
    }
  }, [currentPage, pageSize, loadData]);

  // Optimized refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    clearEnquiryCache(); // Clear cache on manual refresh
    await Promise.all([loadData(), loadStats()]);
    setRefreshing(false);
  }, [loadData, loadStats]);

  // Memoized handlers
  const handleViewEnquiry = useCallback((enquiry) => {
    setSelectedEnquiry(enquiry);
    setModalOpen(true);
  }, []);

  const handleStatusUpdate = useCallback(async (enquiryId, newStatus) => {
    try {
      const { updateEnquiryStatus } = await import('@/lib/database/enquiries');
      const result = await updateEnquiryStatus(enquiryId, newStatus);

      if (result.error) throw result.error;

      // Update local state
      setEnquiries(prev => prev.map(enquiry =>
        enquiry.id === enquiryId
          ? { ...enquiry, status: newStatus, updated_at: new Date().toISOString() }
          : enquiry
      ));

      // Refresh stats
      await loadStats();

      toast({
        title: 'Success',
        description: 'Enquiry status updated successfully'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update enquiry status',
        variant: 'destructive'
      });
    }
  }, [loadStats, toast]);

  const handleDeleteEnquiry = useCallback(async (enquiry) => {
    if (!confirm(`Are you sure you want to delete this enquiry from ${enquiry.customer_name}?`)) return;

    try {
      const { deleteEnquiry } = await import('@/lib/database/enquiries');
      const result = await deleteEnquiry(enquiry.id);

      if (result.error) throw result.error;

      // Update local state
      setEnquiries(prev => prev.filter(e => e.id !== enquiry.id));
      setTotalItems(prev => prev - 1);

      toast({
        title: 'Success',
        description: 'Enquiry deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete enquiry',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const handleExportEnquiries = useCallback(async () => {
    try {
      const result = await exportEnquiries(enquiries, `enquiries-${new Date().toISOString().split('T')[0]}.csv`);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Enquiries exported successfully'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export enquiries',
        variant: 'destructive'
      });
    }
  }, [enquiries, toast]);

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!stats?.trendsData) return [];

    return stats.trendsData.map(item => ({
      date: format(new Date(item.date), 'MMM dd'),
      count: item.count
    }));
  }, [stats?.trendsData]);

  const pieData = useMemo(() => {
    if (!stats?.statusCounts) return [];

    return Object.entries(stats.statusCounts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: CHART_COLORS[Object.keys(STATUS_LABELS).indexOf(status)]
    }));
  }, [stats?.statusCounts]);

  // Table columns configuration
  const columns = useMemo(() => [
    {
      key: 'customer_name',
      label: 'Customer',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={STATUS_COLORS[value] || 'outline'} size="sm">
          {STATUS_LABELS[value] || value}
        </Badge>
      )
    },
    {
      key: 'delivery_method',
      label: 'Delivery',
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            onClick={() => handleViewEnquiry(row)}
            variant="outline"
            size="sm"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleDeleteEnquiry(row)}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [handleViewEnquiry, handleDeleteEnquiry]);

  // Loading state
  if (loading && enquiries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="space-y-6">
            <StatsCardsSkeleton count={4} />
            <div className="grid gap-6 md:grid-cols-2">
              <ChartSkeleton height={300} />
              <ChartSkeleton height={300} />
            </div>
            <DataTableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 relative">
      {/* Background Pattern */}
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
        <Card className="border border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Enquiry Management</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={handleExportEnquiries} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
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
                  <p className="text-sm font-medium text-muted-foreground">Won</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.statusCounts?.won || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(stats?.statusCounts?.new || 0) + (stats?.statusCounts?.contacted || 0)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Trends Chart */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Enquiry Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No distribution data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers, emails, companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Enquiries ({totalItems} total)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={enquiries}
              columns={columns}
              loading={loading}
              emptyMessage="No enquiries found matching your criteria"
              pageSize={pageSize}
              currentPage={currentPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>

        {/* Enquiry Details Modal */}
        <EnquiryDetailsModal
          enquiry={selectedEnquiry}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </div>
  );
}
