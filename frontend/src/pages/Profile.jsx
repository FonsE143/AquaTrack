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
          { label: 'Employees', href: '/admin/employees' },
          { label: 'Activity Logs', href: '/admin/activity-logs' },
          { label: 'Profile', href: '/profile', active: true },
        ]
      case 'staff':
        return [
          { label: 'Dashboard', href: '/staff/dashboard' },
          { label: 'Orders', href: '/staff/deployment' },
          { label: 'Deliveries', href: '/staff/activity-logs' },
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

  // Fetch municipalities
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const response = await api.get('/municipalities/')
        // Handle both paginated and non-paginated responses
        const data = Array.isArray(response.data) ? response.data : 
                    (response.data.results && Array.isArray(response.data.results) ? response.data.results : [])
        console.log('Municipalities fetched:', data);
        setMunicipalities(data)
      } catch (err) {
        console.error('Failed to fetch municipalities:', err)
        setMunicipalities([]) // Set to empty array on error
      }
    }
    fetchMunicipalities()
  }, [])

  // Fetch barangays when municipality changes (for user interactions)
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
            const barangayData = Array.isArray(response.data) ? response.data : 
                                (response.data.results && Array.isArray(response.data.results) ? response.data.results : [])
            console.log('Received barangays:', barangayData);
            console.log('Setting barangay to:', newForm.barangay);
            setBarangays(barangayData)
          } catch (err) {
            console.error('Failed to fetch barangays:', err)
            setBarangays([])
          }
        }
        
        fetchBarangaysForMunicipality();
      }
    }
  }, [data])

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log('Form field changed:', name, value, typeof value);
    setForm((prev) => ({ ...prev, [name]: value }))
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
        if (err.response.data.detail) {
          msg = err.response.data.detail;
        } else if (err.response.data.error) {
          msg = err.response.data.error;
        } else if (typeof err.response.data === 'string') {
          msg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          // Handle field-specific errors
          const errorFields = Object.keys(err.response.data);
          if (errorFields.length > 0) {
            const firstField = errorFields[0];
            const fieldErrors = err.response.data[firstField];
            if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
              msg = `${firstField}: ${fieldErrors[0]}`;
            } else {
              msg = `${firstField}: ${fieldErrors}`;
            }
          }
        }
      } else if (err.message) {
        msg = err.message;
      }
      
      setMessage({ type: 'error', text: msg });
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
                            {isEditingAddress ? 'Cancel Edit' : 'Edit Address'}
                          </button>
                        </div>
                        
                        {/* Address Edit Form */}
                        {isEditingAddress && (
                          <div className="mt-3 pt-3 border-top">
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label className="form-label fw-medium">Municipality</label>
                                <select
                                  name="municipality"
                                  value={form.municipality}
                                  onChange={handleChange}
                                  className="form-control"
                                >
                                  <option value="">Select Municipality</option>
                                  {Array.isArray(municipalities) && municipalities.map((municipality) => (
                                    <option key={municipality.id} value={String(municipality.id)}>
                                      {municipality.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-medium">Barangay</label>
                                <select
                                  name="barangay"
                                  value={form.barangay}
                                  onChange={handleChange}
                                  className="form-control"
                                  disabled={!form.municipality}
                                >
                                  <option value="">Select Barangay</option>
                                  {Array.isArray(barangays) && barangays.map((barangay) => (
                                    <option key={barangay.id} value={String(barangay.id)}>
                                      {barangay.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-12">
                                <label className="form-label fw-medium">House Number / Lot Number / Street *</label>
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
                  
                  <div className="d-flex justify-content-end mt-4">
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
    </AppShell>
  )
}

export default Profile