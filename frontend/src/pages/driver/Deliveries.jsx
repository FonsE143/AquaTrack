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
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Quantity</th>
                          <th>Status</th>
                          <th>Delivered At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(completedDeliveries) && completedDeliveries.length > 0 ? (
                          completedDeliveries.map(delivery => (
                            <tr key={delivery.id}>
                              <td>#{delivery.order_id}</td>
                              <td>
                                {delivery.customer_first_name} {delivery.customer_last_name}
                              </td>
                              <td>{delivery.customer_address}</td>
                              <td>{delivery.order_quantity}</td>
                              <td>
                                <span className={`badge ${
                                  delivery.status === 'delivered' ? 'bg-success' : 
                                  delivery.status === 'in_route' ? 'bg-primary' : 
                                  delivery.status === 'assigned' ? 'bg-warning' : 
                                  delivery.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-1">
                                  <Calendar size={14} className="text-muted" />
                                  <span>{formatDate(delivery.delivered_at)}</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-3">
                              No completed deliveries found
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