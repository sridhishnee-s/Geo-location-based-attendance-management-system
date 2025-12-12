import { useState } from 'react'
import toast from 'react-hot-toast'

const LocationFetcher = ({ onLocationFetched, disabled = false }) => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        }
        setLocation(locationData)
        onLocationFetched(locationData)
        setLoading(false)
        toast.success('Location fetched successfully!')
      },
      (error) => {
        setLoading(false)
        let errorMessage = 'Failed to get location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        toast.error(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={getCurrentLocation}
        disabled={disabled || loading}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Fetching Location...' : 'Get Current Location'}
      </button>

      {location && (
        <div className="p-4 bg-gray-100 rounded-lg space-y-2">
          <p className="text-sm font-medium text-gray-700">Current Location:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Latitude:</span> {location.latitude.toFixed(6)}
            </p>
            <p>
              <span className="font-medium">Longitude:</span> {location.longitude.toFixed(6)}
            </p>
            <p>
              <span className="font-medium">Accuracy:</span> {location.accuracy.toFixed(2)} meters
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationFetcher


