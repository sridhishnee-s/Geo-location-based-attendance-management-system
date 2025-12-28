import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { checkGeoFence } from './geofence'
import { getTimeWindowSettings, validateCheckInTime, validateCheckOutTime, getAttendanceAction } from './timeWindow'
import { validateDevice, generateDeviceFingerprint } from './deviceBinding'
import { validateQRCode } from './qrCode'
import { validateMotion } from './motionValidation'
import { validateNetwork } from './networkValidation'
import { schedulePresenceVerification } from './presenceVerification'
import { startActiveTimeTracking } from './productivity'
import { checkLeaveStatus } from './leaveManagement'
import { logAuditTrail, AuditActions } from './auditTrail'
import { updateGamificationData } from './gamification'
import { trackSession, monitorSuspiciousActivity } from './ipSessionMonitoring'
import { initBehaviorTracking } from './behaviorTracking'

/**
 * Mark attendance (check-in or check-out) for a user
 * @param {string} userId - User ID
 * @param {Object} location - Location object with latitude, longitude, timestamp
 * @param {Object} options - Additional options (qrCode, skipMotion, skipNetwork)
 * @returns {Promise<Object>} - Success status and message
 */
export const markAttendance = async (userId, location, options = {}) => {
  try {
    const now = new Date()
    
    // Check if user is on leave
    const leaveStatus = await checkLeaveStatus(userId, now)
    if (leaveStatus) {
      return {
        success: false,
        message: `You are on approved leave from ${leaveStatus.startDate.toDate?.().toLocaleDateString() || leaveStatus.startDate} to ${leaveStatus.endDate.toDate?.().toLocaleDateString() || leaveStatus.endDate}`,
      }
    }

    // Device binding validation (STRICT MODE - blocks unregistered devices)
    const deviceFingerprint = generateDeviceFingerprint()
    const deviceValidation = await validateDevice(userId, deviceFingerprint, true) // strictMode = true
    if (!deviceValidation.valid) {
      return {
        success: false,
        message: deviceValidation.message,
      }
    }
    if (deviceValidation.alert) {
      // Log device change for admin notification
      await logAuditTrail(AuditActions.DEVICE_CHANGED, userId, null, { deviceFingerprint }, 'Device change detected during attendance')
    }

    // QR Code validation
    if (options.qrCode) {
      const qrValidation = await validateQRCode(options.qrCode)
      if (!qrValidation.valid) {
        return {
          success: false,
          message: qrValidation.message,
        }
      }
    } else {
      return {
        success: false,
        message: 'QR code is required. Please scan the QR code first.',
      }
    }

    // Motion-based validation (user must walk a few steps)
    if (!options.skipMotion) {
      try {
        const motionValidation = await validateMotion(3, 10000) // 3 steps minimum, 10 seconds
        if (!motionValidation.valid) {
          return {
            success: false,
            message: motionValidation.message,
          }
        }
      } catch (error) {
        // If motion sensors not available, allow but log
        console.warn('Motion validation skipped:', error)
      }
    }

    // Network validation (must be on registered network)
    const networkValidation = await validateNetwork(userId)
    if (!networkValidation.valid && !networkValidation.firstTime) {
      return {
        success: false,
        message: networkValidation.message,
      }
    }

    // IP and session monitoring
    const ipAddress = await (await import('./ipSessionMonitoring')).getClientIP()
    const sessionId = await trackSession(userId, ipAddress)
    const suspiciousActivity = await monitorSuspiciousActivity(userId, 'attendance_marked')
    
    if (suspiciousActivity.flagged) {
      // Suspicious activity detected - already logged in monitorSuspiciousActivity
      console.warn('Suspicious activity detected:', suspiciousActivity.alerts)
    }

    // Behavior tracking - check for anomalies
    try {
      const { BehaviorTracker } = await import('./behaviorTracking')
      const tracker = new BehaviorTracker(userId)
      const behaviorCheck = await tracker.checkBehaviorAnomaly()
      
      if (behaviorCheck.anomaly) {
        await (await import('./ipSessionMonitoring')).createAdminAlert({
          type: 'behavior_anomaly',
          userId,
          severity: 'medium',
          message: 'Unusual behavior pattern detected',
          details: behaviorCheck.anomalies,
        })
      }
    } catch (error) {
      console.error('Error checking behavior:', error)
    }

    // Determine if this is check-in or check-out
    const action = await getAttendanceAction(userId, now)
    
    // Time window validation
    const timeWindowSettings = await getTimeWindowSettings()
    if (timeWindowSettings.enabled) {
      if (action === 'checkin') {
        const timeValidation = validateCheckInTime(timeWindowSettings.checkInStart, timeWindowSettings.checkInEnd)
        if (!timeValidation.valid) {
          return {
            success: false,
            message: timeValidation.message,
          }
        }
      } else {
        const timeValidation = validateCheckOutTime(timeWindowSettings.checkOutStart, timeWindowSettings.checkOutEnd)
        if (!timeValidation.valid) {
          return {
            success: false,
            message: timeValidation.message,
          }
        }
      }
    }

    // Check if user has already checked in/out today
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('userId', '==', userId),
      where('timestamp', '>=', today),
      where('timestamp', '<', tomorrow),
      where('type', '==', action),
      orderBy('timestamp', 'desc'),
      limit(1)
    )

    const existingRecords = await getDocs(attendanceQuery)
    if (!existingRecords.empty) {
      return {
        success: false,
        message: `You have already ${action === 'checkin' ? 'checked in' : 'checked out'} today`,
      }
    }

    // Check geo-fence (optional validation)
    const geoFenceCheck = await checkGeoFence(location.latitude, location.longitude)
    if (!geoFenceCheck.inside) {
      return {
        success: false,
        message: `You are outside the allowed area. ${geoFenceCheck.message || ''}`,
      }
    }

    // Create attendance record
    const attendanceData = {
      userId: userId,
      type: action,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null,
      timestamp: now,
      status: action === 'checkin' ? 'present' : 'checked_out',
      validated: geoFenceCheck.inside,
      deviceFingerprint,
    }

    const attendanceRef = await addDoc(collection(db, 'attendance_records'), attendanceData)

    // Schedule presence verification for check-in
    if (action === 'checkin') {
      await schedulePresenceVerification(userId, now)
      // Start active time tracking
      startActiveTimeTracking(userId, now)
      // Initialize behavior tracking
      initBehaviorTracking(userId)
    }

    // Log audit trail
    await logAuditTrail(
      AuditActions.ATTENDANCE_MARKED,
      userId,
      null,
      { attendanceId: attendanceRef.id, type: action, location },
      `${action === 'checkin' ? 'Check-in' : 'Check-out'} marked`
    )

    // Update gamification data
    try {
      await updateGamificationData(userId)
    } catch (error) {
      console.error('Error updating gamification:', error)
    }

    return {
      success: true,
      message: `${action === 'checkin' ? 'Check-in' : 'Check-out'} marked successfully!`,
      type: action,
    }
  } catch (error) {
    console.error('Error marking attendance:', error)
    throw error
  }
}

/**
 * Get attendance records for a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of records to fetch
 * @returns {Promise<Array>} - Array of attendance records
 */
export const getUserAttendance = async (userId, limitCount = 30) => {
  try {
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(attendanceQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching user attendance:', error)
    throw error
  }
}

/**
 * Get all attendance records (for managers)
 * @param {Object} filters - Filter options (date, userId, department)
 * @returns {Promise<Array>} - Array of attendance records
 */
export const getAllAttendance = async (filters = {}) => {
  try {
    let attendanceQuery = query(collection(db, 'attendance_records'), orderBy('timestamp', 'desc'))

    // Apply date filter if provided
    if (filters.startDate && filters.endDate) {
      attendanceQuery = query(
        collection(db, 'attendance_records'),
        where('timestamp', '>=', filters.startDate),
        where('timestamp', '<=', filters.endDate),
        orderBy('timestamp', 'desc')
      )
    }

    const snapshot = await getDocs(attendanceQuery)
    let records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Apply user filter if provided
    if (filters.userId) {
      records = records.filter((record) => record.userId === filters.userId)
    }

    return records
  } catch (error) {
    console.error('Error fetching all attendance:', error)
    throw error
  }
}



