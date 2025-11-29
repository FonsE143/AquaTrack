// src/pages/driver/Deliveries.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Package, MapPin, Play, CheckCircle, X, Truck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { createStyledAlert } from '../../utils/alertHelper'

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
    mutationFn: async ({ deliveryId, status }) => {
      return api.patch(`/deliveries/${deliveryId}/`, { status })
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

  // Handle start delivery
  const handleStartDelivery = (deliveryId) => {
    if (confirm('Start delivery for this order?')) {
      updateDeliveryStatus.mutate({ deliveryId, status: 'in_route' })
    }
  }

  // Handle complete delivery
  const handleCompleteDelivery = (deliveryId) => {
    if (confirm('Mark this delivery as completed?')) {
      updateDeliveryStatus.mutate({ deliveryId, status: 'delivered' })
    }
  }

  // Handle cancel delivery
  const handleCancelDelivery = (deliveryId) => {
    if (confirm('Cancel this delivery?')) {
      updateDeliveryStatus.mutate({ deliveryId, status: 'cancelled' })
    }
  }

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
                    <div className="col-md-3">
                      <div className="small text-muted">Product</div>
                      <div className="fw-medium">{myDeployment.product_name || 'N/A'}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="small text-muted">Stock</div>
                      <div className="fw-medium">{myDeployment.stock || 0} units</div>
                    </div>
                    <div className="col-md-3">
                      <div className="small text-muted">Route</div>
                      <div className="fw-medium">Route {myDeployment.route_number || 'N/A'}</div>
                    </div>
                    <div className="col-md-3">
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
            {/* Customer Orders Table */}
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <Package className="text-primary" size={20} />
                    <h5 className="mb-0">Customer Orders</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(deliveries) && deliveries.length > 0 ? (
                          deliveries.map(delivery => (
                            <tr key={delivery.id}>
                              <td>#{delivery.order_id}</td>
                              <td>
                                {delivery.customer_first_name} {delivery.customer_last_name}
                              </td>
                              <td>{delivery.customer_address}</td>
                              <td>{delivery.order_product_name}</td>
                              <td>{delivery.order_quantity}</td>
                              <td>
                                <span className={`badge ${
                                  delivery.status === 'delivered' ? 'bg-success-subtle text-success-emphasis' :
                                  delivery.status === 'in_route' ? 'bg-primary-subtle text-primary-emphasis' :
                                  delivery.status === 'cancelled' ? 'bg-danger-subtle text-danger-emphasis' :
                                  'bg-warning-subtle text-warning-emphasis'
                                }`}>
                                  {delivery.status}
                                </span>
                              </td>
                              <td>
                                {delivery.status === 'assigned' && (
                                  <button 
                                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                    onClick={() => handleStartDelivery(delivery.id)}
                                    disabled={updateDeliveryStatus.isLoading}
                                  >
                                    <Play size={14} />
                                    Start
                                  </button>
                                )}
                                {delivery.status === 'in_route' && (
                                  <div className="d-flex gap-2">
                                    <button 
                                      className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                      onClick={() => handleCompleteDelivery(delivery.id)}
                                      disabled={updateDeliveryStatus.isLoading}
                                    >
                                      <CheckCircle size={14} />
                                      Complete
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                      onClick={() => handleCancelDelivery(delivery.id)}
                                      disabled={updateDeliveryStatus.isLoading}
                                    >
                                      <X size={14} />
                                      Cancel
                                    </button>
                                  </div>
                                )}
                                {(delivery.status === 'delivered' || delivery.status === 'cancelled') && (
                                  <span className="text-muted">No actions</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-3">
                              No deliveries found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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