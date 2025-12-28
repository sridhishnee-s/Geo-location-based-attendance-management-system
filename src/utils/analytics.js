import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Calculate attendance statistics for a user
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Attendance statistics
 */
export const calculateAttendanceStats = async (userId, startDate, endDate) => {
  try {
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'asc')
    )
    
    const snapshot = await getDocs(attendanceQuery)
    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const presentDays = new Set()
    const lateCount = 0
    const earlyLeaveCount = 0
    
    records.forEach((record) => {
      const date = new Date(record.timestamp?.toDate?.() || record.timestamp)
      const dateKey = date.toISOString().split('T')[0]
      presentDays.add(dateKey)
      
      // Check for late check-in (after 9:30 AM)
      if (record.type === 'checkin') {
        const checkInHour = date.getHours()
        const checkInMinute = date.getMinutes()
        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
          lateCount++
        }
      }
    })
    
    const attendanceRate = (presentDays.size / totalDays) * 100
    const absentDays = totalDays - presentDays.size
    
    return {
      totalDays,
      presentDays: presentDays.size,
      absentDays,
      attendanceRate: attendanceRate.toFixed(2),
      lateCount,
      earlyLeaveCount,
      records: records.length,
    }
  } catch (error) {
    console.error('Error calculating attendance stats:', error)
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      attendanceRate: 0,
      lateCount: 0,
      earlyLeaveCount: 0,
      records: 0,
    }
  }
}

/**
 * Predict absenteeism risk for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Risk prediction
 */
export const predictAbsenteeismRisk = async (userId) => {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90) // Last 90 days
    
    const stats = await calculateAttendanceStats(userId, startDate, endDate)
    
    // Calculate risk factors
    const attendanceRate = parseFloat(stats.attendanceRate)
    const lateFrequency = stats.lateCount / Math.max(stats.presentDays, 1)
    
    let riskScore = 0
    let riskLevel = 'low'
    const factors = []
    
    // Low attendance rate
    if (attendanceRate < 80) {
      riskScore += 30
      factors.push('Low attendance rate')
    } else if (attendanceRate < 90) {
      riskScore += 15
      factors.push('Moderate attendance rate')
    }
    
    // Frequent late arrivals
    if (lateFrequency > 0.3) {
      riskScore += 25
      factors.push('Frequent late arrivals')
    } else if (lateFrequency > 0.15) {
      riskScore += 10
      factors.push('Occasional late arrivals')
    }
    
    // Recent pattern (last 30 days)
    const recentEndDate = new Date()
    const recentStartDate = new Date()
    recentStartDate.setDate(recentStartDate.getDate() - 30)
    const recentStats = await calculateAttendanceStats(userId, recentStartDate, recentEndDate)
    
    if (recentStats.attendanceRate < attendanceRate - 10) {
      riskScore += 20
      factors.push('Declining attendance trend')
    }
    
    // Determine risk level
    if (riskScore >= 50) {
      riskLevel = 'high'
    } else if (riskScore >= 25) {
      riskLevel = 'medium'
    }
    
    return {
      riskScore,
      riskLevel,
      factors,
      stats,
      recommendation: riskLevel === 'high' 
        ? 'Immediate attention required. Consider intervention.'
        : riskLevel === 'medium'
        ? 'Monitor closely. Provide support if needed.'
        : 'Attendance pattern is healthy.',
    }
  } catch (error) {
    console.error('Error predicting absenteeism risk:', error)
    return {
      riskScore: 0,
      riskLevel: 'low',
      factors: [],
      recommendation: 'Unable to calculate risk',
    }
  }
}

/**
 * Get monthly attendance report
 * @param {string} userId - User ID (optional, for all users if null)
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} - Monthly report
 */
export const getMonthlyReport = async (userId, year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    let attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'asc')
    )
    
    const snapshot = await getDocs(attendanceQuery)
    let records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    
    if (userId) {
      records = records.filter((record) => record.userId === userId)
    }
    
    // Group by date
    const dailyStats = {}
    records.forEach((record) => {
      const date = new Date(record.timestamp?.toDate?.() || record.timestamp)
      const dateKey = date.toISOString().split('T')[0]
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          checkIns: 0,
          checkOuts: 0,
          users: new Set(),
        }
      }
      
      if (record.type === 'checkin') {
        dailyStats[dateKey].checkIns++
      } else if (record.type === 'checkout') {
        dailyStats[dateKey].checkOuts++
      }
      
      dailyStats[dateKey].users.add(record.userId)
    })
    
    const totalDays = new Date(year, month, 0).getDate()
    const workingDays = totalDays // Can be enhanced to exclude weekends/holidays
    
    return {
      year,
      month,
      totalDays,
      workingDays,
      totalRecords: records.length,
      uniqueUsers: userId ? 1 : new Set(records.map((r) => r.userId)).size,
      dailyStats: Object.values(dailyStats),
    }
  } catch (error) {
    console.error('Error generating monthly report:', error)
    throw error
  }
}

