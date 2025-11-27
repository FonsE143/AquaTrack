import React, { useState } from 'react'
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { api } from '../../api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Modal component for container return
function ContainerReturnModal({ delivery, onClose, onSubmit }) {
  const [returnedContainers, setReturnedContainers] = useState({})
  
  const orderItems = delivery.order_items || []
  
  const handleInputChange = (itemId, value) => {
    setReturnedContainers(prev => ({
      ...prev,
      [itemId]: parseInt(value) || 0
    }))
  }
  
  const handleSubmit = () => {
    onSubmit(returnedContainers)
    onClose()
  }
  
  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Return Containers</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>Please enter the number of containers returned for each item:</p>
            {orderItems.map(item => (
              <div key={item.id} className="mb-3">
                <label className="form-label">
                  {item.product_name || 'Unknown Product'} (Ordered: {item.qty_full_out || 0})
                </label>
                <input
                  type="number"
                  min="0"
                  max={item.qty_full_out || 0}
                  className="form-control"
                  value={returnedContainers[item.id] !== undefined ? returnedContainers[item.id] : (item.qty_empty_in || 0)}
                  onChange={(e) => handleInputChange(item.id, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DriverDeliveries(){
  const items = [
    { label: 'Dashboard', href: '/driver/dashboard' },
    { label: 'Deliveries', href: '/driver/deliveries', active: true },
  ]

  const queryClient = useQueryClient()
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)

  // Get driver's deliveries
  const { data: deliveries, isLoading, error } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const response = await api.get('/deliveries/')
      // Handle both paginated and non-paginated responses
      let deliveriesData;
      if (response.data.results) {
        deliveriesData = Array.isArray(response.data.results) ? response.data.results : []
      } else {
        deliveriesData = Array.isArray(response.data) ? response.data : []
      }
      
      // Log raw response for debugging
      console.log('Raw deliveries response:', response.data);
      console.log('Processed deliveries data:', deliveriesData);
      
      // Filter to show only deliveries that are assigned to this driver and are not yet completed
      // Drivers should see all deliveries assigned to them where the order is not in a final state
      // Final states are: delivered (with completed delivery) and cancelled
      return deliveriesData.filter(d => {
        // Check if delivery and order exist
        if (!d || !d.order) {
          return false;
        }
        
        // Get statuses - handle both nested object and flat structure
        const deliveryStatus = d.status;
        const orderStatus = d.order_status || 'unknown';
        
        // Log for debugging
        console.log(`Delivery ${d.id}: deliveryStatus=${deliveryStatus}, orderStatus=${orderStatus}`);
        
        // Show deliveries that are assigned to this driver and the order is not in a final state
        // Final state is when order is 'delivered' and delivery is 'completed', or order is 'cancelled'
        const showDelivery = !(
          (orderStatus === 'delivered' && deliveryStatus === 'completed') || 
          orderStatus === 'cancelled'
        );
        
        console.log(`Show delivery ${d.id}: ${showDelivery}`);
        return showDelivery;
      });
    }
  })

  const markDelivered = useMutation({
    mutationFn: async ({ orderId, returnedContainers }) => {
      // First update the returned container counts using our new endpoint
      if (returnedContainers) {
        // Prepare the item updates
        const itemUpdates = Object.entries(returnedContainers)
          .map(([itemId, qty]) => ({
            id: parseInt(itemId),
            qty_empty_in: qty
          }));
        
        // Only update if we have items to update
        if (itemUpdates.length > 0) {
          await api.patch(`/orders/${orderId}/update_item/`, {
            items: itemUpdates
          });
        }
      }
      
      // Use the order process endpoint to mark delivered; server will create ActivityLog
      return api.post(`/orders/${orderId}/process/`, { status: 'delivered' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveries'])
      queryClient.invalidateQueries(['orders'])
      queryClient.invalidateQueries(['driver-delivered-orders'])
      // Invalidate all activity log pages
      queryClient.invalidateQueries(['activity'])
    },
    onError: (err) => {
      console.error('Failed to mark delivered', err)
      alert('Failed to update delivery status. The order may already be in a final state.')
    }
  })

  const markCancelled = useMutation({
    mutationFn: async (orderId) => {
      // Use the order process endpoint to mark cancelled
      return api.post(`/orders/${orderId}/process/`, { status: 'cancelled' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveries'])
      queryClient.invalidateQueries(['orders'])
      queryClient.invalidateQueries(['driver-delivered-orders'])
      // Invalidate all activity log pages
      queryClient.invalidateQueries(['activity'])
    },
    onError: (err) => {
      console.error('Failed to mark cancelled', err)
      alert('Failed to cancel order. Please try again.')
    }
  })

  const handleDeliveredClick = (delivery) => {
    setSelectedDelivery(delivery)
    setShowReturnModal(true)
  }

  const handleContainerReturnSubmit = (returnedContainers) => {
    const orderId = selectedDelivery.order_id || selectedDelivery.order?.id || selectedDelivery.order
    
    // Calculate total ordered and returned containers
    const orderItems = selectedDelivery.order_items || []
    const totalOrderedContainers = orderItems.reduce((sum, item) => sum + (item.qty_full_out || 0), 0)
    const totalReturnedContainers = Object.values(returnedContainers).reduce((sum, qty) => sum + (qty || 0), 0)
    
    // Check if all containers have been returned
    if (totalReturnedContainers < totalOrderedContainers) {
      const missingContainers = totalOrderedContainers - totalReturnedContainers
      const confirmMsg = `Customer has returned ${totalReturnedContainers} containers out of ${totalOrderedContainers} ordered. ${missingContainers} containers are still outstanding. Do you want to proceed with marking this order as delivered and notify the customer about the missing containers?`
      
      if (window.confirm(confirmMsg)) {
        // Proceed with marking as delivered
        markDelivered.mutate({ orderId, returnedContainers })
      }
    } else {
      // All containers returned, proceed normally
      markDelivered.mutate({ orderId, returnedContainers })
    }
  }

  return (
    <AppShell role="driver" sidebar={<Sidebar items={items} />}>
      <div className="container py-4">
        <h2 className="mb-3">My Deliveries</h2>

        {isLoading && <div className="alert alert-secondary">Loading deliveries...</div>}
        {error && <div className="alert alert-danger">Could not load deliveries</div>}

        {!isLoading && deliveries && deliveries.length === 0 && !error && (
          <div className="alert alert-info">No deliveries found.</div>
        )}

        {/* Desktop Table View */}
        <div className="card border-0 shadow-sm d-none d-md-block">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries && Array.isArray(deliveries) && deliveries.map(d => (
                  <tr key={d.id}>
                    <td className="fw-medium">#{d.order_id || d.order?.id || d.order}</td>
                    <td>
                      {d.customer_first_name || d.customer_last_name ? 
                        `${d.customer_first_name || ''} ${d.customer_last_name || ''}`.trim() : 
                        'Unknown Customer'}
                    </td>
                    <td>{d.customer_address || 'No address provided'}</td>
                    <td>{d.customer_phone || 'No phone provided'}</td>
                    <td>
                      {d.order_items?.map((item, idx) => (
                        <div key={idx} className="small">
                          <div>{item.product_name || 'Unknown Product'}: {item.qty_full_out || 0} full</div>
                          <div className="mt-1">
                            <span className="small">Returned: {item.qty_empty_in || 0}</span>
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className="fw-medium">₱{parseFloat(d.order_total_amount || 0).toFixed(2)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleDeliveredClick(d)}
                          disabled={markDelivered.isLoading}
                        >
                          {markDelivered.isLoading ? 'Updating...' : 'Delivered'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this order?')) {
                              markCancelled.mutate(d.order_id || d.order?.id || d.order)
                            }
                          }}
                          disabled={markCancelled.isLoading}
                        >
                          {markCancelled.isLoading ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="d-md-none">
          <div className="row">
            {deliveries && Array.isArray(deliveries) && deliveries.map(d => (
              <div key={d.id} className="col-12 col-sm-6 col-lg-4 mb-3">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">Order #{d.order_id || d.order?.id || d.order}</h5>
                    </div>
                    
                    <div className="mb-2">
                      <small className="text-muted fw-medium">Customer:</small>
                      <div>
                        {d.customer_first_name || d.customer_last_name ? 
                          `${d.customer_first_name || ''} ${d.customer_last_name || ''}`.trim() : 
                          'Unknown Customer'}
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <small className="text-muted fw-medium">Address:</small>
                      <div>{d.customer_address || 'No address provided'}</div>
                    </div>
                    
                    <div className="mb-2">
                      <small className="text-muted fw-medium">Phone:</small>
                      <div>{d.customer_phone || 'No phone provided'}</div>
                    </div>
                    
                    <div className="mb-3">
                      <small className="text-muted fw-medium">Items:</small>
                      <div>
                        {d.order_items?.map((item, idx) => (
                          <div key={idx} className="small">
                            <div>{item.product_name || 'Unknown Product'}: {item.qty_full_out || 0} full</div>
                            <div className="mt-1">
                              <span className="small">Returned: {item.qty_empty_in || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <h4 className="fw-bold text-success mb-0">₱{parseFloat(d.order_total_amount || 0).toFixed(2)}</h4>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleDeliveredClick(d)}
                          disabled={markDelivered.isLoading}
                        >
                          {markDelivered.isLoading ? 'Updating...' : 'Delivered'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this order?')) {
                              markCancelled.mutate(d.order_id || d.order?.id || d.order)
                            }
                          }}
                          disabled={markCancelled.isLoading}
                        >
                          {markCancelled.isLoading ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Container Return Modal */}
        {showReturnModal && selectedDelivery && (
          <ContainerReturnModal 
            delivery={selectedDelivery}
            onClose={() => setShowReturnModal(false)}
            onSubmit={handleContainerReturnSubmit}
          />
        )}
      </div>
    </AppShell>
  )
}