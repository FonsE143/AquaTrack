import React, { useState } from 'react'
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export default function DriverDashboard(){
  const items = [
    { label: 'Dashboard', href: '/driver/dashboard', active: true },
    { label: 'Deliveries', href: '/driver/deliveries' },
  ]
  
  const [activityPage, setActivityPage] = useState(1)
  const activityPageSize = 5

  // Get driver's deliveries to calculate statistics
  const { data: deliveries } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const response = await api.get('/deliveries/')
      // Handle both paginated and non-paginated responses
      let deliveriesData;
      if (response.data.results) {
        deliveriesData = Array.isArray(response.data.results) ? response.data.results : []
      } else {
        deliveriesData = Array.isArray(response.data) ? response.data : []
      }
      
      // Filter out processing, delivered and cancelled orders as a safety measure
      return deliveriesData.filter(d => 
        d.order && d.order.status === 'out'
      )
    }
  })
  
  // Get driver's activity logs
  const { data: activityLogs } = useQuery({
    queryKey: ['activity', activityPage],
    queryFn: async () => {
      const response = await api.get(`/activity/`)
      // Handle both paginated and non-paginated responses
      let activityData;
      if (response.data.results) {
        activityData = Array.isArray(response.data.results) ? response.data.results : []
      } else {
        activityData = Array.isArray(response.data) ? response.data : []
      }
      
      // Filter out activities that are not relevant to order status updates for delivered orders
      return activityData.filter(log => {
        if (log.action === 'update_order_status' && log.meta) {
          // Show all status updates except those that are just confirming already delivered orders
          return !(log.meta.to === 'delivered' && log.meta.from === 'delivered')
        }
        return true
      })
    }
  })

  // Calculate statistics
  const ordersInRoute = deliveries ? deliveries.filter(d => 
    d.status === 'enroute' && d.order && d.order.status === 'out'
  ).length : 0
  
  const deliveredOrders = deliveries ? deliveries.filter(d => 
    d.status === 'completed' && d.order && d.order.status === 'delivered'
  ).length : 0

  // Paginate activity logs
  const paginatedActivityLogs = activityLogs ? activityLogs.slice(
    (activityPage - 1) * activityPageSize,
    activityPage * activityPageSize
  ) : []
  
  const totalPages = activityLogs ? Math.ceil(activityLogs.length / activityPageSize) : 0

  return (
    <AppShell role="driver" sidebar={<Sidebar items={items} />}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Driver Dashboard</h2>
          <Link to="/driver/deliveries" className="btn btn-outline-primary">View Deliveries</Link>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title">Orders in Route</h5>
                    <h2 className="mb-0 text-primary">{ordersInRoute}</h2>
                  </div>
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-truck text-primary" viewBox="0 0 16 16">
                      <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5v-7zm1.294 7.458A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.458zM12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H14v-2a2 2 0 0 1-2-2z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title">Delivered Orders</h5>
                    <h2 className="mb-0 text-success">{deliveredOrders}</h2>
                  </div>
                  <div className="rounded-circle bg-success bg-opacity-10 p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-check-circle text-success" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Activity Log */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">My Activity History</h5>
          </div>
          <div className="card-body">
            {/* Desktop Table View */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Entity</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedActivityLogs.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">
                        No activity found
                      </td>
                    </tr>
                  ) : (
                    paginatedActivityLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <div className="fw-medium">
                            {log.action === 'update_order_status' ? 'Order Status Updated' : log.action}
                          </div>
                          <div className="text-muted small">
                            {log.meta ? (
                              log.action === 'update_order_status' ? (
                                <>
                                  Order {log.entity?.replace('order:', '')} changed from{' '}
                                  <span className="badge bg-warning">
                                    {log.meta.from === 'processing' ? 'Processing' : 
                                     log.meta.from === 'out' ? 'Out for Delivery' : 
                                     log.meta.from === 'delivered' ? 'Delivered' : 
                                     log.meta.from === 'cancelled' ? 'Cancelled' : log.meta.from}
                                  </span>{' '}
                                  to{' '}
                                  <span className="badge bg-success">
                                    {log.meta.to === 'processing' ? 'Processing' : 
                                     log.meta.to === 'out' ? 'Out for Delivery' : 
                                     log.meta.to === 'delivered' ? 'Delivered' : 
                                     log.meta.to === 'cancelled' ? 'Cancelled' : log.meta.to}
                                  </span>
                                </>
                              ) : (
                                JSON.stringify(log.meta)
                              )
                            ) : (
                              'No details'
                            )}
                          </div>
                        </td>
                        <td>
                          {log.entity === 'order' ? 'Order' : 
                           log.entity?.startsWith('order:') ? `Order #${log.entity.replace('order:', '')}` : 
                           log.entity || 'N/A'}
                        </td>
                        <td>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View */}
            <div className="d-md-none">
              <div className="list-group list-group-flush">
                {paginatedActivityLogs.length === 0 ? (
                  <div className="list-group-item text-center text-muted">
                    No activity found
                  </div>
                ) : (
                  paginatedActivityLogs.map(log => (
                    <div key={log.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">
                            {log.action === 'update_order_status' ? 'Order Status Updated' : log.action}
                          </h6>
                          <small className="text-muted">
                            {new Date(log.timestamp).toLocaleString()}
                          </small>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted">Entity:</small>
                        <div>
                          {log.entity === 'order' ? 'Order' : 
                           log.entity?.startsWith('order:') ? `Order #${log.entity.replace('order:', '')}` : 
                           log.entity || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="mb-0">
                        <small className="text-muted">Details:</small>
                        <div className="text-muted small">
                          {log.meta ? (
                            log.action === 'update_order_status' ? (
                              <>
                                Order {log.entity?.replace('order:', '')} changed from{' '}
                                <span className="badge bg-warning">
                                  {log.meta.from === 'processing' ? 'Processing' : 
                                   log.meta.from === 'out' ? 'Out for Delivery' : 
                                   log.meta.from === 'delivered' ? 'Delivered' : 
                                   log.meta.from === 'cancelled' ? 'Cancelled' : log.meta.from}
                                </span>{' '}
                                to{' '}
                                <span className="badge bg-success">
                                  {log.meta.to === 'processing' ? 'Processing' : 
                                   log.meta.to === 'out' ? 'Out for Delivery' : 
                                   log.meta.to === 'delivered' ? 'Delivered' : 
                                   log.meta.to === 'cancelled' ? 'Cancelled' : log.meta.to}
                                </span>
                              </>
                            ) : (
                              JSON.stringify(log.meta)
                            )
                          ) : (
                            'No details'
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setActivityPage(prev => Math.max(prev - 1, 1))}
                  disabled={activityPage === 1}
                >
                  Previous
                </button>
                <small className="text-muted">
                  Page {activityPage} of {totalPages}
                </small>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setActivityPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={activityPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}