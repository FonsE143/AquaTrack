// src/pages/driver/Dashboard.jsx
import AppShell from '../../components/AppShell'
import { Sidebar } from '../../components/Sidebar'
import { Truck, AlertTriangle, Package, CheckCircle, MapPin, Play, X, ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import { createStyledAlert, createStyledConfirm } from '../../utils/alertHelper'

export default function DriverDashboard() {
  const items = [
    { label: 'Dashboard', href: '/driver/dashboard', active: true },
    { label: 'Deliveries', href: '/driver/deliveries' },
  ]

  const queryClient = useQueryClient()

  // Fetch data
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: async () => (await api.get('/deliveries/my-deliveries/')).data.results || (await api.get('/deliveries/my-deliveries/')).data || [],
  })

  const { data: myDeployment } = useQuery({
    queryKey: ['my-deployment'],
    queryFn: async () => {
      try {
        const response = await api.get('/deployments/my-deployment/')
        return response.data
      } catch (error) {
        console.error('Error fetching deployment:', error)
        return null
      }
    },
  })

  // Mutation for updating delivery status
  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ deliveryId, status, deliveredQuantity, returnedContainers }) => {
      const data = { status };
      if (deliveredQuantity !== undefined) {
        data.delivered_quantity = deliveredQuantity;
      }
      if (returnedContainers !== undefined) {
        data.returned_containers = returnedContainers;
      }
      return api.patch(`/deliveries/${deliveryId}/`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-deliveries'])
      queryClient.invalidateQueries(['my-deployment'])
      createStyledAlert('success', 'Delivery Updated', 'Delivery status updated successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Update Failed', 'Failed to update delivery status: ' + (error.response?.data?.detail || error.message))
    }
  })

  // Mutation for returning deployment
  const returnDeployment = useMutation({
    mutationFn: async (returnedContainers) => {
      if (!myDeployment) return;
      
      // Debug: Print the returned containers value
      console.log('DEBUG: Returned containers value:', returnedContainers);
      console.log('DEBUG: Returned containers type:', typeof returnedContainers);
      
      const payload = {};
      if (returnedContainers !== null && returnedContainers !== undefined) {
        payload.returned_containers = parseInt(returnedContainers);
      }
      
      // Debug: Print the payload
      console.log('DEBUG: Payload being sent:', payload);
      
      return api.post(`/deployments/${myDeployment.id}/return/`, payload)
    },    onSuccess: () => {
      queryClient.invalidateQueries(['my-deployment'])
      createStyledAlert('success', 'Deployment Returned', 'Deployment marked as returned successfully!')
    },
    onError: (error) => {
      createStyledAlert('error', 'Return Failed', 'Failed to return deployment: ' + (error.response?.data?.detail || error.message))
    }
  })

  // Handle start delivery
  const handleStartDelivery = (deliveryId) => {
    createStyledConfirm(
      'Start Delivery', 
      'Are you sure you want to start delivery for this order?', 
      () => updateDeliveryStatus.mutate({ deliveryId, status: 'in_route' })
    )
  }

  // Handle complete delivery
  const handleCompleteDelivery = (delivery) => {
    // Calculate maximum allowed quantity (order quantity + free items)
    const maxQuantity = (delivery.order_quantity || 0) + (delivery.order_free_items || 0);
    
    createStyledConfirm(
      'Complete Delivery', 
      `Mark this delivery as completed? Maximum allowed: ${maxQuantity}`,
      (result) => {
        // result will be an object with deliveredQuantity and returnedContainers
        const { deliveredQuantity, returnedContainers } = result;
        
        // Validate delivered quantity
        const qty = parseInt(deliveredQuantity);
        if (isNaN(qty) || qty <= 0) {
          createStyledAlert('error', 'Invalid Quantity', 'Please enter a valid quantity greater than 0');
          return;
        }
        
        // Check if quantity exceeds maximum allowed
        if (qty > maxQuantity) {
          createStyledAlert('error', 'Invalid Quantity', `You cannot deliver more than ${maxQuantity} containers for this order`);
          return;
        }
        
        // Validate returned containers (if provided)
        let returnedQty = 0;
        if (returnedContainers !== undefined && returnedContainers !== null && returnedContainers !== '') {
          returnedQty = parseInt(returnedContainers);
          if (isNaN(returnedQty) || returnedQty < 0) {
            createStyledAlert('error', 'Invalid Returned Containers', 'Please enter a valid number of returned containers (0 or more)');
            return;
          }
          // Check if returned containers exceed delivered quantity
          if (returnedQty > qty) {
            createStyledAlert('error', 'Invalid Returned Containers', `You cannot return more containers (${returnedQty}) than delivered (${qty})`);
            return;
          }
        }
        
        // Update delivery status and quantity
        updateDeliveryStatus.mutate({ 
          deliveryId: delivery.id, 
          status: 'delivered',
          deliveredQuantity: qty,
          returnedContainers: returnedQty
        });
      },
      null,
      {
        inputLabel: 'Delivered Quantity',
        inputType: 'number',
        inputPlaceholder: `Enter quantity delivered (max: ${maxQuantity})`,
        inputRequired: true,
        inputValue: delivery.order_quantity,
        inputMax: maxQuantity,
        additionalInputs: [
          {
            label: 'Returned Containers',
            type: 'number',
            placeholder: 'Enter number of containers returned (optional)',
            name: 'returnedContainers',
            min: 0,
            max: maxQuantity
          }
        ]
      }
    );
  }

  // Handle cancel delivery
  const handleCancelDelivery = (deliveryId) => {
    createStyledConfirm(
      'Cancel Delivery', 
      'Are you sure you want to cancel this delivery?', 
      () => updateDeliveryStatus.mutate({ deliveryId, status: 'cancelled' })
    )
  }

  // Handle return deployment
  const handleReturnDeployment = () => {
    // Calculate the maximum containers that can be returned
    // This should be the sum of order quantities and free items from all deliveries
    let maxContainers = 0;
    if (Array.isArray(deliveries)) {
      deliveries.forEach(delivery => {
        if (delivery.status === 'delivered') {
          // Add the ordered quantity plus free items
          const orderQuantity = delivery.order_quantity || 0;
          const freeItems = delivery.order_free_items || 0;
          maxContainers += orderQuantity + freeItems;
        }
      });
    }
    
    // If no deliveries or no max containers, default to a reasonable number
    const maxAllowed = maxContainers > 0 ? maxContainers : 100;
    
    createStyledConfirm(
      'Return Deployment', 
      `Are you sure you want to mark this deployment as returned? Maximum containers allowed: ${maxAllowed}`,
      (returnedContainers) => {
        // Validate the input
        const containers = parseInt(returnedContainers);
        if (isNaN(containers) || containers < 0) {
          createStyledAlert('error', 'Invalid Input', 'Please enter a valid number of containers');
          return;
        }
        if (containers > maxAllowed) {
          createStyledAlert('error', 'Invalid Input', `You cannot return more than ${maxAllowed} containers`);
          return;
        }
        returnDeployment.mutate(containers);
      },
      null,
      {
        inputLabel: 'Returned Containers',
        inputType: 'number',
        inputPlaceholder: `Enter number of returned containers (max: ${maxAllowed})`,
        inputHelpText: `Please enter the number of containers being returned (maximum: ${maxAllowed})`,
        inputRequired: true
      }
    )
  }
  // Get today's deliveries
  const todaysDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => {
        const deliveryDate = new Date(d.created_at)
        const today = new Date()
        return deliveryDate.toDateString() === today.toDateString()
      })
    : []

  // Get completed deliveries
  const completedDeliveries = todaysDeliveries.filter(d => d.status === 'delivered')

  // Filter out delivered and cancelled orders for the Customer Orders table
  const pendingDeliveries = Array.isArray(deliveries) 
    ? deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled')
    : []

  return (
    <AppShell role="driver" sidebar={<Sidebar items={items} />}>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Truck className="text-primary" size={24} />
              <h1 className="h3 m-0">Driver Dashboard</h1>
            </div>
            <p className="text-muted mb-0">Monitor stock levels and track deliveries</p>
          </div>
        </div>

        {/* Deployment Info - Stock Count Table */}
        {myDeployment && (
          <div className="row g-4 mb-4">
            {/* Stock Count Table */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <Package className="text-success" size={20} />
                    <h5 className="mb-0">Stock Count</h5>
                  </div>
                </div>
                <div className="card-body p-0">
                  {/* Desktop Table View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Product</th>
                          <th>Current Stock</th>
                          <th className="d-none d-lg-table-cell">Vehicle</th>
                          <th className="d-none d-lg-table-cell">Plate Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{myDeployment.product_name || 'N/A'}</td>
                          <td>
                            <span className="fw-bold">{myDeployment.stock || 0} units</span>
                          </td>
                          <td className="d-none d-lg-table-cell">{myDeployment.vehicle_name || 'N/A'}</td>
                          <td className="d-none d-lg-table-cell">{myDeployment.vehicle_plate_number || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="d-md-none p-3">
                    <div className="mb-3">
                      <small className="text-muted">Product</small>
                      <div className="fw-medium">{myDeployment.product_name || 'N/A'}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Current Stock</small>
                      <div className="fw-bold">{myDeployment.stock || 0} units</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Vehicle</small>
                      <div className="fw-medium">{myDeployment.vehicle_name || 'N/A'} ({myDeployment.vehicle_plate_number || 'N/A'})</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Table - Municipality and Barangays */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <MapPin className="text-info" size={20} />
                    <h5 className="mb-0">Route Information</h5>
                  </div>
                  {/* Return Deployment Button */}
                  <button 
                    className="btn btn-warning btn-sm d-flex align-items-center gap-1"
                    onClick={handleReturnDeployment}
                    disabled={returnDeployment.isLoading}
                  >
                    <ArrowLeft size={14} />
                    <span className="d-none d-md-inline">Return</span>
                  </button>
                </div>
                <div className="card-body p-0">
                  {/* Desktop Table View */}
                  <div className="table-responsive d-none d-md-block">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Route Number</th>
                          <th className="d-none d-lg-table-cell">Municipality</th>
                          <th>Barangays</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Route {myDeployment.route_number || 'N/A'}</td>
                          <td className="d-none d-lg-table-cell">{myDeployment.municipality_names || 'N/A'}</td>
                          <td>
                            {myDeployment.barangay_names ? (
                              <div className="d-flex flex-wrap gap-1">
                                {myDeployment.barangay_names.split(', ').map((barangay, idx) => (
                                  <span key={idx} className="badge bg-secondary-subtle text-secondary-emphasis">
                                    {barangay}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="d-md-none p-3">
                    <div className="mb-3">
                      <small className="text-muted">Route Number</small>
                      <div className="fw-medium">Route {myDeployment.route_number || 'N/A'}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Municipality</small>
                      <div className="fw-medium">{myDeployment.municipality_names || 'N/A'}</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">Barangays</small>
                      <div>
                        {myDeployment.barangay_names ? (
                          <div className="d-flex flex-wrap gap-1">
                            {myDeployment.barangay_names.split(', ').map((barangay, idx) => (
                              <span key={idx} className="badge bg-secondary-subtle text-secondary-emphasis">
                                {barangay}
                              </span>
                            ))}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </div>
                    {/* Return Deployment Button for Mobile */}
                    <button 
                      className="btn btn-warning w-100 d-flex align-items-center justify-content-center gap-1"
                      onClick={handleReturnDeployment}
                      disabled={returnDeployment.isLoading}
                    >
                      <ArrowLeft size={14} />
                      Return Deployment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Orders Table */}
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package className="text-primary" size={20} />
                  <h5 className="mb-0">Customer Orders</h5>
                </div>
              </div>
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
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
                            <th className="d-none d-lg-table-cell">Address</th>
                            <th>Quantity</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(pendingDeliveries) && pendingDeliveries.length > 0 ? (
                            pendingDeliveries.map(delivery => (
                              <tr key={delivery.id}>
                                <td>#{delivery.order_id}</td>
                                <td>
                                  {delivery.customer_first_name} {delivery.customer_last_name}
                                </td>
                                <td className="d-none d-lg-table-cell">{delivery.customer_address}</td>
                                <td>{delivery.order_quantity}</td>
                                <td>
                                  {delivery.status === 'assigned' && (
                                    <button 
                                      className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                      onClick={() => handleStartDelivery(delivery.id)}
                                      disabled={updateDeliveryStatus.isLoading}
                                    >
                                      <Play size={14} />
                                      Start
                                    </button>
                                  )}
                                  {delivery.status === 'in_route' && (
                                    <div className="d-flex gap-2">
                                      <button 
                                        className="btn btn-sm btn-success d-flex align-items-center gap-1"
                                        onClick={() => handleCompleteDelivery(delivery)}
                                        disabled={updateDeliveryStatus.isLoading}
                                      >
                                        <CheckCircle size={14} />
                                        Complete
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                        onClick={() => handleCancelDelivery(delivery.id)}
                                        disabled={updateDeliveryStatus.isLoading}
                                      >
                                        <X size={14} />
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center py-3">
                                No pending deliveries found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="d-md-none">
                      {Array.isArray(pendingDeliveries) && pendingDeliveries.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {pendingDeliveries.map(delivery => (
                            <div key={delivery.id} className="list-group-item border-0 px-3 py-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-1">Order #{delivery.order_id}</h6>
                                  <small className="text-muted">
                                    {delivery.customer_first_name} {delivery.customer_last_name}
                                  </small>
                                </div>
                                <span className="badge bg-primary">{delivery.order_quantity} qty</span>
                              </div>
                              
                              <div className="mb-2">
                                <small className="text-muted">Address:</small>
                                <div>{delivery.customer_address}</div>
                              </div>
                              
                              <div>
                                {delivery.status === 'assigned' && (
                                  <button 
                                    className="btn btn-sm btn-success w-100"
                                    onClick={() => handleStartDelivery(delivery.id)}
                                    disabled={updateDeliveryStatus.isLoading}
                                  >
                                    <Play size={14} className="me-1" />
                                    Start Delivery
                                  </button>
                                )}
                                {delivery.status === 'in_route' && (
                                  <div className="d-grid gap-2">
                                    <button 
                                      className="btn btn-sm btn-success"
                                      onClick={() => handleCompleteDelivery(delivery)}
                                      disabled={updateDeliveryStatus.isLoading}
                                    >
                                      <CheckCircle size={14} className="me-1" />
                                      Complete Delivery
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleCancelDelivery(delivery.id)}
                                      disabled={updateDeliveryStatus.isLoading}
                                    >
                                      <X size={14} className="me-1" />
                                      Cancel Delivery
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <Package size={48} className="text-muted mb-3" />
                          <p className="text-muted mb-0">No pending deliveries found</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}