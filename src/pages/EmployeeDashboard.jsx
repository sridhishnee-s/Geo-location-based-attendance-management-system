import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserAttendance } from '../utils/attendance'
import AttendanceButton from '../components/AttendanceButton'
import AttendanceHistory from '../components/AttendanceHistory'
import PresenceVerification from '../components/PresenceVerification'
import GamificationDisplay from '../components/GamificationDisplay'
import LeaveManagement from '../components/LeaveManagement'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import SalaryManagement from '../components/SalaryManagement'
import { isAdmin } from '../utils/roleHelpers'
import { format } from 'date-fns'

const EmployeeDashboard = () => {
  const { currentUser, userData, logout } = useAuth()
  const navigate = useNavigate()
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)

  // Redirect admins to manager dashboard
  useEffect(() => {
    if (userData && isAdmin(userData)) {
      navigate('/manager/dashboard', { replace: true })
    }
  }, [userData, navigate])

  useEffect(() => {
    if (currentUser) {
      loadAttendance()
    }
  }, [currentUser])

  const loadAttendance = async () => {
    try {
      setLoading(true)
      const records = await getUserAttendance(currentUser.uid)
      setAttendanceRecords(records)
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceMarked = () => {
    loadAttendance() // Reload attendance after marking
  }

  return (
    <div className="min-h-screen employee-bg">
      {/* Header */}
      <header className="clay-header sticky top-0 z-50 border-b-2 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">Employee Dashboard</h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    👤 Employee
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome, <span className="font-medium">{userData?.name || currentUser?.email}</span>
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Presence Verification Modal */}
        <PresenceVerification />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <AttendanceButton onAttendanceMarked={handleAttendanceMarked} />
            <GamificationDisplay />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance History */}
            <div className="clay-card p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Attendance History
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : (
                <AttendanceHistory records={attendanceRecords} />
              )}
            </div>

            {/* Analytics */}
            <AnalyticsDashboard />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="clay-stat-card p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Attendance</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {attendanceRecords.length}
            </p>
          </div>
          <div className="clay-stat-card p-6">
            <h3 className="text-sm font-medium text-gray-600">This Month</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {
                attendanceRecords.filter(
                  (record) =>
                    new Date(record.timestamp?.toDate?.() || record.timestamp).getMonth() ===
                    new Date().getMonth()
                ).length
              }
            </p>
          </div>
          <div className="clay-stat-card p-6">
            <h3 className="text-sm font-medium text-gray-600">Last Attendance</h3>
            <p className="text-lg font-semibold text-gray-800 mt-2">
              {attendanceRecords.length > 0
                ? format(
                    attendanceRecords[0].timestamp?.toDate?.() ||
                      new Date(attendanceRecords[0].timestamp),
                    'MMM dd, yyyy HH:mm'
                  )
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Leave Management */}
        <div className="mt-6">
          <LeaveManagement onLeaveApplied={handleAttendanceMarked} />
        </div>

        {/* Salary Management */}
        <div className="mt-6">
          <SalaryManagement />
        </div>
      </main>
    </div>
  )
}

export default EmployeeDashboard



