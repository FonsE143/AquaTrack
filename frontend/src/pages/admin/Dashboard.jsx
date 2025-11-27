// src/pages/admin/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { DollarSign, Users, Package, Truck, TrendingUp, Clock, AlertTriangle, ShoppingBag } from 'lucide-react'

export default function AdminDashboard() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard', active: true },
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Order History', href: '/admin/order-history' },
    { label: 'Inventory', href: '/admin/inventory' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Activity Log', href: '/admin/activity', adminOnly: true },
  ]
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { data: reports, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await api.get('/reports/')).data,
  })

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders/')).data,
  })

  const { data: customers, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/customers/')).data,
  })

  // Safely handle data
  const orderList = orders?.results || orders || []
  const customerList = customers?.results || customers || []
  
  // Safely handle revenue summary with fallbacks
  const revenueSummary = {
    today: Number(reports?.revenue_summary?.today ?? 0),
    week: Number(reports?.revenue_summary?.week ?? 0),
    month: Number(reports?.revenue_summary?.month ?? 0),
  }

  // Calculate metrics with error handling
  const pendingOrders = Array.isArray(orderList) 
    ? orderList.filter((o) => o && o.status && ['processing'].includes(o.status)).length 
    : 0
    
  const deliveriesToday = Array.isArray(orderList) 
    ? orderList.filter((o) => {
        if (!o || !o.created_at) return false
        try {
          const orderDate = new Date(o.created_at)
          const today = new Date()
          return orderDate.toDateString() === today.toDateString() && 
                 o.status && ['out'].includes(o.status)
          } catch {
          return false
        }
      }).length 
    : 0

  // Process revenue data with error handling and fill missing dates
  const processRevenueData = (salesData) => {
    if (!Array.isArray(salesData)) return [];
    
    // Create a map of existing data
    const salesMap = {};
    salesData.forEach(s => {
      if (s && s.created_at__date) {
        let dateStr;
        if (typeof s.created_at__date === 'string') {
          dateStr = s.created_at__date;
        } else if (s.created_at__date instanceof Date) {
          dateStr = s.created_at__date.toISOString().split('T')[0];
        } else {
          dateStr = s.created_at__date;
        }
        salesMap[dateStr] = parseFloat(s.total || 0);
      }
    });
    
    // Generate last 30 days of data
    const result = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const value = salesMap[dateStr] || 0;
      result.push({ label, value });
    }
    
    return result;
  };
  
  const revenue = processRevenueData(reports?.sales);

  // Calculate growth percentage for monthly revenue
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  // Calculate previous month revenue for comparison
  const previousMonthRevenue = Array.isArray(reports?.sales) 
    ? reports.sales
        .filter(s => {
          if (!s || !s.created_at__date) return false;
          const date = new Date(s.created_at__date);
          const today = new Date();
          const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const firstDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          return date >= firstDayOfPreviousMonth && date < firstDayOfCurrentMonth;
        })
        .reduce((sum, s) => sum + parseFloat(s.total || 0), 0)
    : 0;
  
  const monthlyGrowth = calculateGrowth(revenueSummary.month || 0, previousMonthRevenue);
  
  const cards = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(revenueSummary.month || 0),
      detail: `Today • ${formatCurrency(revenueSummary.today || 0)}`,
      accent: 'success',
      icon: <DollarSign size={20} />,
      growth: monthlyGrowth,
    },
    {
      title: 'Active Customers',
      value: Array.isArray(customerList) ? customerList.length : 0,
      detail: 'Engaged this cycle',
      accent: 'primary',
      icon: <Users size={20} />,
    },
    {
      title: 'Pending Orders',
      value: pendingOrders,
      detail: 'Awaiting fulfillment',
      accent: 'warning',
      icon: <Package size={20} />,
    },
    {
      title: 'Deliveries Today',
      value: deliveriesToday,
      detail: 'Currently out for delivery',
      accent: 'info',
      icon: <Truck size={20} />,
    },
  ]

  // Handle loading states
  const isLoading = reportsLoading || ordersLoading || customersLoading
  const hasError = reportsError || ordersError || customersError

  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <TrendingUp className="text-success" size={24} />
              <h1 className="h3 m-0">Operations Dashboard</h1>
            </div>
            <p className="text-muted mb-0">Real-time insight into revenue, customers, and fulfillment.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <span className="badge bg-success-subtle text-success-emphasis d-flex align-items-center gap-1">
              <DollarSign size={14} /> Today {formatCurrency(revenueSummary.today || 0)}
            </span>
            <span className="badge bg-info-subtle text-info-emphasis d-flex align-items-center gap-1">
              <Clock size={14} /> Week {formatCurrency(revenueSummary.week || 0)}
            </span>
          </div>
        </div>

        {hasError && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error loading dashboard data.</strong> Some information may not be available.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          {cards.map((card) => (
            <div className="col-12 col-md-6 col-xl-3" key={card.title}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="d-flex justify-content-between align-items-start">
                        <small className="text-uppercase text-muted fw-medium">{card.title}</small>
                        {card.growth !== undefined && (
                          <span className={`badge ${card.growth >= 0 ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'} d-flex align-items-center gap-1`}>
                            {card.growth >= 0 ? '↑' : '↓'} {Math.abs(card.growth)}%
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 mb-1 fw-bold">{card.value}</h4>
                      <span className="small text-muted">{card.detail}</span>
                    </div>
                    <div className={`rounded-circle bg-light p-2 text-${card.accent}`}>
                      {card.icon}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Alerts */}
        <div className="row g-4">
          {/* Revenue Chart */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Revenue Overview</h5>
                    <small className="text-muted">Performance over the last 30 days</small>
                  </div>
                  <div className="text-end">
                    <div className="small text-success fw-semibold">
                      Total: {formatCurrency(revenue.reduce((sum, item) => sum + item.value, 0))}
                    </div>
                    <div className="small text-muted">
                      Avg: {formatCurrency(revenue.length > 0 ? revenue.reduce((sum, item) => sum + item.value, 0) / revenue.length : 0)} per day
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {isLoading ? (
                  <div className="d-flex align-items-center justify-content-center" style={{ height: 300 }}>
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : revenue.length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
                    <p className="mb-0">No sales data available</p>
                  </div>
                ) : (
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={12} 
                          tickFormatter={(val) => formatCurrency(val)} 
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '0.5rem', 
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                          }}
                                          formatter={(value) => [
                                              formatCurrency(value), 
                                              'Revenue'
                                            ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alerts and Top Customers */}
          <div className="col-lg-4">
            {/* To be Returned Containers */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <AlertTriangle className="text-warning" size={20} />
                  <h5 className="mb-0">To be Returned Containers</h5>
                </div>
              </div>
              <div className="card-body">
                {reportsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-warning" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : Array.isArray(reports?.to_be_returned) && reports.to_be_returned.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {reports.to_be_returned.map((p, index) => (
                      <div key={p.name || index} className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-medium">{p.name || 'Unknown Product'}</span>
                          <span className="badge bg-warning-subtle text-warning-emphasis">
                            {Number(p.outstanding ?? 0)} containers
                          </span>
                        </div>
                        <div className="small text-muted mt-1">
                          Delivered: {Number(p.delivered ?? 0)} | Returned: {Number(p.returned ?? 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-muted">
                    <p className="mb-0">All containers have been returned</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Customers */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <ShoppingBag className="text-primary" size={20} />
                  <h5 className="mb-0">Top Customers</h5>
                </div>
              </div>
              <div className="card-body">
                {reportsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : Array.isArray(reports?.top_customers) && reports.top_customers.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {reports.top_customers.slice(0, 5).map((c, index) => (
                      <div key={c.customer__user__username || index} className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-medium">
                            {c.customer__first_name && c.customer__last_name 
                              ? `${c.customer__first_name} ${c.customer__last_name}`
                              : c.customer__user__username || 'Unknown Customer'}
                          </span>
                          <span className="text-success fw-semibold">
                            {formatCurrency(parseFloat(c.spend || 0) || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-muted">
                    <p className="mb-0">No customer spend recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}