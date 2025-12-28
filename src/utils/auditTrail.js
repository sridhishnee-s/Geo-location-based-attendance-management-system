import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Log an audit trail entry
 * @param {string} action - Action performed
 * @param {string} userId - User ID who performed the action
 * @param {string} targetUserId - Target user ID (if applicable)
 * @param {Object} details - Additional details
 * @param {string} reason - Reason for the action
 * @returns {Promise<void>}
 */
export const logAuditTrail = async (action, userId, targetUserId = null, details = {}, reason = '') => {
  try {
    await addDoc(collection(db, 'audit_trail'), {
      action,
      userId,
      targetUserId,
      timestamp: new Date(),
      details,
      reason,
      ipAddress: await getClientIP(),
      userAgent: navigator.userAgent,
    })
  } catch (error) {
    console.error('Error logging audit trail:', error)
  }
}

/**
 * Get client IP (simplified - in production, use a proper service)
 * @returns {Promise<string>}
 */
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch (error) {
    return 'unknown'
  }
}

/**
 * Get audit trail entries
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - Audit trail entries
 */
export const getAuditTrail = async (filters = {}) => {
  try {
    let auditQuery = query(collection(db, 'audit_trail'), orderBy('timestamp', 'desc'))
    
    if (filters.userId) {
      auditQuery = query(
        collection(db, 'audit_trail'),
        where('userId', '==', filters.userId),
        orderBy('timestamp', 'desc')
      )
    }
    
    if (filters.targetUserId) {
      auditQuery = query(
        collection(db, 'audit_trail'),
        where('targetUserId', '==', filters.targetUserId),
        orderBy('timestamp', 'desc')
      )
    }
    
    if (filters.action) {
      auditQuery = query(
        collection(db, 'audit_trail'),
        where('action', '==', filters.action),
        orderBy('timestamp', 'desc')
      )
    }
    
    if (filters.limit) {
      auditQuery = query(auditQuery, limit(filters.limit))
    } else {
      auditQuery = query(auditQuery, limit(100))
    }
    
    const snapshot = await getDocs(auditQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching audit trail:', error)
    return []
  }
}

/**
 * Common audit actions
 */
export const AuditActions = {
  ATTENDANCE_MARKED: 'attendance_marked',
  ATTENDANCE_MODIFIED: 'attendance_modified',
  ATTENDANCE_DELETED: 'attendance_deleted',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  SETTINGS_CHANGED: 'settings_changed',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  DEVICE_CHANGED: 'device_changed',
  VERIFICATION_FAILED: 'verification_failed',
}

