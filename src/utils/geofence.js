import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Check if a location is within the geo-fence
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @returns {Promise<Object>} - Object with inside status and message
 */
export const checkGeoFence = async (latitude, longitude) => {
  try {
    // Fetch geo-fence settings from Firestore
    const settingsDoc = await getDoc(doc(db, 'settings', 'geofence'))
    
    if (!settingsDoc.exists()) {
      // If no geo-fence is set, allow all locations
      return {
        inside: true,
        message: 'No geo-fence configured',
      }
    }

    const settings = settingsDoc.data()
    const { centerLat, centerLon, radius } = settings

    if (!centerLat || !centerLon || !radius) {
      // If settings are incomplete, allow all locations
      return {
        inside: true,
        message: 'Geo-fence settings incomplete',
      }
    }

    // Calculate distance from center
    const distance = calculateDistance(latitude, longitude, centerLat, centerLon)

    if (distance <= radius) {
      return {
        inside: true,
        message: `Within allowed area (${distance.toFixed(0)}m from center)`,
        distance: distance,
      }
    } else {
      return {
        inside: false,
        message: `Outside allowed area. You are ${distance.toFixed(0)}m away (allowed: ${radius}m)`,
        distance: distance,
      }
    }
  } catch (error) {
    console.error('Error checking geo-fence:', error)
    // On error, allow the location (fail open)
    return {
      inside: true,
      message: 'Error checking geo-fence, allowing attendance',
    }
  }
}

/**
 * Set geo-fence settings (for managers)
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @param {number} radius - Radius in meters
 * @returns {Promise<void>}
 */
export const setGeoFence = async (centerLat, centerLon, radius) => {
  try {
    const { setDoc } = await import('firebase/firestore')
    await setDoc(doc(db, 'settings', 'geofence'), {
      centerLat,
      centerLon,
      radius,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error setting geo-fence:', error)
    throw error
  }
}



