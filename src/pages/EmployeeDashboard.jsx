import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserAttendance } from '../utils/attendance'
import AttendanceButton from '../components/AttendanceButton'
import AttendanceHistory from '../components/AttendanceHistory'
import { format } from 'date-fns'

const EmployeeDashboard = () => {
  const { currentUser, userData, logout } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {userData?.name || currentUser?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Marking Section */}
          <div className="lg:col-span-1">
            <AttendanceButton onAttendanceMarked={handleAttendanceMarked} />
          </div>

          {/* Attendance History Section */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Attendance History
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : (
                <AttendanceHistory records={attendanceRecords} />
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-600">Total Attendance</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {attendanceRecords.length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-600">This Month</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {
                attendanceRecords.filter(
                  (record) =>
                    new Date(record.timestamp?.toDate?.() || record.timestamp).getMonth() ===
                    new Date().getMonth()
                ).length
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-600">Last Attendance</h3>
            <p className="text-lg font-semibold text-gray-900 mt-2">
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
      </main>
    </div>
  )
}

export default EmployeeDashboard



