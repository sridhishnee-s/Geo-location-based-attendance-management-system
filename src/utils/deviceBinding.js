import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Generate device fingerprint
 * @returns {string} - Device fingerprint
 */
export const generateDeviceFingerprint = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillText('Device fingerprint', 2, 2)
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown',
  ].join('|')
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Get or create device binding for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Device binding info
 */
export const getDeviceBinding = async (userId) => {
  try {
    const deviceDoc = await getDoc(doc(db, 'device_bindings', userId))
    if (deviceDoc.exists()) {
      return deviceDoc.data()
    }
    return null
  } catch (error) {
    console.error('Error getting device binding:', error)
    return null
  }
}

/**
 * Bind device to user
 * @param {string} userId - User ID
 * @param {string} deviceFingerprint - Device fingerprint
 * @returns {Promise<Object>} - Success status
 */
export const bindDevice = async (userId, deviceFingerprint) => {
  try {
    const existingBinding = await getDeviceBinding(userId)
    
    if (existingBinding && existingBinding.deviceFingerprint !== deviceFingerprint) {
      // Device change detected
      await updateDoc(doc(db, 'device_bindings', userId), {
        previousDevice: existingBinding.deviceFingerprint,
        deviceFingerprint,
        lastChanged: new Date(),
        changeCount: (existingBinding.changeCount || 0) + 1,
        alerts: [...(existingBinding.alerts || []), {
          timestamp: new Date(),
          message: 'Device change detected',
          previousDevice: existingBinding.deviceFingerprint,
          newDevice: deviceFingerprint,
        }],
      })
      
      return {
        success: true,
        deviceChanged: true,
        message: 'Device change detected and logged',
      }
    }
    
    if (!existingBinding) {
      // First time binding
      await setDoc(doc(db, 'device_bindings', userId), {
        userId,
        deviceFingerprint,
        firstBound: new Date(),
        lastChanged: new Date(),
        changeCount: 0,
        alerts: [],
      })
    } else {
      // Update last access
      await updateDoc(doc(db, 'device_bindings', userId), {
        lastAccess: new Date(),
      })
    }
    
    return {
      success: true,
      deviceChanged: false,
      message: 'Device binding updated',
    }
  } catch (error) {
    console.error('Error binding device:', error)
    throw error
  }
}

/**
 * Check if device is bound to user (strict mode - blocks unregistered devices)
 * @param {string} userId - User ID
 * @param {string} deviceFingerprint - Current device fingerprint
 * @param {boolean} strictMode - If true, block attendance from unregistered devices
 * @returns {Promise<Object>} - { valid: boolean, message: string, alert: boolean }
 */
export const validateDevice = async (userId, deviceFingerprint, strictMode = true) => {
  try {
    const binding = await getDeviceBinding(userId)
    
    if (!binding) {
      if (strictMode) {
        // Strict mode: Block attendance from unregistered devices
        return {
          valid: false,
          message: 'Device not registered. Please contact administrator to register your device.',
          alert: true,
          requiresRegistration: true,
        }
      } else {
        // Non-strict mode: Allow first time and bind
        await bindDevice(userId, deviceFingerprint)
        return { valid: true, message: 'Device registered', alert: false }
      }
    }
    
    if (binding.deviceFingerprint === deviceFingerprint) {
      return { valid: true, message: 'Device verified', alert: false }
    }
    
    // Device mismatch
    if (strictMode) {
      // Strict mode: Block attendance from different devices
      return {
        valid: false,
        message: 'Attendance allowed only from registered device. This device is not registered.',
        alert: true,
        requiresRegistration: true,
      }
    } else {
      // Non-strict mode: Log but allow (admin will be notified)
      await bindDevice(userId, deviceFingerprint)
      return {
        valid: true,
        message: 'Different device detected - Admin will be notified',
        alert: true,
      }
    }
  } catch (error) {
    console.error('Error validating device:', error)
    return { valid: false, message: 'Device validation failed', alert: false }
  }
}

