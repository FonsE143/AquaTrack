// src/pages/customer/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, Package, Plus, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'

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

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products/')).data.results || (await api.get('/products/')).data || [],
  })

  const { data: deliveries } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: async () => (await api.get('/deliveries/my-deliveries/')).data.results || (await api.get('/deliveries/my-deliveries/')).data || [],
  })

  // Get active drivers heading to customer's address
  const activeDriversToMe = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status === 'in_route')
    : []

  // Handle order creation
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    try {
      await api.post('/orders/', {
        product: parseInt(orderForm.product),
        quantity: parseInt(orderForm.quantity),
        customer: me.id
      })
      alert('Order created successfully!')
      setShowOrderModal(false)
      setOrderForm({ product: '', quantity: 1 })
    } catch (error) {
      alert('Failed to create order: ' + (error.response?.data?.detail || error.message))
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
          {/* Active Drivers Heading to Me */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Truck className="text-success" size={20} />
                  <h5 className="mb-0">Active Deliveries to Your Address</h5>
                </div>
              </div>
              <div className="card-body">
                {activeDriversToMe.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {activeDriversToMe.map(delivery => (
                      <div key={delivery.id} className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-success bg-opacity-10 p-2 text-success">
                            <Truck size={16} />
                          </div>
                          <div>
                            <div className="fw-medium">
                              Driver: {delivery.driver_username}
                            </div>
                            <div className="small text-muted">
                              Product: {delivery.order_product_name} × {delivery.order_quantity}
                            </div>
                            <div className="small text-muted">
                              Status: {delivery.status.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <Truck size={32} className="text-muted mb-2" />
                    <p className="text-muted mb-0">No active deliveries to your address</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock Availability */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <AlertTriangle className="text-warning" size={20} />
                  <h5 className="mb-0">Stock Availability</h5>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-around">
                  <div className="text-center">
                    <div className="display-6 text-success fw-bold">✓</div>
                    <div className="text-muted">5-Gallon Water</div>
                    <div className="small text-success">In Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="display-6 text-success fw-bold">✓</div>
                    <div className="text-muted">1-Gallon Water</div>
                    <div className="small text-success">In Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="display-6 text-warning fw-bold">!</div>
                    <div className="text-muted">Dispensers</div>
                    <div className="small text-warning">Low Stock</div>
                  </div>
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
                        {Array.isArray(products) && products.map(product => (
                          <option key={product.id} value={product.id}>{product.name} - ₱{product.price}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Quantity</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        min="1"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
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