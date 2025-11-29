// src/pages/admin/Products.jsx
import React, { useState } from 'react';
import AppShell from '../../components/AppShell';
import { Sidebar } from '../../components/Sidebar';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Plus, Trash2, Edit3, Package } from 'lucide-react';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    liters: ''
  });

  const items = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Route', href: '/admin/route' },
    { label: 'Deployment', href: '/admin/deployment' },
    { label: 'Employees', href: '/admin/employees' },
    { label: 'Products', href: '/admin/products', active: true, adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs' },
  ];

  // Fetch products
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products/');
      // Handle paginated response from Django REST Framework
      return response.data.results || response.data || [];
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: (newProduct) => api.post('/products/', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowAddForm(false);
      setFormData({ name: '', price: '', liters: '' });
      
      // Show success message
      const successAlert = document.createElement('div');
      successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
      successAlert.style.zIndex = '9999';
      successAlert.style.minWidth = '300px';
      successAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill"></i>
          <strong>Success!</strong>
        </div>
        <div class="mt-2">Product created successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      document.body.appendChild(successAlert);
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove();
        }
      }, 3000);
    },
    onError: (error) => {
      // Show error message
      const errorAlert = document.createElement('div');
      errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
      errorAlert.style.zIndex = '9999';
      errorAlert.style.minWidth = '300px';
      errorAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Error!</strong>
        </div>
        <div class="mt-2">Failed to create product: ${error.response?.data?.detail || error.message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      document.body.appendChild(errorAlert);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (errorAlert && errorAlert.parentNode) {
          errorAlert.remove();
        }
      }, 5000);
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (updatedProduct) => api.patch(`/products/${updatedProduct.id}/`, updatedProduct),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setEditingProduct(null);
      setFormData({ name: '', price: '', liters: '' });
      
      // Show success message
      const successAlert = document.createElement('div');
      successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
      successAlert.style.zIndex = '9999';
      successAlert.style.minWidth = '300px';
      successAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill"></i>
          <strong>Success!</strong>
        </div>
        <div class="mt-2">Product updated successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      document.body.appendChild(successAlert);
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove();
        }
      }, 3000);
    },
    onError: (error) => {
      // Show error message
      const errorAlert = document.createElement('div');
      errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
      errorAlert.style.zIndex = '9999';
      errorAlert.style.minWidth = '300px';
      errorAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Error!</strong>
        </div>
        <div class="mt-2">Failed to update product: ${error.response?.data?.detail || error.message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      document.body.appendChild(errorAlert);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (errorAlert && errorAlert.parentNode) {
          errorAlert.remove();
        }
      }, 5000);
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId) => api.delete(`/products/${productId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      
      // Show success message
      const successAlert = document.createElement('div');
      successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
      successAlert.style.zIndex = '9999';
      successAlert.style.minWidth = '300px';
      successAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill"></i>
          <strong>Success!</strong>
        </div>
        <div class="mt-2">Product deleted successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      document.body.appendChild(successAlert);
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove();
        }
      }, 3000);
    },
    onError: (error) => {
      // Show error message
      const errorAlert = document.createElement('div');
      errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
      errorAlert.style.zIndex = '9999';
      errorAlert.style.minWidth = '300px';
      errorAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Error!</strong>
        </div>
        <div class="mt-2">Failed to delete product: ${error.response?.data?.detail || error.message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      document.body.appendChild(errorAlert);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (errorAlert && errorAlert.parentNode) {
          errorAlert.remove();
        }
      }, 5000);
    }
  });

  const handleAddProduct = (e) => {
    e.preventDefault();
    addProductMutation.mutate({
      name: formData.name,
      price: parseFloat(formData.price),
      liters: parseFloat(formData.liters)
    });
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    updateProductMutation.mutate({
      id: editingProduct.id,
      name: formData.name,
      price: parseFloat(formData.price),
      liters: parseFloat(formData.liters)
    });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      liters: product.liters
    });
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleSubmit = (e) => {
    if (editingProduct) {
      handleUpdateProduct(e);
    } else {
      handleAddProduct(e);
    }
  };

  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Package className="text-success" size={24} />
              <h1 className="h3 m-0">Product Management</h1>
            </div>
            <p className="text-muted mb-0">Manage products available for orders</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Products</h5>
          <button 
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', price: '', liters: '' });
              setShowAddForm(true);
            }}
          >
            <Plus size={16} />
            Add New
          </button>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm || editingProduct ? (
          <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingProduct ? 'Edit Product' : 'Create New Product'}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                    }}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Product Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Price (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Liters</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.liters}
                        onChange={(e) => setFormData({...formData, liters: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingProduct(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={addProductMutation.isLoading || updateProductMutation.isLoading}
                    >
                      {addProductMutation.isLoading || updateProductMutation.isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        editingProduct ? 'Update Product' : 'Create Product'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        {/* Products Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : isError ? (
              <div className="alert alert-danger">
                Error loading products. Please try again.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Liters</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products && products.length > 0 ? (
                      products.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>₱{parseFloat(product.price).toFixed(2)}</td>
                          <td>{parseFloat(product.liters).toFixed(2)} L</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(product.id)}
                                disabled={deleteProductMutation.isLoading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No products found. Add a new product to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}