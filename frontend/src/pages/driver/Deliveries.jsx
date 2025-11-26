import React, { useState } from 'react'
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { api } from '../../api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export default function DriverDeliveries(){
  const items = [
    { label: 'Dashboard', href: '/driver/dashboard' },
    { label: 'Deliveries', href: '/driver/deliveries', active: true },
  ]

  const queryClient = useQueryClient()
  
  const { data: deliveries, isLoading, error } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const response = await api.get('/deliveries/')
      console.log('Deliveries response:', response.data);
      // Handle both paginated and non-paginated responses
      let deliveriesData;
      if (response.data.results) {
        deliveriesData = Array.isArray(response.data.results) ? response.data.results : []
      } else {
        deliveriesData = Array.isArray(response.data) ? response.data : []
      }
      
      console.log('Raw deliveries data:', deliveriesData);
      
      // Filter to show only deliveries for orders with "Out for Delivery" status
      const filteredDeliveries = deliveriesData.filter(d => 
        d.order && d.order.status === 'out'
      )
      
      console.log('Filtered deliveries data:', filteredDeliveries);
      return filteredDeliveries
    }
  })

  const markDelivered = useMutation({
    mutationFn: async (orderId) => {
      // Use the order process endpoint to mark delivered; server will create ActivityLog
      console.log('Marking order as delivered:', orderId)
      return api.post(`/orders/${orderId}/process/`, { status: 'delivered' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveries'])
      queryClient.invalidateQueries(['orders'])
    },
    onError: (err) => {
      console.error('Failed to mark delivered', err)
      // Show more detailed error message
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update delivery status'
      alert(`Failed to update delivery status: ${errorMessage}`)
    }
  })

  const markCancelled = useMutation({
    mutationFn: async (orderId) => {
      // Use the order process endpoint to mark cancelled
      console.log('Marking order as cancelled:', orderId)
      return api.post(`/orders/${orderId}/process/`, { status: 'cancelled' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveries'])
      queryClient.invalidateQueries(['orders'])
    },
    onError: (err) => {
      console.error('Failed to mark cancelled', err)
      // Show more detailed error message
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update delivery status'
      alert(`Failed to update delivery status: ${errorMessage}`)
    }
  })

  return (
    <AppShell role="driver" sidebar={<Sidebar items={items} />}>
      <div className="container py-4">
        <h2 className="mb-4">My Deliveries</h2>

        {isLoading && (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 mb-0">Loading deliveries...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error:</strong> Could not load deliveries: {error.message || 'Unknown error'}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}

        {!isLoading && !error && deliveries && deliveries.length === 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="text-muted mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-box-seam" viewBox="0 0 16 16">
                  <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.75a.5.5 0 0 1-.586.491l-7.5-2.25a.5.5 0 0 1-.228 0l-7.5 2.25A.5.5 0 0 1 0 12.25V3.5a.5.5 0 0 1 .414-.491L7.443.184z"/>
                </svg>
              </div>
              <h5 className="mb-1">No deliveries found</h5>
              <p className="text-muted mb-0">You don't have any assigned deliveries at the moment.</p>
            </div>
          </div>
        )}

        {!isLoading && !error && deliveries && deliveries.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Assigned Deliveries</h5>
                <span className="badge bg-primary">{deliveries.length} items</span>
              </div>
            </div>
            <div className="card-body p-0">
              {/* Desktop Table View */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Delivery Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div className="fw-medium">#{d.order_id || (d.order && d.order.id) || d.id || 'Unknown'}</div>
                        </td>
                        <td>
                          <div className="fw-medium">
                            {d.customer_first_name || d.customer_last_name ? 
                              `${d.customer_first_name || ''} ${d.customer_last_name || ''}`.trim() : 
                              'Unknown Customer'
                            }
                          </div>
                        </td>
                        <td>
                          <div className="text-muted small">
                            {d.customer_address || 'No address'}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted small">
                            {d.customer_phone || 'No phone'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            d.order && d.order.status === 'processing' ? 'bg-warning' :
                            d.order && d.order.status === 'out' ? 'bg-primary' :
                            d.order && d.order.status === 'delivered' ? 'bg-success' :
                            d.order && d.order.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {d.order && d.order.status ? d.order.status.charAt(0).toUpperCase() + d.order.status.slice(1) : 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            d.status === 'assigned' ? 'bg-info' :
                            d.status === 'enroute' ? 'bg-primary' :
                            d.status === 'completed' ? 'bg-success' : 'bg-secondary'
                          }`}>
                            {d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-2">
                            {(d.status === 'assigned' || d.status === 'enroute') && (
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => {
                                    const orderId = d.order_id || (d.order && d.order.id) || d.id;
                                    console.log('Marking delivered for order ID:', orderId, 'Delivery data:', d);
                                    markDelivered.mutate(orderId);
                                  }}
                                  disabled={markDelivered.isLoading}
                                >
                                  {markDelivered.isLoading ? 'Updating...' : 'Mark Delivered'}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    const orderId = d.order_id || (d.order && d.order.id) || d.id;
                                    console.log('Marking cancelled for order ID:', orderId, 'Delivery data:', d);
                                    markCancelled.mutate(orderId);
                                  }}
                                  disabled={markCancelled.isLoading}
                                >
                                  {markCancelled.isLoading ? 'Updating...' : 'Cancel Order'}
                                </button>
                              </div>
                            )}
                            {(d.order && d.order.status === 'delivered') && (
                              <span className="text-success">Delivered</span>
                            )}
                            {(d.order && d.order.status === 'cancelled') && (
                              <span className="text-danger">Cancelled</span>
                            )}
                            {d.status === 'completed' && !(d.order && (d.order.status === 'delivered' || d.order.status === 'cancelled')) && (
                              <span className="text-muted">Completed</span>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="d-md-none">
                <div className="list-group list-group-flush">
                  {deliveries.filter(d => 
                    d.order && d.order.status === 'out'
                  ).map(d => (
                    <div key={d.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">Order #{d.order_id || (d.order && d.order.id) || d.id || 'Unknown'}</h6>
                          <span className={`badge ${
                            d.status === 'assigned' ? 'bg-info' :
                            d.status === 'enroute' ? 'bg-primary' :
                            d.status === 'completed' ? 'bg-success' : 'bg-secondary'
                          }`}>
                            {d.status ? d.status.charAt(0).toUpperCase() + d.status.slice(1) : 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className={`badge bg-primary`}>
                            Out for Delivery
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted">Customer:</small>
                        <div className="fw-medium">
                          {d.customer_first_name || d.customer_last_name ? 
                            `${d.customer_first_name || ''} ${d.customer_last_name || ''}`.trim() : 
                            'Unknown Customer'
                          }
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted">Address:</small>
                        <div>{d.customer_address || 'No address'}</div>
                      </div>
                      
                      <div className="mb-3">
                        <small className="text-muted">Phone:</small>
                        <div>{d.customer_phone || 'No phone'}</div>
                      </div>
                      
                      {(d.status === 'assigned' || d.status === 'enroute') && (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-success flex-fill"
                            onClick={() => {
                              const orderId = d.order_id || (d.order && d.order.id) || d.id;
                              console.log('Marking delivered for order ID:', orderId, 'Delivery data:', d);
                              markDelivered.mutate(orderId);
                            }}
                            disabled={markDelivered.isLoading}
                          >
                            {markDelivered.isLoading ? 'Updating...' : 'Mark Delivered'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger flex-fill"
                            onClick={() => {
                              const orderId = d.order_id || (d.order && d.order.id) || d.id;
                              console.log('Marking cancelled for order ID:', orderId, 'Delivery data:', d);
                              markCancelled.mutate(orderId);
                            }}
                            disabled={markCancelled.isLoading}
                          >
                            {markCancelled.isLoading ? 'Updating...' : 'Cancel'}
                          </button>
                        </div>
                      )}
                      
                      {(d.order && d.order.status === 'delivered') && (
                        <div className="text-center text-success">
                          Delivered
                        </div>
                      )}
                      
                      {(d.order && d.order.status === 'cancelled') && (
                        <div className="text-center text-danger">
                          Cancelled
                        </div>
                      )}
                      
                      {d.status === 'completed' && !(d.order && (d.order.status === 'delivered' || d.order.status === 'cancelled')) && (
                        <div className="text-center text-muted">
                          Completed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}