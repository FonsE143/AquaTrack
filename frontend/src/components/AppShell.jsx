import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplet, User, LogOut, Menu, X } from 'lucide-react'

export default function AppShell({ role='admin', children, sidebar }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // If `sidebar` is a React element, clone it and inject `onNavigate` so
  // mobile drawer can close after a navigation click.
  const sidebarWithOnNavigate = React.isValidElement(sidebar)
    ? React.cloneElement(sidebar, { onNavigate: () => setSidebarOpen(false), role })
    : sidebar

  return (
    <div className="min-vh-100 bg-light">
      <header className="app-header py-2 bg-white border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 position-fixed w-100" style={{ zIndex: 1030, top: 0 }}>
        <div className="d-flex align-items-center">
          <button
            className="btn btn-light d-md-none me-2"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <Droplet size={20} className="text-success me-2" />
          <span className="fw-bold">AquaFlow</span>
        </div>

        <div className="position-relative" ref={accountMenuRef}>
          <button 
            className="btn btn-light d-flex align-items-center gap-2"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            aria-expanded={accountMenuOpen}
          >
            <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
              <User size={16} className="text-white" />
            </div>
            <span className="small d-none d-md-inline">My Account ({role[0].toUpperCase()+role.slice(1)})</span>
          </button>
          {accountMenuOpen && (
            <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm py-1" style={{ minWidth: 180, zIndex: 1100, right: 0 }}>
              <button
                className="btn btn-light w-100 text-start"
                onClick={() => {
                  navigate('/profile')
                  setAccountMenuOpen(false)
                }}
              >
                <User size={14} className="me-2" />
                Profile
              </button>
              <button
                className="btn btn-light w-100 text-start"
                onClick={() => {
                  handleLogout()
                  setAccountMenuOpen(false)
                }}
              >
                <LogOut size={14} className="me-2" />
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="d-flex">
        {/* Desktop sidebar - fixed position */}
        <aside className="d-none d-md-block position-fixed bg-white" style={{ width: 260, top: 60, left: 0, bottom: 0, zIndex: 1020 }}>
          <div className="h-100" style={{ padding: '1rem', overflowY: 'auto' }}>
            {sidebarWithOnNavigate}
          </div>
        </aside>

        {/* Mobile drawer */}
        {sidebarOpen && (
          <div className="d-md-none">
            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1040 }} onClick={() => setSidebarOpen(false)} />
            <div className="position-fixed top-0 start-0 h-100 bg-white shadow" style={{ width: 260, zIndex: 1050, padding: '1rem' }}>
              <button className="btn btn-light mb-3" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
                <X size={16} />
              </button>
              {sidebarWithOnNavigate}
            </div>
          </div>
        )}

        {/* Main content - add left margin on desktop to account for fixed sidebar */}
        <main className="flex-grow-1 bg-light main-content">
          <div className="main-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}