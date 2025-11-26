// src/pages/customer/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'
import { Plus, Package, StickyNote } from 'lucide-react'

export default function CustomerDashboard(){
  const items = [
    { label:'Dashboard', href:'/customer/dashboard', active:true },
    { label:'Order History', href:'/customer/order-history' },
    { label:'Notifications', href:'/customer/notifications' },
  ]
  const queryClient = useQueryClient()
  const { data: orders, isLoading, error } = useQuery({ 
    queryKey:['my-orders'], 
    queryFn: async()=> (await api.get('/orders/')).data 
  })
  const { data: me } = useQuery({ 
    queryKey:['me'], 
    queryFn: async()=> (await api.get('/me/')).data 
  })
  const { data: products } = useQuery({ 
    queryKey:['products'], 
    queryFn: async()=> (await api.get('/products/')).data 
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    product: '',
    qty: 1,
    address: '',
    notes: '',
  })
  const [formMessage, setFormMessage] = useState(null)

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!form.product) throw new Error('Please select a product')
      return api.post('/orders/', {
        items: [{ product: parseInt(form.product), qty_full_out: form.qty, qty_empty_in: 0 }],
        notes: form.notes || '',
      })
    },
    onSuccess: () => {
      setFormMessage({ type: 'success', text: 'Order placed successfully!' })
      setForm({ product: '', qty: 1, address: me?.address || '', notes: '' })
      queryClient.invalidateQueries(['my-orders'])
      queryClient.invalidateQueries(['orders'])
      setTimeout(() => {
        setIsModalOpen(false)
        setFormMessage(null)
      }, 1200)
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.items?.[0]?.product?.[0] || 
                      error.response?.data?.items?.[0]?.non_field_errors?.[0] ||
                      error.response?.data?.detail ||
                      error.message ||
                      'Failed to place order'
      setFormMessage({ type: 'error', text: errorMsg })
    }
  })

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'qty' ? parseInt(value || '1') : value }))
  }
  
  const submitOrder = (e) => {
    e.preventDefault()
    setFormMessage(null)
    orderMutation.mutate()
  }
  
  const openModal = () => {
    setForm({
      product: '',
      qty: 1,
      address: me?.address || '',
      notes: '',
    })
    setFormMessage(null)
    setIsModalOpen(true)
  }
  
  const meOrders = (orders?.results || orders || []).slice(0,10)
  
  return (
    <AppShell role="customer" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Welcome back, {me?.username || 'Customer'}!</h1>
            <p className="text-muted mb-0">Here you can manage your orders and view your history</p>
          </div>
          <button 
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={openModal}
          >
            <Plus size={18} />
            Place Order
          </button>
        </div>
        
        {/* Message Alert */}
        {formMessage && (
          <div className={`alert alert-${formMessage.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`} role="alert">
            {formMessage.text}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setFormMessage(null)}
            ></button>
          </div>
        )}
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error loading orders.</strong> Please try again.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}
        
        {/* Order History */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 py-3">
            <h5 className="mb-0">Your Recent Orders</h5>
          </div>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : meOrders.length === 0 ? (
              <div className="text-center py-5">
                <Package size={48} className="text-muted mb-3" />
                <h5 className="mb-1">No orders yet</h5>
                <p className="text-muted mb-0">Place your first order to get started</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meOrders.map(o => (
                        <tr key={o.id}>
                          <td className="fw-medium">#{o.id}</td>
                          <td>{new Date(o.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${
                              o.status === 'delivered' ? 'bg-success' :
                              o.status === 'cancelled' ? 'bg-danger' :
                              o.status === 'out' ? 'bg-info' :
                              'bg-warning'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</td>
                          <td>{o.items?.length || 0} item(s)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  <div className="list-group list-group-flush">
                    {meOrders.map(o => (
                      <div key={o.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">Order #{o.id}</h6>
                            <small className="text-muted">{new Date(o.created_at).toLocaleDateString()}</small>
                          </div>
                          <span className={`badge ${
                            o.status === 'delivered' ? 'bg-success' :
                            o.status === 'cancelled' ? 'bg-danger' :
                            o.status === 'out' ? 'bg-info' :
                            'bg-warning'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Amount:</small>
                          <div className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</div>
                        </div>
                        
                        <div className="mb-0">
                          <small className="text-muted">Items:</small>
                          <div>{o.items?.length || 0} item(s)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Place Order Modal */}
      {isModalOpen && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">Place a New Order</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={submitOrder}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Product *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Package size={18} />
                        </span>
                        <select 
                          className="form-select"
                          name="product"
                          value={form.product} 
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Select a product</option>
                          {(products?.results || products || [])
                            .filter(p => p.active && p.stock_full > 0)
                            .map(p => (
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
                          min="1" 
                          name="qty"
                          value={form.qty} 
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Delivery Address</label>
                      <textarea 
                        className="form-control"
                        name="address"
                        value={form.address} 
                        onChange={handleFormChange}
                        placeholder="Enter delivery address"
                        rows="2"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Delivery Notes</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <StickyNote size={18} />
                        </span>
                        <input
                          className="form-control"
                          type="text"
                          name="notes"
                          placeholder="e.g., Leave at the front door"
                          value={form.notes} 
                          onChange={handleFormChange}
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
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-success"
                  type="submit" 
                  disabled={orderMutation.isLoading || !form.product}
                  onClick={submitOrder}
                >
                  {orderMutation.isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
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