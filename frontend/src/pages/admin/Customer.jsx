// src/pages/admin/Customer.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Users, User, MapPin, Phone, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function AdminCustomer() {
  const items = [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Route', href:'/admin/route' },
    { label:'Deployment', href:'/admin/deployment' },
     { label:'Deployment History', href: '/admin/deployment-history' , adminOnly: true },
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
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const customersPerPage = 20 // 4 tables * 5 rows
  
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
  
  // Flatten all customers into a single array for pagination
  const allCustomers = []
  sortedMunicipalities.forEach(municipality => {
    customersByMunicipality[municipality].forEach(customer => {
      allCustomers.push({
        ...customer,
        municipalityGroup: municipality
      })
    })
  })
  
  // Pagination logic
  const totalPages = Math.ceil(allCustomers.length / customersPerPage)
  const indexOfLastCustomer = currentPage * customersPerPage
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage
  const currentCustomers = allCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer)
  
  // Group current customers by municipality for display
  const displayGroups = {}
  currentCustomers.forEach(customer => {
    const municipality = customer.municipalityGroup
    if (!displayGroups[municipality]) {
      displayGroups[municipality] = []
    }
    displayGroups[municipality].push(customer)
  })
  
  // Create groups of 5 customers for each municipality (fill with placeholders if needed)
  const groupedCustomers = []
  Object.keys(displayGroups).forEach(municipality => {
    const customersInMunicipality = displayGroups[municipality]
    // Split into chunks of 5
    for (let i = 0; i < customersInMunicipality.length; i += 5) {
      const chunk = customersInMunicipality.slice(i, i + 5)
      // Fill with placeholders if less than 5
      while (chunk.length < 5) {
        chunk.push(null) // Placeholder
      }
      groupedCustomers.push({
        municipality,
        customers: chunk,
        startIndex: i
      })
    }
  })
  
  // Fill with empty groups to ensure minimum of 4 tables
  while (groupedCustomers.length < 4) {
    groupedCustomers.push({
      municipality: `Empty Group ${groupedCustomers.length + 1}`,
      customers: Array(5).fill(null),
      startIndex: 0
    })
  }
  
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
            {/* Tables side by side */}
            <div className="row g-3 mb-4">
              {groupedCustomers.map((group, groupIndex) => (
                <div key={groupIndex} className="col-12 col-md-6 col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white border-0 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <MapPin className="text-primary" size={20} />
                        <h5 className="mb-0" style={{ fontSize: '0.9rem' }}>
                          {group.municipality} ({group.startIndex + 1}-{Math.min(group.startIndex + 5, customersByMunicipality[group.municipality]?.length || 0)})
                        </h5>
                      </div>
                    </div>
                    <div className="card-body p-0">
                      {/* Desktop Table View */}
                      <div className="table-responsive d-none d-md-block">
                        <table className="table table-hover mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ fontSize: '0.75rem' }}>Name</th>
                              <th style={{ fontSize: '0.75rem' }}>Contact</th>
                              <th style={{ fontSize: '0.75rem' }}>Address</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.customers.map((customer, index) => (
                              <tr key={index} style={{ height: '60px' }}>
                                {customer ? (
                                  <>
                                    <td style={{ fontSize: '0.8rem' }}>
                                      <div className="d-flex align-items-center gap-2">
                                        <div className="rounded-circle bg-primary bg-opacity-10 p-1 d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>
                                          <User size={12} className="text-primary" />
                                        </div>
                                        <span className="fw-medium">
                                          {customer.first_name} {customer.last_name}
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ fontSize: '0.8rem' }}>
                                      <div className="d-flex flex-column">
                                        <div className="d-flex align-items-center gap-1">
                                          <Phone size={12} className="text-muted" />
                                          <span>{customer.phone || '-'}</span>
                                        </div>
                                        <small className="text-muted">{customer.user?.email || '-'}</small>
                                      </div>
                                    </td>
                                    <td style={{ fontSize: '0.8rem' }}>
                                      <div className="d-flex flex-column">
                                        <span>{customer.barangayName || '-'}</span>
                                        <small className="text-muted">{customer.municipalityName || '-'}</small>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <td colSpan="3" className="text-center text-muted" style={{ fontSize: '0.8rem', height: '60px', verticalAlign: 'middle' }}>
                                    No customer data
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Mobile Card View */}
                      <div className="d-md-none">
                        {group.customers.map((customer, index) => (
                          <div key={index} className="border-bottom p-2" style={{ minHeight: '60px', display: 'flex', alignItems: 'center' }}>
                            {customer ? (
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-1 d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>
                                  <User size={12} className="text-primary" />
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-0 fw-medium" style={{ fontSize: '0.85rem' }}>
                                    {customer.first_name} {customer.last_name}
                                  </h6>
                                  <div className="d-flex align-items-center gap-1">
                                    <Phone size={10} className="text-muted" />
                                    <span className="small">{customer.phone || '-'}</span>
                                  </div>
                                  <small className="text-muted">{customer.user?.email || '-'}</small>
                                  <div className="mt-1">
                                    <small className="text-muted">
                                      {customer.barangayName ? `${customer.barangayName}, ` : ''}
                                      {customer.municipalityName || ''}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted w-100" style={{ fontSize: '0.8rem' }}>
                                No customer data
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        style={{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1
                      // Show first, last, current, and nearby pages
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              style={currentPage === pageNumber ? { backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' } : { color: '#28a745', backgroundColor: 'white' }}
                              onClick={() => setCurrentPage(pageNumber)}
                            >
                              {pageNumber}
                            </button>
                          </li>
                        )
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return (
                          <li key={pageNumber} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )
                      }
                      return null
                    })}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        style={{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}