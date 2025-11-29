// src/pages/admin/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { DollarSign, Truck, Package, TrendingUp, Download, MapPin, Clock } from 'lucide-react'
import { useState } from 'react'

export default function AdminDashboard() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard', active: true },
    { label: 'Route', href: '/admin/route' },
    { label: 'Deployment', href: '/admin/deployment' },
    { label: 'Employees', href: '/admin/employees' },
    { label: 'Products', href: '/admin/products', adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs' },
  ]

  const [showWalkInOrder, setShowWalkInOrder] = useState(false)
  const [walkInOrder, setWalkInOrder] = useState({
    product: '',
    quantity: 1
  })

  // Fetch reports data
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await api.get('/reports/')).data,
  })

  // Fetch products for walk-in order
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products/')).data.results || (await api.get('/products/')).data || [],
  })

  // Fetch deliveries for recent delivery display
  const { data: deliveries } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => (await api.get('/deliveries/')).data.results || (await api.get('/deliveries/')).data || [],
  })

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return `₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Safely handle revenue summary with fallbacks
  const revenueSummary = {
    today: Number(reports?.revenue_summary?.today ?? 0),
    week: Number(reports?.revenue_summary?.week ?? 0),
    month: Number(reports?.revenue_summary?.month ?? 0),
  }

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

  // Get active deliveries
  const activeDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status === 'assigned' || d.status === 'in_route')
    : []

  // Get recent deliveries
  const recentDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status === 'delivered')
        .sort((a, b) => new Date(b.delivered_at) - new Date(a.delivered_at))
        .slice(0, 5)
    : []

  // Handle walk-in order creation
  const handleCreateWalkInOrder = async (e) => {
    e.preventDefault()
    try {
      await api.post('/walk-in-orders/', {
        product: parseInt(walkInOrder.product),
        quantity: parseInt(walkInOrder.quantity)
      })
      alert('Walk-in order created successfully!')
      setShowWalkInOrder(false)
      setWalkInOrder({ product: '', quantity: 1 })
    } catch (error) {
      alert('Failed to create walk-in order: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <TrendingUp className="text-success" size={24} />
              <h1 className="h3 m-0">Admin Dashboard</h1>
            </div>
            <p className="text-muted mb-0">Revenue overview and delivery tracking</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-success d-flex align-items-center gap-2"
              onClick={() => window.location.href = '/api/reports/export_delivered_orders/'}
            >
              <Download size={16} /> Export Data
            </button>
            <button 
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowWalkInOrder(true)}
            >
              <Package size={16} /> Walk-in Order
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-uppercase text-muted fw-medium">Monthly Revenue</small>
                    <h4 className="mt-2 mb-1 fw-bold">{formatCurrency(revenueSummary.month || 0)}</h4>
                    <span className="small text-muted">Today • {formatCurrency(revenueSummary.today || 0)}</span>
                  </div>
                  <div className="rounded-circle bg-success bg-opacity-10 p-2 text-success">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-uppercase text-muted fw-medium">Active Deliveries</small>
                    <h4 className="mt-2 mb-1 fw-bold">{activeDeliveries.length}</h4>
                    <span className="small text-muted">Currently in progress</span>
                  </div>
                  <div className="rounded-circle bg-primary bg-opacity-10 p-2 text-primary">
                    <Truck size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-uppercase text-muted fw-medium">Weekly Orders</small>
                    <h4 className="mt-2 mb-1 fw-bold">{reports?.total_orders || 0}</h4>
                    <span className="small text-muted">This week</span>
                  </div>
                  <div className="rounded-circle bg-info bg-opacity-10 p-2 text-info">
                    <Package size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="row g-4 mb-4">
          {/* Revenue Chart */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0">Revenue Trend</h5>
              </div>
              <div className="card-body">
                {reportsLoading ? (
                  <div className="d-flex align-items-center justify-content-center" style={{ height: 300 }}>
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₱${Number(value).toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="value" fill="#198754" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0">Recent Deliveries</h5>
              </div>
              <div className="card-body">
                {recentDeliveries.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {recentDeliveries.map(delivery => (
                      <div key={delivery.id} className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-medium">Order #{delivery.order_id}</div>
                            <div className="small text-muted">
                              {delivery.customer_first_name} {delivery.customer_last_name}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="small text-success">Delivered</div>
                            <div className="small text-muted">
                              {new Date(delivery.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <MapPin size={32} className="text-muted mb-2" />
                    <p className="text-muted mb-0">In Route</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Walk-in Order Modal */}
        {showWalkInOrder && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Walk-in Order</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowWalkInOrder(false)}
                  ></button>
                </div>
                <form onSubmit={handleCreateWalkInOrder}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Product</label>
                      <select 
                        className="form-select" 
                        value={walkInOrder.product}
                        onChange={(e) => setWalkInOrder({...walkInOrder, product: e.target.value})}
                        required
                      >
                        <option value="">Select Product</option>
                        {Array.isArray(products) && products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Quantity</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        min="1"
                        value={walkInOrder.quantity}
                        onChange={(e) => setWalkInOrder({...walkInOrder, quantity: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowWalkInOrder(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                    >
                      Create Order
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}