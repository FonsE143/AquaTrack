// src/pages/admin/Deployment.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, MapPin, User, Package, Plus, Edit, Trash2 } from 'lucide-react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'
import Modal from '../../components/Modal'

export default function AdminDeployment() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Route', href: '/admin/route' },
    { label: 'Deployment', href: '/admin/deployment', active: true },
    { label: 'Employees', href: '/admin/employees' },
    { label: 'Customers', href: '/admin/customers' },
    { label: 'Products', href: '/admin/products', adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs' },
  ]

  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    id: null,
    driver: '',
    vehicle: '',
    route: '',
    product: '',
    stock: ''
  })
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' })
  const [isEditing, setIsEditing] = useState(false)

  // Fetch deployment data
  const { data: deployments, isLoading: deploymentsLoading, error } = useQuery({
    queryKey: ['deployments'],
    queryFn: async () => {
      const response = await api.get('/deployments/')
      // Handle different response formats
      if (response.data) {
        // If it's already an array, return it
        if (Array.isArray(response.data)) {
          return response.data
        }
        // If it has a results property that's an array, return that
        if (response.data.results && Array.isArray(response.data.results)) {
          return response.data.results
        }
        // If it's a single object with an id, wrap it in an array
        if (response.data.id) {
          return [response.data]
        }
      }
      // Default to empty array
      return []
    },
  })

  // Fetch drivers using the correct endpoint
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await api.get('/drivers/')
      return response.data.results || response.data || []
    },
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response = await api.get('/vehicles/')
      return response.data.results || response.data || []
    },
  })

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await api.get('/routes/')
      return response.data.results || response.data || []
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products/')
      return response.data.results || response.data || []
    },
  })

  // Mutation for creating/updating deployment
  const createUpdateDeploymentMutation = useMutation({
    mutationFn: async (deploymentData) => {
      if (isEditing) {
        return api.patch(`/deployments/${deploymentData.id}/`, deploymentData)
      } else {
        return api.post('/deployments/', deploymentData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deployments'])
      // Show success message
      setModal({
        isOpen: true,
        title: 'Success',
        message: isEditing ? 'Deployment updated successfully!' : 'Deployment created successfully!',
        type: 'success'
      })
      
      // Reset form
      setFormData({
        id: null,
        driver: '',
        vehicle: '',
        route: '',
        product: '',
        stock: ''
      })
      setIsEditing(false)
    },
    onError: (error) => {
      console.error('Deployment error:', error);
      console.error('Error response:', error.response);
      let errorMsg = isEditing ? 'Failed to update deployment. ' : 'Failed to create deployment. ';
      
      // Extract detailed error information
      if (error.response?.data) {
        console.log('Error data:', error.response.data);
        if (typeof error.response.data === 'string') {
          errorMsg += error.response.data;
        } else if (error.response.data.detail) {
          errorMsg += error.response.data.detail;
        } else if (error.response.data.error) {
          errorMsg += error.response.data.error;
        } else if (error.response.data.stock) {
          errorMsg += 'Stock: ' + error.response.data.stock;
        } else if (typeof error.response.data === 'object') {
          // Handle object errors
          const errorKeys = Object.keys(error.response.data);
          if (errorKeys.length > 0) {
            errorMsg += errorKeys.map(key => `${key}: ${error.response.data[key]}`).join(', ');
          }
        }
      } else {
        errorMsg += error.message;
      }
      
      setModal({
        isOpen: true,
        title: 'Error',
        message: errorMsg,
        type: 'error'
      })
    }
  })

  // Mutation for deleting deployment
  const deleteDeploymentMutation = useMutation({
    mutationFn: async (deploymentId) => {
      return api.delete(`/deployments/${deploymentId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deployments'])
      setModal({
        isOpen: true,
        title: 'Success',
        message: 'Deployment deleted successfully!',
        type: 'success'
      })
    },
    onError: (error) => {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to delete deployment: ' + (error.response?.data?.detail || error.message),
        type: 'error'
      })
    }
  })

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle deployment form submission
  const handleDeploymentSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.driver || !formData.vehicle || !formData.route || !formData.product || !formData.stock) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill all fields',
        type: 'warning'
      })
      return
    }
    
    const stockValue = parseInt(formData.stock)
    if (isNaN(stockValue) || stockValue <= 0) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a valid stock quantity',
        type: 'warning'
      })
      return
    }
    
    // Get the selected vehicle to check stock limit
    const selectedVehicle = vehicles?.find(v => v.id === parseInt(formData.vehicle))
    if (selectedVehicle && stockValue > selectedVehicle.stock_limit) {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: `Stock (${stockValue}) exceeds vehicle limit (${selectedVehicle.stock_limit})!`,
        type: 'warning'
      })
      return
    }
    
    createUpdateDeploymentMutation.mutate({
      id: formData.id,
      driver: formData.driver,
      vehicle: formData.vehicle,
      route: formData.route,
      product: formData.product,
      stock: stockValue
    })
  }

  // Handle edit deployment
  const handleEditDeployment = (deployment) => {
    setFormData({
      id: deployment.id,
      driver: deployment.driver.toString(),
      vehicle: deployment.vehicle.toString(),
      route: deployment.route.toString(),
      product: deployment.product.toString(),
      stock: deployment.stock.toString()
    })
    setIsEditing(true)
  }

  // Handle delete deployment
  const handleDeleteDeployment = (deploymentId) => {
    if (confirm('Are you sure you want to delete this deployment?')) {
      deleteDeploymentMutation.mutate(deploymentId)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setFormData({
      id: null,
      driver: '',
      vehicle: '',
      route: '',
      product: '',
      stock: ''
    })
    setIsEditing(false)
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Truck className="text-primary" size={24} />
              <h1 className="h3 m-0">Route Deployment</h1>
            </div>
            <p className="text-muted mb-0">Manage deployments</p>
          </div>
        </div>

        <div className="row g-4">
          {/* Deployments List */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Truck className="text-success" size={20} />
                  <h5 className="mb-0">Current Deployments</h5>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Driver</th>
                        <th>Vehicle</th>
                        <th className="d-none d-md-table-cell">Route</th>
                        <th className="d-none d-md-table-cell">Product</th>
                        <th>Stock</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(deployments) && deployments.map(deployment => (
                        <tr key={deployment.id}>
                          <td>
                            <div className="d-flex flex-column">
                              <span>{deployment.driver_first_name || 'N/A'} {deployment.driver_last_name || ''}</span>
                              <span className="d-md-none text-muted small">{deployment.product_name || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span>{deployment.vehicle_name || 'N/A'}</span>
                              <span className="d-md-none text-muted small">{deployment.vehicle_plate_number || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            Route {deployment.route_number || 'N/A'} - {deployment.municipality_names || 'N/A'}
                          </td>
                          <td className="d-none d-md-table-cell">
                            {deployment.product_name || 'N/A'}
                          </td>
                          <td>
                            <span className="badge bg-primary">{deployment.stock || '0'}</span>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span>{deployment.created_at ? new Date(deployment.created_at).toLocaleDateString() : 'N/A'}</span>
                              <span className="d-md-none text-muted small">Route {deployment.route_number || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEditDeployment(deployment)}
                                title="Edit deployment"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteDeployment(deployment.id)}
                                title="Delete deployment"
                                disabled={deleteDeploymentMutation.isLoading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!Array.isArray(deployments) || deployments.length === 0) && (
                        <tr>
                          <td colSpan="7" className="text-center">
                            No deployments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Create Deployment Form */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  {isEditing ? (
                    <>
                      <Edit className="text-warning" size={20} />
                      <h5 className="mb-0">Edit Deployment</h5>
                    </>
                  ) : (
                    <>
                      <Plus className="text-success" size={20} />
                      <h5 className="mb-0">Create Deployment</h5>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={handleDeploymentSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Driver</label>
                    <select
                      className="form-select"
                      name="driver"
                      value={formData.driver}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Driver</option>
                      {drivers && drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.first_name} {driver.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Vehicle</label>
                    <select
                      className="form-select"
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles && vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name} ({vehicle.plate_number}) - Limit: {vehicle.stock_limit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Route</label>
                    <select
                      className="form-select"
                      name="route"
                      value={formData.route}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Route</option>
                      {routes && routes.map(route => (
                        <option key={route.id} value={route.id}>
                          Route {route.route_number} - {route.municipality_names}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Product</label>
                    <select
                      className="form-select"
                      name="product"
                      value={formData.product}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Product</option>
                      {products && products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ₱{product.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className={`btn ${isEditing ? 'btn-warning' : 'btn-success'} w-100`}
                      disabled={createUpdateDeploymentMutation.isLoading}
                    >
                      {createUpdateDeploymentMutation.isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          {isEditing ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          {isEditing ? <Edit size={16} /> : <Plus size={16} />}
                          {isEditing ? 'Update Deployment' : 'Create Deployment'}
                        </>
                      )}
                    </button>
                    {isEditing && (
                      <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for alerts */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        type={modal.type}
      >
        <p className="mb-0">{modal.message}</p>
      </Modal>
    </AppShell>
  )
}