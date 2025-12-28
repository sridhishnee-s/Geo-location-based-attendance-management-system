import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, updateDoc, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { logAuditTrail, AuditActions } from './auditTrail'

/**
 * Get client IP address
 */
export const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch (error) {
    return 'unknown'
  }
}

/**
 * Track user session
 */
export const trackSession = async (userId, ipAddress) => {
  try {
    const sessionData = {
      userId,
      ipAddress,
      startTime: new Date(),
      lastActivity: new Date(),
      userAgent: navigator.userAgent,
      sessionId: `${userId}_${Date.now()}`,
    }
    
    await addDoc(collection(db, 'sessions'), sessionData)
    return sessionData.sessionId
  } catch (error) {
    console.error('Error tracking session:', error)
    return null
  }
}

/**
 * Update session activity
 */
export const updateSessionActivity = async (sessionId) => {
  try {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('sessionId', '==', sessionId),
      orderBy('lastActivity', 'desc'),
      limit(1)
    )
    
    const snapshot = await getDocs(sessionsQuery)
    if (!snapshot.empty) {
      const sessionDoc = snapshot.docs[0]
      await updateDoc(sessionDoc.ref, {
        lastActivity: new Date(),
      })
    }
  } catch (error) {
    console.error('Error updating session activity:', error)
  }
}

/**
 * Check for multiple logins from same network
 */
export const checkMultipleLogins = async (userId, ipAddress) => {
  try {
    // Check for other users from same IP in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('ipAddress', '==', ipAddress),
      where('startTime', '>=', oneHourAgo),
      orderBy('startTime', 'desc')
    )
    
    const snapshot = await getDocs(sessionsQuery)
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    
    // Group by userId
    const userSessions = {}
    sessions.forEach(session => {
      if (!userSessions[session.userId]) {
        userSessions[session.userId] = []
      }
      userSessions[session.userId].push(session)
    })
    
    // Check if multiple users from same IP
    const uniqueUsers = Object.keys(userSessions)
    if (uniqueUsers.length > 1) {
      return {
        suspicious: true,
        message: `Multiple users (${uniqueUsers.length}) logged in from same IP address`,
        users: uniqueUsers,
        ipAddress,
      }
    }
    
    // Check if same user has multiple active sessions
    if (userSessions[userId] && userSessions[userId].length > 1) {
      return {
        suspicious: true,
        message: `User has ${userSessions[userId].length} active sessions from same IP`,
        sessions: userSessions[userId].length,
        ipAddress,
      }
    }
    
    return { suspicious: false }
  } catch (error) {
    console.error('Error checking multiple logins:', error)
    return { suspicious: false }
  }
}

/**
 * Check for rapid attendance actions
 */
export const checkRapidActions = async (userId, actionType = 'attendance_marked') => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const auditQuery = query(
      collection(db, 'audit_trail'),
      where('userId', '==', userId),
      where('action', '==', actionType),
      where('timestamp', '>=', fiveMinutesAgo),
      orderBy('timestamp', 'desc')
    )
    
    const snapshot = await getDocs(auditQuery)
    const actions = snapshot.docs.map(doc => doc.data())
    
    if (actions.length > 3) {
      // More than 3 actions in 5 minutes is suspicious
      return {
        suspicious: true,
        message: `Rapid ${actionType} detected: ${actions.length} actions in 5 minutes`,
        count: actions.length,
        timeWindow: '5 minutes',
      }
    }
    
    // Check time between actions
    if (actions.length >= 2) {
      const timeDiffs = []
      for (let i = 0; i < actions.length - 1; i++) {
        const time1 = actions[i].timestamp?.toDate?.() || new Date(actions[i].timestamp)
        const time2 = actions[i + 1].timestamp?.toDate?.() || new Date(actions[i + 1].timestamp)
        timeDiffs.push(time1 - time2)
      }
      
      const minTimeDiff = Math.min(...timeDiffs)
      if (minTimeDiff < 10 * 1000) {
        // Less than 10 seconds between actions
        return {
          suspicious: true,
          message: `Very rapid actions detected: ${Math.round(minTimeDiff / 1000)}s between actions`,
          minTimeDiff,
        }
      }
    }
    
    return { suspicious: false }
  } catch (error) {
    console.error('Error checking rapid actions:', error)
    return { suspicious: false }
  }
}

/**
 * Monitor and flag suspicious patterns
 */
export const monitorSuspiciousActivity = async (userId, actionType) => {
  try {
    const ipAddress = await getClientIP()
    
    // Check multiple logins
    const multipleLogins = await checkMultipleLogins(userId, ipAddress)
    if (multipleLogins.suspicious) {
      await createAdminAlert({
        type: 'multiple_logins',
        userId,
        severity: 'high',
        message: multipleLogins.message,
        details: multipleLogins,
      })
    }
    
    // Check rapid actions
    const rapidActions = await checkRapidActions(userId, actionType)
    if (rapidActions.suspicious) {
      await createAdminAlert({
        type: 'rapid_actions',
        userId,
        severity: 'medium',
        message: rapidActions.message,
        details: rapidActions,
      })
    }
    
    return {
      flagged: multipleLogins.suspicious || rapidActions.suspicious,
      alerts: [
        multipleLogins.suspicious && multipleLogins,
        rapidActions.suspicious && rapidActions,
      ].filter(Boolean),
    }
  } catch (error) {
    console.error('Error monitoring suspicious activity:', error)
    return { flagged: false, alerts: [] }
  }
}

/**
 * Create admin alert
 */
export const createAdminAlert = async (alertData) => {
  try {
    const alert = {
      ...alertData,
      timestamp: new Date(),
      status: 'pending',
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
    }
    
    await addDoc(collection(db, 'admin_alerts'), alert)
    
    // Also log in audit trail
    await logAuditTrail(
      'suspicious_activity_detected',
      alertData.userId,
      null,
      alertData.details,
      alertData.message
    )
  } catch (error) {
    console.error('Error creating admin alert:', error)
  }
}

/**
 * Get admin alerts
 */
export const getAdminAlerts = async (filters = {}) => {
  try {
    let alertsQuery = query(
      collection(db, 'admin_alerts'),
      orderBy('timestamp', 'desc')
    )
    
    if (filters.status) {
      alertsQuery = query(
        collection(db, 'admin_alerts'),
        where('status', '==', filters.status),
        orderBy('timestamp', 'desc')
      )
    }
    
    if (filters.severity) {
      alertsQuery = query(
        collection(db, 'admin_alerts'),
        where('severity', '==', filters.severity),
        orderBy('timestamp', 'desc')
      )
    }
    
    if (filters.limit) {
      alertsQuery = query(alertsQuery, limit(filters.limit))
    } else {
      alertsQuery = query(alertsQuery, limit(50))
    }
    
    const snapshot = await getDocs(alertsQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching admin alerts:', error)
    return []
  }
}

/**
 * Acknowledge admin alert
 */
export const acknowledgeAlert = async (alertId, managerId) => {
  try {
    const alertRef = doc(db, 'admin_alerts', alertId)
    await updateDoc(alertRef, {
      acknowledged: true,
      acknowledgedBy: managerId,
      acknowledgedAt: new Date(),
      status: 'acknowledged',
    })
  } catch (error) {
    console.error('Error acknowledging alert:', error)
  }
}

