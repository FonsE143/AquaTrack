// src/pages/staff/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, Package, Plus, History } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'
import { createStyledAlert } from '../../utils/alertHelper'
import { Link } from 'react-router-dom'

export default function StaffDashboard() {
  const items = [
    { label: 'Dashboard', href: '/staff/dashboard', active: true },
    { label: 'Deployment', href: '/staff/deployment' },
    { label: 'Deployment History', href: '/staff/deployment-history' },
    { label: 'Activity Logs', href: '/staff/activity-logs' },
  ]

  const [showWalkInOrder, setShowWalkInOrder] = useState(false)
  const [walkInOrder, setWalkInOrder] = useState({
    product: '',
    quantity: 1
  })

  // Fetch data
  const { data: deliveries } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => (await api.get('/deliveries/')).data.results || (await api.get('/deliveries/')).data || [],
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products/')).data.results || (await api.get('/products/')).data || [],
  })

  // Get active drivers in routes
  const activeDrivers = Array.isArray(deliveries) 
    ? [...new Set(deliveries.filter(d => d.status === 'assigned' || d.status === 'in_route').map(d => d.driver_username))]
    : []

  // Handle walk-in order creation
  const handleCreateWalkInOrder = async (e) => {
    e.preventDefault()
    try {
      await api.post('/walk-in-orders/', {
        product: parseInt(walkInOrder.product),
        quantity: parseInt(walkInOrder.quantity)
      })
      createStyledAlert('success', 'Order Created', 'Walk-in order created successfully!')
      setShowWalkInOrder(false)
      setWalkInOrder({ product: '', quantity: 1 })
    } catch (error) {
      createStyledAlert('error', 'Order Failed', 'Failed to create walk-in order: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <AppShell role="staff" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Truck className="text-primary" size={24} />
              <h1 className="h3 m-0">Staff Dashboard</h1>
            </div>
            <p className="text-muted mb-0">Overview of active drivers and orders</p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/staff/deployment-history" className="btn btn-outline-primary d-flex align-items-center gap-2">
              <History size={16} /> Deployment History
            </Link>
            <button 
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowWalkInOrder(true)}
            >
              <Plus size={16} /> Walk-in Order
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Truck className="text-success" size={20} />
                  <h5 className="mb-0">Active Drivers</h5>
                </div>
              </div>
              <div className="card-body">
                {activeDrivers.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {activeDrivers.map((driver, index) => (
                      <div key={index} className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-success bg-opacity-10 p-2 text-success">
                            <Truck size={16} />
                          </div>
                          <div className="fw-medium">{driver}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <Truck size={32} className="text-muted mb-2" />
                    <p className="text-muted mb-0">No active drivers in routes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package className="text-info" size={20} />
                  <h5 className="mb-0">Quick Stats</h5>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-around gap-3">
                  <div className="text-center">
                    <div className="display-6 text-success fw-bold">12</div>
                    <div className="text-muted">Today's Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="display-6 text-primary fw-bold">8</div>
                    <div className="text-muted">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="display-6 text-info fw-bold">4</div>
                    <div className="text-muted">Completed</div>
                  </div>
                </div>
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