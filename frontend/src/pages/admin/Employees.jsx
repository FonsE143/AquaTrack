// src/pages/admin/Employees.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { User, Truck, Plus, Edit, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'

export default function AdminEmployees() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Route', href: '/admin/route' },
    { label: 'Deployment', href: '/admin/deployment' },
    { label: 'Employees', href: '/admin/employees', active: true },
    { label: 'Products', href: '/admin/products', adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs' },
  ]

  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'create' or 'edit'
  const [currentItem, setCurrentItem] = useState(null)
  const [activeTab, setActiveTab] = useState('staff')

  // Fetch employees data
  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/staff/')).data.results || (await api.get('/staff/')).data || [],
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => (await api.get('/drivers/')).data.results || (await api.get('/drivers/')).data || [],
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get('/vehicles/')).data.results || (await api.get('/vehicles/')).data || [],
  })

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      // For staff, use the staff endpoint
      // For drivers, use the users endpoint with role parameter
      if (userData.role === 'staff') {
        return api.post('/staff/', userData)
      } else {
        return api.post('/users/', { ...userData, role: 'driver' })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff', 'drivers', 'vehicles'])
      setShowModal(false)
      // Show success message
      const successAlert = document.createElement('div')
      successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3'
      successAlert.style.zIndex = '9999'
      successAlert.style.minWidth = '300px'
      successAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill"></i>
          <strong>Success!</strong>
        </div>
        <div class="mt-2">User created successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(successAlert)
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove()
        }
      }, 3000)
    },
    onError: (error) => {
      // Show error message
      const errorAlert = document.createElement('div')
      errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3'
      errorAlert.style.zIndex = '9999'
      errorAlert.style.minWidth = '300px'
      errorAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Error!</strong>
        </div>
        <div class="mt-2">Failed to create user: ${error.response?.data?.detail || error.message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(errorAlert)
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (errorAlert && errorAlert.parentNode) {
          errorAlert.remove()
        }
      }, 5000)
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }) => {
      // For staff, use the staff endpoint
      // For drivers, use the users endpoint
      if (userData.role === 'staff') {
        return api.patch(`/staff/${userId}/`, userData)
      } else {
        return api.patch(`/users/${userId}/`, userData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff', 'drivers', 'vehicles'])
      setShowModal(false)
      // Show success message
      const successAlert = document.createElement('div')
      successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3'
      successAlert.style.zIndex = '9999'
      successAlert.style.minWidth = '300px'
      successAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill"></i>
          <strong>Success!</strong>
        </div>
        <div class="mt-2">User updated successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(successAlert)
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove()
        }
      }, 3000)
    },
    onError: (error) => {
      // Show error message
      const errorAlert = document.createElement('div')
      errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3'
      errorAlert.style.zIndex = '9999'
      errorAlert.style.minWidth = '300px'
      errorAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Error!</strong>
        </div>
        <div class="mt-2">Failed to update user: ${error.response?.data?.detail || error.message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(errorAlert)
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (errorAlert && errorAlert.parentNode) {
          errorAlert.remove()
        }
      }, 5000)
    }
  })

  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData) => {
      return api.post('/vehicles/', vehicleData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles'])
      setShowModal(false)
      // Show success message
      const successAlert = document.createElement('div')
      successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3'
      successAlert.style.zIndex = '9999'
      successAlert.style.minWidth = '300px'
      successAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill"></i>
          <strong>Success!</strong>
        </div>
        <div class="mt-2">Vehicle created successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(successAlert)
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove()
        }
      }, 3000)
    },
    onError: (error) => {
      // Show error message
      const errorAlert = document.createElement('div')
      errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3'
      errorAlert.style.zIndex = '9999'
      errorAlert.style.minWidth = '300px'
      errorAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Error!</strong>
        </div>
        <div class="mt-2">Failed to create vehicle: ${error.response?.data?.detail || error.message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(errorAlert)
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (errorAlert && errorAlert.parentNode) {
          errorAlert.remove()
        }
      }, 5000)
    }
  })

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, vehicleData }) => {
      return api.patch(`/vehicles/${vehicleId}/`, vehicleData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles'])
      setShowModal(false)
      // Show success message
      const successAlert = document.createElement('div')
      successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3'
      successAlert.style.zIndex = '9999'
      successAlert.style.minWidth = '300px'
      successAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill"></i>
          <strong>Success!</strong>
        </div>
        <div class="mt-2">Vehicle updated successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(successAlert)
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove()
        }
      }, 3000)
    },
    onError: (error) => {
      // Show error message
      const errorAlert = document.createElement('div')
      errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3'
      errorAlert.style.zIndex = '9999'
      errorAlert.style.minWidth = '300px'
      errorAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Error!</strong>
        </div>
        <div class="mt-2">Failed to update vehicle: ${error.response?.data?.detail || error.message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(errorAlert)
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (errorAlert && errorAlert.parentNode) {
          errorAlert.remove()
        }
      }, 5000)
    }
  })

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    if (activeTab === 'vehicles') {
      const vehicleData = {
        name: formData.get('name'),
        plate_number: formData.get('plate_number'),
        stock_limit: parseInt(formData.get('stock_limit'))
      }
      
      if (modalType === 'create') {
        createVehicleMutation.mutate(vehicleData)
      } else {
        updateVehicleMutation.mutate({ vehicleId: currentItem.id, vehicleData })
      }
    } else {
      const userData = {
        username: formData.get('username'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: activeTab === 'staff' ? 'staff' : 'driver'
      }
      
      // Add password for new users
      if (modalType === 'create') {
        userData.password = formData.get('password')
        createUserMutation.mutate(userData)
      } else {
        updateUserMutation.mutate({ userId: currentItem.id, userData })
      }
    }
  }

  // Open modal for creating new user
  const openCreateModal = () => {
    setModalType('create')
    setCurrentItem(null)
    setShowModal(true)
  }

  // Open modal for editing user
  const openEditModal = (user) => {
    setModalType('edit')
    setCurrentItem(user)
    setShowModal(true)
  }

  // Render form fields
  const renderFormFields = () => {
    if (activeTab === 'vehicles') {
      return (
        <>
          <div className="mb-3">
            <label className="form-label">Vehicle Name</label>
            <input 
              type="text" 
              className="form-control" 
              name="name" 
              defaultValue={currentItem?.name || ''}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Plate Number</label>
            <input 
              type="text" 
              className="form-control" 
              name="plate_number" 
              defaultValue={currentItem?.plate_number || ''}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Stock Limit</label>
            <input 
              type="number" 
              className="form-control" 
              name="stock_limit" 
              defaultValue={currentItem?.stock_limit || ''}
              min="1"
              required 
            />
          </div>
        </>
      )
    } else {
      return (
        <>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              name="username" 
              defaultValue={currentItem?.username || ''}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">First Name</label>
            <input 
              type="text" 
              className="form-control" 
              name="first_name" 
              defaultValue={currentItem?.first_name || ''}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Last Name</label>
            <input 
              type="text" 
              className="form-control" 
              name="last_name" 
              defaultValue={currentItem?.last_name || ''}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              name="email" 
              defaultValue={currentItem?.email || ''}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input 
              type="text" 
              className="form-control" 
              name="phone" 
              defaultValue={currentItem?.phone || ''}
            />
          </div>
          {modalType === 'create' && (
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                name="password" 
                required 
              />
            </div>
          )}
        </>
      )
    }
  }

  // Render table based on active tab
  const renderTable = () => {
    if (activeTab === 'staff') {
      return (
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(staff) && staff.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.phone || 'N/A'}</td>
                <td>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => openEditModal(user)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this user?')) {
                          // TODO: Implement user deletion
                          // Show error message
                          const errorAlert = document.createElement('div')
                          errorAlert.className = 'alert alert-warning alert-dismissible fade show position-fixed top-0 end-0 m-3'
                          errorAlert.style.zIndex = '9999'
                          errorAlert.style.minWidth = '300px'
                          errorAlert.innerHTML = `
                            <div class="d-flex align-items-center gap-2">
                              <i class="bi bi-exclamation-triangle-fill"></i>
                              <strong>Not Implemented!</strong>
                            </div>
                            <div class="mt-2">User deletion not implemented yet</div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                          `
                          document.body.appendChild(errorAlert)
                          
                          // Auto dismiss after 3 seconds
                          setTimeout(() => {
                            if (errorAlert && errorAlert.parentNode) {
                              errorAlert.remove()
                            }
                          }, 3000)
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    } else if (activeTab === 'drivers') {
      return (
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(drivers) && drivers.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.phone || 'N/A'}</td>
                <td>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => openEditModal(user)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this user?')) {
                          // TODO: Implement user deletion
                          // Show error message
                          const errorAlert = document.createElement('div')
                          errorAlert.className = 'alert alert-warning alert-dismissible fade show position-fixed top-0 end-0 m-3'
                          errorAlert.style.zIndex = '9999'
                          errorAlert.style.minWidth = '300px'
                          errorAlert.innerHTML = `
                            <div class="d-flex align-items-center gap-2">
                              <i class="bi bi-exclamation-triangle-fill"></i>
                              <strong>Not Implemented!</strong>
                            </div>
                            <div class="mt-2">User deletion not implemented yet</div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                          `
                          document.body.appendChild(errorAlert)
                          
                          // Auto dismiss after 3 seconds
                          setTimeout(() => {
                            if (errorAlert && errorAlert.parentNode) {
                              errorAlert.remove()
                            }
                          }, 3000)
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    } else {
      return (
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Plate Number</th>
              <th>Stock Limit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(vehicles) && vehicles.map(vehicle => {
              return (
                <tr key={vehicle.id}>
                  <td>{vehicle.name}</td>
                  <td>{vehicle.plate_number}</td>
                  <td>{vehicle.stock_limit}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setModalType('edit')
                          setCurrentItem(vehicle)
                          setShowModal(true)
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this vehicle?')) {
                            // TODO: Implement vehicle deletion
                            // Show error message
                            const errorAlert = document.createElement('div')
                            errorAlert.className = 'alert alert-warning alert-dismissible fade show position-fixed top-0 end-0 m-3'
                            errorAlert.style.zIndex = '9999'
                            errorAlert.style.minWidth = '300px'
                            errorAlert.innerHTML = `
                              <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-exclamation-triangle-fill"></i>
                                <strong>Not Implemented!</strong>
                              </div>
                              <div class="mt-2">Vehicle deletion not implemented yet</div>
                              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            `
                            document.body.appendChild(errorAlert)
                            
                            // Auto dismiss after 3 seconds
                            setTimeout(() => {
                              if (errorAlert && errorAlert.parentNode) {
                                errorAlert.remove()
                              }
                            }, 3000)
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }
  }

  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <User className="text-success" size={24} />
              <h1 className="h3 m-0">Employee Management</h1>
            </div>
            <p className="text-muted mb-0">Manage staff, drivers, and vehicles</p>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <User size={16} className="me-2" />
              Staff
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'drivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('drivers')}
            >
              <Truck size={16} className="me-2" />
              Drivers
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'vehicles' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicles')}
            >
              <Truck size={16} className="me-2" />
              Vehicles
            </button>
          </li>
        </ul>

        {/* Action Bar */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-capitalize">{activeTab}</h5>
          <button 
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Add New
          </button>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              {renderTable()}
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalType === 'create' ? 'Add New' : 'Edit'} {activeTab === 'vehicles' ? 'Vehicle' : activeTab.slice(0, -1)}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {renderFormFields()}
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={createUserMutation.isLoading || updateUserMutation.isLoading || createVehicleMutation.isLoading || updateVehicleMutation.isLoading}
                    >
                      {(createUserMutation.isLoading || updateUserMutation.isLoading || createVehicleMutation.isLoading || updateVehicleMutation.isLoading) ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          {modalType === 'create' ? 'Create' : 'Update'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}