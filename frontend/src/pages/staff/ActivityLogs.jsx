// src/pages/staff/ActivityLogs.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Clock, User, Package, Truck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useMemo } from 'react'

export default function StaffActivityLogs() {
  const items = [
    { label: 'Dashboard', href: '/staff/dashboard' },
    { label: 'Deployment', href: '/staff/deployment' },
    { label: 'Activity Logs', href: '/staff/activity-logs', active: true },
  ]

  // Fetch activity logs for current user
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['my-activity-logs'],
    queryFn: async () => {
      // Fetch only current user's activity logs
      const response = await api.get('/activity/my-logs/')
      // Handle pagination if present
      let logs = response.data.results || response.data || []
      return Array.isArray(logs) ? logs : []
    },
  })

  // Fetch additional data for enrichment
  const { data: drivers } = useQuery({
    queryKey: ['drivers-for-staff-logs'],
    queryFn: async () => {
      const response = await api.get('/drivers/')
      const driversData = response.data.results || response.data || []
      return Array.isArray(driversData) ? driversData : []
    },
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-staff-logs'],
    queryFn: async () => {
      const response = await api.get('/vehicles/')
      const vehiclesData = response.data.results || response.data || []
      return Array.isArray(vehiclesData) ? vehiclesData : []
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products-for-staff-logs'],
    queryFn: async () => {
      const response = await api.get('/products/')
      const productsData = response.data.results || response.data || []
      return Array.isArray(productsData) ? productsData : []
    },
  })

  // Create lookup maps for enrichment
  const driverMap = useMemo(() => {
    if (!drivers) return {}
    const map = {}
    drivers.forEach(driver => {
      map[driver.id] = `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || driver.user_username
    })
    return map
  }, [drivers])

  const vehicleMap = useMemo(() => {
    if (!vehicles) return {}
    const map = {}
    vehicles.forEach(vehicle => {
      map[vehicle.id] = vehicle.name
    })
    return map
  }, [vehicles])

  const productMap = useMemo(() => {
    if (!products) return {}
    const map = {}
    products.forEach(product => {
      map[product.id] = product.name
    })
    return map
  }, [products])

  // Icon mapping
  const getIcon = (action) => {
    if (action.includes('order') || action.includes('Order')) return <Package size={16} />
    if (action.includes('delivery') || action.includes('Delivery')) return <Truck size={16} />
    if (action.includes('deployment') || action.includes('Deployment')) return <Truck size={16} />
    return <User size={16} />
  }

  // Format metadata for display
  const formatMetadata = (meta, entityType) => {
    if (!meta || Object.keys(meta).length === 0) return null

    const formattedItems = []

    // Handle different entity types
    if (entityType === 'deployment') {
      if (meta.deployment_id) {
        formattedItems.push(`Deployment: #${meta.deployment_id}`)
      }
      if (meta.driver_id && driverMap[meta.driver_id]) {
        formattedItems.push(`Driver: ${driverMap[meta.driver_id]}`)
      }
      if (meta.vehicle_id && vehicleMap[meta.vehicle_id]) {
        formattedItems.push(`Vehicle: ${vehicleMap[meta.vehicle_id]}`)
      }
      if (meta.product_id && productMap[meta.product_id]) {
        formattedItems.push(`Product: ${productMap[meta.product_id]}`)
      }
      if (meta.stock !== undefined) {
        formattedItems.push(`Stock: ${meta.stock}`)
      }
    } else if (entityType === 'order') {
      if (meta.order_id) {
        formattedItems.push(`Order: #${meta.order_id}`)
      }
      if (meta.product) {
        formattedItems.push(`Product: ${meta.product}`)
      }
      if (meta.quantity) {
        formattedItems.push(`Quantity: ${meta.quantity}`)
      }
      if (meta.customer) {
        formattedItems.push(`Customer: ${meta.customer}`)
      }
    } else if (entityType === 'delivery') {
      if (meta.delivery_id) {
        formattedItems.push(`Delivery: #${meta.delivery_id}`)
      }
      if (meta.order_id) {
        formattedItems.push(`Order: #${meta.order_id}`)
      }
      if (meta.status) {
        formattedItems.push(`Status: ${meta.status}`)
      }
      if (meta.driver) {
        formattedItems.push(`Driver: ${meta.driver}`)
      }
    } else {
      // Generic handling for other metadata
      Object.entries(meta).forEach(([key, value]) => {
        // Skip ID fields that we've already handled
        if (!key.endsWith('_id') || !driverMap[value] || !vehicleMap[value] || !productMap[value]) {
          formattedItems.push(`${key.replace(/_/g, ' ')}: ${value}`)
        }
      })
    }

    return formattedItems
  }

  return (
    <AppShell role="staff" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Clock className="text-primary" size={24} />
              <h1 className="h3 m-0">My Activity Logs</h1>
            </div>
            <p className="text-muted mb-0">View your activity history</p>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <User className="text-success" size={20} />
              <h5 className="mb-0">Activity History</h5>
            </div>
          </div>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : Array.isArray(activityLogs) && activityLogs.length > 0 ? (
              <>
                {/* Desktop View */}
                <div className="d-none d-md-block">
                  <div className="list-group list-group-flush">
                    {activityLogs.map(log => {
                      const formattedMeta = formatMetadata(log.meta, log.entity)
                      return (
                        <div key={log.id} className="list-group-item border-0 px-3 py-3">
                          <div className="d-flex align-items-start gap-3">
                            <div className="mt-1 text-success">
                              {getIcon(log.action)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex flex-wrap justify-content-between gap-2">
                                <div className="fw-medium">
                                  {log.action.replace(/_/g, ' ')}
                                </div>
                                <div className="small text-muted">
                                  {new Date(log.timestamp).toLocaleString()}
                                </div>
                              </div>
                              <div className="small text-muted mt-1">
                                {log.entity}
                              </div>
                              {formattedMeta && formattedMeta.length > 0 && (
                                <div className="small mt-2">
                                  {formattedMeta.map((item, index) => (
                                    <span key={index} className="badge bg-light text-dark me-1">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Mobile View */}
                <div className="d-md-none">
                  <div className="row g-3 p-3">
                    {activityLogs.map(log => {
                      const formattedMeta = formatMetadata(log.meta, log.entity)
                      return (
                        <div key={log.id} className="col-12">
                          <div className="card shadow-sm border">
                            <div className="card-body">
                              <div className="d-flex align-items-start gap-3">
                                <div className="mt-1 text-success">
                                  {getIcon(log.action)}
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex flex-wrap justify-content-between gap-2">
                                    <div className="fw-medium">
                                      {log.action.replace(/_/g, ' ')}
                                    </div>
                                    <div className="small text-muted">
                                      {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="small text-muted mt-1">
                                    {log.entity}
                                  </div>
                                  {formattedMeta && formattedMeta.length > 0 && (
                                    <div className="small mt-2">
                                      {formattedMeta.map((item, index) => (
                                        <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <Clock size={48} className="text-muted mb-3" />
                <h5 className="mb-1">No Activity Logs</h5>
                <p className="text-muted mb-0">You don't have any activity logs yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}