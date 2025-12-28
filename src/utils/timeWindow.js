import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Get office time window settings
 * @returns {Promise<Object>} - Time window settings
 */
export const getTimeWindowSettings = async () => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'timeWindow'))
    if (settingsDoc.exists()) {
      return settingsDoc.data()
    }
    // Default time window: Check-in 9 AM to 9:30 AM, Check-out 5 PM to 6 PM
    return {
      checkInStart: '09:00',
      checkInEnd: '09:30',
      checkOutStart: '17:00',
      checkOutEnd: '18:00',
      enabled: true,
    }
  } catch (error) {
    console.error('Error fetching time window settings:', error)
    return {
      checkInStart: '09:00',
      checkInEnd: '09:30',
      checkOutStart: '17:00',
      checkOutEnd: '18:00',
      enabled: false,
    }
  }
}

/**
 * Check if current time is within check-in window
 * @param {string} checkInStart - Start time (HH:mm)
 * @param {string} checkInEnd - End time (HH:mm)
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validateCheckInTime = (checkInStart, checkInEnd) => {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  const [startHour, startMin] = checkInStart.split(':').map(Number)
  const [endHour, endMin] = checkInEnd.split(':').map(Number)
  
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
  
  if (currentTimeMinutes >= startTime && currentTimeMinutes <= endTime) {
    return { valid: true, message: 'Check-in time is valid' }
  }
  
  if (currentTimeMinutes < startTime) {
    return { valid: false, message: `Check-in window starts at ${checkInStart}` }
  }
  
  return { valid: false, message: `Check-in window closed. It was open from ${checkInStart} to ${checkInEnd}` }
}

/**
 * Check if current time is within check-out window
 * @param {string} checkOutStart - Start time (HH:mm)
 * @param {string} checkOutEnd - End time (HH:mm)
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validateCheckOutTime = (checkOutStart, checkOutEnd) => {
  const now = new Date()
  const [startHour, startMin] = checkOutStart.split(':').map(Number)
  const [endHour, endMin] = checkOutEnd.split(':').map(Number)
  
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
  
  if (currentTimeMinutes >= startTime && currentTimeMinutes <= endTime) {
    return { valid: true, message: 'Check-out time is valid' }
  }
  
  if (currentTimeMinutes < startTime) {
    return { valid: false, message: `Check-out window starts at ${checkOutStart}` }
  }
  
  return { valid: false, message: `Check-out window closed. It was open from ${checkOutStart} to ${checkOutEnd}` }
}

/**
 * Check if it's a check-in or check-out action
 * @param {string} userId - User ID
 * @param {Date} date - Date to check
 * @returns {Promise<string>} - 'checkin' or 'checkout'
 */
export const getAttendanceAction = async (userId, date = new Date()) => {
  try {
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore')
    const today = new Date(date)
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
    
    const snapshot = await getDocs(attendanceQuery)
    if (snapshot.empty) {
      return 'checkin'
    }
    
    const lastRecord = snapshot.docs[0].data()
    return lastRecord.type === 'checkin' ? 'checkout' : 'checkin'
  } catch (error) {
    console.error('Error determining attendance action:', error)
    return 'checkin'
  }
}

