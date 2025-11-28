// src/pages/driver/Deliveries.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Package, MapPin, Play, CheckCircle, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'

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

  // Mutation for updating delivery status
  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ deliveryId, status }) => {
      return api.patch(`/deliveries/${deliveryId}/`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-deliveries'])
      alert('Delivery status updated successfully!')
    },
    onError: (error) => {
      alert('Failed to update delivery status: ' + (error.response?.data?.detail || error.message))
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
            <p className="text-muted mb-0">Checklist of customer orders within your route</p>
          </div>
        </div>

        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {/* Pending Deliveries */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-warning bg-opacity-10 p-2 text-warning">
                      <Package size={20} />
                    </div>
                    <h5 className="mb-0">Pending ({pendingDeliveries.length})</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  {pendingDeliveries.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {pendingDeliveries.map(delivery => (
                        <div key={delivery.id} className="list-group-item border-0 px-3 py-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-medium">Order #{delivery.order_id}</div>
                              <div className="small text-muted">
                                {delivery.customer_first_name} {delivery.customer_last_name}
                              </div>
                              <div className="small text-muted">
                                {delivery.customer_address}
                              </div>
                            </div>
                            <span className="badge bg-warning-subtle text-warning-emphasis">
                              Pending
                            </span>
                          </div>
                          <div className="small mb-2">
                            <strong>{delivery.order_product_name}</strong> × {delivery.order_quantity}
                          </div>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-success d-flex align-items-center gap-1"
                              onClick={() => handleStartDelivery(delivery.id)}
                              disabled={updateDeliveryStatus.isLoading}
                            >
                              <Play size={14} />
                              Start
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Package size={32} className="text-muted mb-2" />
                      <p className="text-muted mb-0">No pending deliveries</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* In-Route Deliveries */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-2 text-primary">
                      <MapPin size={20} />
                    </div>
                    <h5 className="mb-0">In Route ({inRouteDeliveries.length})</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  {inRouteDeliveries.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {inRouteDeliveries.map(delivery => (
                        <div key={delivery.id} className="list-group-item border-0 px-3 py-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-medium">Order #{delivery.order_id}</div>
                              <div className="small text-muted">
                                {delivery.customer_first_name} {delivery.customer_last_name}
                              </div>
                              <div className="small text-muted">
                                {delivery.customer_address}
                              </div>
                            </div>
                            <span className="badge bg-primary-subtle text-primary-emphasis">
                              In Route
                            </span>
                          </div>
                          <div className="small mb-2">
                            <strong>{delivery.order_product_name}</strong> × {delivery.order_quantity}
                          </div>
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MapPin size={32} className="text-muted mb-2" />
                      <p className="text-muted mb-0">No deliveries in route</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Completed Deliveries */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-success bg-opacity-10 p-2 text-success">
                      <CheckCircle size={20} />
                    </div>
                    <h5 className="mb-0">Completed ({completedDeliveries.length})</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  {completedDeliveries.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {completedDeliveries.map(delivery => (
                        <div key={delivery.id} className="list-group-item border-0 px-3 py-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-medium">Order #{delivery.order_id}</div>
                              <div className="small text-muted">
                                {delivery.customer_first_name} {delivery.customer_last_name}
                              </div>
                            </div>
                            <span className="badge bg-success-subtle text-success-emphasis">
                              Completed
                            </span>
                          </div>
                          <div className="small">
                            <strong>{delivery.order_product_name}</strong> × {delivery.order_quantity}
                          </div>
                          <div className="small text-muted mt-1">
                            Delivered at: {new Date(delivery.delivered_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle size={32} className="text-muted mb-2" />
                      <p className="text-muted mb-0">No completed deliveries</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}