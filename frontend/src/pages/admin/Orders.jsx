// src/pages/admin/Orders.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { useState, useMemo } from 'react'
import { Plus, Package, Truck, User } from 'lucide-react'

// Modal component for container return
function ContainerReturnModal({ order, onClose, onSubmit }) {
  const [returnedContainers, setReturnedContainers] = useState({})
  
  // Group order items by product and sum quantities
  const groupedOrderItems = useMemo(() => {
    // Add safety checks for order data
    if (!order || !order.items || !Array.isArray(order.items)) {
      console.warn('Invalid order data provided to ContainerReturnModal:', order);
      return [];
    }
    
    const grouped = {};
    order.items.forEach(item => {
      // Add safety checks for item data
      if (!item) return;
      
      const key = item.product || item.product_id;
      if (key) {
        if (grouped[key]) {
          // Sum the quantities for the same product
          grouped[key].qty_full_out += item.qty_full_out || 0;
          grouped[key].items.push(item);
        } else {
          // Create new entry for this product
          grouped[key] = {
            ...item,
            qty_full_out: item.qty_full_out || 0,
            items: [item]
          };
        }
      }
    });
    
    // Convert to array and use the first item's id as the key for the grouped item
    return Object.values(grouped).map(group => ({
      ...group,
      id: group.items[0]?.id || group.product || group.product_id // Add fallback for id
    }));
  }, [order?.items]);
  
  const handleInputChange = (itemId, value) => {
    setReturnedContainers(prev => ({
      ...prev,
      [itemId]: parseInt(value) || 0
    }));
  };
  
  const handleSubmit = () => {
    onSubmit(returnedContainers);
    // Don't call onClose here, let the parent component handle it
    // onClose();
  };
  
  // Don't render if we don't have valid order data
  if (!order || !Array.isArray(groupedOrderItems) || groupedOrderItems.length === 0) {
    return null;
  }
  
  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Return Containers for Walk-in Order</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>Please enter the number of containers returned for each item:</p>
            {groupedOrderItems.map(item => (
              <div key={item.id} className="mb-3">
                <label className="form-label">
                  {item.product_name || item.name || 'Unknown Product'} (Ordered: {item.qty_full_out || 0})
                </label>
                <input
                  type="number"
                  min="0"
                  max={item.qty_full_out || 0}
                  className="form-control"
                  value={returnedContainers[item.id] !== undefined ? returnedContainers[item.id] : 0}
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
              Confirm and Mark Delivered
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const items = [
    { label:'Dashboard', href:'/admin/dashboard' },
    { label:'Orders', href:'/admin/orders', active:true },
    { label:'Order History', href:'/admin/order-history' },
    { label:'Inventory', href:'/admin/inventory' },
    { label:'Users', href:'/admin/users' },
    { label:'Deployment', href:'/admin/deployment' },
    { label: 'Deployment History', href: '/admin/deployment-history' },
    { label:'Employees', href:'/admin/employees' },
    { label:'Activity Log', href:'/admin/activity', adminOnly: true },
  ]
  
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
  const [walkInForm, setWalkInForm] = useState({
    product: '',
    qty: 1,
  })
  const [showWalkInReturnModal, setShowWalkInReturnModal] = useState(false)
  const [walkInOrderData, setWalkInOrderData] = useState(null)
  const [popupMessage, setPopupMessage] = useState(null)
  const ordersPerPage = 10
  
  const { data: orders, isLoading, error } = useQuery({ 
    queryKey:['orders'], 
    queryFn: async()=> (await api.get('/orders/')).data 
  })
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async()=> (await api.get('/drivers/')).data
  })
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async()=> {
      const response = await api.get('/products/')
      console.log('Products data:', response.data)
      return response.data
    }
  })
  
  const processOrder = useMutation({
    mutationFn: ({ id, payload }) => api.post(`/orders/${id}/process/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      queryClient.invalidateQueries(['deliveries'])  // Also invalidate deliveries for driver pages
    },
    onError: (error) => {
      console.error('Failed to update order:', error.response?.data || error.message)
      // Replace alert with state-based popup
      setPopupMessage('Failed to update order status. Please try again.')
      setTimeout(() => setPopupMessage(null), 3000) // Auto-hide after 3 seconds
    }
  })
  
  const walkInMutation = useMutation({
    mutationFn: async () => {
      // Validate form data
      if (!walkInForm.product) {
        throw new Error('Please select a product')
      }
      
      const productId = parseInt(walkInForm.product);
      if (!productId) {
        throw new Error('Invalid product selected')
      }
      
      // Check if product has sufficient stock
      let selectedProduct = null;
      if (Array.isArray(products?.results)) {
        selectedProduct = products.results.find(p => p.id === productId);
      } else if (Array.isArray(products)) {
        selectedProduct = products.find(p => p.id === productId);
      }
      
      if (!selectedProduct) {
        throw new Error('Selected product not found')
      }
      
      if (!selectedProduct.active) {
        throw new Error('Selected product is not active')
      }
      
      // Check if we have sufficient stock for the requested quantity
      // Note: Stock validation is now done via order-based calculations
      // For now, we'll allow the order to be created and handle stock tracking in the inventory system
      
      if (!walkInForm.qty || walkInForm.qty < 1) {
        throw new Error('Quantity must be at least 1')
      }
      
      try {
        // Create the order with explicit customer ID for walk-in orders
        console.log('Creating walk-in order...');
        console.log('Order items:', [{ product: parseInt(walkInForm.product), qty_full_out: walkInForm.qty, qty_empty_in: 0 }]);
        
        const orderPayload = {
          items: [{ 
            product: parseInt(walkInForm.product), 
            qty_full_out: parseInt(walkInForm.qty), 
            qty_empty_in: 0 
          }],
          notes: 'walk-in order',
          customer: 6  // The ID of the walk-in customer we created earlier
        }
        
        console.log('Order payload:', orderPayload);
        const orderResponse = await api.post('/orders/', orderPayload)
        console.log('Order created:', orderResponse.data);
        
        // Return the created order data
        return orderResponse.data;
      } catch (error) {
        console.error('API Error Details:', error.response?.data || error.message);
        console.error('Error Status:', error.response?.status);
        console.error('Error Headers:', error.response?.headers);
        console.error('Error Config:', error.config);
        throw error;
      }
    },
    onSuccess: (orderData) => {
      // Show container return modal instead of immediately marking as delivered
      setWalkInOrderData(orderData)
      setShowWalkInReturnModal(true)
      setIsWalkInModalOpen(false)
      setWalkInForm({ product: '', qty: 1 })
    },
    onError: (error) => {
      console.error('Failed to create walk-in order:', error.response?.data || error.message)
      // Log detailed error information for debugging
      console.error('Error config:', error.config);
      console.error('Error request:', error.request);
      
      let errorMsg = 'Failed to create walk-in order. Please try again.';
      
      // Handle specific error cases
      if (error.response?.status === 500) {
        errorMsg = 'Server error occurred. This might be due to invalid data or a system issue. Please check the product selection and try again.';
      } else if (error.response?.status === 400) {
        // Handle validation errors
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null) {
          // Check for field-specific errors
          if (errorData.items) {
            errorMsg = errorData.items[0]?.product?.[0] || 
                      errorData.items[0]?.non_field_errors?.[0] ||
                      errorData.items[0] ||
                      errorMsg;
          } else {
            // Check for general error messages
            errorMsg = errorData.detail ||
                      errorData.message ||
                      JSON.stringify(errorData) ||
                      errorMsg;
          }
        } else {
          errorMsg = errorData || errorMsg;
        }
      } else if (error.response?.data) {
        // Handle other HTTP errors with response data
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData !== null) {
          errorMsg = errorData.detail ||
                    errorData.message ||
                    JSON.stringify(errorData) ||
                    errorMsg;
        } else {
          errorMsg = errorData || errorMsg;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      // Replace alert with state-based popup
      setPopupMessage(`Error: ${errorMsg}`)
      setTimeout(() => setPopupMessage(null), 3000) // Auto-hide after 3 seconds
    }
  })
  
  // Mutation for updating container returns and marking walk-in order as delivered
  const updateWalkInContainers = useMutation({
    mutationFn: async ({ orderId, returnedContainers }) => {
      console.log('updateWalkInContainers called with:', { orderId, returnedContainers });
      
      // Check if walkInOrderData is available
      if (!walkInOrderData) {
        console.error('walkInOrderData is null or undefined');
        throw new Error('Order data is not available. Please try again.');
      }
      
      // First update the returned container counts using our new endpoint
      if (returnedContainers) {
        // Prepare the item updates
        // We need to map the grouped container returns back to individual item updates
        const itemUpdates = [];
        
        // Get the original order items to map back to individual items
        const orderItems = walkInOrderData.items || [];
        console.log('Original order items:', orderItems);
        
        // Check if we have order items
        if (!orderItems.length) {
          console.warn('No order items found');
          throw new Error('No items found in the order. Please try again.');
        }
        
        const productItemsMap = {};
        
        // Group original items by product
        orderItems.forEach(item => {
          const productId = item.product || item.product_id;
          if (productId) {
            if (!productItemsMap[productId]) {
              productItemsMap[productId] = [];
            }
            productItemsMap[productId].push(item);
          }
        });
        console.log('Product items map:', productItemsMap);
        
        // For each returned container entry, distribute the return quantity among the original items
        Object.entries(returnedContainers).forEach(([itemId, returnedQty]) => {
          console.log(`Processing returned container: ${itemId} = ${returnedQty}`);
          // Find the corresponding original item to get its product
          const originalItem = orderItems.find(item => item.id === parseInt(itemId));
          if (originalItem) {
            const productId = originalItem.product || originalItem.product_id;
            const productItems = productItemsMap[productId] || [];
            console.log(`Product ${productId} has ${productItems.length} items`);
            
            // Distribute the returned quantity among the items for this product
            let remainingQty = returnedQty || 0;
            productItems.forEach(item => {
              if (remainingQty > 0) {
                const itemQty = Math.min(remainingQty, item.qty_full_out);
                itemUpdates.push({
                  id: item.id,
                  qty_empty_in: itemQty
                });
                console.log(`Updated item ${item.id} with qty_empty_in: ${itemQty}`);
                remainingQty -= itemQty;
              } else {
                // For items with no returned quantity, ensure qty_empty_in is 0
                itemUpdates.push({
                  id: item.id,
                  qty_empty_in: 0
                });
                console.log(`Updated item ${item.id} with qty_empty_in: 0`);
              }
            });
          } else {
            console.warn(`Could not find original item for ID: ${itemId}`);
          }
        });
        console.log('Item updates to send:', itemUpdates);
        
        // Only update if we have items to update
        if (itemUpdates.length > 0) {
          try {
            console.log(`Sending PATCH request to /orders/${orderId}/update_item/`);
            await api.patch(`/orders/${orderId}/update_item/`, {
              items: itemUpdates
            });
            console.log('Item updates sent successfully');
          } catch (error) {
            console.error('Failed to update order items:', error.response?.data || error.message);
            throw error;
          }
        }
      }
      
      // Use the order process endpoint to mark delivered
      console.log(`Sending POST request to /orders/${orderId}/process/ with status: delivered`);
      return api.post(`/orders/${orderId}/process/`, { status: 'delivered' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['deliveries']);  // Also invalidate deliveries for driver pages
      setShowWalkInReturnModal(false);
      setWalkInOrderData(null);
      // Replace alert with state-based popup
      setPopupMessage('Walk-in order created successfully and marked as delivered!');
      setTimeout(() => setPopupMessage(null), 3000); // Auto-hide after 3 seconds
    },
    onError: (error) => {
      console.error('Failed to update walk-in order:', error.response?.data || error.message);
      console.error('Error config:', error.config);
      console.error('Error request:', error.request);
      // Close the modal on error
      setShowWalkInReturnModal(false);
      setWalkInOrderData(null);
      // Replace alert with state-based popup
      let errorMsg = 'Failed to update walk-in order. Please try again.';
      if (error.response?.data) {
        errorMsg = `Error: ${JSON.stringify(error.response.data)}`;
      } else if (error.message) {
        errorMsg = `Error: ${error.message}`;
      }
      setPopupMessage(errorMsg);
      setTimeout(() => setPopupMessage(null), 5000); // Auto-hide after 5 seconds
    }
  })
  

  
  const orderList = (orders?.results || orders || []).filter(order => {
    // Filter out delivered and cancelled orders
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return false;
    }
    
    // Also filter out orders that are 'out' with a driver assigned
    // These are effectively completed from the admin perspective
    if (order.status === 'out' && order.driver) {
      return false;
    }
    
    // Filter out walk-in customer orders
    if (order.customer_username === 'walkin_customer') {
      return false;
    }
    
    return true;
  })
  const driverList = drivers?.results || drivers || []
  
  // Calculate pagination
  const totalOrders = orderList.length
  const totalPages = Math.ceil(totalOrders / ordersPerPage)
  
  // Get orders for current page
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const ordersToDisplay = orderList.slice(startIndex, endIndex)
  
  // Pad the orders array to always have 10 rows
  const paddedOrders = [...ordersToDisplay];
  while (paddedOrders.length < 10) {
    paddedOrders.push(null);
  }
  
  const ordersWithPadding = paddedOrders.map((o, index) => {
    if (o === null) {
      return { id: `empty-${index}`, isEmpty: true };
    }
    return o;
  });

  const [pendingUpdates, setPendingUpdates] = useState({});

  const handleStatusChange = (orderId, newStatus) => {
    // For "Out for Delivery", wait for driver selection
    if (newStatus === 'out') {
      // Store the pending status update
      setPendingUpdates(prev => ({
        ...prev,
        [orderId]: {
          ...prev[orderId],
          status: newStatus
        }
      }));
      
      // Check if we already have a driver selected
      const order = orderList.find(o => o.id === orderId);
      if (order && order.driver) {
        // Both status and driver are selected, process the update
        const payload = { status: newStatus, driver_id: order.driver.id };
        processOrder.mutate({ id: orderId, payload });
        
        // Clear pending update
        setPendingUpdates(prev => {
          const newPending = { ...prev };
          delete newPending[orderId];
          return newPending;
        });
      }
    } else if (newStatus === 'cancelled') {
      // For cancelled status, update immediately
      processOrder.mutate({ id: orderId, payload: { status: newStatus } });
      
      // Clear any pending updates for this order
      setPendingUpdates(prev => {
        const newPending = { ...prev };
        delete newPending[orderId];
        return newPending;
      });
    } else {
      // For other statuses (like 'processing'), update immediately
      processOrder.mutate({ id: orderId, payload: { status: newStatus } });
      
      // Clear any pending updates for this order
      setPendingUpdates(prev => {
        const newPending = { ...prev };
        delete newPending[orderId];
        return newPending;
      });
    }
  }

  const handleDriverChange = (orderId, driverId, currentStatus) => {
    // Store the pending driver update
    setPendingUpdates(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        driverId: driverId ? Number(driverId) : null
      }
    }));
    
    // Check if status is "Out for Delivery"
    const order = orderList.find(o => o.id === orderId);
    const pendingStatus = pendingUpdates[orderId]?.status;
    const effectiveStatus = pendingStatus || (order ? order.status : currentStatus);
    
    if (effectiveStatus === 'out') {
      // Status is "Out for Delivery", check if we have both status and driver
      if (driverId) {
        // Both status and driver are selected, process the update
        const payload = { status: 'out', driver_id: Number(driverId) };
        processOrder.mutate({ id: orderId, payload });
        
        // Clear pending update
        setPendingUpdates(prev => {
          const newPending = { ...prev };
          delete newPending[orderId];
          return newPending;
        });
      }
    } else if (effectiveStatus === 'cancelled') {
      // For cancelled orders, just update driver if needed
      const payload = { status: effectiveStatus };
      if (driverId) {
        payload.driver_id = Number(driverId);
      }
      processOrder.mutate({ id: orderId, payload });
      
      // Clear pending update
      setPendingUpdates(prev => {
        const newPending = { ...prev };
        delete newPending[orderId];
        return newPending;
      });
    }
  }
  
  // Navigation functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  // Handle container return submission for walk-in orders
  const handleWalkInContainerReturnSubmit = (returnedContainers) => {
    // Check if walkInOrderData is available
    if (!walkInOrderData) {
      setPopupMessage('Error: Order data is not available. Please try again.')
      setTimeout(() => setPopupMessage(null), 5000) // Auto-hide after 5 seconds
      return
    }
    
    const orderId = walkInOrderData?.id
    
    if (!orderId) {
      // Replace alert with state-based popup
      setPopupMessage('Error: Order ID not found')
      setTimeout(() => setPopupMessage(null), 3000) // Auto-hide after 3 seconds
      return
    }
    
    // Calculate total ordered and returned containers
    // Group items by product to match the display in the modal
    const productQuantities = {};
    (walkInOrderData.items || []).forEach(item => {
      const productId = item.product || item.product_id;
      if (productId) {
        if (productQuantities[productId]) {
          productQuantities[productId] += item.qty_full_out || 0;
        } else {
          productQuantities[productId] = item.qty_full_out || 0;
        }
      }
    });
    
    const totalOrderedContainers = Object.values(productQuantities).reduce((sum, qty) => sum + qty, 0);
    const totalReturnedContainers = Object.values(returnedContainers).reduce((sum, qty) => sum + (qty || 0), 0);
    
    // Check if all containers have been returned
    if (totalReturnedContainers < totalOrderedContainers) {
      const missingContainers = totalOrderedContainers - totalReturnedContainers;
      const confirmMsg = `Customer has returned ${totalReturnedContainers} containers out of ${totalOrderedContainers} ordered. ${missingContainers} containers are still outstanding. Do you want to proceed with marking this order as delivered?`;
      
      if (window.confirm(confirmMsg)) {
        // Proceed with marking as delivered
        updateWalkInContainers.mutate({ orderId, returnedContainers });
      } else {
        // User cancelled, close the modal
        setShowWalkInReturnModal(false);
      }
    } else {
      // All containers returned, proceed normally
      updateWalkInContainers.mutate({ orderId, returnedContainers });
    }
  }
  
  return (
    <AppShell role="admin" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Popup Message */}
        {popupMessage && (
          <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{zIndex: 9999}}>
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {popupMessage}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setPopupMessage(null)}
              ></button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h3 mb-1">Order Management</h1>
            <p className="text-muted mb-0">View and manage all customer orders</p>
          </div>
          <button 
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={() => {
              // Check if we have products data
              if (!products || (Array.isArray(products.results) && products.results.length === 0) || (Array.isArray(products) && products.length === 0)) {
                // Replace alert with state-based popup
                setPopupMessage('No products available. Please check product inventory.')
                setTimeout(() => setPopupMessage(null), 3000) // Auto-hide after 3 seconds
                return
              }
              setIsWalkInModalOpen(true)
            }}
            disabled={!products}
          >
            <Plus size={18} />
            Walk-in Order
          </button>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error loading orders.</strong> Please try again.
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}
        
        {/* Orders Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : orderList.length === 0 ? (
              <div className="text-center py-5">
                <Package size={48} className="text-muted mb-3" />
                <h5 className="mb-1">No orders found</h5>
                <p className="text-muted mb-0">There are no orders to display at the moment</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Driver</th>
                        <th>Amount</th>
                        <th>Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersWithPadding.map(o => (
                        <tr key={o.id}>
                          {o.isEmpty ? (
                            <>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                              <td>&nbsp;</td>
                            </>
                          ) : (
                            <>
                              <td className="fw-medium">#{o.id}</td>
                              <td>{o.customer_first_name || o.customer_username || o.customer}</td>
                              <td>{new Date(o.created_at).toLocaleDateString()}</td>
                              <td>
                                <select 
                                  className="form-select form-select-sm"
                                  value={o.status}
                                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                  disabled={processOrder.isLoading}
                                >
                                  <option value="processing">Processing</option>
                                  <option value="out">Out for Delivery</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={o.driver?.id || ''}
                                  onChange={(e) => handleDriverChange(o.id, e.target.value || null, o.status)}
                                >
                                  <option value="">Unassigned</option>
                                  {driverList.map(driverMember => (
                                    <option key={driverMember.id} value={driverMember.id}>
                                      {`${driverMember.first_name || ''} ${driverMember.last_name || ''}`.trim() || driverMember.username || `Driver #${driverMember.id}`}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</td>
                              <td>{o.items ? o.items.reduce((total, item) => total + (item.qty_full_out || 0) + (item.qty_empty_in || 0), 0) : 0} item(s)</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalOrders)} of {totalOrders} orders
                  </div>
                  <div className="btn-group" role="group">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      Next
                    </button>
                  </div>
                </div>
                
                {/* Mobile Card View */}
                <div className="d-md-none">
                  <div className="list-group list-group-flush">
                    {orderList.map(o => (
                      <div key={o.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">Order #{o.id}</h6>
                            <small className="text-muted">{new Date(o.created_at).toLocaleDateString()}</small>
                          </div>
                          <div>
                            <span className={`badge ${
                              o.status === 'processing' ? 'bg-warning' :
                              o.status === 'out' ? 'bg-primary' :
                              o.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Customer:</small>
                          <div>{o.customer_first_name || o.customer_username || o.customer}</div>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted">Amount:</small>
                          <div className="fw-medium">₱{parseFloat(o.total_amount || 0).toFixed(2)}</div>
                        </div>
                        
                        <div className="mb-3">
                          <small className="text-muted">Driver:</small>
                          <div>
                            <select
                              className="form-select form-select-sm"
                              value={o.driver?.id || ''}
                              onChange={(e) => handleDriverChange(o.id, e.target.value || null, o.status)}
                            >
                              <option value="">Unassigned</option>
                              {driverList.map(driverMember => (
                                <option key={driverMember.id} value={driverMember.id}>
                                  {`${driverMember.first_name || ''} ${driverMember.last_name || ''}`.trim() || driverMember.username || `Driver #${driverMember.id}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="mb-0">
                          <small className="text-muted">Items:</small>
                          <div>{o.items ? o.items.reduce((total, item) => total + (item.qty_full_out || 0) + (item.qty_empty_in || 0), 0) : 0} item(s)</div>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <select 
                            className="form-select form-select-sm flex-fill"
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            disabled={processOrder.isLoading}
                          >
                            <option value="processing">Processing</option>
                            <option value="out">Out for Delivery</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Walk-in Order Modal */}
      {isWalkInModalOpen && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">Walk-in Order</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsWalkInModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e)=>{e.preventDefault(); walkInMutation.mutate()}}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="walkin-product" className="form-label fw-medium">Product *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Package size={18} />
                        </span>
                        <select
                          id="walkin-product"
                          className="form-select"
                          name="product"
                          value={walkInForm.product}
                          onChange={(e) => setWalkInForm({...walkInForm, product: e.target.value})}
                          required
                        >
                          <option value="">Select product</option>
                          {Array.isArray(products?.results) ? 
                            products.results
                              .filter(p => p.active)
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — ₱{parseFloat(p.price).toFixed(2)}
                                </option>
                              )) : 
                            Array.isArray(products) ? 
                            products
                              .filter(p => p.active)
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — ₱{parseFloat(p.price).toFixed(2)}
                                </option>
                              )) : null
                          }
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="walkin-qty" className="form-label fw-medium">Quantity *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <span>#</span>
                        </span>
                        <input
                          id="walkin-qty"
                          className="form-control"
                          type="number"
                          name="qty"
                          min="1"
                          value={walkInForm.qty}
                          onChange={(e) => setWalkInForm({...walkInForm, qty: parseInt(e.target.value || '1')})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-muted small">
                      This will create a walk-in customer order. You will be prompted to enter the number of returned containers after creating the order.
                    </p>
                    {products && Array.isArray(products.results) && products.results.length === 0 && (
                      <div className="alert alert-warning">
                        No products available in inventory. Please add products before creating walk-in orders.
                      </div>
                    )}
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-light" 
                  onClick={() => setIsWalkInModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={walkInMutation.isLoading}
                  onClick={() => walkInMutation.mutate()}
                >
                  {walkInMutation.isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Walk-in Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Container Return Modal for Walk-in Orders */}
      {showWalkInReturnModal && walkInOrderData && (
        <ContainerReturnModal 
          order={walkInOrderData}
          onClose={() => {
            setShowWalkInReturnModal(false)
            // Don't clear walkInOrderData here, let the mutation handle it
            // setWalkInOrderData(null)
          }}
          onSubmit={handleWalkInContainerReturnSubmit}
        />
      )}
    </AppShell>
  )
}