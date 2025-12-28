import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Simple hash function for QR code
 */
const hashString = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Generate QR code data with timestamp
 */
export const generateQRCode = async () => {
  try {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const qrData = `ATT_${timestamp}_${randomString}`
    
    // Create a hash for security
    const qrHash = hashString(qrData)
    
    // Store QR code in database with 30-second expiry
    const qrDoc = {
      data: qrData,
      hash: qrHash,
      timestamp: new Date(),
      expiresAt: new Date(timestamp + 30 * 1000), // 30 seconds
      used: false,
    }
    
    await setDoc(doc(db, 'qr_codes', 'current'), qrDoc)
    
    return {
      qrData: qrData,
      qrHash: qrHash,
      timestamp,
      expiresAt: qrDoc.expiresAt,
    }
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

/**
 * Get current QR code
 */
export const getCurrentQRCode = async () => {
  try {
    const qrDoc = await getDoc(doc(db, 'qr_codes', 'current'))
    if (qrDoc.exists()) {
      const data = qrDoc.data()
      const now = new Date()
      const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt)
      
      if (now > expiresAt) {
        // QR code expired, generate new one
        return await generateQRCode()
      }
      
      return {
        qrData: data.data,
        qrHash: data.hash,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        expiresAt: expiresAt,
      }
    }
    
    // No QR code exists, generate one
    return await generateQRCode()
  } catch (error) {
    console.error('Error getting QR code:', error)
    throw error
  }
}

/**
 * Validate QR code
 */
export const validateQRCode = async (scannedQRData) => {
  try {
    const qrDoc = await getDoc(doc(db, 'qr_codes', 'current'))
    if (!qrDoc.exists()) {
      return { valid: false, message: 'No QR code found' }
    }
    
    const data = qrDoc.data()
    const now = new Date()
    const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt)
    
    // Check if expired
    if (now > expiresAt) {
      return { valid: false, message: 'QR code expired. Please scan the latest code.' }
    }
    
    // Check if already used
    if (data.used) {
      return { valid: false, message: 'QR code already used' }
    }
    
    // Validate QR data (check both data and hash)
    const isValidData = data.data === scannedQRData
    const isValidHash = data.hash && scannedQRData.includes(data.hash)
    
    if (!isValidData && !isValidHash) {
      return { valid: false, message: 'Invalid QR code. Please scan the latest code.' }
    }
    
    // Mark as used
    const { updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'qr_codes', 'current'), {
      used: true,
      usedAt: new Date(),
    })
    
    return { valid: true, message: 'QR code validated successfully' }
  } catch (error) {
    console.error('Error validating QR code:', error)
    return { valid: false, message: 'QR code validation failed' }
  }
}

/**
 * Start QR code refresh interval (for managers)
 */
export const startQRCodeRefresh = (onQRCodeUpdate) => {
  const generateAndNotify = async () => {
    try {
      const qrCode = await generateQRCode()
      if (onQRCodeUpdate) {
        onQRCodeUpdate(qrCode)
      }
    } catch (error) {
      console.error('Error refreshing QR code:', error)
    }
  }
  
  // Generate immediately
  generateAndNotify()
  
  // Refresh every 30 seconds
  const interval = setInterval(generateAndNotify, 30000)
  
  return () => clearInterval(interval)
}

