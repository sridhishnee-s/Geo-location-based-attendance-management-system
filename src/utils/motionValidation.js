/**
 * Motion-based validation using device accelerometer
 */

/**
 * Request motion sensor permissions and start tracking
 */
export const startMotionTracking = () => {
  return new Promise((resolve, reject) => {
    if (!window.DeviceMotionEvent) {
      reject(new Error('Device motion not supported'))
      return
    }

    // Request permission (iOS 13+)
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            resolve(true)
          } else {
            reject(new Error('Motion permission denied'))
          }
        })
        .catch(reject)
    } else {
      // Permission already granted or not needed
      resolve(true)
    }
  })
}

/**
 * Track steps/movement using accelerometer
 */
export const trackSteps = (duration = 10000) => {
  return new Promise((resolve, reject) => {
    let stepCount = 0
    let lastAcceleration = { x: 0, y: 0, z: 0 }
    let isTracking = true
    let startTime = Date.now()

    const handleMotion = (event) => {
      if (!isTracking) return

      const acceleration = event.accelerationIncludingGravity || event.acceleration
      if (!acceleration) return

      const { x, y, z } = acceleration
      const deltaX = Math.abs(x - lastAcceleration.x)
      const deltaY = Math.abs(y - lastAcceleration.y)
      const deltaZ = Math.abs(z - lastAcceleration.z)

      // Detect step (significant change in acceleration)
      const totalDelta = deltaX + deltaY + deltaZ
      if (totalDelta > 2.5) {
        // Threshold for step detection
        stepCount++
      }

      lastAcceleration = { x, y, z }

      // Check if duration elapsed
      if (Date.now() - startTime >= duration) {
        isTracking = false
        window.removeEventListener('devicemotion', handleMotion)
        resolve({
          steps: stepCount,
          duration: Date.now() - startTime,
          valid: stepCount >= 3, // Minimum 3 steps required
        })
      }
    }

    window.addEventListener('devicemotion', handleMotion, { passive: true })

    // Timeout fallback
    setTimeout(() => {
      if (isTracking) {
        isTracking = false
        window.removeEventListener('devicemotion', handleMotion)
        resolve({
          steps: stepCount,
          duration: Date.now() - startTime,
          valid: stepCount >= 3,
        })
      }
    }, duration + 1000)
  })
}

/**
 * Validate motion (user must walk a few steps)
 */
export const validateMotion = async (minSteps = 3, duration = 10000) => {
  try {
    // Request permission
    await startMotionTracking()

    // Track steps
    const result = await trackSteps(duration)

    return {
      valid: result.valid,
      steps: result.steps,
      requiredSteps: minSteps,
      message: result.valid
        ? `Motion validated: ${result.steps} steps detected`
        : `Insufficient movement. Detected ${result.steps} steps, required ${minSteps} steps. Please walk a few steps.`,
    }
  } catch (error) {
    console.error('Error validating motion:', error)
    return {
      valid: false,
      steps: 0,
      message: error.message || 'Motion validation failed. Please ensure motion sensors are enabled.',
    }
  }
}

/**
 * Check if device supports motion sensors
 */
export const isMotionSupported = () => {
  return 'DeviceMotionEvent' in window || 'ondevicemotion' in window
}

