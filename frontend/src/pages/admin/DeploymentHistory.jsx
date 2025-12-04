// src/pages/admin/DeploymentHistory.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Truck, Package, MapPin, User, Calendar } from 'lucide-react'

export default function AdminDeploymentHistory() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard', adminOnly: true },
    { label: 'Route', href: '/admin/route' , adminOnly: true },
    { label: 'Deployment', href: '/admin/deployment' , adminOnly: true },
    { label: 'Deployment History', href: '/admin/deployment-history' , adminOnly: true },
    { label: 'Employees', href: '/admin/employees', adminOnly: true  },
    { label: 'Customers', href: '/admin/customers', adminOnly: true  },
    { label: 'Products', href: '/admin/products', adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs', adminOnly: true  },
  ]

  // Fetch deployment history data (deployments with status 'returned' or 'completed')
  const { data: deployments, isLoading, error } = useQuery({
    queryKey: ['deployment-history'],
    queryFn: async () => {
      try {
        const response = await api.get('/deployments/?status=returned,completed')
        return response.data.results || response.data || []
      } catch (error) {
        console.error('Error fetching deployment history:', error)
        return []
      }
    },
  })

  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Truck className="text-primary" size={24} />
              <h1 className="h3 m-0">Deployment History</h1>
            </div>
            <p className="text-muted mb-0">View completed and returned deployments</p>
          </div>
        </div>

        {/* Deployment History Table */}
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package className="text-info" size={20} />
                  <h5 className="mb-0">Deployment Records</h5>
                </div>
              </div>
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="text-danger">Error loading deployment history</div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="table-responsive d-none d-md-block">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Deployment ID</th>
                            <th>Driver</th>
                            <th>Vehicle</th>
                            <th>Route</th>
                            <th>Product</th>
                            <th>Initial Stock</th>
                            <th>Stock</th>
                            <th>Returned Containers</th>
                            <th>Status</th>
                            <th>Date Created</th>
                            <th>Date Returned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(deployments) && deployments.length > 0 ? (
                            deployments.slice(0, 10).map((deployment) => (
                              <tr key={deployment.id}>
                                <td>#{deployment.deployment_id || deployment.id}</td>
                                <td>
                                  {deployment.driver_first_name || 'N/A'} {deployment.driver_last_name || ''}
                                </td>
                                <td>
                                  <div className="d-flex flex-column">
                                    <span>{deployment.vehicle_name || 'N/A'}</span>
                                    <small className="text-muted">{deployment.vehicle_plate_number || 'N/A'}</small>
                                  </div>
                                </td>
                                <td>Route {deployment.route_number || 'N/A'}</td>
                                <td>{deployment.product_name || 'N/A'}</td>
                                <td>{deployment.initial_stock || 0} units</td>
                                <td>{deployment.stock || 0} units</td>
                                <td>{deployment.returned_containers || 0} units</td>
                                <td>
                                  <span className={`badge ${
                                    deployment.status === 'returned' ? 'bg-warning' : 
                                    deployment.status === 'completed' ? 'bg-success' : 'bg-secondary'
                                  }`}>
                                    {deployment.status ? deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1) : 'N/A'}
                                  </span>
                                </td>
                                <td>{new Date(deployment.created_at).toLocaleDateString()}</td>
                                <td>{deployment.returned_at ? new Date(deployment.returned_at).toLocaleDateString() : 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="11" className="text-center py-3">
                                No deployment history found
                              </td>
                            </tr>
                          )}
                          {/* Fill remaining rows to maintain fixed height */}
                          {Array.isArray(deployments) && deployments.length > 0 && deployments.length < 10 && (
                            [...Array(10 - deployments.length)].map((_, index) => (
                              <tr key={`empty-${index}`}>
                                <td colSpan="11" className="py-3">&nbsp;</td>
                              </tr>
                            ))
                          )}
                          {Array.isArray(deployments) && deployments.length === 0 && (
                            [...Array(10)].map((_, index) => (
                              <tr key={`empty-${index}`}>
                                <td colSpan="11" className="py-3">&nbsp;</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="d-md-none p-3">
                      {Array.isArray(deployments) && deployments.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {deployments.slice(0, 10).map((deployment) => (
                            <div key={deployment.id} className="list-group-item border-0 px-0 py-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-1">#{deployment.deployment_id || deployment.id}</h6>
                                  <small className="text-muted">
                                    {deployment.driver_first_name || 'N/A'} {deployment.driver_last_name || ''}
                                  </small>
                                </div>
                                <span className={`badge ${
                                  deployment.status === 'returned' ? 'bg-warning' : 
                                  deployment.status === 'completed' ? 'bg-success' : 'bg-secondary'
                                }`}>
                                  {deployment.status ? deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1) : 'N/A'}
                                </span>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Vehicle:</small>
                                <div>{deployment.vehicle_name || 'N/A'} ({deployment.vehicle_plate_number || 'N/A'})</div>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Product:</small>
                                <div>{deployment.product_name || 'N/A'}</div>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Initial Stock:</small>
                                <div>{deployment.initial_stock || 0} units</div>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Stock:</small>
                                <div>{deployment.stock || 0} units</div>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Returned Containers:</small>
                                <div>{deployment.returned_containers || 0} units</div>
                              </div>
                              
                              <div className="d-flex justify-content-between">
                                <div>
                                  <small className="text-muted">Created:</small>
                                  <div>{new Date(deployment.created_at).toLocaleDateString()}</div>
                                </div>
                                <div>
                                  <small className="text-muted">Returned:</small>
                                  <div>{deployment.returned_at ? new Date(deployment.returned_at).toLocaleDateString() : 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <Package size={48} className="text-muted mb-3" />
                          <p className="text-muted mb-0">No deployment history found</p>
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