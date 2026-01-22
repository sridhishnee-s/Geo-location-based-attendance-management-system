import { useState, useEffect, useRef } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { setGeoFence } from '../utils/geofence'
import toast from 'react-hot-toast'
import { reverseGeocode, getGoogleMapsApiKey } from '../utils/geocoding'
import { loadGoogleMapsAPI } from '../utils/googleMapsLoader'
import MapLocationSelector from './MapLocationSelector'

const GeoFenceSettings = () => {
  const [settings, setSettings] = useState({
    centerLat: '',
    centerLon: '',
    radius: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [settingOfficeLocation, setSettingOfficeLocation] = useState(false)
  const [officeAddress, setOfficeAddress] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)

  useEffect(() => {
    loadSettings()
    // Load Google Maps API
    loadGoogleMapsAPI()
      .then(() => {
        setMapLoaded(true)
      })
      .catch((error) => {
        console.warn('Google Maps API not available:', error)
      })
  }, [])

  // Initialize/update map when settings change
  useEffect(() => {
    if (mapLoaded && settings.centerLat && settings.centerLon && mapRef.current) {
      const timer = setTimeout(() => {
        updateMap()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [settings.centerLat, settings.centerLon, settings.radius, mapLoaded])

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'geofence'))
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        const loadedSettings = {
          centerLat: data.centerLat?.toString() || '',
          centerLon: data.centerLon?.toString() || '',
          radius: data.radius?.toString() || '',
        }
        setSettings(loadedSettings)
        
        // Load address for the office location
        if (loadedSettings.centerLat && loadedSettings.centerLon) {
          loadOfficeAddress(parseFloat(loadedSettings.centerLat), parseFloat(loadedSettings.centerLon))
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadOfficeAddress = async (lat, lng) => {
    try {
      const apiKey = getGoogleMapsApiKey()
      if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        const result = await reverseGeocode(lat, lng, apiKey)
        if (result.success) {
          setOfficeAddress(result)
        }
      }
    } catch (error) {
      console.error('Error loading office address:', error)
    }
  }

  const updateMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current) return

    const lat = parseFloat(settings.centerLat)
    const lng = parseFloat(settings.centerLon)
    const radius = parseFloat(settings.radius) || 100

    if (isNaN(lat) || isNaN(lng)) return

    const center = new window.google.maps.LatLng(lat, lng)

    if (!mapInstanceRef.current) {
      // Initialize map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: center,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      })
    } else {
      // Update map center
      mapInstanceRef.current.setCenter(center)
    }

    // Update or create marker
    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapInstanceRef.current,
        title: 'Office Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      })
    } else {
      markerRef.current.setPosition(center)
    }

    // Update or create circle for radius
    if (circleRef.current) {
      circleRef.current.setMap(null)
    }

    if (radius > 0) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.15,
        map: mapInstanceRef.current,
        center: center,
        radius: radius,
      })
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setFetchingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const updatedSettings = {
          ...settings,
          centerLat: lat.toString(),
          centerLon: lng.toString(),
        }
        setSettings(updatedSettings)
        setFetchingLocation(false)
        
        // Load address for the location
        await loadOfficeAddress(lat, lng)
        toast.success('Current location fetched!')
      },
      (error) => {
        setFetchingLocation(false)
        toast.error('Failed to get current location')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const setCurrentLocationAsOffice = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setSettingOfficeLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const defaultRadius = 100 // Default 100 meters radius

        try {
          // Set and save immediately
          await setGeoFence(lat, lng, defaultRadius)
          
          // Update local state
          setSettings({
            centerLat: lat.toString(),
            centerLon: lng.toString(),
            radius: defaultRadius.toString(),
          })

          // Load address
          await loadOfficeAddress(lat, lng)

          setSettingOfficeLocation(false)
          toast.success(`Office location set to your current location with ${defaultRadius}m radius!`)
        } catch (error) {
          setSettingOfficeLocation(false)
          toast.error('Failed to save office location: ' + error.message)
        }
      },
      (error) => {
        setSettingOfficeLocation(false)
        toast.error('Failed to get current location')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!settings.centerLat || !settings.centerLon || !settings.radius) {
      toast.error('Please fill in all fields')
      return
    }

    const centerLat = parseFloat(settings.centerLat)
    const centerLon = parseFloat(settings.centerLon)
    const radius = parseFloat(settings.radius)

    if (isNaN(centerLat) || isNaN(centerLon) || isNaN(radius)) {
      toast.error('Please enter valid numbers')
      return
    }

    if (centerLat < -90 || centerLat > 90 || centerLon < -180 || centerLon > 180) {
      toast.error('Invalid coordinates')
      return
    }

    if (radius <= 0) {
      toast.error('Radius must be greater than 0')
      return
    }

    setLoading(true)
    try {
      await setGeoFence(centerLat, centerLon, radius)
      // Reload address after saving
      await loadOfficeAddress(centerLat, centerLon)
      toast.success('Office location settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="clay-card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Office Location Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure the office (target) location for attendance. Employees must be within the specified radius to check in.
        </p>
      </div>

      {/* Quick Set Office Location Button */}
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Quick Setup</h3>
        <p className="text-xs text-gray-600 mb-3">
          Set your current location as the office location with a default 100-meter radius.
        </p>
        <button
          type="button"
          onClick={setCurrentLocationAsOffice}
          disabled={settingOfficeLocation}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {settingOfficeLocation ? 'Setting Office Location...' : '📍 Set Current Location as Office'}
        </button>
      </div>

      {/* Map Visualization */}
      {settings.centerLat && settings.centerLon && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">Office Location Map</h3>
          {mapLoaded ? (
            <div
              ref={mapRef}
              className="w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200"
              style={{ minHeight: '256px' }}
            />
          ) : (
            <div className="w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          )}
          
          {officeAddress && officeAddress.success && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Office Address
              </p>
              <p className="text-sm text-gray-800 font-medium">{officeAddress.placeName}</p>
              <p className="text-xs text-gray-600">{officeAddress.formattedAddress}</p>
            </div>
          )}
        </div>
      )}

      {/* Map Location Selector */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Select Location on Map</h3>
        <p className="text-xs text-gray-500 mb-4">
          Click on the map below to select the office location:
        </p>
        <MapLocationSelector
          onLocationSelected={(locationData) => {
            setSettings({
              ...settings,
              centerLat: locationData.latitude.toString(),
              centerLon: locationData.longitude.toString(),
            })
            loadOfficeAddress(locationData.latitude, locationData.longitude)
          }}
          initialLocation={
            settings.centerLat && settings.centerLon
              ? {
                  latitude: parseFloat(settings.centerLat),
                  longitude: parseFloat(settings.centerLon),
                }
              : null
          }
        />
      </div>

      {/* Manual Configuration Form */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Manual Configuration</h3>
        <p className="text-xs text-gray-500 mb-4">
          You can also manually enter coordinates or adjust the settings here:
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office Latitude
              </label>
              <input
                type="number"
                step="any"
                value={settings.centerLat}
                onChange={(e) => setSettings({ ...settings, centerLat: e.target.value })}
                className="w-full px-3 py-2 clay-input"
                placeholder="e.g., 28.6139"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office Longitude
              </label>
              <input
                type="number"
                step="any"
                value={settings.centerLon}
                onChange={(e) => setSettings({ ...settings, centerLon: e.target.value })}
                className="w-full px-3 py-2 clay-input"
                placeholder="e.g., 77.2090"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Radius (meters)
              </label>
              <input
                type="number"
                step="any"
                value={settings.radius}
                onChange={(e) => setSettings({ ...settings, radius: e.target.value })}
                className="w-full px-3 py-2 clay-input"
                placeholder="e.g., 100"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={fetchingLocation}
              className="px-4 py-2 clay-button text-gray-700 font-medium disabled:opacity-50"
            >
              {fetchingLocation ? 'Fetching...' : '📍 Use Current Location'}
            </button>
            <button
              type="submit"
              disabled={loading || !settings.centerLat || !settings.centerLon || !settings.radius}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : '💾 Save Office Location'}
            </button>
          </div>
        </form>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">📝 Where to Change Office Location</h3>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>Go to <strong>Manager Dashboard</strong> → <strong>Settings</strong> tab</li>
          <li>Or use the <strong>Quick Setup</strong> button above to set it to your current location</li>
          <li>You can manually edit the coordinates and radius in the form above</li>
          <li>The red circle on the map shows the allowed attendance area</li>
        </ul>
      </div>
    </div>
  )
}

export default GeoFenceSettings
