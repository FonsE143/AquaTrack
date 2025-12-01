// src/pages/admin/Customer.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Users, User, MapPin, Phone } from 'lucide-react'

export default function AdminCustomer() {
  const items = [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Route', href:'/admin/route' },
    { label:'Deployment', href:'/admin/deployment' },
    { label:'Employees', href:'/admin/employees' },
    { label:'Customers', href:'/admin/customers', active:true },
    { label:'Products', href:'/admin/products', adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs', adminOnly: true },
  ]
  
  const { data: customers, isLoading: customersLoading, error: customersError } = useQuery({ 
    queryKey:['customers'], 
    queryFn: async()=> {
      const response = await api.get('/customers/')
      return response.data.results || response.data || []
    }
  })
  
  // Group customers by municipality
  const customersByMunicipality = {}
  if (Array.isArray(customers)) {
    customers.forEach(customer => {
      // Handle cases where address data might be incomplete
      const municipalityName = customer.address?.municipality_name || customer.address?.barangay?.municipality?.name;
      const barangayName = customer.address?.barangay_name || customer.address?.barangay?.name;
      const fullAddress = customer.address?.full_address;
      
      // Use municipality name as the key, fallback to 'No Address' if none exists
      const municipality = municipalityName || 'No Address';
      
      if (!customersByMunicipality[municipality]) {
        customersByMunicipality[municipality] = [];
      }
      customersByMunicipality[municipality].push({
        ...customer, 
        municipalityName, 
        barangayName
      });
    });
  }
  
  // Sort municipalities alphabetically
  const sortedMunicipalities = Object.keys(customersByMunicipality).sort()
  
  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Users className="text-primary" size={24} />
              <h1 className="h3 m-0">Customer Management</h1>
            </div>
            <p className="text-muted mb-0">View and manage all customers in the system</p>
          </div>
        </div>
        
        {customersLoading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : customersError ? (
          <div className="alert alert-danger" role="alert">
            <strong>Error loading customers.</strong> Please try again.
          </div>
        ) : (
          <>
            {/* Customers by Municipality */}
            {sortedMunicipalities.length > 0 ? (
              sortedMunicipalities.map(municipality => (
                <div key={municipality} className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white border-0 py-3">
                    <div className="d-flex align-items-center gap-2">
                      <MapPin className="text-primary" size={20} />
                      <h5 className="mb-0">{municipality} ({customersByMunicipality[municipality].length})</h5>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    {/* Desktop Table View */}
                    <div className="table-responsive d-none d-md-block">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customersByMunicipality[municipality].map(customer => (
                            <tr key={customer.id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                                    <User size={16} className="text-primary" />
                                  </div>
                                  <span className="fw-medium">
                                    {customer.first_name} {customer.last_name}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <div className="d-flex align-items-center gap-1">
                                    <Phone size={14} className="text-muted" />
                                    <span>{customer.phone || '-'}</span>
                                  </div>
                                  <small className="text-muted">{customer.user?.email || '-'}</small>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <span>{customer.address?.full_address || '-'}</span>
                                  <small className="text-muted">
                                    {customer.barangayName && customer.municipalityName 
                                      ? `${customer.barangayName}, ${customer.municipalityName}`
                                      : (customer.barangayName || customer.municipalityName || '-')}
                                  </small>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="d-md-none">
                      {customersByMunicipality[municipality].map(customer => (
                        <div key={customer.id} className="border-bottom p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-1 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                              <User size={18} className="text-primary" />
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-0 fw-medium">{customer.first_name} {customer.last_name}</h6>
                            </div>
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex align-items-center gap-1">
                              <Phone size={14} className="text-muted" />
                              <span className="small">{customer.phone || '-'}</span>
                            </div>
                            <small className="text-muted">{customer.user?.email || '-'}</small>
                            <div className="d-flex flex-column">
                              <span className="small">{customer.address?.full_address || '-'}</span>
                              <small className="text-muted">
                                {customer.barangayName && customer.municipalityName 
                                  ? `${customer.barangayName}, ${customer.municipalityName}`
                                  : (customer.barangayName || customer.municipalityName || '-')}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <Users size={48} className="text-muted mb-3" />
                  <h5 className="mb-1">No customers found</h5>
                  <p className="text-muted mb-0">There are no customers to display</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}