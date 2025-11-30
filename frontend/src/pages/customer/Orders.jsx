// src/pages/customer/Orders.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Package, CheckCircle, XCircle, Clock, Truck, Gift } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export default function CustomerOrders() {
  const items = [
    { label: 'Dashboard', href: '/customer/dashboard' },
    { label: 'Order History', href: '/customer/orders', active: true },
  ]

  // Fetch deliveries for current customer
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: async () => (await api.get('/deliveries/my-deliveries/')).data.results || (await api.get('/deliveries/my-deliveries/')).data || [],
  })

  // Filter for completed and cancelled orders
  const completedOrders = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status === 'delivered' || d.status === 'cancelled')
    : []

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppShell role="customer" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Package className="text-primary" size={24} />
              <h1 className="h3 m-0">Order History</h1>
            </div>
            <p className="text-muted mb-0">View your completed and cancelled orders</p>
          </div>
        </div>

        {isLoading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <Package className="text-primary" size={20} />
                    <h5 className="mb-0">Completed & Cancelled Orders</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  {/* Desktop Table View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Product</th>
                          <th>Ordered Quantity</th>
                          <th className="d-none d-lg-table-cell">Delivered Quantity</th>
                          <th>Status</th>
                          <th className="d-none d-lg-table-cell">Created At</th>
                          <th className="d-none d-xl-table-cell">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(completedOrders) && completedOrders.length > 0 ? (
                          completedOrders.map((delivery, index) => (
                            <tr key={index}>
                              <td>#{delivery.order_id || 'N/A'}</td>
                              <td>{delivery.order_product_name || 'N/A'}</td>
                              <td>
                                {delivery.order_quantity || 0}
                                {delivery.order_free_items > 0 && (
                                  <span className="text-success ms-1">
                                    <Gift size={12} /> +{delivery.order_free_items}
                                  </span>
                                )}
                                {delivery.order_free_items > 0 && (
                                  <div className="small text-muted">
                                    Total: {delivery.order_total_quantity || delivery.order_quantity}
                                  </div>
                                )}
                              </td>
                              <td className="d-none d-lg-table-cell">
                                {delivery.delivered_quantity || delivery.order_quantity || 0}
                              </td>
                              <td>
                                <span className={`badge ${
                                  delivery.status === 'delivered' ? 'bg-success' : 
                                  delivery.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  <div className="d-flex align-items-center gap-1">
                                    {delivery.status === 'delivered' && <CheckCircle size={12} />}
                                    {delivery.status === 'cancelled' && <XCircle size={12} />}
                                    {delivery.status ? delivery.status.replace('_', ' ').charAt(0).toUpperCase() + delivery.status.replace('_', ' ').slice(1) : 'N/A'}
                                  </div>
                                </span>
                              </td>
                              <td className="d-none d-lg-table-cell">{formatDate(delivery.created_at)}</td>
                              <td className="d-none d-xl-table-cell">{formatDate(delivery.updated_at)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-5">
                              <Package size={48} className="text-muted mb-3" />
                              <p className="text-muted mb-0 h4">No completed or cancelled orders found</p>
                              <p className="text-muted">Your completed orders will appear here once delivered or cancelled</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="d-md-none">
                    {Array.isArray(completedOrders) && completedOrders.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {completedOrders.map((delivery, index) => (
                          <div key={index} className="list-group-item border-0 px-3 py-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1">Order #{delivery.order_id || 'N/A'}</h6>
                                <small className="text-muted">{delivery.order_product_name || 'N/A'}</small>
                              </div>
                              <span className={`badge ${
                                delivery.status === 'delivered' ? 'bg-success' : 
                                delivery.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                <div className="d-flex align-items-center gap-1">
                                  {delivery.status === 'delivered' && <CheckCircle size={12} />}
                                  {delivery.status === 'cancelled' && <XCircle size={12} />}
                                  {delivery.status ? delivery.status.replace('_', ' ').charAt(0).toUpperCase() + delivery.status.replace('_', ' ').slice(1) : 'N/A'}
                                </div>
                              </span>
                            </div>
                            
                            <div className="mb-2">
                              <small className="text-muted">Ordered Quantity:</small>
                              <div>
                                {delivery.order_quantity || 0}
                                {delivery.order_free_items > 0 && (
                                  <span className="text-success ms-1">
                                    <Gift size={12} /> +{delivery.order_free_items}
                                  </span>
                                )}
                                {delivery.order_free_items > 0 && (
                                  <div className="small text-muted">
                                    Total: {delivery.order_total_quantity || delivery.order_quantity}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-2">
                              <small className="text-muted">Delivered Quantity:</small>
                              <div>
                                {delivery.delivered_quantity || delivery.order_quantity || 0}
                              </div>
                            </div>
                            
                            <div className="mb-0">
                              <small className="text-muted">Created:</small>
                              <div>{formatDate(delivery.created_at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <Package size={48} className="text-muted mb-3" />
                        <p className="text-muted mb-0 h4">No completed or cancelled orders found</p>
                        <p className="text-muted">Your completed orders will appear here once delivered or cancelled</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}