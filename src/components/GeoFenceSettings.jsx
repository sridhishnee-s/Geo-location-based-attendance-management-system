import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { setGeoFence } from '../utils/geofence'
import toast from 'react-hot-toast'

const GeoFenceSettings = () => {
  const [settings, setSettings] = useState({
    centerLat: '',
    centerLon: '',
    radius: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'geofence'))
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setSettings({
          centerLat: data.centerLat?.toString() || '',
          centerLon: data.centerLon?.toString() || '',
          radius: data.radius?.toString() || '',
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setFetchingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSettings({
          ...settings,
          centerLat: position.coords.latitude.toString(),
          centerLon: position.coords.longitude.toString(),
        })
        setFetchingLocation(false)
        toast.success('Current location fetched!')
      },
      (error) => {
        setFetchingLocation(false)
        toast.error('Failed to get current location')
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
      toast.success('Geo-fence settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Geo-Fence Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Center Latitude
            </label>
            <input
              type="number"
              step="any"
              value={settings.centerLat}
              onChange={(e) => setSettings({ ...settings, centerLat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 28.6139"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Center Longitude
            </label>
            <input
              type="number"
              step="any"
              value={settings.centerLon}
              onChange={(e) => setSettings({ ...settings, centerLon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 77.2090"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Radius (meters)
            </label>
            <input
              type="number"
              step="any"
              value={settings.radius}
              onChange={(e) => setSettings({ ...settings, radius: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 100"
              required
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={fetchingLocation}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {fetchingLocation ? 'Fetching...' : 'Use Current Location'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Set the center coordinates and radius for the allowed attendance area. Users must be
          within this radius to mark attendance.
        </p>
      </form>
    </div>
  )
}

export default GeoFenceSettings

