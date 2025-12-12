import { useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO, startOfDay, eachDayOfInterval } from 'date-fns'

const AttendanceCharts = ({ records }) => {
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return []

    // Group by date
    const groupedByDate = records.reduce((acc, record) => {
      const timestamp = record.timestamp?.toDate?.() || new Date(record.timestamp)
      const dateKey = format(startOfDay(timestamp), 'yyyy-MM-dd')
      
      if (!acc[dateKey]) {
        acc[dateKey] = 0
      }
      acc[dateKey]++
      return acc
    }, {})

    // Convert to array and sort by date
    return Object.entries(groupedByDate)
      .map(([date, count]) => ({
        date: format(parseISO(date), 'MMM dd'),
        count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [records])

  const hourlyData = useMemo(() => {
    if (!records || records.length === 0) return []

    const hourlyCounts = Array(24).fill(0)
    
    records.forEach((record) => {
      const timestamp = record.timestamp?.toDate?.() || new Date(record.timestamp)
      const hour = timestamp.getHours()
      hourlyCounts[hour]++
    })

    return hourlyCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      count,
    }))
  }, [records])

  if (!records || records.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-center">No data available for charts</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Attendance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Daily Attendance Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Attendance Count"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Distribution Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Hourly Attendance Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Attendance Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AttendanceCharts



