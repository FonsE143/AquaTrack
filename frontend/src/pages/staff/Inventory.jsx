// src/pages/staff/Inventory.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Package, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function StaffInventory(){
  const items = [
    { label:'Dashboard', href:'/staff/dashboard' },
    { label:'Orders', href:'/staff/orders' },
    { label:'Order History', href:'/staff/order-history' },
    { label:'Inventory', href:'/staff/inventory', active:true },
  ]
  const { data, isLoading, error } = useQuery({ 
    queryKey:['products'], 
    queryFn: async()=> (await api.get('/products/')).data 
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 10
  
  const productList = data?.results || data || []
  
  // Calculate pagination
  const totalProducts = productList.length
  const totalPages = Math.ceil(totalProducts / productsPerPage)
  
  // Get products for current page
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const productsToDisplay = productList.slice(startIndex, endIndex)
  
  // Pad the products array to always have 10 rows
  const paddedProducts = [...productsToDisplay];
  while (paddedProducts.length < 10) {
    paddedProducts.push(null);
  }
  
  const productsWithPadding = paddedProducts.map((p, index) => {
    if (p === null) {
      return { id: `empty-${index}`, isEmpty: true };
    }
    return p;
  });
  
  // Navigation functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  return (
    <AppShell role="staff" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Inventory</h1>
            <p className="text-muted mb-0">View current inventory levels and stock status</p>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error loading inventory.</strong> Please try again.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}
        
        {/* Inventory Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Full</th>
                        <th>Empty</th>
                        <th>Threshold</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsWithPadding.map(p => (
                        <tr key={p.id} className={p.isEmpty ? '' : (p.stock_full < p.threshold ? 'table-warning' : '')}>
                          {p.isEmpty ? (
                            <>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                            </>
                          ) : (
                            <>
                              <td className="fw-medium">{p.name}</td>
                              <td>{p.sku}</td>
                              <td>₱{parseFloat(p.price).toFixed(2)}</td>
                              <td className={p.stock_full < p.threshold ? 'text-danger fw-bold' : ''}>
                                {p.stock_full}
                                {p.stock_full < p.threshold && (
                                  <AlertTriangle size={14} className="ms-1 text-warning" />
                                )}
                              </td>
                              <td>{p.stock_empty}</td>
                              <td>{p.threshold}</td>
                              <td>
                                <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                                  {p.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} products
                  </div>
                  <div className="btn-group" role="group">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      Next
                    </button>
                  </div>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  <div className="list-group list-group-flush">
                    {productList.length > 0 ? (
                      productList.map(p => (
                        <div key={p.id} className={`list-group-item ${p.stock_full < p.threshold ? 'bg-warning bg-opacity-25' : ''}`}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">{p.name}</h6>
                              <small className="text-muted">SKU: {p.sku}</small>
                            </div>
                            <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                              {p.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted">Price:</small>
                            <div>₱{parseFloat(p.price).toFixed(2)}</div>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted">Stock:</small>
                            <div className={p.stock_full < p.threshold ? 'text-danger fw-bold' : ''}>
                              Full: {p.stock_full} | Empty: {p.stock_empty}
                              {p.stock_full < p.threshold && (
                                <AlertTriangle size={14} className="ms-1 text-warning" />
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-0">
                            <small className="text-muted">Threshold:</small>
                            <div>{p.threshold}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="list-group-item text-center py-5">
                        <Package size={48} className="text-muted mb-3" />
                        <h5 className="mb-1">No products found</h5>
                        <p className="text-muted mb-0">There are no products to display</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}