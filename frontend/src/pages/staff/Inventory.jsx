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
  
  const { data: products, isLoading, error } = useQuery({ 
    queryKey:['products'], 
    queryFn: async()=> (await api.get('/products/')).data 
  })
  
  // We need to calculate stock values based on orders
  // Let's fetch orders to calculate the stock values
  const { data: orders } = useQuery({ 
    queryKey: ['orders-for-inventory'], 
    queryFn: async () => (await api.get('/orders/')).data 
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 10
  
  const productList = products?.results || products || []
  
  // Calculate stock values based on orders
  const calculateStockValues = (product) => {
    if (!orders) return { delivered: 0, returned: 0, toBeReturned: 0 }
    
    // Get all order items for this product
    const orderItems = []
    const ordersArray = Array.isArray(orders) ? orders : 
                       (orders.results ? orders.results : [])
    
    ordersArray.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (item.product === product.id || item.product_id === product.id) {
            orderItems.push({
              ...item,
              order_status: order.status
            })
          }
        })
      }
    })
    
    // Calculate totals
    let delivered = 0
    let returned = 0
    
    orderItems.forEach(item => {
      // Only count delivered orders
      if (item.order_status === 'delivered') {
        delivered += item.qty_full_out || 0
        returned += item.qty_empty_in || 0
      }
    })
    
    const toBeReturned = delivered - returned
    
    return { delivered, returned, toBeReturned }
  }
  
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
                        <th>Delivered Stock</th>
                        <th>Returned Container</th>
                        <th>To be Returned Container</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsWithPadding.map(p => {
                        if (p.isEmpty) {
                          return (
                            <tr key={p.id}>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                            </tr>
                          );
                        }
                        
                        const stockValues = calculateStockValues(p);
                        return (
                          <tr 
                            key={p.id} 
                            className={stockValues.toBeReturned > 0 ? 'table-warning' : ''}
                          >
                            <td className="fw-medium">{p.name}</td>
                            <td>{p.sku}</td>
                            <td>₱{parseFloat(p.price).toFixed(2)}</td>
                            <td className={stockValues.toBeReturned > 0 ? 'text-danger fw-bold' : ''}>
                              {stockValues.delivered}
                              {stockValues.toBeReturned > 0 && (
                                <AlertTriangle size={14} className="ms-1 text-warning" />
                              )}
                            </td>
                            <td>{stockValues.returned}</td>
                            <td className={stockValues.toBeReturned > 0 ? 'text-danger fw-bold' : ''}>
                              {stockValues.toBeReturned}
                            </td>
                            <td>
                              <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                                {p.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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
                      productList.map(p => {
                        const stockValues = calculateStockValues(p);
                        return (
                          <div key={p.id} className={`list-group-item ${stockValues.toBeReturned > 0 ? 'bg-warning bg-opacity-25' : ''}`}>
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
                              <div className={stockValues.toBeReturned > 0 ? 'text-danger fw-bold' : ''}>
                                Delivered: {stockValues.delivered} | Returned: {stockValues.returned} | To be Returned: {stockValues.toBeReturned}
                                {stockValues.toBeReturned > 0 && (
                                  <AlertTriangle size={14} className="ms-1 text-warning" />
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-0">
                              <small className="text-muted">Status:</small>
                              <div>
                                <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                                  {p.active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
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