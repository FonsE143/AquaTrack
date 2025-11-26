// src/pages/admin/Orders.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Package, User, Plus, StickyNote } from 'lucide-react'
import { useState } from 'react'

export default function AdminOrders(){
  const items = [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Orders', href:'/admin/orders', active:true },
    { label:'Order History', href:'/admin/order-history' },
    { label:'Inventory', href:'/admin/inventory' },
    { label:'Users', href:'/admin/users' },
    { label:'Activity Log', href:'/admin/activity', adminOnly: true },
  ]
  
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ 
    queryKey:['orders'], 
    queryFn: async()=> (await api.get('/orders/')).data 
  })
  const { data: customerList } = useQuery({ 
    queryKey:['customers'], 
    queryFn: async()=> (await api.get('/customers/')).data 
  })
  const { data: productList } = useQuery({ 
    queryKey:['products'], 
    queryFn: async()=> (await api.get('/products/')).data 
  })
  const { data: driverList } = useQuery({
    queryKey: ['drivers'],
    queryFn: async()=> (await api.get('/drivers/')).data
  })
  
  const processOrder = useMutation({
    mutationFn: ({ id, payload }) => api.post(`/orders/${id}/process/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
    },
    onError: (error) => {
      console.error('Failed to update order:', error.response?.data || error.message)
      alert('Failed to update order status. Please try again.')
    }
  })
  
  const walkInMutation = useMutation({
    mutationFn: async () => {
      if (!walkInForm.customer || !walkInForm.product) 
        throw new Error('Customer and product are required')
      return api.post('/orders/', {
        customer: parseInt(walkInForm.customer),
        items: [{ product: parseInt(walkInForm.product), qty_full_out: walkInForm.qty, qty_empty_in: 0 }],
        notes: walkInForm.notes || '',
      })
    },
    onSuccess: () => {
      setWalkInMessage({ type: 'success', text: 'Order placed successfully!' })
      setWalkInForm({ customer: '', product: '', qty: 1, notes: '' })
      queryClient.invalidateQueries(['orders'])
      setTimeout(() => {
        setIsWalkInModalOpen(false)
        setWalkInMessage(null)
      }, 1200)
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.items?.[0]?.non_field_errors?.[0] ||
                      error.message ||
                      'Failed to place order'
      setWalkInMessage({ type: 'error', text: errorMsg })
    }
  })
  
  const orderList = (data?.results || data || []).filter(order => order.status !== 'delivered')
  const customers = customerList?.results || customerList || []
  const products = productList?.results || productList || []
  const drivers = driverList?.results || driverList || []
  
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
  const [walkInForm, setWalkInForm] = useState({
    customer: '',
    product: '',
    qty: 1,
    notes: '',
  })
  const [walkInMessage, setWalkInMessage] = useState(null)
  
  const handleStatusChange = (orderId, newStatus) => {
    processOrder.mutate({ id: orderId, payload: { status: newStatus } })
  }
  
  const handleDriverChange = (orderId, driverId, status) => {
    const payload = { status }
    if (driverId) {
      payload.driver_id = Number(driverId)
    }
    processOrder.mutate({ id: orderId, payload })
  }
  
  const handleWalkInChange = (e) => {
    const { name, value } = e.target
    setWalkInForm(prev => ({ ...prev, [name]: name === 'qty' ? parseInt(value || '1') : value }))
  }
  
  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Order Management</h1>
            <p className="text-muted mb-0">View and manage all customer orders</p>
          </div>
          <button 
            className="btn btn-success d-flex align-items-center gap-2" 
            onClick={() => {
              setWalkInForm({ customer: '', product: '', qty: 1, notes: '' })
              setWalkInMessage(null)
              setIsWalkInModalOpen(true)
            }}
          >
            <Plus size={18} />
            Walk-in Order
          </button>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error loading orders.</strong> Please try again.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}
        
        {/* Orders Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : orderList.length === 0 ? (
              <div className="text-center py-5">
                <Package size={48} className="text-muted mb-3" />
                <h5 className="mb-1">No orders found</h5>
                <p className="text-muted mb-0">There are no orders to display at the moment</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Driver</th>
                        <th>Amount</th>
                        <th>Items</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderList.map(o => (
                        <tr key={o.id}>
                          <td className="fw-medium">#{o.id}</td>
                          <td>{o.customer_username || o.customer}</td>
                          <td>{new Date(o.created_at).toLocaleDateString()}</td>
                          <td>
                            <select 
                              className="form-select form-select-sm"
                              value={o.status}
                              onChange={(e) => handleStatusChange(o.id, e.target.value)}
                              disabled={processOrder.isLoading}
                            >
                              <option value="processing">Processing</option>
                              <option value="out">Out for Delivery</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {o.delivery_status && (
                              <small className="text-muted d-block mt-1">Delivery: {o.delivery_status}</small>
                            )}
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={o.driver?.id || ''}
                              onChange={(e) => handleDriverChange(o.id, e.target.value || null, 'out')}
                              disabled={o.status === 'delivered' || o.status === 'cancelled'}
                            >
                              <option value="">Unassigned</option>
                              {drivers.map(driverMember => (
                                <option key={driverMember.id} value={driverMember.id}>
                                  {driverMember.username || driverMember.first_name || `Driver #${driverMember.id}`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</td>
                          <td>{o.items?.length || 0} item(s)</td>
                          <td>
                            {o.notes ? (
                              <div className="d-flex align-items-center gap-1 text-muted" title={o.notes}>
                                <StickyNote size={16} />
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  <div className="list-group list-group-flush">
                    {orderList.filter(order => order.status !== 'delivered').map(o => (
                      <div key={o.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">Order #{o.id}</h6>
                            <small className="text-muted">{new Date(o.created_at).toLocaleDateString()}</small>
                          </div>
                          <div>
                            <span className={`badge ${
                              o.status === 'processing' ? 'bg-warning' :
                              o.status === 'out' ? 'bg-primary' :
                              o.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Customer:</small>
                          <div>{o.customer_username || o.customer}</div>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Amount:</small>
                          <div className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</div>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Items:</small>
                          <div>{o.items?.length || 0} item(s)</div>
                        </div>
                        
                        {o.delivery_status && (
                          <div className="mb-2">
                            <small className="text-muted">Delivery Status:</small>
                            <div>
                              <span className="badge bg-info">{o.delivery_status}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <small className="text-muted">Driver:</small>
                          <div>
                            <select
                              className="form-select form-select-sm"
                              value={o.driver?.id || ''}
                              onChange={(e) => handleDriverChange(o.id, e.target.value || null, 'out')}
                              disabled={o.status === 'delivered' || o.status === 'cancelled'}
                            >
                              <option value="">Unassigned</option>
                              {drivers.map(driverMember => (
                                <option key={driverMember.id} value={driverMember.id}>
                                  {driverMember.username || driverMember.first_name || `Driver #${driverMember.id}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <select 
                            className="form-select form-select-sm flex-fill"
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            disabled={processOrder.isLoading}
                          >
                            <option value="processing">Processing</option>
                            <option value="out">Out for Delivery</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        {o.notes && (
                          <div className="mt-2">
                            <small className="text-muted">Notes:</small>
                            <div className="text-muted">{o.notes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Walk-in Order Modal */}
      {isWalkInModalOpen && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">Walk-in Order</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsWalkInModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                {walkInMessage && (
                  <div className={`alert alert-${walkInMessage.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`} role="alert">
                    {walkInMessage.text}
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setWalkInMessage(null)}
                    ></button>
                  </div>
                )}
                <form onSubmit={(e)=>{e.preventDefault(); walkInMutation.mutate()}}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Customer *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <User size={18} />
                        </span>
                        <select
                          className="form-select"
                          name="customer"
                          value={walkInForm.customer}
                          onChange={handleWalkInChange}
                          required
                        >
                          <option value="">Select customer</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.username || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Customer #${c.id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Product *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Package size={18} />
                        </span>
                        <select
                          className="form-select"
                          name="product"
                          value={walkInForm.product}
                          onChange={handleWalkInChange}
                          required
                        >
                          <option value="">Select product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} — ₱{parseFloat(p.price).toFixed(2)} (Stock: {p.stock_full})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Quantity *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <span>#</span>
                        </span>
                        <input
                          className="form-control"
                          type="number"
                          name="qty"
                          min="1"
                          value={walkInForm.qty}
                          onChange={handleWalkInChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Notes</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <StickyNote size={18} />
                        </span>
                        <input
                          className="form-control"
                          type="text"
                          name="notes"
                          placeholder="Optional notes"
                          value={walkInForm.notes}
                          onChange={handleWalkInChange}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-light" 
                  onClick={() => setIsWalkInModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={walkInMutation.isLoading}
                  onClick={() => walkInMutation.mutate()}
                >
                  {walkInMutation.isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Submit Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}