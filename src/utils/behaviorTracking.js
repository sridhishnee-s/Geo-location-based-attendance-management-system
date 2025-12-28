import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Track typing speed and response patterns
 */
export class BehaviorTracker {
  constructor(userId) {
    this.userId = userId
    this.keystrokes = []
    this.responseTimes = []
    this.mouseMovements = []
    this.startTime = Date.now()
    this.lastActivity = Date.now()
  }

  /**
   * Record keystroke timing
   */
  recordKeystroke() {
    const now = Date.now()
    const timeSinceLastKey = now - this.lastActivity
    this.keystrokes.push(timeSinceLastKey)
    this.lastActivity = now
    
    // Keep only last 100 keystrokes
    if (this.keystrokes.length > 100) {
      this.keystrokes.shift()
    }
  }

  /**
   * Record response time to a prompt
   */
  recordResponseTime(promptTime, responseTime) {
    const responseDelay = responseTime - promptTime
    this.responseTimes.push(responseDelay)
    
    // Keep only last 50 responses
    if (this.responseTimes.length > 50) {
      this.responseTimes.shift()
    }
  }

  /**
   * Record mouse movement
   */
  recordMouseMovement() {
    const now = Date.now()
    this.mouseMovements.push(now)
    
    // Keep only last 200 movements
    if (this.mouseMovements.length > 200) {
      this.mouseMovements.shift()
    }
  }

  /**
   * Calculate average typing speed (keystrokes per minute)
   */
  getTypingSpeed() {
    if (this.keystrokes.length < 10) return null
    
    const recentKeystrokes = this.keystrokes.slice(-20)
    const avgInterval = recentKeystrokes.reduce((a, b) => a + b, 0) / recentKeystrokes.length
    const keystrokesPerMinute = 60000 / avgInterval
    return keystrokesPerMinute
  }

  /**
   * Calculate average response time
   */
  getAverageResponseTime() {
    if (this.responseTimes.length === 0) return null
    return this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
  }

  /**
   * Get behavior pattern
   */
  getBehaviorPattern() {
    return {
      typingSpeed: this.getTypingSpeed(),
      avgResponseTime: this.getAverageResponseTime(),
      totalKeystrokes: this.keystrokes.length,
      totalResponses: this.responseTimes.length,
      sessionDuration: Date.now() - this.startTime,
    }
  }

  /**
   * Save behavior pattern to database
   */
  async saveBehaviorPattern() {
    try {
      const pattern = this.getBehaviorPattern()
      const behaviorRef = doc(db, 'behavior_patterns', this.userId)
      const behaviorDoc = await getDoc(behaviorRef)
      
      if (behaviorDoc.exists()) {
        const existing = behaviorDoc.data()
        const patterns = existing.patterns || []
        patterns.push({
          ...pattern,
          timestamp: new Date(),
        })
        
        // Keep only last 30 patterns
        const recentPatterns = patterns.slice(-30)
        
        await updateDoc(behaviorRef, {
          patterns: recentPatterns,
          lastUpdated: new Date(),
          baseline: this.calculateBaseline(recentPatterns),
        })
      } else {
        await setDoc(behaviorRef, {
          userId: this.userId,
          patterns: [{
            ...pattern,
            timestamp: new Date(),
          }],
          baseline: pattern,
          lastUpdated: new Date(),
        })
      }
    } catch (error) {
      console.error('Error saving behavior pattern:', error)
    }
  }

  /**
   * Calculate baseline behavior
   */
  calculateBaseline(patterns) {
    if (patterns.length < 5) return null
    
    const typingSpeeds = patterns
      .map(p => p.typingSpeed)
      .filter(s => s !== null)
    const responseTimes = patterns
      .map(p => p.avgResponseTime)
      .filter(t => t !== null)
    
    return {
      avgTypingSpeed: typingSpeeds.length > 0 
        ? typingSpeeds.reduce((a, b) => a + b, 0) / typingSpeeds.length 
        : null,
      avgResponseTime: responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null,
      stdDevTypingSpeed: this.calculateStdDev(typingSpeeds),
      stdDevResponseTime: this.calculateStdDev(responseTimes),
    }
  }

  /**
   * Calculate standard deviation
   */
  calculateStdDev(values) {
    if (values.length < 2) return null
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const squareDiffs = values.map(v => Math.pow(v - avg, 2))
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
    return Math.sqrt(avgSquareDiff)
  }

  /**
   * Check if current behavior matches baseline
   */
  async checkBehaviorAnomaly() {
    try {
      const currentPattern = this.getBehaviorPattern()
      const behaviorRef = doc(db, 'behavior_patterns', this.userId)
      const behaviorDoc = await getDoc(behaviorRef)
      
      if (!behaviorDoc.exists() || !behaviorDoc.data().baseline) {
        // No baseline yet, save current as baseline
        await this.saveBehaviorPattern()
        return { anomaly: false, message: 'Baseline established' }
      }
      
      const baseline = behaviorDoc.data().baseline
      const anomalies = []
      
      // Check typing speed anomaly
      if (currentPattern.typingSpeed && baseline.avgTypingSpeed) {
        const speedDiff = Math.abs(currentPattern.typingSpeed - baseline.avgTypingSpeed)
        const threshold = baseline.stdDevTypingSpeed * 2 || baseline.avgTypingSpeed * 0.5
        
        if (speedDiff > threshold) {
          anomalies.push({
            type: 'typing_speed',
            current: currentPattern.typingSpeed,
            expected: baseline.avgTypingSpeed,
            deviation: speedDiff,
          })
        }
      }
      
      // Check response time anomaly
      if (currentPattern.avgResponseTime && baseline.avgResponseTime) {
        const timeDiff = Math.abs(currentPattern.avgResponseTime - baseline.avgResponseTime)
        const threshold = baseline.stdDevResponseTime * 2 || baseline.avgResponseTime * 0.5
        
        if (timeDiff > threshold) {
          anomalies.push({
            type: 'response_time',
            current: currentPattern.avgResponseTime,
            expected: baseline.avgResponseTime,
            deviation: timeDiff,
          })
        }
      }
      
      if (anomalies.length > 0) {
        return {
          anomaly: true,
          anomalies,
          message: 'Unusual behavior detected',
        }
      }
      
      return { anomaly: false, message: 'Behavior normal' }
    } catch (error) {
      console.error('Error checking behavior anomaly:', error)
      return { anomaly: false, message: 'Behavior check failed' }
    }
  }
}

/**
 * Initialize behavior tracking for a user
 */
export const initBehaviorTracking = (userId) => {
  const tracker = new BehaviorTracker(userId)
  
  // Track keystrokes
  const handleKeyPress = () => tracker.recordKeystroke()
  window.addEventListener('keypress', handleKeyPress, { passive: true })
  
  // Track mouse movements
  const handleMouseMove = () => tracker.recordMouseMovement()
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  
  // Save pattern every 5 minutes
  const saveInterval = setInterval(() => {
    tracker.saveBehaviorPattern()
  }, 5 * 60 * 1000)
  
  // Cleanup function
  return () => {
    window.removeEventListener('keypress', handleKeyPress)
    window.removeEventListener('mousemove', handleMouseMove)
    clearInterval(saveInterval)
    tracker.saveBehaviorPattern()
  }
}

