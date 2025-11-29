// src/pages/admin/Employees.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { User, Truck, Plus, Edit, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'
import { createStyledAlert } from '../../utils/alertHelper'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  })
  const itemsPerPage = 5

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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStaff = Array.isArray(staff) ? staff.slice(indexOfFirstItem, indexOfLastItem) : [];
  const currentDrivers = Array.isArray(drivers) ? drivers.slice(indexOfFirstItem, indexOfLastItem) : [];
  const currentVehicles = Array.isArray(vehicles) ? vehicles.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalStaffPages = Array.isArray(staff) ? Math.ceil(staff.length / itemsPerPage) : 0;
  const totalDriversPages = Array.isArray(drivers) ? Math.ceil(drivers.length / itemsPerPage) : 0;
  const totalVehiclesPages = Array.isArray(vehicles) ? Math.ceil(vehicles.length / itemsPerPage) : 0;

  // Pagination component
  const renderPagination = () => {
    let totalPages = 0;
    if (activeTab === 'staff') totalPages = totalStaffPages;
    else if (activeTab === 'drivers') totalPages = totalDriversPages;
    else totalPages = totalVehiclesPages;
    
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="d-flex justify-content-center mt-3">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
            </li>
            
            {pageNumbers.map(number => (
              <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(number)}
                >
                  {number}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

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
      createStyledAlert('success', 'Success!', 'User created successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to create user: ${error.response?.data?.detail || error.message}`, 5000)
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
      createStyledAlert('success', 'Success!', 'User updated successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to update user: ${error.response?.data?.detail || error.message}`, 5000)
    }
  })

  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData) => {
      return api.post('/vehicles/', vehicleData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles'])
      setShowModal(false)
      createStyledAlert('success', 'Success!', 'Vehicle created successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to create vehicle: ${error.response?.data?.detail || error.message}`, 5000)
    }
  })

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, vehicleData }) => {
      return api.patch(`/vehicles/${vehicleId}/`, vehicleData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles'])
      setShowModal(false)
      createStyledAlert('success', 'Success!', 'Vehicle updated successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to update vehicle: ${error.response?.data?.detail || error.message}`, 5000)
    }
  })

  // Delete mutations
  const deleteStaffMutation = useMutation({
    mutationFn: async (userId) => {
      return api.delete(`/staff/${userId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff'])
      createStyledAlert('success', 'Success!', 'Staff member deleted successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to delete staff member: ${error.response?.data?.detail || error.message}`, 5000)
    }
  })

  const deleteDriverMutation = useMutation({
    mutationFn: async (userId) => {
      return api.delete(`/drivers/${userId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers'])
      createStyledAlert('success', 'Success!', 'Driver deleted successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to delete driver: ${error.response?.data?.detail || error.message}`, 5000)
    }
  })

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId) => {
      return api.delete(`/vehicles/${vehicleId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles'])
      createStyledAlert('success', 'Success!', 'Vehicle deleted successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to delete vehicle: ${error.response?.data?.detail || error.message}`, 5000)
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
        userData.password = activeTab === 'staff' ? 'staffpassword' : 'driverpassword'
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
            <input 
              type="hidden" 
              name="password" 
              value={activeTab === 'staff' ? 'staffpassword' : 'driverpassword'} 
            />
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
            {Array.from({ length: itemsPerPage }).map((_, index) => {
              // If we have a user for this index, display it
              if (index < currentStaff.length) {
                const user = currentStaff[index];
                return (
                  <tr key={user.id} style={{ height: '80px' }}>
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
                            setConfirmation({
                              isOpen: true,
                              title: 'Confirm Deletion',
                              message: 'Are you sure you want to delete this staff member?',
                              onConfirm: () => deleteStaffMutation.mutate(user.id)
                            });
                          }}
                          disabled={deleteStaffMutation.isLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              // For empty rows, show placeholder content
              return (
                <tr key={`empty-${index}`} style={{ height: '80px' }}>
                  <td colSpan="5" className="text-center py-4">
                    {currentStaff.length === 0 && index === 0 && (!staff || staff.length === 0) && (
                      'No staff members found.'
                    )}
                  </td>
                </tr>
              );
            })}
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
            {Array.from({ length: itemsPerPage }).map((_, index) => {
              // If we have a user for this index, display it
              if (index < currentDrivers.length) {
                const user = currentDrivers[index];
                return (
                  <tr key={user.id} style={{ height: '80px' }}>
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
                            setConfirmation({
                              isOpen: true,
                              title: 'Confirm Deletion',
                              message: 'Are you sure you want to delete this driver?',
                              onConfirm: () => deleteDriverMutation.mutate(user.id)
                            });
                          }}
                          disabled={deleteDriverMutation.isLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              // For empty rows, show placeholder content
              return (
                <tr key={`empty-${index}`} style={{ height: '80px' }}>
                  <td colSpan="5" className="text-center py-4">
                    {currentDrivers.length === 0 && index === 0 && (!drivers || drivers.length === 0) && (
                      'No drivers found.'
                    )}
                  </td>
                </tr>
              );
            })}
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
            {Array.from({ length: itemsPerPage }).map((_, index) => {
              // If we have a vehicle for this index, display it
              if (index < currentVehicles.length) {
                const vehicle = currentVehicles[index];
                return (
                  <tr key={vehicle.id} style={{ height: '80px' }}>
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
                            setConfirmation({
                              isOpen: true,
                              title: 'Confirm Deletion',
                              message: 'Are you sure you want to delete this vehicle?',
                              onConfirm: () => {
                                // TODO: Implement vehicle deletion
                                createStyledAlert('warning', 'Not Implemented!', 'Vehicle deletion not implemented yet')
                              }
                            });
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              // For empty rows, show placeholder content
              return (
                <tr key={`empty-${index}`} style={{ height: '80px' }}>
                  <td colSpan="4" className="text-center py-4">
                    {currentVehicles.length === 0 && index === 0 && (!vehicles || vehicles.length === 0) && (
                      'No vehicles found.'
                    )}
                  </td>
                </tr>
              );
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
            <div className="table-responsive" style={{ minHeight: '450px' }}>
              {renderTable()}
              
              {/* Pagination */}
              {renderPagination()}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmation.isOpen && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000 }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{confirmation.title}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setConfirmation({ isOpen: false, title: '', message: '', onConfirm: null })}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>{confirmation.message}</p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setConfirmation({ isOpen: false, title: '', message: '', onConfirm: null })}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={() => {
                      if (confirmation.onConfirm) confirmation.onConfirm();
                      setConfirmation({ isOpen: false, title: '', message: '', onConfirm: null });
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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