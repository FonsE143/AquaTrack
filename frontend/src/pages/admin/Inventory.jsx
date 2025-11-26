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
    mutationFn: ({ id, data }) => api.patch(`/products/${id}/`, data),
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
  
  const handleEdit = (product) => {
    setEditing(product.id)
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock_full: product.stock_full,
      stock_empty: product.stock_empty,
      threshold: product.threshold,
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
              setFormData({ name: '', sku: '', price: 0, stock_full: 0, stock_empty: 0, threshold: 10, active: true })
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
                        <th>Full Stock</th>
                        <th>Empty Stock</th>
                        <th>Threshold</th>
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
                            <input 
                              className="form-control form-control-sm" 
                              type="number" 
                              value={formData.stock_full || ''} 
                              onChange={e => setFormData({...formData, stock_full: e.target.value})} 
                            />
                          </td>
                          <td>
                            <input 
                              className="form-control form-control-sm" 
                              type="number" 
                              value={formData.stock_empty || ''} 
                              onChange={e => setFormData({...formData, stock_empty: e.target.value})} 
                            />
                          </td>
                          <td>
                            <input 
                              className="form-control form-control-sm" 
                              type="number" 
                              value={formData.threshold || ''} 
                              onChange={e => setFormData({...formData, threshold: e.target.value})} 
                            />
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
                      {productList.map(p => (
                        <tr 
                          key={p.id} 
                          className={p.stock_full < p.threshold ? 'table-warning' : ''}
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
                                <input 
                                  className="form-control form-control-sm" 
                                  type="number" 
                                  value={formData.stock_full} 
                                  onChange={e => setFormData({...formData, stock_full: e.target.value})} 
                                />
                              </td>
                              <td>
                                <input 
                                  className="form-control form-control-sm" 
                                  type="number" 
                                  value={formData.stock_empty} 
                                  onChange={e => setFormData({...formData, stock_empty: e.target.value})} 
                                />
                              </td>
                              <td>
                                <input 
                                  className="form-control form-control-sm" 
                                  type="number" 
                                  value={formData.threshold} 
                                  onChange={e => setFormData({...formData, threshold: e.target.value})} 
                                />
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
                      ))}
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
                  <div className="list-group list-group-flush">
                    {editing === 'new' && (
                      <div className="list-group-item bg-warning">
                        <h6 className="mb-3">Add New Product</h6>
                        <div className="mb-2">
                          <label className="form-label small">Product Name</label>
                          <input 
                            className="form-control form-control-sm" 
                            placeholder="Product name" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small">SKU</label>
                          <input 
                            className="form-control form-control-sm" 
                            placeholder="SKU" 
                            value={formData.sku || ''} 
                            onChange={e => setFormData({...formData, sku: e.target.value})} 
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small">Price</label>
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
                        </div>
                        <div className="mb-2">
                          <label className="form-label small">Full Stock</label>
                          <input 
                            className="form-control form-control-sm" 
                            type="number" 
                            value={formData.stock_full || ''} 
                            onChange={e => setFormData({...formData, stock_full: e.target.value})} 
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small">Empty Stock</label>
                          <input 
                            className="form-control form-control-sm" 
                            type="number" 
                            value={formData.stock_empty || ''} 
                            onChange={e => setFormData({...formData, stock_empty: e.target.value})} 
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small">Threshold</label>
                          <input 
                            className="form-control form-control-sm" 
                            type="number" 
                            value={formData.threshold || ''} 
                            onChange={e => setFormData({...formData, threshold: e.target.value})} 
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small">Status</label>
                          <select 
                            className="form-select form-select-sm" 
                            value={formData.active ? 'true' : 'false'} 
                            onChange={e => setFormData({...formData, active: e.target.value === 'true'})}
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-success btn-sm flex-fill" 
                            onClick={() => handleSave(null)}
                          >
                            Save
                          </button>
                          <button 
                            className="btn btn-outline-secondary btn-sm flex-fill" 
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {productList.map(p => (
                      <div key={p.id} className={`list-group-item ${p.stock_full < p.threshold ? 'bg-warning bg-opacity-25' : ''}`}>
                        {editing === p.id ? (
                          <>
                            <h6 className="mb-3">Edit Product</h6>
                            <div className="mb-2">
                              <label className="form-label small">Product Name</label>
                              <input 
                                className="form-control form-control-sm" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small">SKU</label>
                              <input 
                                className="form-control form-control-sm" 
                                value={formData.sku} 
                                onChange={e => setFormData({...formData, sku: e.target.value})} 
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small">Price</label>
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
                            </div>
                            <div className="mb-2">
                              <label className="form-label small">Full Stock</label>
                              <input 
                                className="form-control form-control-sm" 
                                type="number" 
                                value={formData.stock_full} 
                                onChange={e => setFormData({...formData, stock_full: e.target.value})} 
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small">Empty Stock</label>
                              <input 
                                className="form-control form-control-sm" 
                                type="number" 
                                value={formData.stock_empty} 
                                onChange={e => setFormData({...formData, stock_empty: e.target.value})} 
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small">Threshold</label>
                              <input 
                                className="form-control form-control-sm" 
                                type="number" 
                                value={formData.threshold} 
                                onChange={e => setFormData({...formData, threshold: e.target.value})} 
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small">Status</label>
                              <select 
                                className="form-select form-select-sm" 
                                value={formData.active ? 'true' : 'false'} 
                                onChange={e => setFormData({...formData, active: e.target.value === 'true'})}
                              >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                              </select>
                            </div>
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-success btn-sm flex-fill" 
                                onClick={() => handleSave(p.id)}
                              >
                                Save
                              </button>
                              <button 
                                className="btn btn-outline-secondary btn-sm flex-fill" 
                                onClick={() => setEditing(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
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
                            
                            <div className="mb-2">
                              <small className="text-muted">Threshold:</small>
                              <div>{p.threshold}</div>
                            </div>
                            
                            <button 
                              className="btn btn-outline-primary btn-sm w-100" 
                              onClick={() => handleEdit(p)}
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                    {productList.length === 0 && !isLoading && !editing && (
                      <div className="list-group-item text-center py-5">
                        <Package size={48} className="text-muted mb-3" />
                        <h5 className="mb-1">No products found</h5>
                        <p className="text-muted mb-0">Add your first product to get started</p>
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