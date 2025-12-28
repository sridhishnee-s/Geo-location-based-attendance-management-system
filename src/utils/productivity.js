import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Track active time (time spent on page)
 * @param {string} userId - User ID
 * @param {Date} checkInTime - Check-in timestamp
 * @returns {Function} - Cleanup function to stop tracking
 */
export const startActiveTimeTracking = (userId, checkInTime) => {
  let lastActiveTime = Date.now()
  let totalActiveTime = 0
  let isTracking = true
  
  // Track mouse movement, clicks, keyboard activity
  const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart']
  const handleActivity = () => {
    if (isTracking) {
      const now = Date.now()
      const timeDiff = now - lastActiveTime
      if (timeDiff < 5 * 60 * 1000) { // Only count if less than 5 minutes inactive
        totalActiveTime += timeDiff
      }
      lastActiveTime = now
    }
  }
  
  activityEvents.forEach((event) => {
    window.addEventListener(event, handleActivity, { passive: true })
  })
  
  // Update active time every minute
  const intervalId = setInterval(async () => {
    if (isTracking) {
      const now = Date.now()
      const timeDiff = now - lastActiveTime
      if (timeDiff < 5 * 60 * 1000) {
        totalActiveTime += timeDiff
      }
      lastActiveTime = now
      
      try {
        const today = new Date(checkInTime)
        today.setHours(0, 0, 0, 0)
        const activityDocId = `${userId}_${today.toISOString().split('T')[0]}`
        
        const activityRef = doc(db, 'activity_tracking', activityDocId)
        const activityDoc = await getDoc(activityRef)
        
        if (activityDoc.exists()) {
          await updateDoc(activityRef, {
            activeTime: totalActiveTime,
            lastUpdate: new Date(),
          })
        } else {
          await setDoc(activityRef, {
            userId,
            date: today,
            checkInTime,
            activeTime: totalActiveTime,
            lastUpdate: new Date(),
            tasksCompleted: 0,
          })
        }
      } catch (error) {
        console.error('Error updating active time:', error)
      }
    }
  }, 60000) // Update every minute
  
  // Cleanup function
  return () => {
    isTracking = false
    clearInterval(intervalId)
    activityEvents.forEach((event) => {
      window.removeEventListener(event, handleActivity)
    })
    
    // Final update
    const now = Date.now()
    const timeDiff = now - lastActiveTime
    if (timeDiff < 5 * 60 * 1000) {
      totalActiveTime += timeDiff
    }
  }
}

/**
 * Get activity tracking data for a date
 * @param {string} userId - User ID
 * @param {Date} date - Date to check
 * @returns {Promise<Object>} - Activity data
 */
export const getActivityData = async (userId, date) => {
  try {
    const today = new Date(date)
    today.setHours(0, 0, 0, 0)
    const activityDocId = `${userId}_${today.toISOString().split('T')[0]}`
    
    const activityDoc = await getDoc(doc(db, 'activity_tracking', activityDocId))
    if (activityDoc.exists()) {
      return activityDoc.data()
    }
    return null
  } catch (error) {
    console.error('Error getting activity data:', error)
    return null
  }
}

/**
 * Mark task as completed
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @param {Date} date - Date
 * @returns {Promise<Object>} - Success status
 */
export const markTaskCompleted = async (userId, taskId, date = new Date()) => {
  try {
    const today = new Date(date)
    today.setHours(0, 0, 0, 0)
    const activityDocId = `${userId}_${today.toISOString().split('T')[0]}`
    
    const activityRef = doc(db, 'activity_tracking', activityDocId)
    const activityDoc = await getDoc(activityRef)
    
    if (activityDoc.exists()) {
      const currentData = activityDoc.data()
      await updateDoc(activityRef, {
        tasksCompleted: (currentData.tasksCompleted || 0) + 1,
        lastUpdate: new Date(),
      })
    } else {
      await setDoc(activityRef, {
        userId,
        date: today,
        tasksCompleted: 1,
        activeTime: 0,
        lastUpdate: new Date(),
      })
    }
    
    return { success: true, message: 'Task marked as completed' }
  } catch (error) {
    console.error('Error marking task completed:', error)
    throw error
  }
}

/**
 * Validate productivity requirements
 * @param {string} userId - User ID
 * @param {Date} date - Date to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateProductivity = async (userId, date) => {
  try {
    const activityData = await getActivityData(userId, date)
    
    if (!activityData) {
      return {
        valid: false,
        message: 'No activity data found',
        activeTime: 0,
        tasksCompleted: 0,
      }
    }
    
    // Get productivity settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'productivity'))
    const settings = settingsDoc.exists() ? settingsDoc.data() : {
      minActiveTime: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
      minTasksCompleted: 3,
      enabled: true,
    }
    
    if (!settings.enabled) {
      return { valid: true, message: 'Productivity validation disabled' }
    }
    
    const activeTimeHours = activityData.activeTime / (60 * 60 * 1000)
    const tasksCompleted = activityData.tasksCompleted || 0
    
    const meetsActiveTime = activityData.activeTime >= settings.minActiveTime
    const meetsTaskRequirement = tasksCompleted >= settings.minTasksCompleted
    
    const valid = meetsActiveTime || meetsTaskRequirement
    
    return {
      valid,
      message: valid
        ? 'Productivity requirements met'
        : `Minimum requirements not met. Active time: ${activeTimeHours.toFixed(1)}h (required: ${settings.minActiveTime / (60 * 60 * 1000)}h), Tasks: ${tasksCompleted} (required: ${settings.minTasksCompleted})`,
      activeTime: activityData.activeTime,
      activeTimeHours: activeTimeHours.toFixed(1),
      tasksCompleted,
      requirements: {
        minActiveTime: settings.minActiveTime,
        minTasksCompleted: settings.minTasksCompleted,
      },
    }
  } catch (error) {
    console.error('Error validating productivity:', error)
    return { valid: true, message: 'Productivity validation error' }
  }
}

