// src/pages/admin/Inventory.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'
import { Plus, Package, AlertTriangle } from 'lucide-react'

export default function AdminInventory() {
  const items = [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Orders', href:'/admin/orders' },
    { label:'Order History', href:'/admin/order-history' },
    { label:'Inventory', href:'/admin/inventory', active:true },
    { label: 'Users', href: '/admin/users' },
    { label:'Deployment', href:'/admin/deployment' },
    { label: 'Deployment History', href: '/admin/deployment-history' },
    { label:'Employees', href:'/admin/employees' },
    { label: 'Activity Log', href: '/admin/activity', adminOnly: true },
  ]
  
  const queryClient = useQueryClient()
  const { data: products, isLoading, error } = useQuery({ 
    queryKey:['products'], 
    queryFn: async()=> (await api.get('/products/')).data 
  })
  
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({})
  
  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => {
      return api.patch(`/products/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setEditing(null)
    },
    onError: (error) => {
      console.error('Failed to update product:', error.response?.data || error.message)
      alert('Failed to update product. Please try again.')
    }
  })
  
  const createProduct = useMutation({
    mutationFn: (data) => api.post('/products/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setEditing(null)
    },
    onError: (error) => {
      console.error('Failed to create product:', error.response?.data || error.message)
      alert('Failed to create product. Please check all fields and try again.')
    }
  })
  
  const productList = products?.results || products || []
  
  // We need to calculate stock values based on orders
  // Let's fetch orders to calculate the stock values
  const { data: orders } = useQuery({ 
    queryKey: ['orders-for-inventory'], 
    queryFn: async () => (await api.get('/orders/')).data 
  })
  
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
  
  const handleEdit = (product) => {
    setEditing(product.id)
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      active: product.active
    })
  }
  
  const handleSave = (id) => {
    if (id) {
      updateProduct.mutate({ id, data: formData })
    } else {
      createProduct.mutate(formData)
    }
  }
  
  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Inventory Management</h1>
            <p className="text-muted mb-0">Manage products and stock levels</p>
          </div>
          <button 
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={() => {
              setEditing('new')
              setFormData({ name: '', sku: '', price: 0, active: true })
            }}
          >
            <Plus size={18} />
            Add Product
          </button>
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editing === 'new' && (
                        <tr className="table-warning">
                          <td>
                            <input 
                              className="form-control form-control-sm" 
                              placeholder="Product name" 
                              value={formData.name || ''} 
                              onChange={e => setFormData({...formData, name: e.target.value})} 
                            />
                          </td>
                          <td>
                            <input 
                              className="form-control form-control-sm" 
                              placeholder="SKU" 
                              value={formData.sku || ''} 
                              onChange={e => setFormData({...formData, sku: e.target.value})} 
                            />
                          </td>
                          <td>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">₱</span>
                              <input 
                                className="form-control" 
                                type="number" 
                                step="0.01" 
                                value={formData.price || ''} 
                                onChange={e => setFormData({...formData, price: e.target.value})} 
                              />
                            </div>
                          </td>
                          <td>
                            <div className="form-control-plaintext form-control-sm">0</div>
                          </td>
                          <td>
                            <div className="form-control-plaintext form-control-sm">0</div>
                          </td>
                          <td>
                            <div className="form-control-plaintext form-control-sm">0</div>
                          </td>
                          <td>
                            <select 
                              className="form-select form-select-sm" 
                              value={formData.active ? 'true' : 'false'} 
                              onChange={e => setFormData({...formData, active: e.target.value === 'true'})}
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button 
                                className="btn btn-success btn-sm" 
                                onClick={() => handleSave(null)}
                              >
                                Save
                              </button>
                              <button 
                                className="btn btn-outline-secondary btn-sm" 
                                onClick={() => setEditing(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {productList.map(p => {
  const stockValues = calculateStockValues(p)
  return (
    <tr 
      key={p.id} 
      className={stockValues.toBeReturned > 0 ? 'table-warning' : ''}
    >
      {editing === p.id ? (
        <>
          <td>
            <input 
              className="form-control form-control-sm" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </td>
          <td>
            <input 
              className="form-control form-control-sm" 
              value={formData.sku} 
              onChange={e => setFormData({...formData, sku: e.target.value})} 
            />
          </td>
          <td>
            <div className="input-group input-group-sm">
              <span className="input-group-text">₱</span>
              <input 
                className="form-control" 
                type="number" 
                step="0.01" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
              />
            </div>
          </td>
          <td>
            {/* Delivered Stock - Read only now */}
            <div className="form-control-plaintext form-control-sm">
              {stockValues.delivered}
            </div>
          </td>
          <td>
            {/* Returned Container - Read only now */}
            <div className="form-control-plaintext form-control-sm">
              {stockValues.returned}
            </div>
          </td>
          <td>
            {/* To be Returned Container - Read only now */}
            <div className={`form-control-plaintext form-control-sm ${stockValues.toBeReturned > 0 ? 'text-danger fw-bold' : ''}`}>
              {stockValues.toBeReturned}
            </div>
          </td>
          <td>
            <select 
              className="form-select form-select-sm" 
              value={formData.active ? 'true' : 'false'} 
              onChange={e => setFormData({...formData, active: e.target.value === 'true'})}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </td>
          <td>
            <div className="d-flex gap-1">
              <button 
                className="btn btn-success btn-sm" 
                onClick={() => handleSave(p.id)}
              >
                Save
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm" 
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
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
          <td>
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => handleEdit(p)}
            >
              Edit
            </button>
          </td>
        </>
      )}
    </tr>
  )
})}
                      {productList.length === 0 && !isLoading && (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <Package size={48} className="text-muted mb-3" />
                            <h5 className="mb-1">No products found</h5>
                            <p className="text-muted mb-0">Add your first product to get started</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  {editing === 'new' && (
                    <div className="card mb-3 border-warning">
                      <div className="card-header bg-warning bg-opacity-10">
                        <h5 className="mb-0">Add New Product</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label">Product Name</label>
                          <input 
                            className="form-control" 
                            placeholder="Product name" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">SKU</label>
                          <input 
                            className="form-control" 
                            placeholder="SKU" 
                            value={formData.sku || ''} 
                            onChange={e => setFormData({...formData, sku: e.target.value})} 
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Price</label>
                          <div className="input-group">
                            <span className="input-group-text">₱</span>
                            <input 
                              className="form-control" 
                              type="number" 
                              step="0.01" 
                              value={formData.price || ''} 
                              onChange={e => setFormData({...formData, price: e.target.value})} 
                            />
                          </div>
                        </div>
                        <div className="row g-2">
                          <div className="col-6">
                            <label className="form-label">Delivered Stock</label>
                            <div className="form-control-plaintext">0</div>
                          </div>
                          <div className="col-6">
                            <label className="form-label">Returned Container</label>
                            <div className="form-control-plaintext">0</div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">To be Returned Container</label>
                          <div className="form-control-plaintext">0</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <select 
                            className="form-select" 
                            value={formData.active ? 'true' : 'false'} 
                            onChange={e => setFormData({...formData, active: e.target.value === 'true'})}
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-success flex-fill" 
                            onClick={() => handleSave(null)}
                          >
                            Save
                          </button>
                          <button 
                            className="btn btn-outline-secondary" 
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {productList.map(p => {
                    const stockValues = calculateStockValues(p)
                    return (
                    <div key={p.id} className="card mb-3">
                      {editing === p.id ? (
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label">Product Name</label>
                            <input 
                              className="form-control" 
                              value={formData.name} 
                              onChange={e => setFormData({...formData, name: e.target.value})} 
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">SKU</label>
                            <input 
                              className="form-control" 
                              value={formData.sku} 
                              onChange={e => setFormData({...formData, sku: e.target.value})} 
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Price</label>
                            <div className="input-group">
                              <span className="input-group-text">₱</span>
                              <input 
                                className="form-control" 
                                type="number" 
                                step="0.01" 
                                value={formData.price} 
                                onChange={e => setFormData({...formData, price: e.target.value})} 
                              />
                            </div>
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label">Delivered Stock</label>
                              <div className="form-control-plaintext">
                                {stockValues.delivered}
                              </div>
                            </div>
                            <div className="col-6">
                              <label className="form-label">Returned Container</label>
                              <div className="form-control-plaintext">
                                {stockValues.returned}
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">To be Returned Container</label>
                            <div className={`form-control-plaintext ${stockValues.toBeReturned > 0 ? 'text-danger fw-bold' : ''}`}>
                              {stockValues.toBeReturned}
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Status</label>
                            <select 
                              className="form-select" 
                              value={formData.active ? 'true' : 'false'} 
                              onChange={e => setFormData({...formData, active: e.target.value === 'true'})}
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-success flex-fill" 
                              onClick={() => handleSave(p.id)}
                            >
                              Save
                            </button>
                            <button 
                              className="btn btn-outline-secondary" 
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h5 className="card-title mb-1">{p.name}</h5>
                              <p className="card-text text-muted mb-0">SKU: {p.sku}</p>
                            </div>
                            <span className={`badge ${p.active ? 'bg-success' : 'bg-secondary'}`}>
                              {p.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="row g-2 mb-3">
                            <div className="col-6">
                              <small className="text-muted">Price</small>
                              <div className="fw-medium">₱{parseFloat(p.price).toFixed(2)}</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">Delivered Stock</small>
                              <div className={`fw-medium ${stockValues.toBeReturned > 0 ? 'text-danger' : ''}`}>
                                {stockValues.delivered}
                                {stockValues.toBeReturned > 0 && (
                                  <AlertTriangle size={14} className="ms-1 text-warning" />
                                )}
                              </div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">Returned Container</small>
                              <div className="fw-medium">{stockValues.returned}</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">To be Returned Container</small>
                              <div className={`fw-medium ${stockValues.toBeReturned > 0 ? 'text-danger fw-bold' : ''}`}>
                                {stockValues.toBeReturned}
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            className="btn btn-outline-primary w-100" 
                            onClick={() => handleEdit(p)}
                          >
                            Edit Product
                          </button>
                        </div>
                      )}
                    </div>
                  )})}
                  
                  {productList.length === 0 && !isLoading && (
                    <div className="text-center py-5">
                      <Package size={48} className="text-muted mb-3" />
                      <h5 className="mb-1">No products found</h5>
                      <p className="text-muted mb-0">Add your first product to get started</p>
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