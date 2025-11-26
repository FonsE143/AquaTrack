// src/pages/customer/Notifications.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Bell } from 'lucide-react'

export default function CustomerNotifications(){
  const items = [
    { label:'Dashboard', href:'/customer/dashboard' },
    { label:'Order History', href:'/customer/order-history' },
    { label:'Notifications', href:'/customer/notifications', active:true },
  ]
  
  const { data, isLoading, error } = useQuery({ 
    queryKey:['notifications'], 
    queryFn: async()=> (await api.get('/notifications/')).data 
  })
  
  const notifications = data?.results || data || []
  
  return (
    <AppShell role="customer" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Notifications</h1>
            <p className="text-muted mb-0">View all your notifications and updates</p>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error loading notifications.</strong> Please try again.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}
        
        {/* Notifications List */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5">
                <Bell size={48} className="text-muted mb-3" />
                <h5 className="mb-1">No notifications yet</h5>
                <p className="text-muted mb-0">You don't have any notifications at the moment</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map(n => (
                  <div key={n.id} className="list-group-item border-0 px-4 py-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <p className="mb-1">{n.message}</p>
                        <small className="text-muted">
                          {new Date(n.sent_at).toLocaleString()}
                        </small>
                      </div>
                      <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">
                        {n.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}