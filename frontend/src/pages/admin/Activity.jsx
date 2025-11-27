import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Activity, User } from 'lucide-react'

// Helper function to format meta data in a user-friendly way
const formatMetaData = (meta, action) => {
  if (!meta) return '-';
  
  const entries = [];
  
  // Special handling for update_order_status action
  if (action === 'update_order_status') {
    // Format status changes
    if (meta.from && meta.to) {
      entries.push(`Status changed from "${meta.from}" to "${meta.to}"`);
    } else if (meta.to) {
      entries.push(`Status set to "${meta.to}"`);
    }
    
    // Format driver assignment
    if (meta.driver_assigned !== undefined) {
      if (meta.driver_assigned === null) {
        entries.push('Driver unassigned');
      } else if (meta.driver_assigned) {
        entries.push(`Driver assigned (ID: ${meta.driver_assigned})`);
      }
    }
  } 
  // Special handling for assign_driver action
  else if (action === 'assign_driver') {
    if (meta.driver_assigned !== undefined) {
      if (meta.driver_assigned === null) {
        entries.push('Driver unassigned');
      } else if (meta.driver_assigned) {
        entries.push(`Driver assigned (ID: ${meta.driver_assigned})`);
      }
    }
    
    // Format status if present
    if (meta.from && meta.to) {
      entries.push(`Status: ${meta.from} → ${meta.to}`);
    } else if (meta.to) {
      entries.push(`Status: ${meta.to}`);
    }
  }
  // Generic handling for other actions
  else {
    // Format status changes
    if (meta.from && meta.to) {
      entries.push(`Status: ${meta.from} → ${meta.to}`);
    } else if (meta.to) {
      entries.push(`Status: ${meta.to}`);
    }
    
    // Format driver assignment
    if (meta.driver_assigned !== undefined) {
      if (meta.driver_assigned === null) {
        entries.push('Driver: Unassigned');
      } else {
        entries.push(`Driver ID: ${meta.driver_assigned}`);
      }
    }
    
    // Format other key-value pairs
    Object.keys(meta).forEach(key => {
      if (!['from', 'to', 'driver_assigned'].includes(key)) {
        entries.push(`${key}: ${meta[key]}`);
      }
    });
  }
  
  return entries.length > 0 ? entries.join(', ') : '-';
};

export default function AdminActivity() {
  const items = [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Orders', href:'/admin/orders' },
    { label:'Order History', href:'/admin/order-history' },
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
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Activity Log</h1>
            <p className="text-muted mb-0">View all system activities and user actions</p>
          </div>
        </div>
        
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Activity className="text-primary" size={20} />
              <h5 className="mb-0">Recent Activities ({Array.isArray(logs) ? logs.length : 0})</h5>
            </div>
          </div>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger m-3" role="alert">
                <strong>Error loading activity logs.</strong> Please try again.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(logs) && logs.length > 0 ? (
                        logs.map(log => (
                          <tr key={log.id}>
                            <td className="text-muted small">{new Date(log.timestamp).toLocaleString()}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                                  <User size={16} className="text-primary" />
                                </div>
                                <span>
                                  {log.actor_first_name || log.actor_last_name ? 
                                    `${log.actor_first_name || ''} ${log.actor_last_name || ''}`.trim() : 
                                    log.actor_username || 'System'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <strong>{log.action}</strong>
                            </td>
                            <td>{log.entity}</td>
                            <td className="small text-muted">
                              {formatMetaData(log.meta, log.action)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            <Activity size={48} className="text-muted mb-3" />
                            <h5 className="mb-1">No activities found</h5>
                            <p className="text-muted mb-0">There are no activities to display</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  {Array.isArray(logs) && logs.length > 0 ? (
                    logs.map(log => (
                      <div key={log.id} className="border-bottom p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="small text-muted">{new Date(log.timestamp).toLocaleString()}</div>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-1 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                              <User size={18} className="text-primary" />
                            </div>
                            <div className="small text-muted">
                              {log.actor_first_name || log.actor_last_name ? 
                                `${log.actor_first_name || ''} ${log.actor_last_name || ''}`.trim() : 
                                log.actor_username || 'System'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <strong>{log.action}</strong>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Entity:</small>
                          <div>{log.entity}</div>
                        </div>
                        
                        <div>
                          <small className="text-muted">Details:</small>
                          <div className="small text-muted">{formatMetaData(log.meta, log.action)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5">
                      <Activity size={48} className="text-muted mb-3" />
                      <h5 className="mb-1">No activities found</h5>
                      <p className="text-muted mb-0">There are no activities to display</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}