// src/pages/admin/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { DollarSign, Truck, Package, TrendingUp, Download, MapPin, Clock, History, Gift } from 'lucide-react'
import { useState } from 'react'
import { createStyledAlert } from '../../utils/alertHelper'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard', active: true },
    { label: 'Route', href: '/admin/route' , adminOnly: true },
    { label: 'Deployment', href: '/admin/deployment' , adminOnly: true },
    { label: 'Deployment History', href: '/admin/deployment-history' },
    { label: 'Employees', href: '/admin/employees', adminOnly: true  },
    { label: 'Customers', href: '/admin/customers', adminOnly: true  },
    { label: 'Products', href: '/admin/products', adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs', adminOnly: true  },
  ]

  const [showWalkInOrder, setShowWalkInOrder] = useState(false)
  const [walkInOrder, setWalkInOrder] = useState({
    product: '',
    quantity: 1,
    returnedContainers: 0
  })

  // Calculate free items based on quantity (buy 10 get 1 free)
  const calculateFreeItems = (quantity) => {
    // Return 0 if quantity is not a valid number
    if (!quantity || isNaN(parseInt(quantity))) return 0;
    return Math.floor(parseInt(quantity) / 10);
  };
  
  // Get product price by ID
  const getProductPrice = (productId) => {
    if (!Array.isArray(products) || !productId || isNaN(parseInt(productId))) return 0;
    const product = products.find(p => p.id === parseInt(productId));
    // Return 0 if product not found or price is not a valid number
    return product && product.price !== undefined && product.price !== null && !isNaN(parseFloat(product.price)) ? parseFloat(product.price) : 0;
  };
  
  // Calculate total cost
  const calculateTotalCost = (productId, quantity) => {
    const price = getProductPrice(productId);
    // Return 0 if quantity is not a valid number
    if (!quantity || isNaN(parseInt(quantity))) return 0;
    return price * parseInt(quantity || 0);
  };
  
  // Get product name by ID
  const getProductName = (productId) => {
    if (!Array.isArray(products) || !productId || isNaN(parseInt(productId))) return '';
    const product = products.find(p => p.id === parseInt(productId));
    // Return empty string if product not found or name is not valid
    return product && product.name ? product.name : '';
  };
  
  // Get maximum quantity for a product
  const getMaxQuantity = (productId) => {
    if (!Array.isArray(products) || !productId || isNaN(parseInt(productId))) return 0;
    const product = products.find(p => p.id === parseInt(productId));
    // Return 0 if product not found or stock is not a valid number
    return product && product.stock !== undefined && product.stock !== null && !isNaN(parseInt(product.stock)) ? parseInt(product.stock) : 0;
  };
  
  // Get available stock for a product
  const getAvailableStock = (productId) => {
    // Return 0 if products array is not available or product ID is invalid
    if (!Array.isArray(products) || !productId || isNaN(parseInt(productId))) return 0;
    const product = products.find(p => p.id === parseInt(productId));
    // Return 0 if product not found or stock is not a valid number
    return product && product.stock !== undefined && product.stock !== null && !isNaN(parseInt(product.stock)) ? parseInt(product.stock) : 0;
  };
  
  // Check if product is out of stock
  const isProductOutOfStock = (productId) => {
    // Return true if product ID is invalid or stock is 0 or less
    if (!productId || isNaN(parseInt(productId))) return true;
    return getAvailableStock(productId) <= 0;
  };
  
  // Check if requested quantity exceeds available stock
  const isQuantityExceedingStock = (productId, quantity) => {
    // Return false if product ID is invalid or quantity is not a valid number
    if (!productId || isNaN(parseInt(productId)) || !quantity || isNaN(parseInt(quantity))) return false;
    return parseInt(quantity) > getAvailableStock(productId);
  };
  
  // Get stock warning message
  const getStockWarning = (productId) => {
    // Return empty string if no product selected or invalid product ID
    if (!productId || isNaN(parseInt(productId))) return '';
    const stock = getAvailableStock(productId);
    // Return empty string if stock data is not available or is not a valid number
    if (stock === null || stock === undefined || isNaN(stock)) return '';
    if (stock <= 0) return 'Out of stock';
    if (stock <= 5) return `Only ${stock} left in stock`;
    return `${stock} available`;
  };
  
  // Format currency (using existing formatCurrency function)
  const formatPrice = (amount) => {
    // Return formatted 0 if amount is not a valid number
    if (!amount || isNaN(parseFloat(amount))) return '₱0.00';
    return `₱${Number(parseFloat(amount) || 0).toFixed(2)}`;
  };

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
        quantity: parseInt(walkInOrder.quantity),
        returned_containers: parseInt(walkInOrder.returnedContainers) || 0
      })
      createStyledAlert('success', 'Order Created', 'Walk-in order created successfully!')
      setShowWalkInOrder(false)
      setWalkInOrder({ product: '', quantity: 1, returnedContainers: 0 })
    } catch (error) {
      createStyledAlert('error', 'Order Failed', 'Failed to create walk-in order: ' + (error.response?.data?.detail || error.message))
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
                        {Array.isArray(products) && products
                          .filter(product => product && product.id && product.name) // Filter out invalid products
                          .map(product => {
                            return (
                              <option key={product.id} value={product.id}>
                                {product.name} - {formatPrice(product.price)}
                              </option>
                            );
                          })}
                      </select>
                      {walkInOrder.product && (
                        <div className="mt-2">
                          <small className="text-muted">
                            {getProductName(walkInOrder.product)} - {formatPrice(getProductPrice(walkInOrder.product))} each
                          </small>
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Quantity
                        {walkInOrder.quantity >= 10 && (
                          <span className="text-success ms-2">
                            <Gift size={16} className="d-inline" /> 
                            Buy {walkInOrder.quantity} get {calculateFreeItems(walkInOrder.quantity)} free!
                          </span>
                        )}
                      </label>
                      <input 
                        type="number" 
                        className="form-control"
                        min="1"
                        max="999999"
                        value={walkInOrder.quantity}
                        onChange={(e) => setWalkInOrder({...walkInOrder, quantity: parseInt(e.target.value || 1)})}
                        required
                      />
                      {/* Removed stock validation for walk-in orders */}
                      {walkInOrder.quantity >= 10 && (
                        <div className="alert alert-success mt-2 mb-0 py-2">
                          <div className="d-flex align-items-center gap-2">
                            <Gift size={16} />
                            <div>
                              <strong>Promotion:</strong> Customer will receive <strong>{walkInOrder.quantity + calculateFreeItems(walkInOrder.quantity)}</strong> units 
                              ({walkInOrder.quantity} ordered + {calculateFreeItems(walkInOrder.quantity)} free)!
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Returned Containers</label>
                      <input 
                        type="number" 
                        className="form-control"
                        min="0"
                        max={walkInOrder.quantity + calculateFreeItems(walkInOrder.quantity)}
                        value={walkInOrder.returnedContainers}
                        onChange={(e) => setWalkInOrder({...walkInOrder, returnedContainers: parseInt(e.target.value || 0)})}
                      />
                      <div className="form-text">
                        Maximum: {walkInOrder.quantity + calculateFreeItems(walkInOrder.quantity)} containers
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <div className="me-auto">
                      <div className="fw-bold">
                        Total Cost: {formatPrice(calculateTotalCost(walkInOrder.product, walkInOrder.quantity))}
                      </div>
                      <div className="small text-muted">
                        {walkInOrder.quantity} × {formatPrice(getProductPrice(walkInOrder.product))} = {formatPrice(calculateTotalCost(walkInOrder.product, walkInOrder.quantity))}
                      </div>
                      {calculateFreeItems(walkInOrder.quantity) > 0 && (
                        <div className="small text-success">
                          <Gift size={12} className="d-inline" /> 
                          +{calculateFreeItems(walkInOrder.quantity)} free items ({getProductName(walkInOrder.product)})
                        </div>
                      )}
                    </div>
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
                      disabled={!walkInOrder.product || walkInOrder.quantity < 1}
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