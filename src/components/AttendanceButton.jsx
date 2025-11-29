import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { markAttendance } from '../utils/attendance'
import LocationFetcher from './LocationFetcher'
import toast from 'react-hot-toast'

const AttendanceButton = ({ onAttendanceMarked }) => {
  const { currentUser, userData } = useAuth()
  const [location, setLocation] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleLocationFetched = (locationData) => {
    setLocation(locationData)
  }

  const handleMarkAttendance = async () => {
    if (!location) {
      toast.error('Please fetch your location first')
      return
    }

    if (!currentUser || !userData) {
      toast.error('User not authenticated')
      return
    }

    setSubmitting(true)
    try {
      const result = await markAttendance(currentUser.uid, location)
      if (result.success) {
        toast.success(result.message)
        setLocation(null) // Reset location after successful submission
        if (onAttendanceMarked) {
          onAttendanceMarked()
        }
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to mark attendance: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Mark Attendance</h2>
      
      <LocationFetcher 
        onLocationFetched={handleLocationFetched}
        disabled={submitting}
      />

      <button
        onClick={handleMarkAttendance}
        disabled={!location || submitting}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {submitting ? 'Marking Attendance...' : 'Mark Attendance'}
      </button>
    </div>
  )
}

export default AttendanceButton

