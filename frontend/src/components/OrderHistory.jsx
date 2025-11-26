import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function OrderHistory({ orderId }) {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['order-history', orderId],
    queryFn: async () => {
      const response = await api.get(`/order-history/?order=${orderId}`)
      return response.data.results || response.data || []
    },
    enabled: !!orderId
  })

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 mb-0 text-muted">Loading order history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-warning" role="alert">
        <strong>Error:</strong> Could not load order history: {error.message || 'Unknown error'}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="mb-0 text-muted">No order history available</p>
      </div>
    )
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="table-light">
          <tr>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Updated By</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id}>
              <td>{new Date(entry.timestamp).toLocaleString()}</td>
              <td>
                <span className={`badge ${
                  entry.status === 'delivered' ? 'bg-success' :
                  entry.status === 'cancelled' ? 'bg-danger' :
                  entry.status === 'out' ? 'bg-info' :
                  'bg-warning'
                }`}>
                  {entry.status}
                </span>
              </td>
              <td>{entry.updated_by_name || 'System'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}