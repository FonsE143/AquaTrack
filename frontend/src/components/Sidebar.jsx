import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Package, Truck, Users, Clock, FileText, User, Settings, Bell, MapPin, UserCheck, FileClock, PlusCircle } from 'lucide-react'

const iconMap = {
  'Dashboard': LayoutDashboard,
  'Route': MapPin,
  'Deployment': Truck,
  'Employees': Users,
  'Activity Logs': FileClock,
  'Orders': Package,
  'Inventory': Truck,
  'Deliveries': Truck,
  'Users': Users,
  'Activity Log': Clock,
  'Order History': FileText,
  'Notifications': Bell,
  'Profile': User,
  'Settings': Settings,
}

// Sidebar renders Bootstrap-styled nav buttons. Visited links are stored in
// localStorage under `visitedNav` and are styled green (outline) after first click.
export function Sidebar({ items, onNavigate, role }) {
  const location = useLocation()
  const [visited, setVisited] = useState(() => {
    try {
      const raw = localStorage.getItem('visitedNav')
      const arr = raw ? JSON.parse(raw) : []
      return new Set(arr)
    } catch {
      return new Set()
    }
  })

  const markVisited = (href) => {
    try {
      const raw = localStorage.getItem('visitedNav')
      const arr = raw ? JSON.parse(raw) : []
      if (!arr.includes(href)) {
        arr.push(href)
        localStorage.setItem('visitedNav', JSON.stringify(arr))
        setVisited(new Set(arr))
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="nav flex-column gap-2 h-100">
      <style>
        {`
          .sidebar-btn-hover:hover {
            background-color: #198754 !important;
            color: white !important;
            border-color: #198754 !important;
          }
          .sidebar-btn-hover:hover .lucide {
            color: white !important;
          }
        `}
      </style>
      {items.map(i => {
        // If the item is marked admin-only and current role is not admin, skip it
        if (i.adminOnly && role !== 'admin') return null
        const isActive = i.active || location.pathname === i.href
        const isVisited = visited.has(i.href) || isActive
        const Icon = iconMap[i.label] || Settings // Changed fallback from LayoutDashboard to Settings

        // Determine Bootstrap button variant:
        // - active route: solid success
        // - visited (not active): secondary outline without border
        // - default: light button without border
        const btnClass = isActive
          ? 'btn btn-success d-flex align-items-center border-0'
          : isVisited
          ? 'btn btn-outline-secondary d-flex align-items-center border-0 sidebar-btn-hover'
          : 'btn btn-light d-flex align-items-center border-0 sidebar-btn-hover'

        return (
          <Link
            key={i.href}
            to={i.href}
            onClick={() => {
              markVisited(i.href)
              if (typeof onNavigate === 'function') onNavigate()
            }}
            role="button"
            className={`${btnClass}`}
            style={{ gap: '0.5rem' }}
          >
            <Icon size={18} className="" />
            <span className="fw-medium">{i.label}</span>
          </Link>
        )
      })}
    </div>
  )
}