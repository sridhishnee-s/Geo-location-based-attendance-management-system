import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { logAuditTrail, AuditActions } from './auditTrail'

/**
 * Apply for leave
 * @param {string} userId - User ID
 * @param {Date} startDate - Leave start date
 * @param {Date} endDate - Leave end date
 * @param {string} type - Leave type (sick, vacation, personal, etc.)
 * @param {string} reason - Leave reason
 * @returns {Promise<Object>} - Success status
 */
export const applyForLeave = async (userId, startDate, endDate, type, reason) => {
  try {
    const leaveData = {
      userId,
      startDate,
      endDate,
      type,
      reason,
      status: 'pending',
      appliedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
    }
    
    const leaveRef = await addDoc(collection(db, 'leave_requests'), leaveData)
    
    await logAuditTrail(
      AuditActions.LEAVE_APPLIED || 'leave_applied',
      userId,
      null,
      { leaveId: leaveRef.id, startDate, endDate, type },
      reason
    )
    
    return {
      success: true,
      message: 'Leave application submitted successfully',
      leaveId: leaveRef.id,
    }
  } catch (error) {
    console.error('Error applying for leave:', error)
    throw error
  }
}

/**
 * Get leave requests for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Leave requests
 */
export const getUserLeaveRequests = async (userId) => {
  try {
    const leaveQuery = query(
      collection(db, 'leave_requests'),
      where('userId', '==', userId),
      orderBy('appliedAt', 'desc')
    )
    
    const snapshot = await getDocs(leaveQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return []
  }
}

/**
 * Get all leave requests (for managers)
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} - Leave requests
 */
export const getAllLeaveRequests = async (status = null) => {
  try {
    let leaveQuery = query(collection(db, 'leave_requests'), orderBy('appliedAt', 'desc'))
    
    if (status) {
      leaveQuery = query(
        collection(db, 'leave_requests'),
        where('status', '==', status),
        orderBy('appliedAt', 'desc')
      )
    }
    
    const snapshot = await getDocs(leaveQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching all leave requests:', error)
    return []
  }
}

/**
 * Approve or reject leave request
 * @param {string} leaveId - Leave request ID
 * @param {string} managerId - Manager ID
 * @param {string} action - 'approve' or 'reject'
 * @param {string} reason - Reason for approval/rejection
 * @returns {Promise<Object>} - Success status
 */
export const processLeaveRequest = async (leaveId, managerId, action, reason = '') => {
  try {
    const leaveDoc = await getDoc(doc(db, 'leave_requests', leaveId))
    if (!leaveDoc.exists()) {
      return { success: false, message: 'Leave request not found' }
    }
    
    const leaveData = leaveDoc.data()
    const status = action === 'approve' ? 'approved' : 'rejected'
    
    await updateDoc(doc(db, 'leave_requests', leaveId), {
      status,
      approvedBy: managerId,
      approvedAt: new Date(),
      approvalReason: reason,
    })
    
    await logAuditTrail(
      action === 'approve' ? AuditActions.LEAVE_APPROVED : AuditActions.LEAVE_REJECTED,
      managerId,
      leaveData.userId,
      { leaveId, status },
      reason
    )
    
    return {
      success: true,
      message: `Leave request ${status} successfully`,
    }
  } catch (error) {
    console.error('Error processing leave request:', error)
    throw error
  }
}

/**
 * Check if user is on leave for a date
 * @param {string} userId - User ID
 * @param {Date} date - Date to check
 * @returns {Promise<Object|null>} - Leave request if found
 */
export const checkLeaveStatus = async (userId, date) => {
  try {
    const leaveQuery = query(
      collection(db, 'leave_requests'),
      where('userId', '==', userId),
      where('status', '==', 'approved'),
    )
    
    const snapshot = await getDocs(leaveQuery)
    const leaves = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    for (const leave of leaves) {
      const startDate = new Date(leave.startDate.toDate?.() || leave.startDate)
      const endDate = new Date(leave.endDate.toDate?.() || leave.endDate)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      
      if (checkDate >= startDate && checkDate <= endDate) {
        return leave
      }
    }
    
    return null
  } catch (error) {
    console.error('Error checking leave status:', error)
    return null
  }
}

