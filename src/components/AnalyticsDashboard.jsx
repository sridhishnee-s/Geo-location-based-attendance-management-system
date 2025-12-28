import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { calculateAttendanceStats, predictAbsenteeismRisk, getMonthlyReport } from '../utils/analytics'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import toast from 'react-hot-toast'

const AnalyticsDashboard = ({ userId = null }) => {
  const { currentUser, userData } = useAuth()
  const [stats, setStats] = useState(null)
  const [riskPrediction, setRiskPrediction] = useState(null)
  const [monthlyReport, setMonthlyReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    loadAnalytics()
  }, [currentUser, userId, selectedMonth])

  const loadAnalytics = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      const targetUserId = userId || currentUser.uid
      
      // Get stats for last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      
      const [statsData, riskData, monthlyData] = await Promise.all([
        calculateAttendanceStats(targetUserId, startDate, endDate),
        predictAbsenteeismRisk(targetUserId),
        getMonthlyReport(targetUserId, selectedMonth.getFullYear(), selectedMonth.getMonth() + 1),
      ])
      
      setStats(statsData)
      setRiskPrediction(riskData)
      setMonthlyReport(monthlyData)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-green-600 bg-green-50'
    }
  }

  if (loading) {
    return (
      <div className="clay-card p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  const pieData = [
    { name: 'Present', value: stats?.presentDays || 0, color: '#10b981' },
    { name: 'Absent', value: stats?.absentDays || 0, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {/* Risk Prediction */}
      {riskPrediction && (
        <div className={`clay-card p-6 ${getRiskColor(riskPrediction.riskLevel)}`}>
          <h3 className="text-lg font-semibold mb-2">Absenteeism Risk Assessment</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Risk Level:</span>
              <span className="text-xl font-bold capitalize">{riskPrediction.riskLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Risk Score:</span>
              <span className="font-semibold">{riskPrediction.riskScore}/100</span>
            </div>
            {riskPrediction.factors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-1">Risk Factors:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {riskPrediction.factors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm mt-3 italic">{riskPrediction.recommendation}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="clay-stat-card p-4">
          <p className="text-sm text-gray-600">Attendance Rate</p>
          <p className="text-2xl font-bold text-gray-800">{stats?.attendanceRate || 0}%</p>
        </div>
        <div className="clay-stat-card p-4">
          <p className="text-sm text-gray-600">Present Days</p>
          <p className="text-2xl font-bold text-green-600">{stats?.presentDays || 0}</p>
        </div>
        <div className="clay-stat-card p-4">
          <p className="text-sm text-gray-600">Absent Days</p>
          <p className="text-2xl font-bold text-red-600">{stats?.absentDays || 0}</p>
        </div>
        <div className="clay-stat-card p-4">
          <p className="text-sm text-gray-600">Late Arrivals</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.lateCount || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution */}
        <div className="clay-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        {monthlyReport && monthlyReport.dailyStats && (
          <div className="clay-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Monthly Attendance Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyReport.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Legend />
                <Bar dataKey="checkIns" fill="#3b82f6" name="Check-ins" />
                <Bar dataKey="checkOuts" fill="#10b981" name="Check-outs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyticsDashboard

