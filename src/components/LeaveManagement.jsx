import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { applyForLeave, getUserLeaveRequests, processLeaveRequest } from '../utils/leaveManagement'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const LeaveManagement = ({ isManager = false, onLeaveApplied }) => {
  const { currentUser, userData } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation',
    reason: '',
  })

  useEffect(() => {
    loadLeaveRequests()
  }, [currentUser, isManager])

  const loadLeaveRequests = async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const requests = await getUserLeaveRequests(currentUser.uid)
      setLeaveRequests(requests)
    } catch (error) {
      console.error('Error loading leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentUser) return

    setLoading(true)
    try {
      const result = await applyForLeave(
        currentUser.uid,
        new Date(formData.startDate),
        new Date(formData.endDate),
        formData.type,
        formData.reason
      )
      
      if (result.success) {
        toast.success(result.message)
        setShowForm(false)
        setFormData({ startDate: '', endDate: '', type: 'vacation', reason: '' })
        loadLeaveRequests()
        if (onLeaveApplied) onLeaveApplied()
      }
    } catch (error) {
      toast.error('Failed to apply for leave: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessLeave = async (leaveId, action) => {
    if (!isManager) return
    
    setLoading(true)
    try {
      const result = await processLeaveRequest(leaveId, currentUser.uid, action)
      if (result.success) {
        toast.success(result.message)
        loadLeaveRequests()
      }
    } catch (error) {
      toast.error('Failed to process leave request: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100/80 text-green-800'
      case 'rejected':
        return 'bg-red-100/80 text-red-800'
      default:
        return 'bg-yellow-100/80 text-yellow-800'
    }
  }

  if (!isManager && !showForm && leaveRequests.length === 0) {
    return (
      <div className="clay-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Leave Management</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            Apply for Leave
          </button>
        </div>
        <p className="text-gray-500 text-center py-4">No leave requests yet</p>
      </div>
    )
  }

  return (
    <div className="clay-card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Leave Management</h2>
        {!isManager && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            {showForm ? 'Cancel' : 'Apply for Leave'}
          </button>
        )}
      </div>

      {showForm && !isManager && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 clay-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 clay-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 clay-input"
              required
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 clay-input"
              rows="3"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {loading && leaveRequests.length === 0 ? (
          <div className="text-center py-4">Loading...</div>
        ) : leaveRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No leave requests</p>
        ) : (
          leaveRequests.map((request) => (
            <div key={request.id} className="p-4 bg-white/30 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">
                    {format(new Date(request.startDate?.toDate?.() || request.startDate), 'MMM dd')} -{' '}
                    {format(new Date(request.endDate?.toDate?.() || request.endDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{request.type}</p>
                  <p className="text-sm text-gray-500 mt-1">{request.reason}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                  {isManager && request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProcessLeave(request.id, 'approve')}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleProcessLeave(request.id, 'reject')}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LeaveManagement

