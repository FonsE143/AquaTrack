import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppShell from '../components/AppShell'
import { Sidebar } from '../components/Sidebar'
import { api } from '../api/client'

const sidebarMap = {
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Order History', href: '/admin/order-history' },
    { label: 'Inventory', href: '/admin/inventory' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Activity Log', href: '/admin/activity', adminOnly: true },
  ],
  staff: [
    { label: 'Dashboard', href: '/staff/dashboard' },
    { label: 'Orders', href: '/staff/orders' },
    { label: 'Order History', href: '/staff/order-history' },
    { label: 'Inventory', href: '/staff/inventory' },
  ],
  driver: [
    { label: 'Dashboard', href: '/driver/dashboard' },
    { label: 'Deliveries', href: '/driver/deliveries' },
  ],
  customer: [
    { label: 'Dashboard', href: '/customer/dashboard' },
    { label: 'Order History', href: '/customer/order-history' },
    { label: 'Notifications', href: '/customer/notifications' },
  ],
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [message, setMessage] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      console.log('Fetching profile data...');
      const response = await api.get('/me/');
      console.log('Profile data received:', response.data);
      return response.data;
    },
  })

  // Initialize form when data is loaded
  useEffect(() => {
    if (data) {
      console.log('Profile data received:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
      const newForm = {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      };
      console.log('Setting form to:', newForm);
      setForm(newForm);
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: async (payload) => (await api.patch('/me/', payload)).data,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated)
      setForm({
        first_name: updated.first_name || '',
        last_name: updated.last_name || '',
        email: updated.email || '',
        phone: updated.phone || '',
        address: updated.address || '',
      })
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    },
    onError: (err) => {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to update profile.'
      setMessage({ type: 'error', text: msg })
    },
  })

  const sidebarItems = useMemo(() => {
    const role = data?.role || 'customer'
    return sidebarMap[role] || sidebarMap.customer
  }, [data?.role])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      console.log('Form updated to:', updated);
      return updated;
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage(null)
    mutation.mutate(form)
  }

  const role = data?.role || 'customer'

  return (
    <AppShell role={role} sidebar={<Sidebar items={sidebarItems} />}>
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

            {isLoading && (
              <div className="d-flex align-items-center justify-content-center py-5">
                {console.log('Rendering loading state')}
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" role="alert">
                Failed to load profile information. Error: {error.message || 'Unknown error'}
                {console.log('Profile loading error:', error)}
              </div>
            )}

            {!isLoading && data && (
              <div className="card border-0 shadow-sm">
                {console.log('Rendering profile form. Data:', data, 'isLoading:', isLoading)}
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-medium">First Name</label>
                        <input
                          type="text"
                          name="first_name"
                          value={form.first_name}
                          onChange={handleChange}
                          className="form-control"
                        />
                        {console.log('Rendering first_name:', form.first_name, 'Type:', typeof form.first_name)}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Last Name</label>
                        <input
                          type="text"
                          name="last_name"
                          value={form.last_name}
                          onChange={handleChange}
                          className="form-control"
                        />
                        {console.log('Rendering last_name:', form.last_name, 'Type:', typeof form.last_name)}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Contact Number</label>
                        <input
                          type="text"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">Role</label>
                        <input
                          type="text"
                          value={role}
                          disabled
                          className="form-control bg-light"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-medium">Address</label>
                        <textarea
                          name="address"
                          rows="3"
                          value={form.address}
                          onChange={handleChange}
                          className="form-control"
                        />
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
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}