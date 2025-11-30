// src/pages/driver/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, AlertTriangle, Package, CheckCircle, MapPin, Play, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { createStyledAlert, createStyledConfirm } from '../../utils/alertHelper'

export default function DriverDashboard() {
  const items = [
    { label: 'Dashboard', href: '/driver/dashboard', active: true },
    { label: 'Deliveries', href: '/driver/deliveries' },
  ]

  const queryClient = useQueryClient()

  // Fetch data
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: async () => (await api.get('/deliveries/my-deliveries/')).data.results || (await api.get('/deliveries/my-deliveries/')).data || [],
  })

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

  // Handle start delivery
  const handleStartDelivery = (deliveryId) => {
    createStyledConfirm(
      'Start Delivery', 
      'Are you sure you want to start delivery for this order?', 
      () => updateDeliveryStatus.mutate({ deliveryId, status: 'in_route' })
    )
  }

  // Handle complete delivery
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

  // Get today's deliveries
  const todaysDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => {
        const deliveryDate = new Date(d.created_at)
        const today = new Date()
        return deliveryDate.toDateString() === today.toDateString()
      })
    : []

  // Get completed deliveries
  const completedDeliveries = todaysDeliveries.filter(d => d.status === 'delivered')

  return (
    <AppShell role="driver" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Truck className="text-primary" size={24} />
              <h1 className="h3 m-0">Driver Dashboard</h1>
            </div>
            <p className="text-muted mb-0">Monitor stock levels and track deliveries</p>
          </div>
        </div>

        {/* Deployment Info - Stock Count Table */}
        {myDeployment && (
          <div className="row g-4 mb-4">
            {/* Stock Count Table */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <Package className="text-success" size={20} />
                    <h5 className="mb-0">Stock Count</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Product</th>
                          <th>Current Stock</th>
                          <th>Vehicle</th>
                          <th>Plate Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{myDeployment.product_name || 'N/A'}</td>
                          <td>
                            <span className="fw-bold">{myDeployment.stock || 0} units</span>
                          </td>
                          <td>{myDeployment.vehicle_name || 'N/A'}</td>
                          <td>{myDeployment.vehicle_plate_number || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Table - Municipality and Barangays */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <MapPin className="text-info" size={20} />
                    <h5 className="mb-0">Route Information</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Route Number</th>
                          <th>Municipality</th>
                          <th>Barangays</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Route {myDeployment.route_number || 'N/A'}</td>
                          <td>{myDeployment.municipality_names || 'N/A'}</td>
                          <td>
                            {myDeployment.barangay_names ? (
                              <div className="d-flex flex-wrap gap-1">
                                {myDeployment.barangay_names.split(', ').map((barangay, idx) => (
                                  <span key={idx} className="badge bg-secondary-subtle text-secondary-emphasis">
                                    {barangay}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Orders Table */}
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package className="text-primary" size={20} />
                  <h5 className="mb-0">Customer Orders</h5>
                </div>
              </div>
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Quantity</th>
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
                              <td>{delivery.order_quantity}</td>
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
                                      onClick={() => handleCompleteDelivery(delivery)}
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
                            <td colSpan="5" className="text-center py-3">
                              No deliveries found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}