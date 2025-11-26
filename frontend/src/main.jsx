import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/Orders'
import AdminInventory from './pages/admin/Inventory'
import AdminUsers from './pages/admin/Users'
import AdminActivity from './pages/admin/Activity'
import StaffDashboard from './pages/staff/Dashboard'
import StaffOrders from './pages/staff/Orders'
import StaffInventory from './pages/staff/Inventory'
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerNotifications from './pages/customer/Notifications'
import ProfilePage from './pages/Profile'
import DriverDashboard from './pages/driver/Dashboard'
import DriverDeliveries from './pages/driver/Deliveries'
import OrderHistoryPage from './pages/OrderHistory'
import { api } from './api/client'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// eslint-disable-next-line react-refresh/only-export-components
function RequireAuth({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const [userRole, setUserRole] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  
  React.useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    
    // Fetch user role
    api.get('/me/')
      .then(res => {
        setUserRole(res.data.role)
        // Store user role in localStorage for navigation
        localStorage.setItem('userRole', res.data.role)
        if (allowedRoles.length > 0 && !allowedRoles.includes(res.data.role)) {
          // Redirect based on role
          const roleMap = {
            admin: '/admin/dashboard',
            staff: '/staff/dashboard',
            driver: '/driver/dashboard',
            customer: '/customer/dashboard',
          };
          navigate(roleMap[res.data.role] || '/login', { replace: true })
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        navigate('/login', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [token, allowedRoles, navigate])
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return null // Will redirect in useEffect
  }
  
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Admin */}
          <Route path="/admin/dashboard" element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/orders" element={<RequireAuth allowedRoles={['admin']}><AdminOrders /></RequireAuth>} />
          <Route path="/admin/order-history" element={<RequireAuth allowedRoles={['admin']}><OrderHistoryPage /></RequireAuth>} />
          <Route path="/admin/inventory" element={<RequireAuth allowedRoles={['admin']}><AdminInventory /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth allowedRoles={['admin']}><AdminUsers /></RequireAuth>} />
          <Route path="/admin/activity" element={<RequireAuth allowedRoles={['admin']}><AdminActivity /></RequireAuth>} />
          {/* Staff */}
          <Route path="/staff/dashboard" element={<RequireAuth allowedRoles={['staff', 'admin']}><StaffDashboard /></RequireAuth>} />
          <Route path="/staff/orders" element={<RequireAuth allowedRoles={['staff', 'admin']}><StaffOrders /></RequireAuth>} />
          <Route path="/staff/order-history" element={<RequireAuth allowedRoles={['staff', 'admin']}><OrderHistoryPage /></RequireAuth>} />
          <Route path="/staff/inventory" element={<RequireAuth allowedRoles={['staff', 'admin']}><StaffInventory /></RequireAuth>} />
          {/* Customer */}
          <Route path="/customer/dashboard" element={<RequireAuth allowedRoles={['customer']}><CustomerDashboard /></RequireAuth>} />
          <Route path="/customer/order-history" element={<RequireAuth allowedRoles={['customer']}><OrderHistoryPage /></RequireAuth>} />
          <Route path="/customer/notifications" element={<RequireAuth allowedRoles={['customer']}><CustomerNotifications /></RequireAuth>} />
          {/* Driver */}
          <Route path="/driver/dashboard" element={<RequireAuth allowedRoles={['driver']}><DriverDashboard /></RequireAuth>} />
          <Route path="/driver/deliveries" element={<RequireAuth allowedRoles={['driver']}><DriverDeliveries /></RequireAuth>} />
          {/* Profile */}
          <Route path="/profile" element={<RequireAuth allowedRoles={['admin','staff','customer','driver']}><ProfilePage /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)