import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Package, Truck, Users, Clock } from 'lucide-react'

const iconMap = {
  'Dashboard': LayoutDashboard,
  'Orders': Package,
  'Inventory': Truck,
  'Deliveries': Truck,
  'Users': Users,
  'Activity Log': Clock,
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

  // Ensure all items are properly rendered
  useEffect(() => {
    // This effect ensures the component re-renders when location changes
  }, [location])

  return (
    <div className="nav flex-column gap-2">
      {items.map(i => {
        // If the item is marked admin-only and current role is not admin, skip it
        if (i.adminOnly && role !== 'admin') return null
        const isActive = i.active || location.pathname === i.href
        const isVisited = visited.has(i.href) || isActive
        const Icon = iconMap[i.label] || LayoutDashboard

        // Determine Bootstrap button variant:
        // - active route: solid success
        // - visited (not active): outline-success
        // - default: light button with border
        const btnClass = isActive
          ? 'btn btn-success d-flex align-items-center'
          : isVisited
          ? 'btn btn-outline-success d-flex align-items-center'
          : 'btn btn-light border d-flex align-items-center'

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