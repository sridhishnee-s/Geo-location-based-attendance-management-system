import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

/**
 * Calculate attendance streak
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Streak information
 */
export const calculateStreak = async (userId) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get last 30 days of attendance
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)
    
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc')
    )
    
    const snapshot = await getDocs(attendanceQuery)
    const records = snapshot.docs.map((doc) => {
      const data = doc.data()
      const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp)
      return {
        date: timestamp.toISOString().split('T')[0],
      }
    })
    
    // Calculate current streak
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    const uniqueDates = [...new Set(records.map((r) => r.date))].sort().reverse()
    
    let checkDate = new Date(today)
    for (let i = 0; i < 30; i++) {
      const dateKey = checkDate.toISOString().split('T')[0]
      const hasAttendance = uniqueDates.includes(dateKey)
      
      if (hasAttendance) {
        tempStreak++
        if (i === 0) {
          currentStreak = tempStreak
        }
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        if (i === 0) {
          // Check yesterday
          const yesterday = new Date(checkDate)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayKey = yesterday.toISOString().split('T')[0]
          if (uniqueDates.includes(yesterdayKey)) {
            // Continue from yesterday
            tempStreak = 1
            currentStreak = 1
          } else {
            tempStreak = 0
            currentStreak = 0
          }
        } else {
          tempStreak = 0
        }
      }
      
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    return {
      currentStreak,
      longestStreak,
      totalDays: uniqueDates.length,
    }
  } catch (error) {
    console.error('Error calculating streak:', error)
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
    }
  }
}

/**
 * Calculate attendance score
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Score information
 */
export const calculateScore = async (userId) => {
  try {
    const streak = await calculateStreak(userId)
    
    // Get last 30 days stats
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
    )
    
    const snapshot = await getDocs(attendanceQuery)
    const records = snapshot.docs.map((doc) => doc.data())
    
    // Calculate score components
    let score = 0
    const breakdown = {
      baseAttendance: 0,
      streakBonus: 0,
      punctualityBonus: 0,
      consistencyBonus: 0,
    }
    
    // Base attendance (1 point per day)
    const uniqueDates = new Set(records.map((r) => {
      const timestamp = r.timestamp?.toDate?.() || new Date(r.timestamp)
      return timestamp.toISOString().split('T')[0]
    }))
    breakdown.baseAttendance = uniqueDates.size * 10
    score += breakdown.baseAttendance
    
    // Streak bonus
    breakdown.streakBonus = streak.currentStreak * 5
    score += breakdown.streakBonus
    
    // Punctuality (on-time check-ins)
    const onTimeCheckIns = records.filter((r) => {
      if (r.type !== 'checkin') return false
      const timestamp = r.timestamp?.toDate?.() || new Date(r.timestamp)
      const hour = timestamp.getHours()
      const minute = timestamp.getMinutes()
      return hour < 9 || (hour === 9 && minute <= 30)
    }).length
    breakdown.punctualityBonus = onTimeCheckIns * 2
    score += breakdown.punctualityBonus
    
    // Consistency (attendance rate)
    const attendanceRate = (uniqueDates.size / 30) * 100
    if (attendanceRate >= 95) {
      breakdown.consistencyBonus = 50
    } else if (attendanceRate >= 90) {
      breakdown.consistencyBonus = 30
    } else if (attendanceRate >= 80) {
      breakdown.consistencyBonus = 10
    }
    score += breakdown.consistencyBonus
    
    // Get level based on score
    const level = Math.floor(score / 100) + 1
    const levelProgress = score % 100
    
    return {
      totalScore: score,
      level,
      levelProgress,
      breakdown,
      streak,
    }
  } catch (error) {
    console.error('Error calculating score:', error)
    return {
      totalScore: 0,
      level: 1,
      levelProgress: 0,
      breakdown: {},
      streak: { currentStreak: 0, longestStreak: 0 },
    }
  }
}

/**
 * Update user gamification data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated gamification data
 */
export const updateGamificationData = async (userId) => {
  try {
    const scoreData = await calculateScore(userId)
    
    const gamificationRef = doc(db, 'gamification', userId)
    await setDoc(gamificationRef, {
      userId,
      ...scoreData,
      lastUpdated: new Date(),
    }, { merge: true })
    
    return scoreData
  } catch (error) {
    console.error('Error updating gamification data:', error)
    throw error
  }
}

/**
 * Get leaderboard
 * @param {number} limit - Number of top users
 * @returns {Promise<Array>} - Leaderboard entries
 */
export const getLeaderboard = async (limitCount = 10) => {
  try {
    // This would require a different approach in production
    // For now, we'll get all gamification data and sort
    const snapshot = await getDocs(collection(db, 'gamification'))
    const entries = snapshot.docs.map((doc) => ({
      userId: doc.id,
      ...doc.data(),
    }))
    
    return entries
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, limitCount)
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return []
  }
}

