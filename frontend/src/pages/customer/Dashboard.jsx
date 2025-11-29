// src/pages/customer/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, Package, Plus, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState, useMemo, useEffect } from 'react'

export default function CustomerDashboard() {
  const items = [
    { label: 'Dashboard', href: '/customer/dashboard', active: true },
  ]

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState({
    product: '',
    quantity: 1
  })

  // Fetch data
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/me/')).data,
  })

  const { data: deliveries } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: async () => (await api.get('/deliveries/my-deliveries/')).data.results || (await api.get('/deliveries/my-deliveries/')).data || [],
  })

  // Fetch products for order modal
  const { data: products } = useQuery({
    queryKey: ['order-products'],
    queryFn: async () => (await api.get('/products/')).data.results || (await api.get('/products/')).data || [],
  })

  // Fetch deployments by customer's barangay
  const { data: barangayDeployments } = useQuery({
    queryKey: ['barangay-deployments'],
    queryFn: async () => {
      try {
        const response = await api.get('/deployments/by-customer-barangay/')
        return response.data
      } catch (error) {
        console.error('Error fetching barangay deployments:', error)
        return { deployments: [], message: 'Error fetching deployments' }
      }
    },
  })

  // Get active drivers heading to customer's address
  const activeDriversToMe = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status === 'in_route')
    : []

  // Get unique drivers from barangay deployments
  const uniqueDrivers = useMemo(() => {
    if (!barangayDeployments?.deployments) return [];
    
    const driverMap = {};
    const uniqueDrivers = [];
    
    barangayDeployments.deployments.slice(0, 5).forEach(deployment => {
      if (deployment.driver_id && !driverMap[deployment.driver_id]) {
        driverMap[deployment.driver_id] = true;
        uniqueDrivers.push(deployment);
      }
    });
    
    return uniqueDrivers;
  }, [barangayDeployments]);

  // Get maximum quantity for a product based on available stock
  const getMaxQuantity = (productId) => {
    if (!productId || !barangayDeployments?.deployments) return 0;
    
    const deployment = barangayDeployments.deployments.find(d => d.product === parseInt(productId));
    return deployment ? deployment.stock : 0;
  };

  // Reset quantity when product changes
  useEffect(() => {
    if (orderForm.product) {
      const maxQty = getMaxQuantity(orderForm.product);
      if (orderForm.quantity > maxQty) {
        setOrderForm({...orderForm, quantity: maxQty});
      }
    }
  }, [orderForm.product, barangayDeployments]);
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    try {
      await api.post('/orders/', {
        product: parseInt(orderForm.product),
        quantity: parseInt(orderForm.quantity),
        customer: me.id
      })
      createStyledAlert('success', 'Order Created', 'Your order has been created successfully!')
      setShowOrderModal(false)
      setOrderForm({ product: '', quantity: 1 })
    } catch (error) {
      createStyledAlert('error', 'Order Failed', 'Failed to create order: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <AppShell role="customer" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Package className="text-primary" size={24} />
              <h1 className="h3 m-0">Welcome, {me?.first_name || me?.username}!</h1>
            </div>
            <p className="text-muted mb-0">Manage your orders and track deliveries</p>
          </div>
          <button 
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={() => setShowOrderModal(true)}
          >
            <Plus size={16} /> Place Order
          </button>
        </div>

        <div className="row g-4">
          {/* Active Drivers */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Truck className="text-success" size={72} />
                  <h5 className="mb-0">Active Drivers</h5>
                </div>
              </div>
              <div className="card-body">
                {uniqueDrivers.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {uniqueDrivers.map((deployment, index) => (
                      <div key={index} className="list-group-item border-0 px-0 py-4">
                        <div className="d-flex align-items-center gap-4">
                          <div className="rounded-circle bg-success bg-opacity-10 p-4 text-success">
                            <Truck size={60} />
                          </div>
                          <div>
                            <div className="fw-bold h3 mb-2">
                              Delivery Driver
                            </div>
                            <div className="h5 mb-2">
                              Phone: {deployment.driver_phone || 'N/A'}
                            </div>
                            <div className="h5">
                              Location: N/A
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <Truck size={120} className="text-muted mb-4" />
                    <p className="text-muted mb-0 h2">No active drivers</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Available Stock Based on Driver Deployment */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <AlertTriangle className="text-warning" size={20} />
                  <h5 className="mb-0">Available Stock</h5>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive" style={{ maxHeight: '250px', minHeight: '250px', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th>Available Stock</th>
                        <th>Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {barangayDeployments?.deployments && barangayDeployments.deployments.length > 0 ? (
                        barangayDeployments.deployments.slice(0, 5).map((deployment, index) => (
                          <tr key={index}>
                            <td>{deployment.product_name || 'N/A'}</td>
                            <td>
                              <span className="badge bg-primary">{deployment.stock || 0}</span>
                            </td>
                            <td>
                              {deployment.driver_first_name} {deployment.driver_last_name}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center align-middle" style={{ height: '200px' }}>
                            No deliveries for the current address
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package className="text-info" size={20} />
                  <h5 className="mb-0">Order History</h5>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive" style={{ maxHeight: '250px', minHeight: '250px', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(deliveries) && deliveries.length > 0 ? (
                        deliveries.slice(0, 5).map((delivery, index) => (
                          <tr key={index}>
                            <td>{delivery.order_id || 'N/A'}</td>
                            <td>{delivery.order_product_name || 'N/A'}</td>
                            <td>{delivery.order_quantity || 0}</td>
                            <td>{delivery.created_at ? new Date(delivery.created_at).toLocaleDateString() : 'N/A'}</td>
                            <td>
                              <span className="badge bg-warning">
                                {delivery.status ? delivery.status.replace('_', ' ') : 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center align-middle" style={{ height: '200px' }}>
                            No order history
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Modal */}
        {showOrderModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Place New Order</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowOrderModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleCreateOrder}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Product</label>
                      <select 
                        className="form-select" 
                        value={orderForm.product}
                        onChange={(e) => setOrderForm({...orderForm, product: e.target.value})}
                        required
                      >
                        <option value="">Select Product</option>
                        {barangayDeployments?.deployments && barangayDeployments.deployments.map((deployment, index) => (
                          <option key={index} value={deployment.product}>{deployment.product_name} - Stock: {deployment.stock}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Quantity (Max: {getMaxQuantity(orderForm.product)})</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        min="1"
                        max={getMaxQuantity(orderForm.product)}
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({...orderForm, quantity: Math.min(e.target.value, getMaxQuantity(orderForm.product))})}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowOrderModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                    >
                      Place Order
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