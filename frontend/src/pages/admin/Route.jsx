// src/pages/admin/Route.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, MapPin, Plus, Trash2, Pencil, History } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState } from 'react'
import { createStyledAlert } from '../../utils/alertHelper'

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
    { label: 'Deployment History', href: '/admin/deployment-history' },
    { label: 'Employees', href: '/admin/employees' },
    { label: 'Customers', href: '/admin/customers' },
    { label: 'Products', href: '/admin/products', adminOnly: true },
    { label: 'Activity Logs', href: '/admin/activity-logs' },
  ]

  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [routeFormData, setRouteFormData] = useState({
    route_number: '',
    municipalities: [],
    barangays: {}
  })
  const [locationFormData, setLocationFormData] = useState({
    municipalityOption: 'existing', // 'existing' or 'new'
    existingMunicipality: '',
    newMunicipality: '',
    barangay: '',
    selectedBarangay: ''
  });
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  })
  const itemsPerPage = 5

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

  // Fetch all barangays
  const { data: allBarangays } = useQuery({
    queryKey: ['barangays'],
    queryFn: async () => {
      const response = await api.get('/barangays/')
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
      createStyledAlert('success', 'Success!', 'Route created successfully!')
      
      setRouteFormData({
        route_number: '',
        municipalities: [],
        barangays: {}
      })
      setShowCreateForm(false)
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to create route: ${error.response?.data?.detail || error.message}`, 5000)
    }
  })

  // Mutation for deleting route
  const deleteRouteMutation = useMutation({
    mutationFn: async (routeId) => {
      return api.delete(`/routes/${routeId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['routes'])
      createStyledAlert('success', 'Success!', 'Route deleted successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to delete route: ${error.response?.data?.detail || error.message}`, 5000)
    }
  })

  // Mutation for creating municipality
  const createMunicipalityMutation = useMutation({
    mutationFn: async (municipalityData) => {
      return api.post('/municipalities/', municipalityData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['municipalities']);
      createStyledAlert('success', 'Success!', 'Municipality created successfully!');
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to create municipality: ${error.response?.data?.name || error.response?.data?.detail || error.message}`, 5000);
    }
  });

  // Mutation for deleting municipality
  const deleteMunicipalityMutation = useMutation({
    mutationFn: async (municipalityId) => {
      return api.delete(`/municipalities/${municipalityId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['municipalities']);
      queryClient.invalidateQueries(['barangays']);
      createStyledAlert('success', 'Success!', 'Municipality deleted successfully!');
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to delete municipality: ${error.response?.data?.detail || error.message}`, 5000);
    }
  });

  // Mutation for creating barangay
  const createBarangayMutation = useMutation({
    mutationFn: async (barangayData) => {
      return api.post('/barangays/', barangayData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['barangays']);
      queryClient.invalidateQueries(['municipalities']);
      createStyledAlert('success', 'Success!', 'Barangay created successfully!');
      // Reset form
      setLocationFormData({
        municipalityOption: 'existing',
        existingMunicipality: '',
        newMunicipality: '',
        barangay: '',
        selectedBarangay: ''
      });
      setShowLocationModal(false);
    },
    onError: (error) => {
      // Log the error for debugging
      console.log('Barangay creation error:', error);
      
      // Check if it's a duplicate barangay error
      let errorMessage = '';
      
      // Handle different error response formats
      if (error.response?.data) {
        // Check for name field errors
        if (error.response.data.name) {
          errorMessage = Array.isArray(error.response.data.name) 
            ? error.response.data.name[0] 
            : error.response.data.name;
        } 
        // Check for general non_field_errors
        else if (error.response.data.non_field_errors) {
          errorMessage = Array.isArray(error.response.data.non_field_errors) 
            ? error.response.data.non_field_errors[0] 
            : error.response.data.non_field_errors;
        }
        // Check for detail field
        else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
        // Fallback to stringified data
        else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else {
        errorMessage = error.message || 'Unknown error';
      }
      
      // Check if it's a duplicate error (various possible messages)
      if (errorMessage && 
          (errorMessage.includes('already exists') || 
           errorMessage.includes('unique') || 
           errorMessage.includes('duplicate'))) {
        createStyledAlert('warning', 'Duplicate Barangay!', 'A barangay with this name already exists in the selected municipality. Please choose a different name or select a different municipality.', 5000);
      } else {
        createStyledAlert('error', 'Error!', `Failed to create barangay: ${errorMessage}`, 5000);
      }
    }
  });

  // Mutation for deleting barangay
  const deleteBarangayMutation = useMutation({
    mutationFn: async (barangayId) => {
      return api.delete(`/barangays/${barangayId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['barangays']);
      queryClient.invalidateQueries(['municipalities']);
      createStyledAlert('success', 'Success!', 'Barangay deleted successfully!');
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to delete barangay: ${error.response?.data?.detail || error.message}`, 5000);
    }
  });

  // Mutation for updating route
  const updateRouteMutation = useMutation({
    mutationFn: async (routeData) => {
      return api.put(`/routes/${editingRoute.id}/`, routeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['routes'])
      createStyledAlert('success', 'Success!', 'Route updated successfully!')
      
      setRouteFormData({
        route_number: '',
        municipalities: [],
        barangays: {}
      })
      setShowEditForm(false)
      setEditingRoute(null)
    },
    onError: (error) => {
      createStyledAlert('error', 'Error!', `Failed to update route: ${error.response?.data?.detail || error.message}`, 5000)
    }
  })

  // Handle route form submission
  const handleRouteSubmit = (e) => {
    e.preventDefault()
    
    if (!routeFormData.route_number || routeFormData.municipalities.length === 0) {
      createStyledAlert('warning', 'Validation Error!', 'Please fill route number and select at least one municipality')
      return
    }
    
    // Collect all selected barangays from all municipalities
    const allSelectedBarangays = []
    Object.values(routeFormData.barangays).forEach(barangayList => {
      allSelectedBarangays.push(...barangayList.map(id => parseInt(id)))
    })
    
    if (allSelectedBarangays.length === 0) {
      createStyledAlert('warning', 'Validation Error!', 'Please select at least one barangay')
      return
    }
    
    createRouteMutation.mutate({
      route_number: routeFormData.route_number,
      municipalities: routeFormData.municipalities.map(id => parseInt(id)),
      barangays: allSelectedBarangays
    })
  }

  // Handle location form submission
  const handleLocationSubmit = (e) => {
    e.preventDefault();
    
    // Handle Remove Barangay option
    if (locationFormData.municipalityOption === 'removeBarangay') {
      if (!locationFormData.existingMunicipality) {
        createStyledAlert('warning', 'Validation Error!', 'Please select a municipality');
        return;
      }
      
      if (!locationFormData.selectedBarangay) {
        createStyledAlert('warning', 'Validation Error!', 'Please select a barangay to remove');
        return;
      }
      
      const selectedMunicipality = municipalities?.find(m => m.id.toString() === locationFormData.existingMunicipality);
      const selectedBarangay = allBarangays?.find(b => b.id.toString() === locationFormData.selectedBarangay);
      
      if (!selectedMunicipality || !selectedBarangay) {
        createStyledAlert('error', 'Error', 'Selected municipality or barangay not found.');
        return;
      }
      
      setConfirmation({
        isOpen: true,
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete the barangay "${selectedBarangay.name}" from "${selectedMunicipality.name}"?`,
        onConfirm: () => {
          deleteBarangayMutation.mutate(selectedBarangay.id);
          // Reset the selection
          setLocationFormData(prev => ({
            ...prev,
            selectedBarangay: ''
          }));
        }
      });
      return;
    }
    
    // Handle Remove Municipality option
    if (locationFormData.municipalityOption === 'remove') {
      if (!locationFormData.existingMunicipality) {
        createStyledAlert('warning', 'Validation Error!', 'Please select a municipality to remove');
        return;
      }
      
      const selectedMunicipality = municipalities?.find(m => m.id.toString() === locationFormData.existingMunicipality);
      if (!selectedMunicipality) {
        createStyledAlert('error', 'Error', 'Selected municipality not found.');
        return;
      }
      
      setConfirmation({
        isOpen: true,
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete the municipality "${selectedMunicipality.name}"? This will also delete all associated barangays.`,
        onConfirm: () => {
          deleteMunicipalityMutation.mutate(selectedMunicipality.id);
        }
      });
      return;
    }
    
    let municipalityName = '';
    if (locationFormData.municipalityOption === 'existing') {
      if (!locationFormData.existingMunicipality) {
        createStyledAlert('warning', 'Validation Error!', 'Please select a municipality');
        return;
      }
      // Get the municipality name from the selected option
      const selectedMunicipality = municipalities?.find(m => m.id.toString() === locationFormData.existingMunicipality);
      municipalityName = selectedMunicipality?.name || '';
    } else {
      if (!locationFormData.newMunicipality.trim()) {
        createStyledAlert('warning', 'Validation Error!', 'Please enter a municipality name');
        return;
      }
      municipalityName = locationFormData.newMunicipality.trim();
    }
    
    if (!locationFormData.barangay.trim()) {
      createStyledAlert('warning', 'Validation Error!', 'Please enter a barangay name');
      return;
    }
    
    // If adding to existing municipality
    if (locationFormData.municipalityOption === 'existing') {
      createBarangayMutation.mutate({
        name: locationFormData.barangay.trim(),
        municipality: parseInt(locationFormData.existingMunicipality)
      });
    } else {
      // First create the new municipality
      createMunicipalityMutation.mutate(
        { name: municipalityName },
        {
          onSuccess: (municipalityResponse) => {
            // Then create the barangay
            createBarangayMutation.mutate({
              name: locationFormData.barangay.trim(),
              municipality: municipalityResponse.data.id
            });
          },
          onError: (error) => {
            createStyledAlert('error', 'Error!', `Failed to create municipality: ${error.response?.data?.name || error.response?.data?.detail || error.message}`, 5000);
          }
        }
      );
    }
  };

  // Handle location form input changes
  const handleLocationInputChange = (e) => {
    const { name, value } = e.target;
    setLocationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle municipality option change
  const handleMunicipalityOptionChange = (e) => {
    const value = e.target.value;
    setLocationFormData(prev => ({
      ...prev,
      municipalityOption: value,
      existingMunicipality: value === 'existing' ? '' : prev.existingMunicipality,
      newMunicipality: value === 'new' ? '' : prev.newMunicipality
    }));
  };

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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentRoutes = Array.isArray(routes) ? routes.slice(indexOfFirstItem, indexOfLastItem) : []
  const totalPages = Array.isArray(routes) ? Math.ceil(routes.length / itemsPerPage) : 0

  // Helper function to format barangay names
  const formatBarangayNames = (route) => {
    if (route.barangay_names) {
      return route.barangay_names
    }
    // Fallback if barangay_names is not available
    return route.barangays_detail ? route.barangays_detail.map(b => b.name).join(', ') : 'N/A'
  }

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null
    
    const pageNumbers = []
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
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
    )
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
          <div className="d-flex gap-2">
            <button 
              className="btn btn-success d-flex align-items-center gap-2"
              onClick={() => setShowLocationModal(true)}
            >
              <Plus size={16} />
              Location
            </button>
            <button 
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} />
              Create Route
            </button>
          </div>
        </div>

        {/* New Location Modal */}
        {showLocationModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Location</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowLocationModal(false);
                      setLocationFormData({
                        municipality: '',
                        barangay: ''
                      });
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleLocationSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Municipality Option</label>
                      <div className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="municipalityOption"
                          value="existing"
                          checked={locationFormData.municipalityOption === 'existing'}
                          onChange={handleMunicipalityOptionChange}
                        />
                        <label className="form-check-label">Add to existing municipality</label>
                      </div>
                      <div className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="municipalityOption"
                          value="new"
                          checked={locationFormData.municipalityOption === 'new'}
                          onChange={handleMunicipalityOptionChange}
                        />
                        <label className="form-check-label">Create new municipality</label>
                      </div>
                      <div className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="municipalityOption"
                          value="remove"
                          checked={locationFormData.municipalityOption === 'remove'}
                          onChange={handleMunicipalityOptionChange}
                        />
                        <label className="form-check-label">Remove Municipality</label>
                      </div>
                      <div className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="municipalityOption"
                          value="removeBarangay"
                          checked={locationFormData.municipalityOption === 'removeBarangay'}
                          onChange={handleMunicipalityOptionChange}
                        />
                        <label className="form-check-label">Remove Barangay</label>
                      </div>
                    </div>
                    
                    {locationFormData.municipalityOption === 'existing' ? (
                      <div className="mb-3">
                        <label className="form-label">Select Municipality</label>
                        <select
                          className="form-select"
                          name="existingMunicipality"
                          value={locationFormData.existingMunicipality}
                          onChange={handleLocationInputChange}
                        >
                          <option value="">Choose a municipality</option>
                          {Array.isArray(municipalities) && municipalities.map(municipality => (
                            <option key={municipality.id} value={municipality.id}>
                              {municipality.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : locationFormData.municipalityOption === 'remove' ? (
                      <div className="mb-3">
                        <label className="form-label">Select Municipality to Remove</label>
                        <select
                          className="form-select"
                          name="existingMunicipality"
                          value={locationFormData.existingMunicipality}
                          onChange={handleLocationInputChange}
                        >
                          <option value="">Choose a municipality</option>
                          {Array.isArray(municipalities) && municipalities.map(municipality => (
                            <option key={municipality.id} value={municipality.id}>
                              {municipality.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : locationFormData.municipalityOption === 'removeBarangay' ? (
                      <div className="mb-3">
                        <div className="mb-3">
                          <label className="form-label">Select Municipality</label>
                          <select
                            className="form-select"
                            name="existingMunicipality"
                            value={locationFormData.existingMunicipality}
                            onChange={(e) => {
                              handleLocationInputChange(e);
                              // Reset selected barangay when municipality changes
                              setLocationFormData(prev => ({
                                ...prev,
                                selectedBarangay: ''
                              }));
                            }}
                          >
                            <option value="">Choose a municipality</option>
                            {Array.isArray(municipalities) && municipalities.map(municipality => (
                              <option key={municipality.id} value={municipality.id}>
                                {municipality.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {locationFormData.existingMunicipality && (
                          <div className="mb-3">
                            <label className="form-label">Select Barangay to Remove</label>
                            <select
                              className="form-select"
                              name="selectedBarangay"
                              value={locationFormData.selectedBarangay}
                              onChange={handleLocationInputChange}
                            >
                              <option value="">Choose a barangay</option>
                              {Array.isArray(allBarangays) && allBarangays
                                .filter(barangay => barangay.municipality.toString() === locationFormData.existingMunicipality)
                                .map(barangay => (
                                  <option key={barangay.id} value={barangay.id}>
                                    {barangay.name}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-3">
                        <label className="form-label">New Municipality Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="newMunicipality"
                          value={locationFormData.newMunicipality}
                          onChange={handleLocationInputChange}
                          placeholder="Enter new municipality name"
                        />
                      </div>
                    )}
                    
                    {/* Only show barangay name field when adding new locations, not when removing */}
                    {(locationFormData.municipalityOption === 'existing' || locationFormData.municipalityOption === 'new') && (
                      <div className="mb-3">
                        <label className="form-label">Barangay Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="barangay"
                          value={locationFormData.barangay}
                          onChange={handleLocationInputChange}
                          placeholder="Enter barangay name"
                        />
                      </div>
                    )}
                    <div className="d-flex justify-content-end gap-2">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowLocationModal(false);
                          setLocationFormData({
                            municipalityOption: 'existing',
                            existingMunicipality: '',
                            newMunicipality: '',
                            barangay: '',
                            selectedBarangay: ''
                          });
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-success"
                        disabled={createMunicipalityMutation.isLoading || createBarangayMutation.isLoading}
                      >
                        {locationFormData.municipalityOption === 'remove' || locationFormData.municipalityOption === 'removeBarangay'
                          ? ((createMunicipalityMutation.isLoading || createBarangayMutation.isLoading) ? 'Removing...' : 'Remove Location')
                          : ((createMunicipalityMutation.isLoading || createBarangayMutation.isLoading) ? 'Adding...' : 'Add Location')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

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
                        <div className="border rounded p-2">
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
                        <div className="mt-2">
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              // Show confirmation for deleting selected municipalities
                              if (routeFormData.municipalities.length === 0) {
                                createStyledAlert('warning', 'No Selection', 'Please select at least one municipality to delete.');
                                return;
                              }
                              
                              const selectedMunicipalityNames = routeFormData.municipalities
                                .map(id => municipalities?.find(m => m.id.toString() === id)?.name)
                                .filter(name => name)
                                .join(', ');
                              
                              setConfirmation({
                                isOpen: true,
                                title: 'Confirm Deletion',
                                message: `Are you sure you want to delete the selected municipalities: ${selectedMunicipalityNames}? This will also delete all associated barangays.`,
                                onConfirm: () => {
                                  // Delete each selected municipality
                                  routeFormData.municipalities.forEach(municipalityId => {
                                    deleteMunicipalityMutation.mutate(municipalityId);
                                  });
                                  
                                  // Clear selection
                                  setRouteFormData(prev => ({
                                    ...prev,
                                    municipalities: [],
                                    barangays: {}
                                  }));
                                }
                              });
                            }}
                          >
                            Delete Selected Municipalities
                          </button>
                        </div>
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
                      createStyledAlert('warning', 'Validation Error!', 'Please fill route number and select at least one municipality')
                      return
                    }
                    
                    // Collect all selected barangays from all municipalities
                    const allSelectedBarangays = []
                    Object.values(routeFormData.barangays).forEach(barangayList => {
                      allSelectedBarangays.push(...barangayList.map(id => parseInt(id)))
                    })
                    
                    if (allSelectedBarangays.length === 0) {
                      createStyledAlert('warning', 'Validation Error!', 'Please select at least one barangay')
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
            <div className="table-responsive" style={{ minHeight: '450px' }}>
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Route Number</th>
                    <th className="d-none d-md-table-cell">Municipality</th>
                    <th className="d-none d-lg-table-cell">Barangays Covered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: itemsPerPage }).map((_, index) => {
                    // If we have a route for this index, display it
                    if (index < currentRoutes.length) {
                      const route = currentRoutes[index];
                      return (
                        <tr key={route.id} style={{ height: '80px' }}>
                          <td>
                            <div className="d-flex flex-column">
                              <div className="d-flex align-items-center gap-2">
                                <MapPin size={16} className="text-muted" />
                                <span className="fw-bold">Route {route.route_number}</span>
                              </div>
                              <div className="d-md-none mt-1">
                                <div className="small text-muted">
                                  {route.municipalities_detail?.map((municipality, idx) => (
                                    <span key={idx}>
                                      {municipality.name}{idx < route.municipalities_detail.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                                <div className="small text-muted">
                                  {formatBarangayNames(route).split(', ').slice(0, 2).join(', ')}
                                  {formatBarangayNames(route).split(', ').length > 2 ? '...' : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <div className="d-flex flex-wrap gap-1">
                              {route.municipalities_detail?.map((municipality, idx) => (
                                <span key={idx} className="badge bg-primary-subtle text-primary-emphasis">
                                  {municipality.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <div className="d-flex flex-wrap gap-1">
                              {formatBarangayNames(route).split(', ').map((barangay, idx) => (
                                <span key={idx} className="badge bg-secondary-subtle text-secondary-emphasis">
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
                                  setConfirmation({
                                    isOpen: true,
                                    title: 'Confirm Deletion',
                                    message: 'Are you sure you want to delete this route?',
                                    onConfirm: () => deleteRouteMutation.mutate(route.id)
                                  });
                                }}
                                disabled={deleteRouteMutation.isLoading}
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
                          {currentRoutes.length === 0 && index === 0 && (!Array.isArray(routes) || routes.length === 0) && (
                            routesLoading ? 'Loading...' : 'No routes found'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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

            {/* Pagination */}
            {renderPagination()}
          </div>
        </div>

        {/* Locations Management Section */}
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-header bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <MapPin className="text-success" size={20} />
              <h5 className="mb-0">Locations Management</h5>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              {/* Municipalities List */}
              <div className="col-md-6">
                <h6>Municipalities</h6>
                <div className="border rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <ul className="list-group list-group-flush">
                    {Array.isArray(municipalities) && municipalities.length > 0 ? (
                      municipalities.map(municipality => (
                        <li key={municipality.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{municipality.name}</span>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setConfirmation({
                                isOpen: true,
                                title: 'Confirm Deletion',
                                message: `Are you sure you want to delete the municipality "${municipality.name}"? This will also delete all associated barangays.`,
                                onConfirm: () => deleteMunicipalityMutation.mutate(municipality.id)
                              });
                            }}
                            disabled={deleteMunicipalityMutation.isLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="list-group-item text-muted">No municipalities found</li>
                    )}
                  </ul>
                </div>
              </div>
                          
              {/* Barangays List */}
              <div className="col-md-6">
                <h6>Barangays</h6>
                <div className="border rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <ul className="list-group list-group-flush">
                    {Array.isArray(municipalities) && municipalities.length > 0 && Array.isArray(allBarangays) && allBarangays.length > 0 ? (
                      municipalities.flatMap(municipality => {
                        // Filter barangays for this municipality
                        const barangays = allBarangays.filter(b => b.municipality === municipality.id);
                                    
                        return Array.isArray(barangays) && barangays.length > 0 ? (
                          barangays.map(barangay => (
                            <li key={barangay.id} className="list-group-item d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{barangay.name}</strong>
                                <br />
                                <small className="text-muted">{municipality.name}</small>
                              </div>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setConfirmation({
                                    isOpen: true,
                                    title: 'Confirm Deletion',
                                    message: `Are you sure you want to delete the barangay "${barangay.name}" from "${municipality.name}"?`,
                                    onConfirm: () => deleteBarangayMutation.mutate(barangay.id)
                                  });
                                }}
                                disabled={deleteBarangayMutation.isLoading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </li>
                          ))
                        ) : null;
                      })
                    ) : (
                      <li className="list-group-item text-muted">No barangays found</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}