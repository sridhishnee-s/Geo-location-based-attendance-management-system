import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Generate random verification prompt
 * @returns {Object} - Verification prompt
 */
export const generateVerificationPrompt = () => {
  const prompts = [
    { question: 'What is 2 + 3?', answer: '5', type: 'math' },
    { question: 'What color is the sky?', answer: 'blue', type: 'general' },
    { question: 'What is 10 - 4?', answer: '6', type: 'math' },
    { question: 'How many days in a week?', answer: '7', type: 'general' },
    { question: 'What is 3 × 2?', answer: '6', type: 'math' },
    { question: 'What is the first letter of alphabet?', answer: 'a', type: 'general' },
  ]
  
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
  return {
    ...randomPrompt,
    id: Date.now().toString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  }
}

/**
 * Schedule random presence verification
 * @param {string} userId - User ID
 * @param {Date} checkInTime - Check-in timestamp
 * @returns {Promise<void>}
 */
export const schedulePresenceVerification = async (userId, checkInTime) => {
  try {
    // Schedule 2-3 random verifications during work hours
    const workStart = new Date(checkInTime)
    workStart.setHours(9, 0, 0, 0)
    
    const workEnd = new Date(checkInTime)
    workEnd.setHours(18, 0, 0, 0)
    
    const verifications = []
    const numVerifications = 2 + Math.floor(Math.random() * 2) // 2-3 verifications
    
    for (let i = 0; i < numVerifications; i++) {
      const randomTime = new Date(
        workStart.getTime() + Math.random() * (workEnd.getTime() - workStart.getTime())
      )
      
      const prompt = generateVerificationPrompt()
      
      const expiresAt = new Date(randomTime.getTime() + 30 * 1000) // 30 seconds to respond
      verifications.push({
        userId,
        scheduledTime: randomTime,
        prompt: prompt.question,
        expectedAnswer: prompt.answer.toLowerCase(),
        status: 'pending',
        checkInDate: checkInTime,
        createdAt: new Date(),
        expiresAt: expiresAt,
      })
    }
    
    // Save verifications
    for (const verification of verifications) {
      await addDoc(collection(db, 'presence_verifications'), verification)
    }
  } catch (error) {
    console.error('Error scheduling presence verification:', error)
  }
}

/**
 * Get pending verifications for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Pending verifications
 */
export const getPendingVerifications = async (userId) => {
  try {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    const verificationQuery = query(
      collection(db, 'presence_verifications'),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      where('scheduledTime', '<=', now),
      where('scheduledTime', '>=', today),
      orderBy('scheduledTime', 'asc'),
      limit(5)
    )
    
    const snapshot = await getDocs(verificationQuery)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching pending verifications:', error)
    return []
  }
}

/**
 * Submit verification response
 * @param {string} verificationId - Verification ID
 * @param {string} answer - User's answer
 * @param {Date} promptTime - When prompt was shown (for response time tracking)
 * @returns {Promise<Object>} - Result
 */
export const submitVerification = async (verificationId, answer, promptTime = null) => {
  try {
    const verificationDoc = await getDoc(doc(db, 'presence_verifications', verificationId))
    if (!verificationDoc.exists()) {
      return { success: false, message: 'Verification not found' }
    }
    
    const verification = verificationDoc.data()
    
    // Check if expired
    const expiresAt = verification.expiresAt?.toDate?.() || new Date(verification.expiresAt)
    if (new Date() > expiresAt) {
      return { success: false, message: 'Verification expired. Please respond within 30 seconds.', expired: true }
    }
    
    const isCorrect = answer.toLowerCase().trim() === verification.expectedAnswer.toLowerCase()
    
    const responseTime = promptTime ? Date.now() - promptTime.getTime() : null
    
    const { updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'presence_verifications', verificationId), {
      status: isCorrect ? 'completed' : 'failed',
      userAnswer: answer,
      respondedAt: new Date(),
      responseTime: responseTime,
    })
    
    // Track response time for behavior analysis
    if (responseTime && promptTime) {
      try {
        const { BehaviorTracker } = await import('./behaviorTracking')
        // This will be handled by the behavior tracker instance
      } catch (error) {
        // Behavior tracking not initialized, skip
      }
    }
    
    if (!isCorrect) {
      // Log failed verification
      await addDoc(collection(db, 'verification_failures'), {
        userId: verification.userId,
        verificationId,
        timestamp: new Date(),
        reason: 'Incorrect answer',
      })
    }
    
    return {
      success: true,
      correct: isCorrect,
      message: isCorrect ? 'Verification successful!' : 'Incorrect answer. Please try again.',
    }
  } catch (error) {
    console.error('Error submitting verification:', error)
    return { success: false, message: 'Failed to submit verification' }
  }
}

/**
 * Check verification compliance for attendance
 * @param {string} userId - User ID
 * @param {Date} date - Date to check
 * @returns {Promise<Object>} - Compliance status
 */
export const checkVerificationCompliance = async (userId, date) => {
  try {
    const today = new Date(date)
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const verificationQuery = query(
      collection(db, 'presence_verifications'),
      where('userId', '==', userId),
      where('checkInDate', '>=', today),
      where('checkInDate', '<', tomorrow),
    )
    
    const snapshot = await getDocs(verificationQuery)
    const verifications = snapshot.docs.map((doc) => doc.data())
    
    const total = verifications.length
    const completed = verifications.filter((v) => v.status === 'completed').length
    const failed = verifications.filter((v) => v.status === 'failed').length
    const pending = verifications.filter((v) => v.status === 'pending').length
    
    const complianceRate = total > 0 ? (completed / total) * 100 : 100
    
    return {
      total,
      completed,
      failed,
      pending,
      complianceRate,
      compliant: complianceRate >= 70, // At least 70% compliance required
    }
  } catch (error) {
    console.error('Error checking verification compliance:', error)
    return { compliant: true, complianceRate: 100 } // Default to compliant on error
  }
}

