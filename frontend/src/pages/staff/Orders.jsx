// src/pages/staff/Orders.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Package, User } from 'lucide-react'
import { useState } from 'react'

export default function StaffOrders(){
  const items = [
    { label:'Dashboard', href:'/staff/dashboard' },
    { label:'Orders', href:'/staff/orders', active:true },
    { label:'Order History', href:'/staff/order-history' },
    { label:'Inventory', href:'/staff/inventory' },
  ]
  
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ 
    queryKey:['orders'], 
    queryFn: async()=> (await api.get('/orders/')).data 
  })
  
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async()=> (await api.get('/drivers/')).data
  })
  
  const processOrder = useMutation({
    mutationFn: ({ id, payload }) => {
      console.log('Processing order:', { id, payload });
      return api.post(`/orders/${id}/process/`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
    },
    onError: (error) => {
      console.error('Failed to update order:', error.response?.data || error.message)
      alert('Failed to update order status. Please try again.')
    }
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10
  
  const orders = (data?.results || data || []).filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
  const driverList = drivers?.results || drivers || []
  
  // Calculate pagination
  const totalOrders = orders.length
  const totalPages = Math.ceil(totalOrders / ordersPerPage)
  
  // Get orders for current page
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const ordersToDisplay = orders.slice(startIndex, endIndex)
  
  // Pad the orders array to always have 10 rows
  const paddedOrders = [...ordersToDisplay];
  while (paddedOrders.length < 10) {
    paddedOrders.push(null);
  }
  
  const ordersWithPadding = paddedOrders.map((o, index) => {
    if (o === null) {
      return { id: `empty-${index}`, isEmpty: true };
    }
    return o;
  });
  
  const handleStatusChange = (orderId, newStatus) => {
    // For "Out for Delivery", we need to also assign a driver
    if (newStatus === 'out') {
      // We'll handle this through the driver assignment instead
      return
    }
    processOrder.mutate({ id: orderId, payload: { status: newStatus } })
  }

  const handleDriverChange = (orderId, driverId, status) => {
    console.log('Assigning driver to order:', { orderId, driverId, status });
    const payload = { status }
    if (driverId) {
      payload.driver_id = Number(driverId)
    }
    processOrder.mutate({ id: orderId, payload })
  }
  
  // Navigation functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  return (
    <AppShell role="staff" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Order Management</h1>
            <p className="text-muted mb-0">View and process customer orders</p>
          </div>
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
            ) : orders.length === 0 ? (
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
                      </tr>
                    </thead>
                    <tbody>
                      {ordersWithPadding.map(o => (
                        <tr key={o.id}>
                          {o.isEmpty ? (
                            <>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                            </>
                          ) : (
                            <>
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
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={o.driver?.id || ''}
                                  onChange={(e) => handleDriverChange(o.id, e.target.value || null, 'out')}
                                  disabled={o.status === 'delivered' || o.status === 'cancelled'}
                                >
                                  <option value="">Unassigned</option>
                                  {driverList.map(driverMember => (
                                    <option key={driverMember.id} value={driverMember.id}>
                                      {driverMember.username || driverMember.first_name || `Driver #${driverMember.id}`}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalOrders)} of {totalOrders} orders
                  </div>
                  <div className="btn-group" role="group">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      Next
                    </button>
                  </div>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  <div className="list-group list-group-flush">
                    {orders.filter(order => order.status !== 'delivered').map(o => (
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
                              {driverList.map(driverMember => (
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
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}