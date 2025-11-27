// src/pages/admin/Users.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Users, User } from 'lucide-react'

export default function AdminUsers() {
  const items = [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Orders', href:'/admin/orders' },
    { label:'Order History', href:'/admin/order-history' },
    { label:'Inventory', href:'/admin/inventory' },
    { label:'Users', href:'/admin/users', active:true },
    { label: 'Activity Log', href: '/admin/activity', adminOnly: true },
  ]
  
  const { data: customers, isLoading: customersLoading, error: customersError } = useQuery({ 
    queryKey:['customers'], 
    queryFn: async()=> (await api.get('/customers/')).data 
  })
  
  const { data: staff, isLoading: staffLoading, error: staffError } = useQuery({ 
    queryKey:['staff'], 
    queryFn: async()=> (await api.get('/staff/')).data 
  })
  
  const customerList = customers?.results || customers || []
  const staffList = staff?.results || staff || []
  
  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">User Management</h1>
            <p className="text-muted mb-0">View and manage all users in the system</p>
          </div>
        </div>
        
        <div className="row g-4">
          {/* Customers Section */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Users className="text-primary" size={20} />
                  <h5 className="mb-0">Customers ({Array.isArray(customerList) ? customerList.length : 0})</h5>
                </div>
              </div>
              <div className="card-body p-0">
                {customersLoading ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : customersError ? (
                  <div className="alert alert-danger m-3" role="alert">
                    <strong>Error loading customers.</strong> Please try again.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="table-responsive d-none d-md-block">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(customerList) && customerList.length > 0 ? (
                            customerList.map(u => (
                              <tr key={u.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                                      <User size={16} className="text-primary" />
                                    </div>
                                    <span className="fw-medium">{u.first_name} {u.last_name}</span>
                                  </div>
                                </td>
                                <td>{u.email}</td>
                                <td>{u.phone || '-'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="text-center py-5">
                                <Users size={48} className="text-muted mb-3" />
                                <h5 className="mb-1">No customers found</h5>
                                <p className="text-muted mb-0">There are no customers to display</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="d-md-none">
                      {Array.isArray(customerList) && customerList.length > 0 ? (
                        customerList.map(u => (
                          <div key={u.id} className="border-bottom p-3">
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle bg-primary bg-opacity-10 p-1 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                                <User size={18} className="text-primary" />
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-0 fw-medium small">{u.first_name} {u.last_name}</h6>
                                <p className="mb-0 text-muted small">{u.email}</p>
                                <p className="mb-0 text-muted small">Phone: {u.phone || '-'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5">
                          <Users size={48} className="text-muted mb-3" />
                          <h5 className="mb-1">No customers found</h5>
                          <p className="text-muted mb-0">There are no customers to display</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Staff Section */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Users className="text-success" size={20} />
                  <h5 className="mb-0">Staff ({Array.isArray(staffList) ? staffList.length : 0})</h5>
                </div>
              </div>
              <div className="card-body p-0">
                {staffLoading ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : staffError ? (
                  <div className="alert alert-danger m-3" role="alert">
                    <strong>Error loading staff.</strong> Please try again.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="table-responsive d-none d-md-block">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(staffList) && staffList.length > 0 ? (
                            staffList.map(u => (
                              <tr key={u.id}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="rounded-circle bg-success bg-opacity-10 p-2">
                                      <User size={16} className="text-success" />
                                    </div>
                                    <span className="fw-medium">{u.first_name} {u.last_name}</span>
                                  </div>
                                </td>
                                <td>{u.email}</td>
                                <td>{u.phone || '-'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="text-center py-5">
                                <Users size={48} className="text-muted mb-3" />
                                <h5 className="mb-1">No staff found</h5>
                                <p className="text-muted mb-0">There are no staff members to display</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="d-md-none">
                      {Array.isArray(staffList) && staffList.length > 0 ? (
                        staffList.map(u => (
                          <div key={u.id} className="border-bottom p-3">
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle bg-success bg-opacity-10 p-1 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                                <User size={18} className="text-success" />
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-0 fw-medium small">{u.first_name} {u.last_name}</h6>
                                <p className="mb-0 text-muted small">{u.email}</p>
                                <p className="mb-0 text-muted small">Phone: {u.phone || '-'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5">
                          <Users size={48} className="text-muted mb-3" />
                          <h5 className="mb-1">No staff found</h5>
                          <p className="text-muted mb-0">There are no staff members to display</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}