import { format } from 'date-fns'

const AttendanceHistory = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No attendance records found.</p>
        <p className="text-sm mt-2">Mark your first attendance to get started!</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200/30">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Validated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/30">
          {records.map((record) => {
            const timestamp = record.timestamp?.toDate?.() || new Date(record.timestamp)
            return (
              <tr key={record.id} className="hover:bg-white/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  <div>{format(timestamp, 'MMM dd, yyyy')}</div>
                  <div className="text-gray-600">{format(timestamp, 'HH:mm:ss')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Lat:</span> {record.latitude.toFixed(6)}
                  </div>
                  <div>
                    <span className="font-medium">Lng:</span> {record.longitude.toFixed(6)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100/80 text-green-800 backdrop-blur-sm">
                    {record.status || 'present'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {record.validated ? (
                    <span className="text-green-600 font-medium">✓ Valid</span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Invalid</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default AttendanceHistory





