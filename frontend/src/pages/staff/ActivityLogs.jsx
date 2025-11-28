// src/pages/staff/ActivityLogs.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Clock, User, Package, Truck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

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
      let logs = response.data || []
      return Array.isArray(logs) ? logs : []
    },
  })

  // Icon mapping
  const getIcon = (action) => {
    if (action.includes('order') || action.includes('Order')) return <Package size={16} />
    if (action.includes('delivery') || action.includes('Delivery')) return <Truck size={16} />
    if (action.includes('deployment') || action.includes('Deployment')) return <Truck size={16} />
    return <User size={16} />
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
              <div className="list-group list-group-flush">
                {activityLogs.map(log => (
                  <div key={log.id} className="list-group-item border-0 px-3 py-3">
                    <div className="d-flex align-items-start gap-3">
                      <div className="mt-1 text-success">
                        {getIcon(log.action)}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap justify-content-between gap-2">
                          <div className="fw-medium">
                            {log.action}
                          </div>
                          <div className="small text-muted">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="small text-muted mt-1">
                          {log.entity}
                        </div>
                        {log.meta && Object.keys(log.meta).length > 0 && (
                          <div className="small mt-2">
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