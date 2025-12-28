import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, updateDoc, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getUserAttendance } from './attendance'
import { getUserLeaveRequests, checkLeaveStatus } from './leaveManagement'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, differenceInHours, parseISO } from 'date-fns'

/**
 * Get user salary configuration
 */
export const getUserSalaryConfig = async (userId) => {
  try {
    const salaryDoc = await getDoc(doc(db, 'salary_configs', userId))
    if (salaryDoc.exists()) {
      return salaryDoc.data()
    }
    return null
  } catch (error) {
    console.error('Error fetching salary config:', error)
    return null
  }
}

/**
 * Set user salary configuration
 */
export const setUserSalaryConfig = async (userId, config) => {
  try {
    await setDoc(doc(db, 'salary_configs', userId), {
      userId,
      ...config,
      updatedAt: new Date(),
    })
    return { success: true }
  } catch (error) {
    console.error('Error setting salary config:', error)
    throw error
  }
}

/**
 * Calculate working hours for a day
 */
export const calculateDailyWorkingHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return 0
  
  const checkIn = checkInTime?.toDate?.() || new Date(checkInTime)
  const checkOut = checkOutTime?.toDate?.() || new Date(checkOutTime)
  
  const hours = differenceInHours(checkOut, checkIn)
  return Math.max(0, hours)
}

/**
 * Calculate overtime hours
 */
export const calculateOvertimeHours = (workingHours, standardHours = 8) => {
  return Math.max(0, workingHours - standardHours)
}

/**
 * Get attendance records for a month
 */
export const getMonthlyAttendance = async (userId, year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    const attendanceQuery = query(
      collection(db, 'attendance_records'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'asc')
    )
    
    const snapshot = await getDocs(attendanceQuery)
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    
    // Group by date and pair check-in/check-out
    const dailyRecords = {}
    records.forEach(record => {
      const date = new Date(record.timestamp?.toDate?.() || record.timestamp)
      const dateKey = format(date, 'yyyy-MM-dd')
      
      if (!dailyRecords[dateKey]) {
        dailyRecords[dateKey] = {
          date: dateKey,
          checkIn: null,
          checkOut: null,
          workingHours: 0,
          overtimeHours: 0,
        }
      }
      
      if (record.type === 'checkin') {
        dailyRecords[dateKey].checkIn = record.timestamp
      } else if (record.type === 'checkout') {
        dailyRecords[dateKey].checkOut = record.timestamp
      }
    })
    
    // Calculate working hours for each day
    Object.values(dailyRecords).forEach(day => {
      if (day.checkIn && day.checkOut) {
        day.workingHours = calculateDailyWorkingHours(day.checkIn, day.checkOut)
        day.overtimeHours = calculateOvertimeHours(day.workingHours)
      }
    })
    
    return Object.values(dailyRecords)
  } catch (error) {
    console.error('Error fetching monthly attendance:', error)
    return []
  }
}

/**
 * Calculate salary for a month
 */
export const calculateMonthlySalary = async (userId, year, month) => {
  try {
    // Get salary configuration
    const salaryConfig = await getUserSalaryConfig(userId)
    if (!salaryConfig) {
      throw new Error('Salary configuration not found')
    }
    
    const {
      baseSalary = 0,
      standardWorkingHours = 8,
      workingDaysPerMonth = 22,
      hourlyRate = 0,
      overtimeRate = 0, // Multiplier for overtime (e.g., 1.5 for 1.5x)
      leaveDeductionRate = 1, // Full day deduction per leave
      halfDayLeaveDeduction = 0.5,
    } = salaryConfig
    
    // Get monthly attendance
    const dailyAttendance = await getMonthlyAttendance(userId, year, month)
    
    // Get leave requests for the month
    const leaveRequests = await getUserLeaveRequests(userId)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    
    const monthlyLeaves = leaveRequests.filter(leave => {
      const leaveStart = leave.startDate?.toDate?.() || new Date(leave.startDate)
      const leaveEnd = leave.endDate?.toDate?.() || new Date(leave.endDate)
      return leave.status === 'approved' &&
             ((leaveStart >= startDate && leaveStart <= endDate) ||
              (leaveEnd >= startDate && leaveEnd <= endDate) ||
              (leaveStart <= startDate && leaveEnd >= endDate))
    })
    
    // Calculate leave days
    let totalLeaveDays = 0
    monthlyLeaves.forEach(leave => {
      const leaveStart = leave.startDate?.toDate?.() || new Date(leave.startDate)
      const leaveEnd = leave.endDate?.toDate?.() || new Date(leave.endDate)
      
      // Count working days in leave period
      const leaveDays = eachDayOfInterval({
        start: leaveStart > startDate ? leaveStart : startDate,
        end: leaveEnd < endDate ? leaveEnd : endDate,
      }).filter(day => !isWeekend(day)).length
      
      totalLeaveDays += leaveDays
    })
    
    // Calculate present days
    const presentDays = dailyAttendance.filter(day => day.checkIn && day.checkOut).length
    
    // Calculate total working hours
    const totalWorkingHours = dailyAttendance.reduce((sum, day) => sum + day.workingHours, 0)
    
    // Calculate total overtime hours
    const totalOvertimeHours = dailyAttendance.reduce((sum, day) => sum + day.overtimeHours, 0)
    
    // Calculate standard hours worked
    const standardHoursWorked = presentDays * standardWorkingHours
    
    // Calculate salary components
    let grossSalary = baseSalary
    
    // Overtime bonus
    const overtimeBonus = totalOvertimeHours * hourlyRate * (overtimeRate || 1.5)
    
    // Leave deductions
    const leaveDeduction = (totalLeaveDays * baseSalary) / workingDaysPerMonth * leaveDeductionRate
    
    // Net salary calculation
    const netSalary = grossSalary - leaveDeduction + overtimeBonus
    
    // Calculate per day salary
    const perDaySalary = baseSalary / workingDaysPerMonth
    
    // Calculate actual days worked value
    const workedDaysValue = presentDays * perDaySalary
    
    // Alternative calculation: based on hours worked
    const hoursBasedSalary = totalWorkingHours * hourlyRate
    const finalSalary = Math.max(netSalary, hoursBasedSalary)
    
    return {
      baseSalary,
      presentDays,
      totalLeaveDays,
      totalWorkingHours,
      standardHoursWorked,
      totalOvertimeHours,
      overtimeBonus,
      leaveDeduction,
      grossSalary,
      netSalary: finalSalary,
      perDaySalary,
      workedDaysValue,
      hoursBasedSalary,
      breakdown: {
        base: baseSalary,
        overtime: overtimeBonus,
        leaveDeduction: -leaveDeduction,
        net: finalSalary,
      },
    }
  } catch (error) {
    console.error('Error calculating monthly salary:', error)
    throw error
  }
}

/**
 * Generate salary slip
 */
export const generateSalarySlip = async (userId, year, month) => {
  try {
    const salaryCalculation = await calculateMonthlySalary(userId, year, month)
    const salaryConfig = await getUserSalaryConfig(userId)
    
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId))
    const userData = userDoc.exists() ? userDoc.data() : {}
    
    const salarySlip = {
      userId,
      employeeName: userData.name || userData.email,
      employeeId: userId,
      month,
      year,
      generatedAt: new Date(),
      ...salaryCalculation,
      config: salaryConfig,
    }
    
    // Save salary slip
    const slipRef = await addDoc(collection(db, 'salary_slips'), salarySlip)
    
    return {
      id: slipRef.id,
      ...salarySlip,
    }
  } catch (error) {
    console.error('Error generating salary slip:', error)
    throw error
  }
}

/**
 * Get salary slips for a user
 */
export const getUserSalarySlips = async (userId, limit = 12) => {
  try {
    const slipsQuery = query(
      collection(db, 'salary_slips'),
      where('userId', '==', userId),
      orderBy('generatedAt', 'desc'),
      limit(limit)
    )
    
    const snapshot = await getDocs(slipsQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching salary slips:', error)
    return []
  }
}

/**
 * Get all salary slips (for managers)
 */
export const getAllSalarySlips = async (filters = {}) => {
  try {
    let slipsQuery = query(
      collection(db, 'salary_slips'),
      orderBy('generatedAt', 'desc')
    )
    
    if (filters.userId) {
      slipsQuery = query(
        collection(db, 'salary_slips'),
        where('userId', '==', filters.userId),
        orderBy('generatedAt', 'desc')
      )
    }
    
    if (filters.year && filters.month) {
      slipsQuery = query(
        collection(db, 'salary_slips'),
        where('year', '==', filters.year),
        where('month', '==', filters.month),
        orderBy('generatedAt', 'desc')
      )
    }
    
    const snapshot = await getDocs(slipsQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching all salary slips:', error)
    return []
  }
}

