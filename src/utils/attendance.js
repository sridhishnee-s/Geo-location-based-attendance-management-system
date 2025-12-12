import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { checkGeoFence } from './geofence'

/**
 * Mark attendance for a user
 * @param {string} userId - User ID
 * @param {Object} location - Location object with latitude, longitude, timestamp
 * @returns {Promise<Object>} - Success status and message
 */
export const markAttendance = async (userId, location) => {
  try {
    // Check if user has already marked attendance today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('userId', '==', userId),
      where('timestamp', '>=', today),
      where('timestamp', '<', tomorrow),
      orderBy('timestamp', 'desc'),
      limit(1)
    )

    const existingRecords = await getDocs(attendanceQuery)
    if (!existingRecords.empty) {
      return {
        success: false,
        message: 'You have already marked attendance today',
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
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null,
      timestamp: new Date(),
      status: 'present',
      validated: geoFenceCheck.inside,
    }

    await addDoc(collection(db, 'attendance_records'), attendanceData)

    return {
      success: true,
      message: 'Attendance marked successfully!',
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


