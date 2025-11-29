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
import AdminDeployment from './pages/admin/Deployment'
import AdminRoute from './pages/admin/Route'
import AdminEmployees from './pages/admin/Employees'
import AdminProducts from './pages/admin/Products'
import AdminActivityLogs from './pages/admin/ActivityLogs'
import StaffDashboard from './pages/staff/Dashboard'
import StaffDeployment from './pages/staff/Deployment'
import StaffActivityLogs from './pages/staff/ActivityLogs'
import CustomerDashboard from './pages/customer/Dashboard'
import DriverDashboard from './pages/driver/Dashboard'
import DriverDeliveries from './pages/driver/Deliveries'
import ProfilePage from './pages/Profile'
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
          <Route path="/admin/route" element={<RequireAuth allowedRoles={['admin']}><AdminRoute /></RequireAuth>} />
          <Route path="/admin/deployment" element={<RequireAuth allowedRoles={['admin']}><AdminDeployment /></RequireAuth>} />
          <Route path="/admin/employees" element={<RequireAuth allowedRoles={['admin']}><AdminEmployees /></RequireAuth>} />
          <Route path="/admin/products" element={<RequireAuth allowedRoles={['admin']}><AdminProducts /></RequireAuth>} />
          <Route path="/admin/activity-logs" element={<RequireAuth allowedRoles={['admin']}><AdminActivityLogs /></RequireAuth>} />
          {/* Staff */}
          <Route path="/staff/dashboard" element={<RequireAuth allowedRoles={['staff', 'admin']}><StaffDashboard /></RequireAuth>} />
          <Route path="/staff/deployment" element={<RequireAuth allowedRoles={['staff', 'admin']}><StaffDeployment /></RequireAuth>} />
          <Route path="/staff/activity-logs" element={<RequireAuth allowedRoles={['staff', 'admin']}><StaffActivityLogs /></RequireAuth>} />
          {/* Customer */}
          <Route path="/customer/dashboard" element={<RequireAuth allowedRoles={['customer']}><CustomerDashboard /></RequireAuth>} />
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