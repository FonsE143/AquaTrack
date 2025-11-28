// src/pages/admin/Route.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, MapPin, Plus, Trash2, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'

// Barangay Selector Component
function BarangaySelector({ municipalityId, municipalityName, selectedBarangays, onBarangayChange }) {
  const { data: barangayData, isLoading } = useQuery({
    queryKey: ['barangays', municipalityId],
    queryFn: async () => {
      if (!municipalityId) {
        return [];
      }
      const response = await api.get(`/barangays/?municipality=${municipalityId}`);
      return response.data.results || response.data || [];
    },
    enabled: !!municipalityId
  });

  if (isLoading) {
    return (
      <div className="col-md-12">
        <label className="form-label">Barangays for {municipalityName}</label>
        <div className="text-muted">Loading barangays...</div>
      </div>
    );
  }

  return (
    <div className="col-md-12">
      <label className="form-label">Barangays for {municipalityName}</label>
      <div className="border rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <select
          multiple
          className="form-select"
          value={selectedBarangays}
          onChange={onBarangayChange}
          style={{ border: 'none' }}
        >
          {Array.isArray(barangayData) && barangayData.map(barangay => (
            <option key={barangay.id} value={barangay.id}>
              {barangay.name}
            </option>
          ))}
        </select>
      </div>
      <small className="text-muted">Hold Ctrl/Cmd to select multiple barangays</small>
    </div>
  );
}

export default function AdminRoute() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Route', href: '/admin/route', active: true },
    { label: 'Deployment', href: '/admin/deployment' },
    { label: 'Employees', href: '/admin/employees' },
    { label: 'Activity Logs', href: '/admin/activity-logs' },
  ]

  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [routeFormData, setRouteFormData] = useState({
    route_number: '',
    municipalities: [],
    barangays: {}
  })

  // Fetch route data
  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await api.get('/routes/')
      return response.data.results || response.data || []
    },
  })

  const { data: municipalities } = useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const response = await api.get('/municipalities/')
      return response.data.results || response.data || []
    },
  })

  // We'll fetch barangays for each municipality individually
  // This avoids the hook-in-loop issue by not using useQuery inside a map

  // Mutation for creating route
  const createRouteMutation = useMutation({
    mutationFn: async (routeData) => {
      return api.post('/routes/', routeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['routes'])
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
        <div class="mt-2">Route created successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(successAlert)
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove()
        }
      }, 3000)
      
      setRouteFormData({
        route_number: '',
        municipalities: [],
        barangays: {}
      })
      setShowCreateForm(false)
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
        <div class="mt-2">Failed to create route: ${error.response?.data?.detail || error.message}</div>
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

  // Mutation for deleting route
  const deleteRouteMutation = useMutation({
    mutationFn: async (routeId) => {
      return api.delete(`/routes/${routeId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['routes'])
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
        <div class="mt-2">Route deleted successfully!</div>
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
        <div class="mt-2">Failed to delete route: ${error.response?.data?.detail || error.message}</div>
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

  // Mutation for updating route
  const updateRouteMutation = useMutation({
    mutationFn: async (routeData) => {
      return api.put(`/routes/${editingRoute.id}/`, routeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['routes'])
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
        <div class="mt-2">Route updated successfully!</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(successAlert)
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (successAlert && successAlert.parentNode) {
          successAlert.remove()
        }
      }, 3000)
      
      setRouteFormData({
        route_number: '',
        municipalities: [],
        barangays: {}
      })
      setShowEditForm(false)
      setEditingRoute(null)
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
        <div class="mt-2">Failed to update route: ${error.response?.data?.detail || error.message}</div>
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

  // Handle route form submission
  const handleRouteSubmit = (e) => {
    e.preventDefault()
    
    if (!routeFormData.route_number || routeFormData.municipalities.length === 0) {
      // Show validation error
      const validationAlert = document.createElement('div')
      validationAlert.className = 'alert alert-warning alert-dismissible fade show position-fixed top-0 end-0 m-3'
      validationAlert.style.zIndex = '9999'
      validationAlert.style.minWidth = '300px'
      validationAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Validation Error!</strong>
        </div>
        <div class="mt-2">Please fill route number and select at least one municipality</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(validationAlert)
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (validationAlert && validationAlert.parentNode) {
          validationAlert.remove()
        }
      }, 3000)
      return
    }
    
    // Collect all selected barangays from all municipalities
    const allSelectedBarangays = []
    Object.values(routeFormData.barangays).forEach(barangayList => {
      allSelectedBarangays.push(...barangayList.map(id => parseInt(id)))
    })
    
    if (allSelectedBarangays.length === 0) {
      // Show validation error
      const barangayAlert = document.createElement('div')
      barangayAlert.className = 'alert alert-warning alert-dismissible fade show position-fixed top-0 end-0 m-3'
      barangayAlert.style.zIndex = '9999'
      barangayAlert.style.minWidth = '300px'
      barangayAlert.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Validation Error!</strong>
        </div>
        <div class="mt-2">Please select at least one barangay</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `
      document.body.appendChild(barangayAlert)
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        if (barangayAlert && barangayAlert.parentNode) {
          barangayAlert.remove()
        }
      }, 3000)
      return
    }
    
    createRouteMutation.mutate({
      route_number: routeFormData.route_number,
      municipalities: routeFormData.municipalities.map(id => parseInt(id)),
      barangays: allSelectedBarangays
    })
  }

  // Handle form input changes
  const handleRouteInputChange = (e) => {
    const { name, value } = e.target
    setRouteFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMunicipalityChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
    setRouteFormData(prev => ({
      ...prev,
      municipalities: selectedOptions,
      // Reset barangays when municipalities change
      barangays: {}
    }))
  }

  const handleBarangayChange = (municipalityId, e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
    setRouteFormData(prev => ({
      ...prev,
      barangays: {
        ...prev.barangays,
        [municipalityId]: selectedOptions
      }
    }))
  }

  // Helper function to format barangay names
  const formatBarangayNames = (route) => {
    if (route.barangay_names) {
      return route.barangay_names
    }
    // Fallback if barangay_names is not available
    return route.barangays_detail ? route.barangays_detail.map(b => b.name).join(', ') : 'N/A'
  }

  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <MapPin className="text-primary" size={24} />
              <h1 className="h3 m-0">Routes Management</h1>
            </div>
            <p className="text-muted mb-0">Manage delivery routes and their coverage areas</p>
          </div>
          <button 
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={16} />
            Create Route
          </button>
        </div>

        {/* Create Route Modal */}
        {showCreateForm && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create New Route</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowCreateForm(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleRouteSubmit}>
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Route Number</label>
                        <input
                          type="text"
                          className="form-control"
                          name="route_number"
                          value={routeFormData.route_number}
                          onChange={handleRouteInputChange}
                          placeholder="Enter route number"
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Municipalities</label>
                        <select
                          multiple
                          className="form-select"
                          name="municipalities"
                          value={routeFormData.municipalities}
                          onChange={handleMunicipalityChange}
                          size={Math.max(Array.isArray(municipalities) ? municipalities.length : 0, 5)}
                        >
                          {Array.isArray(municipalities) && municipalities.map(municipality => (
                            <option key={municipality.id} value={municipality.id}>
                              {municipality.name}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">Hold Ctrl/Cmd to select multiple municipalities</small>
                      </div>
                      
                      {/* Barangay selection for each selected municipality */}
                      <div className="col-md-12">
                        <div className="border rounded" style={{ maxHeight: '300px', overflowY: 'auto', padding: '15px' }}>
                          {routeFormData.municipalities.map((municipalityId) => {
                            const selectedMunicipality = municipalities?.find(m => m.id.toString() === municipalityId);
                            return (
                              <BarangaySelector
                                key={municipalityId}
                                municipalityId={municipalityId}
                                municipalityName={selectedMunicipality?.name || 'Municipality'}
                                selectedBarangays={routeFormData.barangays[municipalityId] || []}
                                onBarangayChange={(e) => handleBarangayChange(municipalityId, e)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button 
                        type="submit" 
                        className="btn btn-success"
                        disabled={createRouteMutation.isLoading}
                      >
                        {createRouteMutation.isLoading ? 'Creating...' : 'Create Route'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Route Modal */}
        {showEditForm && editingRoute && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Route</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowEditForm(false)
                      setEditingRoute(null)
                      setRouteFormData({
                        route_number: '',
                        municipalities: [],
                        barangays: {}
                      })
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    
                    if (!routeFormData.route_number || routeFormData.municipalities.length === 0) {
                      // Show validation error
                      const validationAlert = document.createElement('div')
                      validationAlert.className = 'alert alert-warning alert-dismissible fade show position-fixed top-0 end-0 m-3'
                      validationAlert.style.zIndex = '9999'
                      validationAlert.style.minWidth = '300px'
                      validationAlert.innerHTML = `
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi bi-exclamation-triangle-fill"></i>
                          <strong>Validation Error!</strong>
                        </div>
                        <div class="mt-2">Please fill route number and select at least one municipality</div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                      `
                      document.body.appendChild(validationAlert)
                      
                      // Auto dismiss after 3 seconds
                      setTimeout(() => {
                        if (validationAlert && validationAlert.parentNode) {
                          validationAlert.remove()
                        }
                      }, 3000)
                      return
                    }
                    
                    // Collect all selected barangays from all municipalities
                    const allSelectedBarangays = []
                    Object.values(routeFormData.barangays).forEach(barangayList => {
                      allSelectedBarangays.push(...barangayList.map(id => parseInt(id)))
                    })
                    
                    if (allSelectedBarangays.length === 0) {
                      // Show validation error
                      const barangayAlert = document.createElement('div')
                      barangayAlert.className = 'alert alert-warning alert-dismissible fade show position-fixed top-0 end-0 m-3'
                      barangayAlert.style.zIndex = '9999'
                      barangayAlert.style.minWidth = '300px'
                      barangayAlert.innerHTML = `
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi bi-exclamation-triangle-fill"></i>
                          <strong>Validation Error!</strong>
                        </div>
                        <div class="mt-2">Please select at least one barangay</div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                      `
                      document.body.appendChild(barangayAlert)
                      
                      // Auto dismiss after 3 seconds
                      setTimeout(() => {
                        if (barangayAlert && barangayAlert.parentNode) {
                          barangayAlert.remove()
                        }
                      }, 3000)
                      return
                    }
                    
                    updateRouteMutation.mutate({
                      route_number: routeFormData.route_number,
                      municipalities: routeFormData.municipalities.map(id => parseInt(id)),
                      barangays: allSelectedBarangays
                    })
                  }}>
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Route Number</label>
                        <input
                          type="text"
                          className="form-control"
                          name="route_number"
                          value={routeFormData.route_number}
                          onChange={handleRouteInputChange}
                          placeholder="Enter route number"
                        />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">Municipalities</label>
                        <select
                          multiple
                          className="form-select"
                          name="municipalities"
                          value={routeFormData.municipalities}
                          onChange={handleMunicipalityChange}
                          size={Math.max(Array.isArray(municipalities) ? municipalities.length : 0, 5)}
                        >
                          {Array.isArray(municipalities) && municipalities.map(municipality => (
                            <option key={municipality.id} value={municipality.id}>
                              {municipality.name}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">Hold Ctrl/Cmd to select multiple municipalities</small>
                      </div>
                      
                      {/* Barangay selection for each selected municipality */}
                      <div className="col-md-12">
                        <div className="border rounded" style={{ maxHeight: '300px', overflowY: 'auto', padding: '15px' }}>
                          {routeFormData.municipalities.map((municipalityId) => {
                            const selectedMunicipality = municipalities?.find(m => m.id.toString() === municipalityId);
                            return (
                              <BarangaySelector
                                key={municipalityId}
                                municipalityId={municipalityId}
                                municipalityName={selectedMunicipality?.name || 'Municipality'}
                                selectedBarangays={routeFormData.barangays[municipalityId] || []}
                                onBarangayChange={(e) => handleBarangayChange(municipalityId, e)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button 
                        type="submit" 
                        className="btn btn-success"
                        disabled={updateRouteMutation.isLoading}
                      >
                        {updateRouteMutation.isLoading ? 'Updating...' : 'Update Route'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Routes Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <MapPin className="text-success" size={20} />
              <h5 className="mb-0">Delivery Routes</h5>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Route Number</th>
                    <th>Municipality</th>
                    <th>Barangays Covered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(routes) && routes.map(route => (
                    <tr key={route.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <MapPin size={16} className="text-muted" />
                          <span>Route {route.route_number}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {route.municipalities_detail?.map((municipality, index) => (
                            <span key={index} className="badge bg-primary-subtle text-primary-emphasis">
                              {municipality.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {formatBarangayNames(route).split(', ').map((barangay, index) => (
                            <span key={index} className="badge bg-secondary-subtle text-secondary-emphasis">
                              {barangay}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              // Set up form for editing
                              setEditingRoute(route)
                              
                              // Prepare barangay selections
                              const initialBarangays = {}
                              route.municipalities_detail?.forEach(municipality => {
                                // Get barangays for this municipality from the route
                                const municipalityBarangays = route.barangays_detail
                                  ?.filter(b => b.municipality === municipality.id)
                                  ?.map(b => b.id.toString()) || []
                                initialBarangays[municipality.id] = municipalityBarangays
                              })
                              
                              setRouteFormData({
                                route_number: route.route_number,
                                municipalities: route.municipalities_detail?.map(m => m.id) || [],
                                barangays: initialBarangays
                              })
                              setShowEditForm(true)
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this route?')) {
                                deleteRouteMutation.mutate(route.id)
                              }
                            }}
                            disabled={deleteRouteMutation.isLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(routes) || routes.length === 0) && (
                    <tr>
                      <td colSpan="4" className="text-center">
                        {routesLoading ? 'Loading...' : 'No routes found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}