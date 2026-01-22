import { useState } from 'react'
import toast from 'react-hot-toast'
import MapLocationSelector from './MapLocationSelector'

const LocationFetcher = ({ onLocationFetched, disabled = false }) => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [useMap, setUseMap] = useState(false)

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

  const handleMapLocationSelected = (locationData) => {
    setLocation(locationData)
    onLocationFetched(locationData)
  }

  return (
    <div className="space-y-4">
      {/* Toggle between GPS and Map */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setUseMap(false)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            !useMap
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-transparent text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          📍 GPS Location
        </button>
        <button
          onClick={() => setUseMap(true)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            useMap
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-transparent text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          🗺️ Map Selection
        </button>
      </div>

      {!useMap ? (
        <>
          <button
            onClick={getCurrentLocation}
            disabled={disabled || loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
          >
            {loading ? 'Fetching Location...' : 'Get Current Location'}
          </button>

          {location && (
            <div className="p-4 clay-card space-y-2">
              <p className="text-sm font-medium text-gray-700">Current Location:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Latitude:</span> {location.latitude.toFixed(6)}
                </p>
                <p>
                  <span className="font-medium">Longitude:</span> {location.longitude.toFixed(6)}
                </p>
                {location.accuracy && (
                  <p>
                    <span className="font-medium">Accuracy:</span> {location.accuracy.toFixed(2)} meters
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <MapLocationSelector
          onLocationSelected={handleMapLocationSelected}
          initialLocation={location}
          disabled={disabled}
        />
      )}
    </div>
  )
}

export default LocationFetcher
