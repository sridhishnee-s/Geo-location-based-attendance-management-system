import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Get registered network for user
 */
export const getRegisteredNetwork = async (userId) => {
  try {
    const networkDoc = await getDoc(doc(db, 'network_registrations', userId))
    if (networkDoc.exists()) {
      return networkDoc.data()
    }
    return null
  } catch (error) {
    console.error('Error getting registered network:', error)
    return null
  }
}

/**
 * Register network for user
 */
export const registerNetwork = async (userId, networkInfo) => {
  try {
    await setDoc(doc(db, 'network_registrations', userId), {
      userId,
      ...networkInfo,
      registeredAt: new Date(),
      lastUpdated: new Date(),
    })
    return { success: true }
  } catch (error) {
    console.error('Error registering network:', error)
    throw error
  }
}

/**
 * Get current network information
 */
export const getCurrentNetworkInfo = async () => {
  try {
    // Try to get connection info (limited browser support)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        type: connection.type,
      }
    }

    // Fallback: Try to detect Wi-Fi SSID (requires special permissions/APIs)
    // For now, we'll use a combination of available data
    const networkInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Note: Actual SSID detection requires special browser APIs or extensions
      // This is a simplified version
    }

    return networkInfo
  } catch (error) {
    console.error('Error getting network info:', error)
    return null
  }
}

/**
 * Validate network match
 */
export const validateNetwork = async (userId) => {
  try {
    const registeredNetwork = await getRegisteredNetwork(userId)
    const currentNetwork = await getCurrentNetworkInfo()

    if (!registeredNetwork) {
      // No network registered yet - allow first time and register
      if (currentNetwork) {
        await registerNetwork(userId, currentNetwork)
      }
      return {
        valid: true,
        message: 'Network registered for first time',
        firstTime: true,
      }
    }

    if (!currentNetwork) {
      return {
        valid: false,
        message: 'Unable to detect network information',
      }
    }

    // Compare network characteristics
    const matches = compareNetworkInfo(registeredNetwork, currentNetwork)

    if (matches) {
      return {
        valid: true,
        message: 'Network validated',
      }
    }

    // Network mismatch
    return {
      valid: false,
      message: 'Network mismatch. You must be connected to the registered office network.',
      registered: registeredNetwork,
      current: currentNetwork,
    }
  } catch (error) {
    console.error('Error validating network:', error)
    return {
      valid: false,
      message: 'Network validation failed',
    }
  }
}

/**
 * Compare network information
 */
const compareNetworkInfo = (registered, current) => {
  // Compare key network characteristics
  const checks = []

  // Check effective type (4G, WiFi, etc.)
  if (registered.effectiveType && current.effectiveType) {
    checks.push(registered.effectiveType === current.effectiveType)
  }

  // Check connection type
  if (registered.type && current.type) {
    checks.push(registered.type === current.type)
  }

  // Check timezone (should match for same location)
  if (registered.timezone && current.timezone) {
    checks.push(registered.timezone === current.timezone)
  }

  // Check platform (device type should match)
  if (registered.platform && current.platform) {
    checks.push(registered.platform === current.platform)
  }

  // At least 2 out of 4 checks should match
  const matchCount = checks.filter(Boolean).length
  return matchCount >= 2
}

/**
 * Get Wi-Fi SSID (if available through experimental APIs)
 * Note: This requires special browser permissions and may not work in all browsers
 */
export const getWiFiSSID = async () => {
  try {
    // Chrome/Edge experimental API (requires HTTPS and user gesture)
    if ('wifi' in navigator && navigator.wifi) {
      const networks = await navigator.wifi.getNetworks()
      if (networks && networks.length > 0) {
        return networks[0].ssid
      }
    }

    // Android Chrome (experimental)
    if (window.Android && window.Android.getWifiSSID) {
      return window.Android.getWifiSSID()
    }

    return null
  } catch (error) {
    console.error('Error getting WiFi SSID:', error)
    return null
  }
}

/**
 * Register Wi-Fi network by SSID
 */
export const registerWiFiNetwork = async (userId, ssid) => {
  try {
    const networkInfo = await getCurrentNetworkInfo()
    await registerNetwork(userId, {
      ...networkInfo,
      ssid: ssid,
      networkType: 'wifi',
    })
    return { success: true }
  } catch (error) {
    console.error('Error registering WiFi network:', error)
    throw error
  }
}

