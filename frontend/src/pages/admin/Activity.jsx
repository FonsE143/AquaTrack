import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export default function AdminActivity() {
  const items = [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Orders', href:'/admin/orders' },
    { label:'Inventory', href:'/admin/inventory' },
    { label:'Users', href:'/admin/users' },
    { label:'Activity Log', href:'/admin/activity', active:true, adminOnly: true },
  ]

  const { data, isLoading, error } = useQuery({
    queryKey: ['activity'],
    queryFn: async () => (await api.get('/activity/')).data,
    enabled: true,
  })

  const logs = data?.results || data || []

  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        <h1 className="h3 mb-3">Activity Log</h1>
        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">Failed to load activity logs.</div>
        ) : (
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {logs.length === 0 ? (
                <div className="text-center text-muted py-4">No activity yet</div>
              ) : (
                <div className="list-group list-group-flush">
                  {logs.map(log => (
                    <div key={log.id} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <div className="small text-muted">{new Date(log.timestamp).toLocaleString()}</div>
                          <div><strong>{log.action}</strong> — {log.entity}</div>
                          <pre className="small mb-0">{JSON.stringify(log.meta)}</pre>
                        </div>
                        <div className="text-end small text-muted">{log.actor_username || 'System'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
