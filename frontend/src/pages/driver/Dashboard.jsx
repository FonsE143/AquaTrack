// src/pages/driver/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, AlertTriangle, Package, CheckCircle } from 'lucide-react'
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

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get('/vehicles/')).data.results || (await api.get('/vehicles/')).data || [],
  })

  // Get stock levels
  const stockLevels = [
    { name: '5-Gallon Water', current: 45, threshold: 20, unit: 'units' },
    { name: '1-Gallon Water', current: 32, threshold: 15, unit: 'units' },
    { name: 'Dispensers', current: 8, threshold: 10, unit: 'units' },
    { name: 'Empty Containers', current: 25, threshold: 30, unit: 'units' },
  ]

  // Get low stock items
  const lowStockItems = stockLevels.filter(item => item.current < item.threshold)

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

        <div className="row g-4">
          {/* Stock Alerts */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <AlertTriangle className="text-warning" size={20} />
                  <h5 className="mb-0">Stock Alerts</h5>
                </div>
              </div>
              <div className="card-body">
                {lowStockItems.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {lowStockItems.map((item, index) => (
                      <div key={index} className="list-group-item border-0 px-0 py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-medium">{item.name}</div>
                            <div className="small text-muted">
                              Current: {item.current} {item.unit} | Threshold: {item.threshold} {item.unit}
                            </div>
                          </div>
                          <div className="badge bg-warning-subtle text-warning-emphasis">
                            Low Stock
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <CheckCircle size={32} className="text-success mb-2" />
                    <p className="text-muted mb-0">All stock levels are adequate</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Stats */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package className="text-info" size={20} />
                  <h5 className="mb-0">Today's Deliveries</h5>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-around gap-3">
                  <div className="text-center">
                    <div className="display-6 text-primary fw-bold">{todaysDeliveries.length}</div>
                    <div className="text-muted">Scheduled</div>
                  </div>
                  <div className="text-center">
                    <div className="display-6 text-success fw-bold">{completedDeliveries.length}</div>
                    <div className="text-muted">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="display-6 text-info fw-bold">
                      {todaysDeliveries.length > 0 
                        ? Math.round((completedDeliveries.length / todaysDeliveries.length) * 100) 
                        : 0}%
                    </div>
                    <div className="text-muted">Completion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Levels Table */}
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-header bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Package className="text-success" size={20} />
              <h5 className="mb-0">Stock Levels</h5>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Item</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLevels.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.current} {item.unit}</td>
                      <td>{item.threshold} {item.unit}</td>
                      <td>
                        <span className={`badge ${
                          item.current < item.threshold 
                            ? 'bg-warning-subtle text-warning-emphasis' 
                            : 'bg-success-subtle text-success-emphasis'
                        }`}>
                          {item.current < item.threshold ? 'Low Stock' : 'Adequate'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}