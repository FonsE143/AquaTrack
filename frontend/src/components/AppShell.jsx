import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplet, User, LogOut, Menu, X } from 'lucide-react'

export default function AppShell({ role='admin', children, sidebar }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  // If `sidebar` is a React element, clone it and inject `onNavigate` so
  // mobile drawer can close after a navigation click.
  const sidebarWithOnNavigate = React.isValidElement(sidebar)
    ? React.cloneElement(sidebar, { onNavigate: () => setSidebarOpen(false), role })
    : sidebar

  return (
    <div className="min-vh-100 bg-light">
      <header className="py-2 bg-white border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 position-fixed w-100" style={{ zIndex: 1030, top: 0 }}>
        <div className="d-flex align-items-center">
          <button
            className="btn btn-light me-2"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <Droplet size={20} className="text-success me-2" />
          <span className="fw-bold fs-6">AquaTrack</span>
        </div>

        <div className="position-relative">
          <details>
            <summary className="btn btn-light d-flex align-items-center gap-2 p-2">
              <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                <User size={16} className="text-white" />
              </div>
              <span className="small d-none d-sm-inline">My Account ({role[0].toUpperCase()+role.slice(1)})</span>
            </summary>
            <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm py-1" style={{ minWidth: 180, zIndex: 1100 }}>
              <button
                className="btn btn-light w-100 text-start"
                onClick={() => navigate('/profile')}
              >
                <User size={14} className="me-2" />
                Profile
              </button>
              <button
                className="btn btn-light w-100 text-start"
                onClick={handleLogout}
              >
                <LogOut size={14} className="me-2" />
                Log out
              </button>
            </div>
          </details>
        </div>
      </header>

      <div className="d-flex">
        {/* Mobile drawer - now used for all screen sizes */}
        {sidebarOpen && (
          <div>
            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1040 }} onClick={() => setSidebarOpen(false)} />
            <div className="position-fixed top-0 start-0 h-100 bg-white shadow" style={{ width: 260, zIndex: 1050, padding: '1rem', paddingTop: 'calc(1rem + 56px)' }}>
              <button className="btn btn-light mb-3" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
                <X size={16} />
              </button>
              {sidebarWithOnNavigate}
            </div>
          </div>
        )}

        <main className="flex-grow-1 p-4 bg-light" style={{ marginLeft: '0', marginTop: '56px' }}>{children}</main>
      </div>
    </div>
  )
}