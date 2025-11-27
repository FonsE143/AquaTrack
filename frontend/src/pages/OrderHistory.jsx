import React, { useState } from 'react'
import AppShell from '../components/AppShell'
import { Sidebar } from '../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Package } from 'lucide-react'

export default function OrderHistoryPage(){
  // Different items based on user role
  const userRole = localStorage.getItem('userRole') || 'customer'
  
  const items = userRole === 'admin' ? [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Orders', href:'/admin/orders' },
    { label:'Order History', href:'/admin/order-history', active: true },
    { label:'Inventory', href:'/admin/inventory' },
    { label:'Users', href:'/admin/users' },
    { label:'Activity Log', href:'/admin/activity', adminOnly: true },
  ] : userRole === 'staff' ? [
    { label:'Dashboard', href:'/staff/dashboard' },
    { label:'Orders', href:'/staff/orders' },
    { label:'Order History', href:'/staff/order-history', active: true },
    { label:'Inventory', href:'/staff/inventory' },
  ] : [
    { label:'Dashboard', href:'/customer/dashboard' },
    { label:'Order History', href:'/customer/order-history', active: true },
    { label:'Notifications', href:'/customer/notifications' },
  ]

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['order-history'],
    queryFn: async () => {
      try {
        let ordersResponse;
        
        // For customer role, show all their orders (delivered and cancelled)
        if (userRole === 'customer') {
          ordersResponse = await api.get('/orders/')
          let customerOrders = ordersResponse.data.results || ordersResponse.data || []
          return customerOrders
        } 
        // For staff and admin, show all orders including cancelled ones
        else {
          ordersResponse = await api.get('/orders/')
          let allOrders = ordersResponse.data.results || ordersResponse.data || []
          return allOrders
        }
      } catch (err) {
        console.error('Error fetching order history:', err)
        return []
      }
    }
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10
  
  // Calculate pagination
  const totalOrders = orders?.length || 0
  const totalPages = Math.ceil(totalOrders / ordersPerPage)
  
  // Get orders for current page
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const ordersToDisplay = orders?.slice(startIndex, endIndex) || []
  
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

  // Function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-warning'
      case 'out':
        return 'bg-primary'
      case 'delivered':
        return 'bg-success'
      case 'cancelled':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  // Function to get status display text
  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'processing':
        return 'Processing'
      case 'out':
        return 'Out for Delivery'
      case 'delivered':
        return 'Delivered'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  return (
    <AppShell role={userRole} sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Order History</h1>
            <p className="text-muted mb-0">
              {userRole === 'customer' 
                ? 'View completed orders delivered by drivers' 
                : 'View all orders and their current status'}
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error loading order history.</strong> Please try again.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}

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
                <h5 className="mb-1">No order history yet</h5>
                <p className="text-muted mb-0">
                  {userRole === 'customer' 
                    ? 'Completed orders delivered by drivers will appear here' 
                    : 'Orders will appear here once they are created'}
                </p>
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
                        <th>Amount</th>
                        <th>Quantity</th>
                        <th>Status</th>
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
                              <td>{o.customer_first_name} {o.customer_last_name}</td>
                              <td>{new Date(o.created_at).toLocaleDateString()}</td>
                              <td className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</td>
                              <td>{o.items ? o.items.reduce((total, item) => total + (item.qty_full_out || 0), 0) : 0}</td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(o.status)}`}>
                                  {getStatusDisplayText(o.status)}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  <div className="row">
                    {(orders || []).map(o => (
                      <div key={o.id} className="col-12 col-sm-6 col-lg-4 mb-3">
                        <div className="card shadow-sm h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1">Order #{o.id}</h6>
                                <small className="text-muted">{new Date(o.created_at).toLocaleDateString()}</small>
                              </div>
                              <span className={`badge ${getStatusBadgeClass(o.status)}`}>
                                {getStatusDisplayText(o.status)}
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
                            
                            <div className="mb-0">
                              <small className="text-muted">Items:</small>
                              <div>{o.items ? o.items.reduce((total, item) => total + (item.qty_full_out || 0) + (item.qty_empty_in || 0), 0) : 0} item(s)</div>
                            </div>
                          </div>
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
                      disabled={currentPage === totalPages || totalPages === 0}
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