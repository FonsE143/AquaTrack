// src/pages/admin/ActivityLogs.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Clock, User, Package, Truck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'

export default function AdminActivityLogs() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Route', href: '/admin/route' },
    { label: 'Deployment', href: '/admin/deployment' },
    { label: 'Employees', href: '/admin/employees' },
    { label: 'Activity Logs', href: '/admin/activity-logs', active: true },
  ]

  const [filter, setFilter] = useState('today') // 'today', 'all', or 'yesterday'

  // Fetch activity logs
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => (await api.get('/activity-logs/')).data.results || (await api.get('/activity-logs/')).data || [],
  })

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
                    {staffLogs.map(log => (
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
                              {log.action} - {log.entity}
                            </div>
                            {log.meta && Object.keys(log.meta).length > 0 && (
                              <div className="small mt-1">
                                {Object.entries(log.meta).map(([key, value]) => (
                                  <span key={key} className="badge bg-light text-dark me-1">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    {driverLogs.map(log => (
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
                              {log.action} - {log.entity}
                            </div>
                            {log.meta && Object.keys(log.meta).length > 0 && (
                              <div className="small mt-1">
                                {Object.entries(log.meta).map(([key, value]) => (
                                  <span key={key} className="badge bg-light text-dark me-1">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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