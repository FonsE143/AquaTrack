import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api'
import AppShell from '../components/AppShell'
import { Sidebar } from '../components/Sidebar'

const Profile = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/me/')).data,
  })

  const [message, setMessage] = useState(null)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    municipality: '',
    barangay: '',
    address_details: '', // For house number/street
  })
  
  // State for password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordMessage, setPasswordMessage] = useState(null)
  
  const [municipalities, setMunicipalities] = useState([])
  const [barangays, setBarangays] = useState([])

  // Define sidebar items based on user role
  const sidebarItems = useMemo(() => {
    if (!data) return []
    
    switch (data.role) {
      case 'admin':
        return [
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Route', href: '/admin/route' },
          { label: 'Deployment', href: '/admin/deployment' },
          { label: 'Deployment History', href: '/admin/deployment-history' },
          { label: 'Employees', href: '/admin/employees' },
          { label: 'Customers', href: '/admin/customers' },
          { label: 'Products', href: '/admin/products', adminOnly: true },
          { label: 'Activity Logs', href: '/admin/activity-logs' },
        ]
      case 'staff':
        return [
          { label: 'Dashboard', href: '/staff/dashboard' },
          { label: 'Deployment', href: '/staff/deployment' },
          { label: 'Deployment History', href: '/staff/deployment-history' },
          { label: 'Activity Logs', href: '/staff/activity-logs' },
        ]
      case 'driver':
        return [
          { label: 'Dashboard', href: '/driver/dashboard' },
          { label: 'Deliveries', href: '/driver/deliveries' },
        ]
      case 'customer':
      default:
        return [
          { label: 'Dashboard', href: '/customer/dashboard' },
          { label: 'Order History', href: '/customer/orders' },
        ]
    }
  }, [data])

  // Fetch municipalities on component mount
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const response = await api.get('/municipalities/')
        // Handle both paginated and non-paginated responses
        const data = Array.isArray(response.data) ? response.data : 
                    (response.data.results && Array.isArray(response.data.results) ? response.data.results : [])
        setMunicipalities(data)
      } catch (err) {
        console.error('Failed to fetch municipalities:', err)
        setMunicipalities([]) // Set to empty array on error
      }
    }
    fetchMunicipalities()
  }, [])

  // Fetch barangays when municipality changes
  useEffect(() => {
    const fetchBarangays = async () => {
      if (form.municipality) {
        try {
          console.log('Fetching barangays for municipality:', form.municipality);
          const response = await api.get(`/barangays/?municipality=${form.municipality}`)
          // Handle both paginated and non-paginated responses
          const data = Array.isArray(response.data) ? response.data : 
                      (response.data.results && Array.isArray(response.data.results) ? response.data.results : [])
          console.log('Received barangays:', data);
          setBarangays(data)
          // Reset barangay selection when municipality changes
          setForm(prev => ({ ...prev, barangay: '' }))
        } catch (err) {
          console.error('Failed to fetch barangays:', err)
          setBarangays([]) // Set to empty array on error
          setForm(prev => ({ ...prev, barangay: '' }))
        }
      } else {
        setBarangays([])
        setForm(prev => ({ ...prev, barangay: '' }))
      }
    }
    fetchBarangays()
  }, [form.municipality])

  // Initialize form when data is loaded
  useEffect(() => {
    if (data) {
      console.log('Profile data received:', data);
      const newForm = {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        municipality: data.address?.municipality ? String(data.address.municipality) : '',
        barangay: data.address?.barangay ? String(data.address.barangay) : '',
        address_details: data.address?.full_address || '',
      }
      console.log('Form initialized with:', newForm);
      
      // Show a message if no address is set
      if (!data.address?.full_address) {
        setMessage({ type: 'info', text: 'Please set your complete address below.' })
      }
      
      // Set the form
      setForm(newForm)
      
      // If there's a municipality in the loaded data, fetch barangays for it
      if (data.address?.municipality) {
        console.log('Fetching barangays for municipality:', data.address.municipality);
        // We need to manually trigger the barangay fetch since useEffect won't trigger
        // when we set the form values directly
        const fetchBarangaysForMunicipality = async () => {
          try {
            const response = await api.get(`/barangays/?municipality=${data.address.municipality}`)
            // Handle both paginated and non-paginated responses
            const data = Array.isArray(response.data) ? response.data : 
                        (response.data.results && Array.isArray(response.data.results) ? response.data.results : [])
            console.log('Received barangays for existing municipality:', data);
            setBarangays(data)
          } catch (err) {
            console.error('Failed to fetch barangays for existing municipality:', err)
            setBarangays([])
          }
        }
        fetchBarangaysForMunicipality()
      }
    }
  }, [data])

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log('Form field changed:', name, value, typeof value);
    setForm((prev) => ({ ...prev, [name]: value }))
  }
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const mutation = useMutation({
    mutationFn: async (payload) => (await api.patch('/me/', payload)).data,
    onSuccess: (updated) => {
      console.log('Profile update response:', updated);
      queryClient.setQueryData(['profile'], updated)
      setForm({
        first_name: updated.first_name || '',
        last_name: updated.last_name || '',
        email: updated.email || '',
        phone: updated.phone || '',
        municipality: updated.address?.municipality ? String(updated.address.municipality) : '',
        barangay: updated.address?.barangay ? String(updated.address.barangay) : '',
        address_details: updated.address?.full_address || '',
      })
      setIsEditingAddress(false) // Close address editor after successful update
      setMessage({ type: 'success', text: 'Profile and address updated successfully.' })
    },
    onError: (err) => {
      console.error('Profile update error:', err);
      let msg = 'Failed to update profile.';
      
      // Handle different types of error responses
      if (err.response?.data) {
        // Check for DRF validation errors
        if (typeof err.response.data === 'object' && !Array.isArray(err.response.data)) {
          // Field-specific errors
          const fieldErrors = [];
          Object.keys(err.response.data).forEach(field => {
            const fieldError = err.response.data[field];
            if (Array.isArray(fieldError)) {
              fieldErrors.push(`${field}: ${fieldError.join(', ')}`);
            } else if (typeof fieldError === 'string') {
              fieldErrors.push(`${field}: ${fieldError}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            msg = fieldErrors.join('; ');
          } else {
            // General error message
            msg = err.response.data.detail || 'Failed to update profile.';
          }
        } else if (typeof err.response.data === 'string') {
          msg = err.response.data;
        }
      }
      
      setMessage({ type: 'error', text: msg });
    },
  })
  
  // Mutation for password change
  const passwordMutation = useMutation({
    mutationFn: async (payload) => (await api.post('/account/change-password/', payload)).data,
    onSuccess: () => {
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' })
      // Clear form
      setPasswordForm({
        old_password: '',
        new_password: '',
        confirm_password: ''
      })
      // Close modal after delay
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordMessage(null)
      }, 2000)
    },
    onError: (err) => {
      console.error('Password change error:', err);
      let msg = 'Failed to change password.';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object' && !Array.isArray(err.response.data)) {
          if (err.response.data.error) {
            msg = err.response.data.error;
          } else if (err.response.data.detail) {
            msg = err.response.data.detail;
          }
        } else if (typeof err.response.data === 'string') {
          msg = err.response.data;
        }
      }
      
      setPasswordMessage({ type: 'error', text: msg });
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate address fields if editing address
    if (isEditingAddress) {
      // If any address field is filled, all must be filled
      if (form.municipality || form.barangay || form.address_details) {
        if (!form.municipality || form.municipality === '') {
          setMessage({ type: 'error', text: 'Please select a municipality.' })
          return
        }
        if (!form.barangay || form.barangay === '') {
          setMessage({ type: 'error', text: 'Please select a barangay.' })
          return
        }
        if (!form.address_details.trim()) {
          setMessage({ type: 'error', text: 'House Number / Lot Number / Street is required.' })
          return
        }
      }
    }
    
    // Prepare the data to send
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
    }
    
    // Only include address fields if editing address
    if (isEditingAddress) {
      payload.municipality = form.municipality ? Number(form.municipality) : undefined
      payload.barangay = form.barangay ? Number(form.barangay) : undefined
      payload.address_details = form.address_details
    }
    
    console.log('Sending profile update payload:', payload);
    mutation.mutate(payload)
  }
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!passwordForm.old_password) {
      setPasswordMessage({ type: 'error', text: 'Current password is required.' })
      return
    }
    
    if (!passwordForm.new_password) {
      setPasswordMessage({ type: 'error', text: 'New password is required.' })
      return
    }
    
    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' })
      return
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' })
      return
    }
    
    // Send request
    passwordMutation.mutate({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password
    })
  }

  const getAddressDisplay = () => {
    if (!data?.address) {
      return 'No address set'
    }
    
    const { full_address, barangay_name, municipality_name } = data.address
    if (full_address && barangay_name && municipality_name) {
      return `${full_address}, ${barangay_name}, ${municipality_name}`
    }
    
    // Fallback to IDs if names are not available
    const { full_address: addr, barangay, municipality } = data.address
    if (addr && barangay && municipality) {
      return `${addr}, Barangay ID: ${barangay}, Municipality ID: ${municipality}`
    }
    
    return 'Incomplete address'
  }

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {error.message}</div>

  return (
    <AppShell role={data?.role || 'customer'} sidebar={<Sidebar items={sidebarItems} />}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h1 className="h3 mb-1">My Profile</h1>
                <p className="text-muted mb-0">Manage your personal information</p>
              </div>

            </div>

            {message && (
              <div
                className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`}
                role="alert"
              >
                {message.text}
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="alert"
                  aria-label="Close"
                  onClick={() => setMessage(null)}
                ></button>
              </div>
            )}
            
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        className="form-control"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        className="form-control"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="form-control"
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-medium">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="form-control"
                      />
                    </div>
                    
                    {/* Address Display */}
                    <div className="col-12">
                      <label className="form-label fw-medium">Address</label>
                      <div className="border rounded p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            {data?.address ? (
                              <p className="mb-0">{getAddressDisplay()}</p>
                            ) : (
                              <p className="mb-0 text-muted">No address set</p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setIsEditingAddress(!isEditingAddress)}
                          >
                            {isEditingAddress ? 'Cancel' : 'Edit Address'}
                          </button>
                        </div>
                        
                        {isEditingAddress && (
                          <div className="mt-3">
                            <div className="row g-3">
                              <div className="col-12 col-md-6">
                                <label className="form-label">Municipality *</label>
                                <select
                                  name="municipality"
                                  value={form.municipality}
                                  onChange={handleChange}
                                  className="form-select"
                                  required={form.barangay || form.address_details}
                                >
                                  <option value="">Select Municipality</option>
                                  {municipalities.map((municipality) => (
                                    <option key={municipality.id} value={municipality.id}>
                                      {municipality.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-12 col-md-6">
                                <label className="form-label">Barangay *</label>
                                <select
                                  name="barangay"
                                  value={form.barangay}
                                  onChange={handleChange}
                                  className="form-select"
                                  disabled={!form.municipality}
                                  required={form.municipality || form.address_details}
                                >
                                  <option value="">Select Barangay</option>
                                  {barangays.map((barangay) => (
                                    <option key={barangay.id} value={barangay.id}>
                                      {barangay.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-12">
                                <label className="form-label">House Number / Lot Number / Street *</label>
                                <input
                                  type="text"
                                  name="address_details"
                                  value={form.address_details}
                                  onChange={handleChange}
                                  className="form-control"
                                  placeholder="Enter your house number, lot number, or street address"
                                />
                                <div className="form-text">This field is required to set your complete address.</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end mt-4 gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Change Password
                    </button>
                    <button
                      type="submit"
                      disabled={mutation.isLoading}
                      className="btn btn-success px-4"
                    >
                      {mutation.isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Password Change Modal */}
      <div className={`modal fade ${showPasswordModal ? 'show' : ''}`} 
           style={{ display: showPasswordModal ? 'block' : 'none' }} 
           tabIndex="-1" 
           aria-labelledby="passwordModalLabel" 
           aria-hidden={!showPasswordModal}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="passwordModalLabel">Change Password</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordMessage(null)
                  setPasswordForm({
                    old_password: '',
                    new_password: '',
                    confirm_password: ''
                  })
                }}
              ></button>
            </div>
            <div className="modal-body">
              {passwordMessage && (
                <div className={`alert ${passwordMessage.type === 'error' ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
                  {passwordMessage.text}
                  <button 
                    type="button" 
                    className="btn-close" 
                    data-bs-dismiss="alert" 
                    aria-label="Close"
                    onClick={() => setPasswordMessage(null)}
                  ></button>
                </div>
              )}
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    name="old_password"
                    value={passwordForm.old_password}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                    minLength={8}
                  />
                  <div className="form-text">Must be at least 8 characters long.</div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordMessage(null)
                      setPasswordForm({
                        old_password: '',
                        new_password: '',
                        confirm_password: ''
                      })
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={passwordMutation.isLoading}
                  >
                    {passwordMutation.isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal backdrop */}
      {showPasswordModal && <div className="modal-backdrop fade show"></div>}
    </AppShell>
  )
}

export default Profile