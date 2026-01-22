import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { markAttendance } from '../utils/attendance'
import { getAttendanceAction } from '../utils/timeWindow'
import LocationFetcher from './LocationFetcher'
import { validateMotion, isMotionSupported } from '../utils/motionValidation'
import { validateNetwork } from '../utils/networkValidation'
import toast from 'react-hot-toast'

const AttendanceButton = ({ onAttendanceMarked }) => {
  const { currentUser, userData } = useAuth()
  const [location, setLocation] = useState(null)
  const [motionValidated, setMotionValidated] = useState(false)
  const [networkValidated, setNetworkValidated] = useState(false)
  const [validatingMotion, setValidatingMotion] = useState(false)
  const [validatingNetwork, setValidatingNetwork] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionType, setActionType] = useState('checkin')
  const [motionSupported, setMotionSupported] = useState(false)

  useEffect(() => {
    const loadActionType = async () => {
      if (currentUser) {
        const action = await getAttendanceAction(currentUser.uid)
        setActionType(action)
      }
    }
    loadActionType()
    
    // Check motion support
    setMotionSupported(isMotionSupported())
    
    // Validate network on mount
    validateNetworkAccess()
  }, [currentUser])

  const validateNetworkAccess = async () => {
    if (!currentUser) return
    try {
      setValidatingNetwork(true)
      const result = await validateNetwork(currentUser.uid)
      setNetworkValidated(result.valid || result.firstTime)
      if (!result.valid && !result.firstTime) {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Network validation error:', error)
    } finally {
      setValidatingNetwork(false)
    }
  }

  const handleMotionValidation = async () => {
    if (!motionSupported) {
      toast.error('Motion sensors not supported on this device')
      return
    }
    
    try {
      setValidatingMotion(true)
      const result = await validateMotion(3, 10000) // 3 steps, 10 seconds
      setMotionValidated(result.valid)
      if (result.valid) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Motion validation failed: ' + error.message)
    } finally {
      setValidatingMotion(false)
    }
  }

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

    // Check network validation
    if (!networkValidated) {
      toast.error('Network validation required. Please wait...')
      await validateNetworkAccess()
      return
    }

    // Check motion validation if supported
    if (motionSupported && !motionValidated) {
      toast.error('Motion validation required. Please walk a few steps first.')
      return
    }

    setSubmitting(true)
    try {
      const result = await markAttendance(currentUser.uid, location, {
        skipMotion: !motionSupported, // Skip if not supported
      })
      if (result.success) {
        toast.success(result.message)
        setLocation(null)
        setMotionValidated(false) // Reset for next time
        // Update action type for next time
        setActionType(result.type === 'checkin' ? 'checkout' : 'checkin')
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

  const buttonText = actionType === 'checkin' ? 'Check In' : 'Check Out'
  const buttonColor = actionType === 'checkin' 
    ? 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
    : 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'

  return (
    <div className="clay-card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {actionType === 'checkin' ? 'Check In' : 'Check Out'}
      </h2>
      
      {/* Location Fetcher */}
      <LocationFetcher 
        onLocationFetched={handleLocationFetched}
        disabled={submitting}
      />

      {/* Network Validation Status */}
      <div className="p-3 rounded-lg bg-white/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Network Validation:</span>
          {validatingNetwork ? (
            <span className="text-xs text-gray-500">Validating...</span>
          ) : networkValidated ? (
            <span className="text-xs text-green-600 font-medium">✓ Validated</span>
          ) : (
            <button
              onClick={validateNetworkAccess}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Validate Now
            </button>
          )}
        </div>
      </div>

      {/* Motion Validation */}
      {motionSupported && (
        <div className="p-3 rounded-lg bg-white/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Motion Validation:</span>
            {validatingMotion ? (
              <span className="text-xs text-gray-500">Walk a few steps...</span>
            ) : motionValidated ? (
              <span className="text-xs text-green-600 font-medium">✓ Validated</span>
            ) : (
              <button
                onClick={handleMotionValidation}
                disabled={validatingMotion}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                Start Validation
              </button>
            )}
          </div>
          {!motionValidated && (
            <p className="text-xs text-gray-500 mt-1">
              Walk a few steps to verify presence
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleMarkAttendance}
        disabled={!location || !networkValidated || (motionSupported && !motionValidated) || submitting}
        className={`w-full px-6 py-3 bg-gradient-to-r ${buttonColor} text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl`}
      >
        {submitting ? `Processing ${buttonText}...` : buttonText}
      </button>

      {/* Validation Checklist */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className={`flex items-center gap-2 ${location ? 'text-green-600' : ''}`}>
          <span>{location ? '✓' : '○'}</span>
          <span>Location Fetched</span>
        </div>
        <div className={`flex items-center gap-2 ${networkValidated ? 'text-green-600' : ''}`}>
          <span>{networkValidated ? '✓' : '○'}</span>
          <span>Network Validated</span>
        </div>
        {motionSupported && (
          <div className={`flex items-center gap-2 ${motionValidated ? 'text-green-600' : ''}`}>
            <span>{motionValidated ? '✓' : '○'}</span>
            <span>Motion Validated</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceButton

