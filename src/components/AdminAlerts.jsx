import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAdminAlerts, acknowledgeAlert } from '../utils/ipSessionMonitoring'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const AdminAlerts = ({ onAlertAcknowledged }) => {
  const { currentUser } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, acknowledged

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [filter])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const filters = filter === 'all' ? {} : { status: filter }
      const alertsData = await getAdminAlerts(filters)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, currentUser.uid)
      toast.success('Alert acknowledged')
      loadAlerts()
      // Notify parent component to update pending count
      if (onAlertAcknowledged) {
        onAlertAcknowledged()
      }
    } catch (error) {
      toast.error('Failed to acknowledge alert')
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100/80 text-red-800 border-red-300'
      case 'medium':
        return 'bg-yellow-100/80 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-blue-100/80 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100/80 text-gray-800 border-gray-300'
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      multiple_logins: 'Multiple Logins',
      rapid_actions: 'Rapid Actions',
      behavior_anomaly: 'Behavior Anomaly',
      device_changed: 'Device Change',
      verification_failed: 'Verification Failed',
    }
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const pendingCount = alerts.filter(a => !a.acknowledged).length

  return (
    <div className="clay-card p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Admin Alerts</h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
              {pendingCount} Pending
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('acknowledged')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'acknowledged'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Acknowledged
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-2 ${
                alert.acknowledged
                  ? 'bg-gray-50 border-gray-200'
                  : getSeverityColor(alert.severity)
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-800">
                      {getTypeLabel(alert.type)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        alert.severity === 'high'
                          ? 'bg-red-200 text-red-800'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    {alert.acknowledged && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800">
                        Acknowledged
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{alert.message}</p>
                  <p className="text-xs text-gray-500">
                    User: {alert.userId} • {format(alert.timestamp?.toDate?.() || new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                  {alert.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto">
                        {JSON.stringify(alert.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminAlerts

