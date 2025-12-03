// src/pages/admin/Employees.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { User, Truck, Plus, Edit, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState, useEffect } from 'react'
import { createStyledAlert } from '../../utils/alertHelper'

export default function AdminEmployees() {
  const items = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Route', href: '/admin/route' },
    { label: 'Deployment', href: '/admin/deployment' },
    { label: 'Deployment History', href: '/admin/deployment-history' },
    { label: 'Employees', href: '/admin/employees', active: true },
    { label: 'Customers', href: '/admin/customers' },
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
  
  // Address state
  const [municipalities, setMunicipalities] = useState([])
  const [barangays, setBarangays] = useState([])
  const [addressForm, setAddressForm] = useState({
    municipality: '',
    barangay: '',
    address_details: ''
  })
  
  const itemsPerPage = 5

  // Fetch municipalities
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const response = await api.get('/municipalities/')
        const data = Array.isArray(response.data) ? response.data : 
                    (response.data.results && Array.isArray(response.data.results) ? response.data.results : [])
        setMunicipalities(data)
      } catch (err) {
        console.error('Failed to fetch municipalities:', err)
        setMunicipalities([])
      }
    }
    
    fetchMunicipalities()
  }, [])

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (addressForm.municipality) {
      const fetchBarangays = async () => {
        try {
          const response = await api.get(`/barangays/?municipality=${addressForm.municipality}`)
          const data = Array.isArray(response.data) ? response.data : 
                      (response.data.results && Array.isArray(response.data.results) ? response.data.results : [])
          setBarangays(data)
        } catch (err) {
          console.error('Failed to fetch barangays:', err)
          setBarangays([])
        }
      }
      
      fetchBarangays()
    } else {
      setBarangays([])
    }
  }, [addressForm.municipality])

  // Reset address form when modal opens/closes or item changes
  useEffect(() => {
    if (showModal && currentItem && currentItem.address_detail) {
      // Pre-fill address form for editing
      setAddressForm({
        municipality: currentItem.address_detail.municipality || '',
        barangay: currentItem.address_detail.barangay || '',
        address_details: currentItem.address_detail.full_address || ''
      })
    } else if (showModal && modalType === 'create') {
      // Clear form for new creation
      setAddressForm({
        municipality: '',
        barangay: '',
        address_details: ''
      })
    }
  }, [showModal, currentItem, modalType])

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
                style={{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
            </li>
            
            {pageNumbers.map(number => (
              <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  style={currentPage === number ? { backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' } : { color: '#28a745', backgroundColor: 'white' }}
                  onClick={() => setCurrentPage(number)}
                >
                  {number}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                style={{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }}
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
      // For drivers, use the drivers endpoint
      if (userData.role === 'staff') {
        return api.post('/staff/', userData)
      } else {
        return api.post('/drivers/', userData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff', 'drivers', 'vehicles'])
      setShowModal(false)
      createStyledAlert('success', 'Success!', 'User created successfully!')
    },
    onError: (error) => {
      // Check if it's a username already exists error
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      
      // Handle specific error cases
      if (errorMessage) {
        if (errorMessage.includes('Username already exists') || errorMessage.includes('A user with this username already exists')) {
          createStyledAlert('error', 'Username Taken', 'This username is already taken. Please choose a different username.', 5000);
        } else if (errorMessage.includes('Username is required')) {
          createStyledAlert('error', 'Missing Username', 'Username is required. Please enter a username.', 5000);
        } else if (errorMessage.includes('Username must be')) {
          createStyledAlert('error', 'Invalid Username', 'Username must be between 3 and 30 characters and can only contain letters, numbers, and underscores.', 5000);
        } else if (errorMessage.includes('First name must be')) {
          createStyledAlert('error', 'Invalid First Name', 'First name must be no more than 50 characters.', 5000);
        } else if (errorMessage.includes('Last name must be')) {
          createStyledAlert('error', 'Invalid Last Name', 'Last name must be no more than 50 characters.', 5000);
        } else if (errorMessage.includes('Invalid email format')) {
          createStyledAlert('error', 'Invalid Email', 'Please enter a valid email address.', 5000);
        } else if (errorMessage.includes('Invalid phone number format')) {
          createStyledAlert('error', 'Invalid Phone', 'Phone number format is invalid. Use 09xx xxx xxxx or +639xxxxxxxxx', 5000);
        } else if (errorMessage.includes('Municipality is required')) {
          createStyledAlert('error', 'Missing Municipality', 'Municipality is required when providing an address.', 5000);
        } else if (errorMessage.includes('Barangay is required')) {
          createStyledAlert('error', 'Missing Barangay', 'Barangay is required when providing an address.', 5000);
        } else if (errorMessage.includes('House Number / Lot Number / Street is required')) {
          createStyledAlert('error', 'Missing Address Details', 'House Number / Lot Number / Street is required when providing an address.', 5000);
        } else if (errorMessage.includes('Address details must be')) {
          createStyledAlert('error', 'Invalid Address', 'Address details must be no more than 200 characters.', 5000);
        } else if (errorMessage.includes('A profile with this user already exists') || errorMessage.includes('A profile for this user already exists')) {
          createStyledAlert('error', 'Profile Exists', 'A profile for this user already exists. Please choose a different username or check if this user already has a profile.', 5000);
        } else if (errorMessage.includes('Required profile information is missing')) {
          createStyledAlert('error', 'Missing Profile Info', 'Required profile information is missing.', 5000);
        } else if (errorMessage.includes('Failed to create user')) {
          createStyledAlert('error', 'User Creation Failed', errorMessage, 5000);
        } else if (errorMessage.includes('Failed to create profile')) {
          createStyledAlert('error', 'Profile Creation Failed', errorMessage, 5000);
        } else {
          createStyledAlert('error', 'Error Creating User', errorMessage, 5000);
        }
      } else {
        createStyledAlert('error', 'Error!', 'Failed to create user. Please try again.', 5000);
      }
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }) => {
      // For staff, use the staff endpoint
      // For drivers, use the drivers endpoint
      if (userData.role === 'staff') {
        return api.patch(`/staff/${userId}/`, userData)
      } else {
        return api.patch(`/drivers/${userId}/`, userData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff', 'drivers', 'vehicles'])
      setShowModal(false)
      createStyledAlert('success', 'Success!', 'User updated successfully!')
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      
      // Handle specific error cases
      if (errorMessage) {
        if (errorMessage.includes('Username already exists')) {
          createStyledAlert('error', 'Username Taken', 'This username is already taken. Please choose a different username.', 5000);
        } else if (errorMessage.includes('Username must be')) {
          createStyledAlert('error', 'Invalid Username', 'Username must be between 3 and 30 characters and can only contain letters, numbers, and underscores.', 5000);
        } else if (errorMessage.includes('First name must be')) {
          createStyledAlert('error', 'Invalid First Name', 'First name must be no more than 50 characters.', 5000);
        } else if (errorMessage.includes('Last name must be')) {
          createStyledAlert('error', 'Invalid Last Name', 'Last name must be no more than 50 characters.', 5000);
        } else if (errorMessage.includes('Invalid email format')) {
          createStyledAlert('error', 'Invalid Email', 'Please enter a valid email address.', 5000);
        } else if (errorMessage.includes('Invalid phone number format')) {
          createStyledAlert('error', 'Invalid Phone', 'Phone number format is invalid. Use 09xx xxx xxxx or +639xxxxxxxxx', 5000);
        } else if (errorMessage.includes('Municipality is required')) {
          createStyledAlert('error', 'Missing Municipality', 'Municipality is required when providing an address.', 5000);
        } else if (errorMessage.includes('Barangay is required')) {
          createStyledAlert('error', 'Missing Barangay', 'Barangay is required when providing an address.', 5000);
        } else if (errorMessage.includes('House Number / Lot Number / Street is required')) {
          createStyledAlert('error', 'Missing Address Details', 'House Number / Lot Number / Street is required when providing an address.', 5000);
        } else if (errorMessage.includes('Address details must be')) {
          createStyledAlert('error', 'Invalid Address', 'Address details must be no more than 200 characters.', 5000);
        } else {
          createStyledAlert('error', 'Error Updating User', errorMessage, 5000);
        }
      } else {
        createStyledAlert('error', 'Error!', 'Failed to update user. Please try again.', 5000);
      }
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
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      if (errorMessage) {
        createStyledAlert('error', 'Error Creating Vehicle', errorMessage, 5000);
      } else {
        createStyledAlert('error', 'Error!', 'Failed to create vehicle. Please try again.', 5000);
      }
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
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      if (errorMessage) {
        createStyledAlert('error', 'Error Updating Vehicle', errorMessage, 5000);
      } else {
        createStyledAlert('error', 'Error!', 'Failed to update vehicle. Please try again.', 5000);
      }
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
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      if (errorMessage) {
        createStyledAlert('error', 'Error Deleting Staff', errorMessage, 5000);
      } else {
        createStyledAlert('error', 'Error!', 'Failed to delete staff member. Please try again.', 5000);
      }
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
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      if (errorMessage) {
        createStyledAlert('error', 'Error Deleting Driver', errorMessage, 5000);
      } else {
        createStyledAlert('error', 'Error!', 'Failed to delete driver. Please try again.', 5000);
      }
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
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      if (errorMessage) {
        createStyledAlert('error', 'Error Deleting Vehicle', errorMessage, 5000);
      } else {
        createStyledAlert('error', 'Error!', 'Failed to delete vehicle. Please try again.', 5000);
      }
    }
  })

  // Validate employee form
  const validateEmployeeForm = (formData) => {
    const errors = {};
    
    // Validate username
    const username = formData.get('username');
    if (!username || username.trim() === '') {
      errors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    } else if (username.trim().length > 30) {
      errors.username = 'Username must be no more than 30 characters long';
    } else {
      // Check for valid characters in username (alphanumeric and underscore only)
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username.trim())) {
        errors.username = 'Username can only contain letters, numbers, and underscores';
      }
    }
    
    // Validate names (not required but if provided, they should be valid)
    const firstName = formData.get('first_name');
    const lastName = formData.get('last_name');
    
    if (firstName && firstName.trim().length > 50) {
      errors.first_name = 'First name must be no more than 50 characters';
    }
    
    if (lastName && lastName.trim().length > 50) {
      errors.last_name = 'Last name must be no more than 50 characters';
    }
    
    // Validate email if provided
    const email = formData.get('email');
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    // Validate phone if provided
    const phone = formData.get('phone');
    if (phone && phone.trim() !== '') {
      // Allow common phone formats
      const phoneRegex = /^(09\d{2}[-\s]?\d{3}[-\s]?\d{4}|\+639\d{9})$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.phone = 'Invalid phone number format. Use 09xx xxx xxxx or +639xxxxxxxxx';
      }
    }
    
    // Validate address fields if any are provided
    const municipality = addressForm.municipality;
    const barangay = addressForm.barangay;
    const addressDetails = addressForm.address_details;
    
    if (municipality || barangay || addressDetails) {
      // All address fields are required if any are provided
      if (!municipality) {
        errors.municipality = 'Municipality is required when providing an address';
      }
      
      if (!barangay) {
        errors.barangay = 'Barangay is required when providing an address';
      }
      
      if (!addressDetails || addressDetails.trim() === '') {
        errors.address_details = 'House Number / Lot Number / Street is required when providing an address';
      } else if (addressDetails.trim().length > 200) {
        errors.address_details = 'Address details must be no more than 200 characters';
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };

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
      // Validate employee form
      const errors = validateEmployeeForm(formData);
      if (errors) {
        // Display errors
        const errorMessages = Object.values(errors).join(', ');
        createStyledAlert('error', 'Validation Error', errorMessages);
        return;
      }
      
      const userData = {
        username: formData.get('username').trim(),
        first_name: formData.get('first_name').trim(),
        last_name: formData.get('last_name').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        role: activeTab === 'staff' ? 'staff' : 'driver'
      }
      
      // Add address data if all fields are filled
      if (addressForm.municipality && addressForm.barangay && addressForm.address_details) {
        userData.municipality = addressForm.municipality
        userData.barangay = addressForm.barangay
        userData.address_details = addressForm.address_details.trim()
      }
      
      // For new users, don't send password as backend sets default passwords
      if (modalType === 'create') {
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
            <label className="form-label">Username *</label>
            <input 
              type="text" 
              className="form-control" 
              name="username" 
              defaultValue={currentItem?.username || ''}
              required 
            />
            <div className="form-text small text-muted">
              3-30 characters, letters, numbers, and underscores only
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">First Name</label>
            <input 
              type="text" 
              className="form-control" 
              name="first_name" 
              defaultValue={currentItem?.first_name || ''}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Last Name</label>
            <input 
              type="text" 
              className="form-control" 
              name="last_name" 
              defaultValue={currentItem?.last_name || ''}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              name="email" 
              defaultValue={currentItem?.email || ''}
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
            <div className="form-text small text-muted">
              Optional. Format: 09xx xxx xxxx or +639xxxxxxxxx
            </div>
          </div>
          
          {/* Address Section */}
          <div className="mb-3">
            <h6 className="fw-semibold mb-3">Address</h6>
            
            {/* Municipality */}
            <div className="mb-3">
              <label className="form-label">Municipality</label>
              <select
                className="form-select"
                value={addressForm.municipality}
                onChange={(e) => setAddressForm({...addressForm, municipality: e.target.value, barangay: ''})}
              >
                <option value="">Select Municipality</option>
                {municipalities.map(municipality => (
                  <option key={municipality.id} value={municipality.id}>
                    {municipality.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Barangay */}
            <div className="mb-3">
              <label className="form-label">Barangay</label>
              <select
                className="form-select"
                value={addressForm.barangay}
                onChange={(e) => setAddressForm({...addressForm, barangay: e.target.value})}
                disabled={!addressForm.municipality}
              >
                <option value="">Select Barangay</option>
                {barangays.map(barangay => (
                  <option key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Address Details */}
            <div className="mb-3">
              <label className="form-label">House Number / Lot Number / Street</label>
              <textarea
                className="form-control"
                placeholder="Enter complete address"
                value={addressForm.address_details}
                onChange={(e) => setAddressForm({...addressForm, address_details: e.target.value})}
                rows="2"
              />
              <div className="form-text small text-muted">
                Maximum 200 characters
              </div>
            </div>
          </div>
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
              <th className="d-none d-md-table-cell">Email</th>
              <th className="d-none d-lg-table-cell">Phone</th>
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
                    <td>
                      <div className="d-flex flex-column justify-content-center" style={{ height: '100%' }}>
                        <span className="fw-bold">{user.username}</span>
                        <span className="d-md-none text-muted small">
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell">
                      <div className="d-flex align-items-center" style={{ height: '100%' }}>
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell">
                      <div className="d-flex flex-column justify-content-center" style={{ height: '100%' }}>
                        <span>{user.email}</span>
                        <span className="d-lg-none text-muted small">Phone: {user.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <div className="d-flex align-items-center" style={{ height: '100%' }}>
                        {user.phone || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1 gap-md-2 align-items-center" style={{ height: '100%' }}>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit size={16} />
                          <span className="d-none d-md-inline ms-1">Edit</span>
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
                          <span className="d-none d-md-inline ms-1">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              // For empty rows, show placeholder content
              return (
                <tr key={`empty-${index}`} style={{ height: '80px' }}>
                  <td colSpan="5" className="text-center align-middle">
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
              <th className="d-none d-md-table-cell">Email</th>
              <th className="d-none d-lg-table-cell">Phone</th>
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
                    <td>
                      <div className="d-flex flex-column justify-content-center" style={{ height: '100%' }}>
                        <span className="fw-bold">{user.username}</span>
                        <span className="d-md-none text-muted small">
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell">
                      <div className="d-flex align-items-center" style={{ height: '100%' }}>
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell">
                      <div className="d-flex flex-column justify-content-center" style={{ height: '100%' }}>
                        <span>{user.email}</span>
                        <span className="d-lg-none text-muted small">Phone: {user.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <div className="d-flex align-items-center" style={{ height: '100%' }}>
                        {user.phone || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1 gap-md-2 align-items-center" style={{ height: '100%' }}>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit size={16} />
                          <span className="d-none d-md-inline ms-1">Edit</span>
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
                          <span className="d-none d-md-inline ms-1">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              // For empty rows, show placeholder content
              return (
                <tr key={`empty-${index}`} style={{ height: '80px' }}>
                  <td colSpan="5" className="text-center align-middle">
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
              <th className="d-none d-md-table-cell">Plate Number</th>
              <th className="d-none d-lg-table-cell">Stock Limit</th>
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
                    <td>
                      <div className="d-flex flex-column justify-content-center" style={{ height: '100%' }}>
                        <span className="fw-bold">{vehicle.name}</span>
                        <span className="d-md-none text-muted small">
                          Plate: {vehicle.plate_number}
                        </span>
                        <span className="d-lg-none text-muted small">
                          Stock: {vehicle.stock_limit}
                        </span>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell">
                      <div className="d-flex align-items-center" style={{ height: '100%' }}>
                        {vehicle.plate_number}
                      </div>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <div className="d-flex align-items-center" style={{ height: '100%' }}>
                        {vehicle.stock_limit}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1 gap-md-2 align-items-center" style={{ height: '100%' }}>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setModalType('edit')
                            setCurrentItem(vehicle)
                            setShowModal(true)
                          }}
                        >
                          <Edit size={16} />
                          <span className="d-none d-md-inline ms-1">Edit</span>
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
                          <span className="d-none d-md-inline ms-1">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              // For empty rows, show placeholder content
              return (
                <tr key={`empty-${index}`} style={{ height: '80px' }}>
                  <td colSpan="4" className="text-center align-middle">
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