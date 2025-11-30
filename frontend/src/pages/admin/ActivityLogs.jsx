// src/pages/admin/ActivityLogs.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Clock, User, Package, Truck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState, useMemo } from 'react'

export default function AdminActivityLogs() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Route', href: '/admin/route' },
    { label: 'Deployment', href: '/admin/deployment' },
    { label: 'Employees', href: '/admin/employees' },
    { label: 'Products', href: '/admin/products', adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs', active: true },
  ]

  const [filter, setFilter] = useState('today') // 'today', 'all', or 'yesterday'

  // Fetch activity logs
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const response = await api.get('/activity/')
      // Handle pagination if present
      const logs = response.data.results || response.data || []
      return Array.isArray(logs) ? logs : []
    },
  })

  // Fetch additional data for enrichment
  const { data: drivers } = useQuery({
    queryKey: ['drivers-for-logs'],
    queryFn: async () => {
      const response = await api.get('/drivers/')
      const driversData = response.data.results || response.data || []
      return Array.isArray(driversData) ? driversData : []
    },
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-logs'],
    queryFn: async () => {
      const response = await api.get('/vehicles/')
      const vehiclesData = response.data.results || response.data || []
      return Array.isArray(vehiclesData) ? vehiclesData : []
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products-for-logs'],
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

  // Filter logs based on selected filter
  const filteredLogs = Array.isArray(activityLogs) 
    ? activityLogs.filter(log => {
        if (filter === 'all') return true
        
        const logDate = new Date(log.timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        
        if (filter === 'today') {
          return logDate.toDateString() === today.toDateString()
        } else if (filter === 'yesterday') {
          return logDate.toDateString() === yesterday.toDateString()
        }
        return true
      })
    : []

  // Get logs by role
  const staffLogs = filteredLogs.filter(log => log.actor_role === 'staff')
  const driverLogs = filteredLogs.filter(log => log.actor_role === 'driver')

  // Icon mapping
  const getIcon = (action) => {
    if (action.includes('order') || action.includes('Order')) return <Package size={16} />
    if (action.includes('delivery') || action.includes('Delivery')) return <Truck size={16} />
    if (action.includes('deployment') || action.includes('Deployment')) return <Truck size={16} />
    return <User size={16} />
  }

  // Get actor name
  const getActorName = (log) => {
    if (log.actor_first_name || log.actor_last_name) {
      return `${log.actor_first_name || ''} ${log.actor_last_name || ''}`.trim()
    }
    return log.actor_username || 'Unknown User'
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
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Clock className="text-primary" size={24} />
              <h1 className="h3 m-0">Activity Logs</h1>
            </div>
            <p className="text-muted mb-0">Monitor all activities by staff and drivers</p>
          </div>
          
          {/* Filter buttons */}
          <div className="d-flex gap-2">
            <button 
              className={`btn btn-sm ${filter === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('today')}
            >
              Today
            </button>
            <button 
              className={`btn btn-sm ${filter === 'yesterday' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('yesterday')}
            >
              Yesterday
            </button>
            <button 
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
          </div>
        </div>

        <div className="row g-4">
          {/* Staff Activities */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <User className="text-success" size={20} />
                  <h5 className="mb-0">Staff Activities</h5>
                  <span className="badge bg-success-subtle text-success-emphasis">
                    {staffLogs.length}
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : staffLogs.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {staffLogs.map(log => {
                      const formattedMeta = formatMetadata(log.meta, log.entity)
                      return (
                        <div key={log.id} className="list-group-item border-0 px-3 py-2">
                          <div className="d-flex align-items-start gap-2">
                            <div className="mt-1 text-success">
                              {getIcon(log.action)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <div className="fw-medium">
                                  {getActorName(log)}
                                </div>
                                <div className="small text-muted">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className="small text-muted">
                                {log.action.replace(/_/g, ' ')} - {log.entity}
                              </div>
                              {formattedMeta && formattedMeta.length > 0 && (
                                <div className="small mt-1">
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
                ) : (
                  <div className="text-center py-5">
                    <User size={48} className="text-muted mb-3" />
                    <h5 className="mb-1">No Staff Activities</h5>
                    <p className="text-muted mb-0">
                      {filter === 'today' ? 'No activities recorded for staff today' : 
                       filter === 'yesterday' ? 'No activities recorded for staff yesterday' : 
                       'No staff activities found'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Driver Activities */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Truck className="text-info" size={20} />
                  <h5 className="mb-0">Driver Activities</h5>
                  <span className="badge bg-info-subtle text-info-emphasis">
                    {driverLogs.length}
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : driverLogs.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {driverLogs.map(log => {
                      const formattedMeta = formatMetadata(log.meta, log.entity)
                      return (
                        <div key={log.id} className="list-group-item border-0 px-3 py-2">
                          <div className="d-flex align-items-start gap-2">
                            <div className="mt-1 text-info">
                              {getIcon(log.action)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <div className="fw-medium">
                                  {getActorName(log)}
                                </div>
                                <div className="small text-muted">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className="small text-muted">
                                {log.action.replace(/_/g, ' ')} - {log.entity}
                              </div>
                              {formattedMeta && formattedMeta.length > 0 && (
                                <div className="small mt-1">
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
                ) : (
                  <div className="text-center py-5">
                    <Truck size={48} className="text-muted mb-3" />
                    <h5 className="mb-1">No Driver Activities</h5>
                    <p className="text-muted mb-0">
                      {filter === 'today' ? 'No activities recorded for drivers today' : 
                       filter === 'yesterday' ? 'No activities recorded for drivers yesterday' : 
                       'No driver activities found'}
                    </p>
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