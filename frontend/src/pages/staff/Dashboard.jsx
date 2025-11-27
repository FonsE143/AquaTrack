// src/pages/staff/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Package, TrendingUp, Clock } from 'lucide-react'
import { useState } from 'react'

export default function StaffDashboard(){
  const items = [
    { label:'Dashboard', href:'/staff/dashboard', active:true },
    { label:'Orders', href:'/staff/orders' },
    { label:'Order History', href:'/staff/order-history' },
    { label:'Inventory', href:'/staff/inventory' },
  ]
  const { data, isLoading, error } = useQuery({ 
    queryKey:['orders'], 
    queryFn: async()=> (await api.get('/orders/')).data 
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 5
  
  const orderList = data?.results || data || []
  const totalOrders = orderList.length
  const totalPages = Math.ceil(totalOrders / ordersPerPage)
  
  // Calculate the orders to display for the current page
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const ordersToDisplay = orderList.slice(startIndex, endIndex)
  
  // Pad the orders array to always have 5 rows
  const paddedOrders = [...ordersToDisplay];
  while (paddedOrders.length < 5) {
    paddedOrders.push(null);
  }
  
  const orders = paddedOrders.map((o, index) => {
    if (o === null) {
      return { id: `empty-${index}`, isEmpty: true };
    }
    return {
      id: o.id, 
      code: o.id, 
      customer: `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim() || o.customer_username || o.customer, 
      date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '-', 
      status: o.status, 
      amount: o.total_amount
    };
  });
  
  const pendingOrders = orderList.filter(o => ['processing'].includes(o.status)).length
  
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
            <h1 className="h3 mb-1">Staff Dashboard</h1>
            <p className="text-muted mb-0">Overview of orders and deliveries</p>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error loading dashboard data.</strong> Please try again.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-uppercase text-muted fw-medium">Pending Orders</small>
                    <h4 className="mt-2 mb-1 fw-bold">{pendingOrders}</h4>
                    <span className="small text-muted">Ready for processing</span>
                  </div>
                  <div className="rounded-circle bg-warning bg-opacity-10 p-2 text-warning">
                    <Package size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-uppercase text-muted fw-medium">Total Orders</small>
                    <h4 className="mt-2 mb-1 fw-bold">{orderList.length}</h4>
                    <span className="small text-muted">All orders</span>
                  </div>
                  <div className="rounded-circle bg-info bg-opacity-10 p-2 text-info">
                    <TrendingUp size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Orders */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 py-3">
            <h5 className="mb-0">Recent Orders</h5>
          </div>
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
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          {o.isEmpty ? (
                            <>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                            </>
                          ) : (
                            <>
                              <td className="fw-medium">#{o.code}</td>
                              <td>{o.customer}</td>
                              <td>{o.date}</td>
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
                              <td className="fw-medium">₱{parseFloat(o.amount || 0).toFixed(2)}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  <div className="list-group list-group-flush">
                    {orderList.slice(startIndex, endIndex).map(o => (
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
                          <small className="text-muted">Customer:</small>
                          <div>{`${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim() || o.customer_username || o.customer}</div>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Amount:</small>
                          <div className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show empty items if less than 5 */}
                    {Array.from({ length: Math.max(0, 5 - orderList.slice(startIndex, endIndex).length) }).map((_, index) => (
                      <div key={`empty-${index}`} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">&nbsp;</h6>
                            <small className="text-muted">&nbsp;</small>
                          </div>
                          <span className="badge">&nbsp;</span>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Customer:</small>
                          <div>&nbsp;</div>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Amount:</small>
                          <div className="fw-medium">&nbsp;</div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
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