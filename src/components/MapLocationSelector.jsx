import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { reverseGeocode, getGoogleMapsApiKey } from '../utils/geocoding'
import toast from 'react-hot-toast'

const containerStyle = {
  width: '100%',
  height: '400px',
}

const defaultCenter = {
  lat: 28.6139, // Default to a common location (can be changed)
  lng: 77.2090,
}

const MapLocationSelector = ({ onLocationSelected, initialLocation = null, disabled = false }) => {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [address, setAddress] = useState(null)
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [map, setMap] = useState(null)

  const apiKey = getGoogleMapsApiKey()

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  })

  // Initialize map center from initialLocation or user's current location
  useEffect(() => {
    if (initialLocation) {
      setMapCenter({
        lat: initialLocation.latitude,
        lng: initialLocation.longitude,
      })
      setSelectedLocation({
        lat: initialLocation.latitude,
        lng: initialLocation.longitude,
      })
      // Load address for initial location
      if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        loadAddress(initialLocation.latitude, initialLocation.longitude)
      }
    } else {
      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const center = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            setMapCenter(center)
          },
          () => {
            // If geolocation fails, use default center
            console.log('Using default map center')
          },
          { timeout: 5000 }
        )
      }
    }
  }, [initialLocation, apiKey])

  const loadAddress = async (lat, lng) => {
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      return
    }

    setLoadingAddress(true)
    try {
      const result = await reverseGeocode(lat, lng, apiKey)
      setAddress(result)
    } catch (error) {
      console.error('Error loading address:', error)
      toast.error('Failed to load address')
    } finally {
      setLoadingAddress(false)
    }
  }

  const handleMapClick = useCallback(
    async (event) => {
      if (disabled) return

      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      const location = {
        lat,
        lng,
      }

      setSelectedLocation(location)
      
      // Load address for selected location
      if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        await loadAddress(lat, lng)
      }

      // Prepare location data for parent component
      const locationData = {
        latitude: lat,
        longitude: lng,
        accuracy: null, // Map selection doesn't have accuracy
        timestamp: new Date(),
      }

      // Call parent callback
      if (onLocationSelected) {
        onLocationSelected(locationData)
      }

      toast.success('Location selected on map')
    },
    [disabled, apiKey, onLocationSelected]
  )

  const onMapLoad = useCallback((map) => {
    setMap(map)
  }, [])

  const onMapUnmount = useCallback(() => {
    setMap(null)
  }, [])

  if (loadError) {
    return (
      <div className="p-4 clay-card">
        <p className="text-red-600">Error loading Google Maps. Please check your API key configuration.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="p-4 clay-card">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="clay-card p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Select Location on Map</h3>
          <p className="text-xs text-gray-600">
            {disabled ? 'Map selection is disabled' : 'Click anywhere on the map to select a location'}
          </p>
        </div>

        <div className="rounded-lg overflow-hidden border-2 border-gray-200">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={15}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              clickableIcons: false,
            }}
          >
            {selectedLocation && <Marker position={selectedLocation} />}
          </GoogleMap>
        </div>

        {selectedLocation && (
          <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Selected Location Details</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Latitude:</span>
                  <span className="text-gray-800">{selectedLocation.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Longitude:</span>
                  <span className="text-gray-800">{selectedLocation.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {loadingAddress ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Loading address...</span>
              </div>
            ) : address && address.success ? (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Place Name
                  </p>
                  <p className="text-sm font-medium text-gray-800">{address.placeName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <p className="text-sm text-gray-700">{address.formattedAddress}</p>
                </div>
                {(address.city || address.state) && (
                  <div className="flex gap-4">
                    {address.city && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                          City
                        </p>
                        <p className="text-sm text-gray-700">{address.city}</p>
                      </div>
                    )}
                    {address.state && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                          State
                        </p>
                        <p className="text-sm text-gray-700">{address.state}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : address && !address.success ? (
              <div className="text-sm text-gray-600">
                <p>Address: {address.formattedAddress}</p>
                <p className="text-xs text-gray-500 mt-1">
                  (Could not fetch detailed address. Using coordinates.)
                </p>
              </div>
            ) : null}
          </div>
        )}

        {!selectedLocation && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 Click on the map to select your location. A marker will appear at the selected position.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapLocationSelector

