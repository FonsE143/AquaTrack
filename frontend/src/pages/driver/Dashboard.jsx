// src/pages/driver/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, AlertTriangle, Package, CheckCircle, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export default function DriverDashboard() {
  const items = [
    { label: 'Dashboard', href: '/driver/dashboard', active: true },
    { label: 'Deliveries', href: '/driver/deliveries' },
  ]

  // Fetch data
  const { data: deliveries } = useQuery({
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

        {/* Recent Deliveries Table */}
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package className="text-primary" size={20} />
                  <h5 className="mb-0">Recent Deliveries</h5>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaysDeliveries.length > 0 ? (
                        todaysDeliveries.map(delivery => (
                          <tr key={delivery.id}>
                            <td>#{delivery.order_id}</td>
                            <td>{delivery.customer_first_name} {delivery.customer_last_name}</td>
                            <td>{delivery.order_product_name}</td>
                            <td>{delivery.order_quantity}</td>
                            <td>
                              <span className={`badge ${
                                delivery.status === 'delivered' ? 'bg-success-subtle text-success-emphasis' :
                                delivery.status === 'in_route' ? 'bg-primary-subtle text-primary-emphasis' :
                                'bg-warning-subtle text-warning-emphasis'
                              }`}>
                                {delivery.status}
                              </span>
                            </td>
                            <td>{new Date(delivery.created_at).toLocaleTimeString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-3">
                            No deliveries today
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
      </div>
    </AppShell>
  )
}