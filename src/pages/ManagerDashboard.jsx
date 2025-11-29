import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAllAttendance } from '../utils/attendance'
import { exportToCSV, exportToExcel } from '../utils/export'
import AttendanceTable from '../components/AttendanceTable'
import AttendanceCharts from '../components/AttendanceCharts'
import GeoFenceSettings from '../components/GeoFenceSettings'
import { format, startOfDay, endOfDay } from 'date-fns'

const ManagerDashboard = () => {
  const { currentUser, userData, logout } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: format(startOfDay(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
    userId: '',
  })

  useEffect(() => {
    loadAttendance()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [attendanceRecords, filters])

  const loadAttendance = async () => {
    try {
      setLoading(true)
      const records = await getAllAttendance()
      setAttendanceRecords(records)
      setFilteredRecords(records)
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...attendanceRecords]

    // Date filter
    if (filters.startDate && filters.endDate) {
      const start = startOfDay(new Date(filters.startDate))
      const end = endOfDay(new Date(filters.endDate))
      filtered = filtered.filter((record) => {
        const recordDate = record.timestamp?.toDate?.() || new Date(record.timestamp)
        return recordDate >= start && recordDate <= end
      })
    }

    // User filter
    if (filters.userId) {
      filtered = filtered.filter((record) => record.userId === filters.userId)
    }

    setFilteredRecords(filtered)
  }

  const handleExportCSV = () => {
    exportToCSV(filteredRecords, 'attendance_report')
  }

  const handleExportExcel = () => {
    exportToExcel(filteredRecords, 'attendance_report')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
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
        {/* Filters Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                placeholder="Filter by User ID"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ startDate: '', endDate: '', userId: '' })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex gap-4">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export to CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export to Excel
          </button>
        </div>

        {/* Charts Section */}
        <div className="mb-6">
          <AttendanceCharts records={filteredRecords} />
        </div>

        {/* Geo-Fence Settings */}
        <div className="mb-6">
          <GeoFenceSettings />
        </div>

        {/* Attendance Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Attendance Records ({filteredRecords.length})
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <AttendanceTable records={filteredRecords} />
          )}
        </div>
      </main>
    </div>
  )
}

export default ManagerDashboard

