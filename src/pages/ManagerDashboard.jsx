import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllAttendance } from '../utils/attendance'
import { exportToCSV, exportToExcel } from '../utils/export'
import { getAuditTrail } from '../utils/auditTrail'
import AttendanceTable from '../components/AttendanceTable'
import AttendanceCharts from '../components/AttendanceCharts'
import GeoFenceSettings from '../components/GeoFenceSettings'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import LeaveManagement from '../components/LeaveManagement'
import SystemSettings from '../components/SystemSettings'
import AdminAlerts from '../components/AdminAlerts'
import SalaryManagement from '../components/SalaryManagement'
import EmployeeSalaryView from '../components/EmployeeSalaryView'
import DeviceRegistration from '../components/DeviceRegistration'
import { getAdminAlerts } from '../utils/ipSessionMonitoring'
import { isAdmin } from '../utils/roleHelpers'
import { format, startOfDay, endOfDay } from 'date-fns'

const ManagerDashboard = () => {
  const { currentUser, userData, logout } = useAuth()
  const navigate = useNavigate()
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [auditTrail, setAuditTrail] = useState([])
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('attendance')
  const [salarySubTab, setSalarySubTab] = useState('my-salary')
  const [filters, setFilters] = useState({
    startDate: format(startOfDay(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfDay(new Date()), 'yyyy-MM-dd'),
    userId: '',
  })

  // Redirect non-admins to employee dashboard
  useEffect(() => {
    if (userData && !isAdmin(userData)) {
      navigate('/employee/dashboard', { replace: true })
    }
  }, [userData, navigate])

  useEffect(() => {
    loadAttendance()
    loadAuditTrail()
    loadPendingAlertsCount()
    
    // Refresh pending alerts count every 30 seconds
    const interval = setInterval(loadPendingAlertsCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [attendanceRecords, filters])

  const loadAuditTrail = async () => {
    try {
      const trail = await getAuditTrail({ limit: 50 })
      setAuditTrail(trail)
    } catch (error) {
      console.error('Error loading audit trail:', error)
    }
  }

  const loadPendingAlertsCount = async () => {
    try {
      const allAlerts = await getAdminAlerts({})
      // Count alerts that are not acknowledged (pending)
      const pendingCount = allAlerts.filter(alert => !alert.acknowledged || alert.status === 'pending').length
      setPendingAlertsCount(pendingCount)
    } catch (error) {
      console.error('Error loading pending alerts count:', error)
      setPendingAlertsCount(0)
    }
  }

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
    <div className="min-h-screen admin-bg">
      {/* Header */}
      <header className="clay-header sticky top-0 z-50 border-b-2 border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs font-semibold shadow-lg">
                    👑 Admin
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
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'attendance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'leaves'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Leave Management
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'audit'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Audit Trail
          </button>
          <button
            onClick={() => {
              setActiveTab('alerts')
              loadPendingAlertsCount() // Refresh count when clicking
            }}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'alerts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Alerts
            {pendingAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                {pendingAlertsCount > 9 ? '9+' : pendingAlertsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('salary')
              setSalarySubTab('my-salary')
            }}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'salary'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Salary Management
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'devices'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Device Registration
          </button>
        </div>

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            {/* Filters Section */}
            <div className="clay-card p-6 mb-6">
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
                className="w-full px-3 py-2 clay-input"
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
                className="w-full px-3 py-2 clay-input"
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
                className="w-full px-3 py-2 clay-input"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ startDate: '', endDate: '', userId: '' })}
                className="w-full px-4 py-2 clay-button text-gray-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="clay-card p-4 mb-6 flex gap-4">
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            Export to CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
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
        <div className="clay-card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Attendance Records ({filteredRecords.length})
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <AttendanceTable records={filteredRecords} />
          )}
        </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsDashboard />
          </div>
        )}

        {/* Leave Management Tab */}
        {activeTab === 'leaves' && (
          <LeaveManagement isManager={true} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <SystemSettings />
            <GeoFenceSettings />
          </div>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="clay-card p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Audit Trail</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/30">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30">
                  {auditTrail.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {format(entry.timestamp?.toDate?.() || new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                        {entry.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.targetUserId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.ipAddress || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {entry.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Alerts Tab */}
        {activeTab === 'alerts' && (
          <AdminAlerts onAlertAcknowledged={loadPendingAlertsCount} />
        )}

        {/* Salary Management Tab */}
        {activeTab === 'salary' && (
          <div className="space-y-6">
            <div className="clay-card p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSalarySubTab('my-salary')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    salarySubTab === 'my-salary'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  My Salary
                </button>
                <button
                  onClick={() => setSalarySubTab('employee-salary')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    salarySubTab === 'employee-salary'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Employee Salaries
                </button>
              </div>
            </div>
            {salarySubTab === 'my-salary' && (
              <SalaryManagement isManager={true} />
            )}
            {salarySubTab === 'employee-salary' && (
              <EmployeeSalaryView />
            )}
          </div>
        )}

        {/* Device Registration Tab */}
        {activeTab === 'devices' && (
          <DeviceRegistration />
        )}
      </main>
    </div>
  )
}

export default ManagerDashboard





