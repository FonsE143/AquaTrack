import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppShell from '../components/AppShell'
import { Sidebar } from '../components/Sidebar'
import { api } from '../api/client'

const sidebarMap = {
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Inventory', href: '/admin/inventory' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Profile', href: '/profile', active: true },
  ],
  staff: [
    { label: 'Dashboard', href: '/staff/dashboard' },
    { label: 'Orders', href: '/staff/orders' },
    { label: 'Inventory', href: '/staff/inventory' },
    { label: 'Profile', href: '/profile', active: true },
  ],
  customer: [
    { label: 'Dashboard', href: '/customer/dashboard' },
    { label: 'Notifications', href: '/customer/notifications' },
    { label: 'Profile', href: '/profile', active: true },
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
  const [formInitialized, setFormInitialized] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/me/')).data,
    onSuccess: (profileData) => {
      if (!formInitialized) {
        setForm({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
        })
        setFormInitialized(true)
      }
    },
  })

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
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage(null)
    mutation.mutate(form)
  }

  const role = data?.role || 'customer'

  return (
    <AppShell role={role} sidebar={<Sidebar items={sidebarItems} />}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>

        {message && (
          <div
            className={`mb-4 rounded px-4 py-2 ${
              message.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {isLoading && <p className="text-gray-500">Loading profile...</p>}
        {error && (
          <p className="text-red-600">Failed to load profile information.</p>
        )}

        {!isLoading && data && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  disabled
                  className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                rows="3"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {mutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}