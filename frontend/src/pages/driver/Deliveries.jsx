// src/pages/driver/Deliveries.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Package, MapPin, Play, CheckCircle, X, Truck, Calendar } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { createStyledAlert, createStyledConfirm } from '../../utils/alertHelper'

export default function DriverDeliveries() {
  const items = [
    { label: 'Dashboard', href: '/driver/dashboard' },
    { label: 'Deliveries', href: '/driver/deliveries', active: true },
  ]

  const queryClient = useQueryClient()

  // Fetch deliveries for current driver
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: async () => (await api.get('/deliveries/my-deliveries/')).data.results || (await api.get('/deliveries/my-deliveries/')).data || [],
  })

  // Fetch driver's deployment
  const { data: myDeployment } = useQuery({
    queryKey: ['my-deployment'],
    queryFn: async () => {
      try {
        const response = await api.get('/deployments/my-deployment/')
        return response.data
      } catch (error) {
        console.error('Error fetching deployment:', error)
        return null
      }
    },
  })

  // Mutation for updating delivery status
  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ deliveryId, status, deliveredQuantity }) => {
      const data = { status };
      if (deliveredQuantity !== undefined) {
        data.delivered_quantity = deliveredQuantity;
      }
      return api.patch(`/deliveries/${deliveryId}/`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-deliveries'])
      createStyledAlert('success', 'Delivery Updated', 'Delivery status updated successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Update Failed', 'Failed to update delivery status: ' + (error.response?.data?.detail || error.message))
    }
  })

  // Get deliveries by status
  const pendingDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status === 'assigned')
    : []

  const inRouteDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status === 'in_route')
    : []

  const completedDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status === 'delivered')
    : []

  // Show all deliveries (including pending, in-route, and completed)
  const allDeliveries = Array.isArray(deliveries) ? deliveries : []

  // Handle start delivery
  const handleStartDelivery = (deliveryId) => {
    createStyledConfirm(
      'Start Delivery', 
      'Are you sure you want to start delivery for this order?', 
      () => updateDeliveryStatus.mutate({ deliveryId, status: 'in_route' })
    )
  }

  // Handle complete delivery with input for delivered quantity
  const handleCompleteDelivery = (delivery) => {
    createStyledConfirm(
      'Complete Delivery', 
      'Mark this delivery as completed?',
      (deliveredQuantity) => {
        // Validate delivered quantity
        const qty = parseInt(deliveredQuantity);
        if (isNaN(qty) || qty <= 0) {
          createStyledAlert('error', 'Invalid Quantity', 'Please enter a valid quantity greater than 0');
          return;
        }
        
        // Update delivery status and quantity
        updateDeliveryStatus.mutate({ 
          deliveryId: delivery.id, 
          status: 'delivered',
          deliveredQuantity: qty
        });
      },
      null,
      {
        inputLabel: 'Delivered Quantity',
        inputType: 'number',
        inputPlaceholder: 'Enter quantity delivered',
        inputRequired: true,
        inputValue: delivery.order_quantity
      }
    );
  }

  // Handle cancel delivery
  const handleCancelDelivery = (deliveryId) => {
    createStyledConfirm(
      'Cancel Delivery', 
      'Are you sure you want to cancel this delivery?', 
      () => updateDeliveryStatus.mutate({ deliveryId, status: 'cancelled' })
    )
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppShell role="driver" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Package className="text-primary" size={24} />
              <h1 className="h3 m-0">My Deliveries</h1>
            </div>
            <p className="text-muted mb-0">List of customer orders within your route</p>
          </div>
        </div>

        {/* Deployment Info */}
        {myDeployment && (
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <Truck className="text-primary" size={20} />
                    <h5 className="mb-0">Current Deployment</h5>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-6 col-md-3 mb-3 mb-md-0">
                      <div className="small text-muted">Product</div>
                      <div className="fw-medium">{myDeployment.product_name || 'N/A'}</div>
                    </div>
                    <div className="col-6 col-md-3 mb-3 mb-md-0">
                      <div className="small text-muted">Stock</div>
                      <div className="fw-medium">{myDeployment.stock || 0} units</div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="small text-muted">Route</div>
                      <div className="fw-medium">Route {myDeployment.route_number || 'N/A'}</div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="small text-muted">Vehicle</div>
                      <div className="fw-medium">{myDeployment.vehicle_name || 'N/A'} ({myDeployment.vehicle_plate_number || 'N/A'})</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {/* Deliveries Table - Showing Completed Orders */}
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <Package className="text-primary" size={20} />
                    <h5 className="mb-0">Deliveries</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  {/* Desktop View - Grouped by Status */}
                  <div className="d-none d-md-block">

                    
                    {/* In-Route Deliveries */}
                    {Array.isArray(inRouteDeliveries) && inRouteDeliveries.length > 0 && (
                      <div className="mb-4">
                        <div className="border-bottom p-3 bg-light">
                          <h6 className="mb-0">In-Route Deliveries</h6>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th className="d-none d-lg-table-cell">Address</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inRouteDeliveries.map(delivery => (
                                <tr key={delivery.id}>
                                  <td>#{delivery.order_id}</td>
                                  <td>
                                    {delivery.customer_first_name} {delivery.customer_last_name}
                                  </td>
                                  <td className="d-none d-lg-table-cell">{delivery.customer_address}</td>
                                  <td>{delivery.order_quantity}</td>
                                  <td>
                                    <span className="badge bg-primary">In Route</span>
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-success"
                                      onClick={() => handleCompleteDelivery(delivery)}
                                    >
                                      <CheckCircle size={14} className="me-1" /> Complete
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-danger ms-2"
                                      onClick={() => handleCancelDelivery(delivery.id)}
                                    >
                                      <X size={14} /> Cancel
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* Completed Deliveries */}
                    {Array.isArray(completedDeliveries) && completedDeliveries.length > 0 && (
                      <div>
                        <div className="border-bottom p-3 bg-light">
                          <h6 className="mb-0">Completed Deliveries</h6>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th className="d-none d-lg-table-cell">Address</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th className="d-none d-lg-table-cell">Delivered At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {completedDeliveries.map(delivery => (
                                <tr key={delivery.id}>
                                  <td>#{delivery.order_id}</td>
                                  <td>
                                    {delivery.customer_first_name} {delivery.customer_last_name}
                                  </td>
                                  <td className="d-none d-lg-table-cell">{delivery.customer_address}</td>
                                  <td>{delivery.order_quantity}</td>
                                  <td>
                                    <span className="badge bg-success">Delivered</span>
                                  </td>
                                  <td className="d-none d-lg-table-cell">
                                    <div className="d-flex align-items-center gap-1">
                                      <Calendar size={14} className="text-muted" />
                                      <span>{formatDate(delivery.delivered_at)}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* No Deliveries Message */}
                    {(!Array.isArray(deliveries) || deliveries.length === 0) && (
                      <div className="text-center py-5">
                        <Package size={48} className="text-muted mb-3" />
                        <p className="text-muted mb-0">No deliveries found</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile View - Grouped by Status */}
                  <div className="d-md-none">

                    
                    {/* In-Route Deliveries */}
                    {Array.isArray(inRouteDeliveries) && inRouteDeliveries.length > 0 && (
                      <div className="mb-4">
                        <div className="border-bottom p-3 bg-light">
                          <h6 className="mb-0">In-Route Deliveries</h6>
                        </div>
                        <div className="list-group list-group-flush">
                          {inRouteDeliveries.map(delivery => (
                            <div key={delivery.id} className="list-group-item border-0 px-3 py-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-1">Order #{delivery.order_id}</h6>
                                  <small className="text-muted">
                                    {delivery.customer_first_name} {delivery.customer_last_name}
                                  </small>
                                </div>
                                <span className="badge bg-primary">In Route</span>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Address:</small>
                                <div>{delivery.customer_address}</div>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Quantity:</small>
                                <div>{delivery.order_quantity}</div>
                              </div>
                              
                              <div className="d-grid gap-2">
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleCompleteDelivery(delivery)}
                                >
                                  <CheckCircle size={14} className="me-1" /> Complete Delivery
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleCancelDelivery(delivery.id)}
                                >
                                  <X size={14} className="me-1" /> Cancel Delivery
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Completed Deliveries */}
                    {Array.isArray(completedDeliveries) && completedDeliveries.length > 0 && (
                      <div>
                        <div className="border-bottom p-3 bg-light">
                          <h6 className="mb-0">Completed Deliveries</h6>
                        </div>
                        <div className="list-group list-group-flush">
                          {completedDeliveries.map(delivery => (
                            <div key={delivery.id} className="list-group-item border-0 px-3 py-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-1">Order #{delivery.order_id}</h6>
                                  <small className="text-muted">
                                    {delivery.customer_first_name} {delivery.customer_last_name}
                                  </small>
                                </div>
                                <span className="badge bg-success">Delivered</span>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Address:</small>
                                <div>{delivery.customer_address}</div>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Quantity:</small>
                                <div>{delivery.order_quantity}</div>
                              </div>
                              
                              <div>
                                <small className="text-muted">Delivered At:</small>
                                <div>
                                  <div className="d-flex align-items-center gap-1">
                                    <Calendar size={14} className="text-muted" />
                                    <span>{formatDate(delivery.delivered_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No Deliveries Message */}
                    {(!Array.isArray(deliveries) || deliveries.length === 0) && (
                      <div className="text-center py-5">
                        <Package size={48} className="text-muted mb-3" />
                        <p className="text-muted mb-0">No deliveries found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}