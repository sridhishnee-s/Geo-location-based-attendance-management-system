import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPendingVerifications, submitVerification } from '../utils/presenceVerification'
import toast from 'react-hot-toast'

const CountdownTimer = ({ startTime, duration, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(duration)
  
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
        onExpire()
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [startTime, duration, onExpire])
  
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all duration-100"
            style={{ width: `${(timeLeft / duration) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-red-600">{timeLeft}s</span>
      </div>
    </div>
  )
}

const PresenceVerification = () => {
  const { currentUser } = useAuth()
  const [verification, setVerification] = useState(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    const checkVerifications = async () => {
      const verifications = await getPendingVerifications(currentUser.uid)
      if (verifications.length > 0) {
        const activeVerification = verifications[0]
        const now = new Date()
        const scheduledTime = activeVerification.scheduledTime?.toDate?.() || new Date(activeVerification.scheduledTime)
        const expiresAt = activeVerification.expiresAt?.toDate?.() || new Date(scheduledTime.getTime() + 30 * 1000) // 30 seconds

        if (now >= scheduledTime && now <= expiresAt) {
          setVerification({ ...activeVerification, promptTime: now })
          setShowModal(true)
        } else if (now > expiresAt) {
          // Verification expired, mark as failed
          const { submitVerification } = await import('../utils/presenceVerification')
          await submitVerification(activeVerification.id, '')
        }
      }
    }

    // Check every 30 seconds
    const interval = setInterval(checkVerifications, 30000)
    checkVerifications() // Initial check

    return () => clearInterval(interval)
  }, [currentUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!verification || !answer.trim()) {
      toast.error('Please enter an answer')
      return
    }

    // Check if expired (30 seconds)
    const now = new Date()
    const expiresAt = verification.expiresAt?.toDate?.() || new Date(verification.promptTime?.getTime() + 30 * 1000)
    if (now > expiresAt) {
      toast.error('Time expired! Please respond within 30 seconds.')
      setShowModal(false)
      setVerification(null)
      return
    }

    setSubmitting(true)
    try {
      const result = await submitVerification(verification.id, answer, verification.promptTime)
      if (result.success) {
        if (result.correct) {
          toast.success(result.message)
          setShowModal(false)
          setVerification(null)
          setAnswer('')
        } else {
          toast.error(result.message)
          setAnswer('')
        }
      } else {
        if (result.expired) {
          toast.error('Verification expired')
          setShowModal(false)
          setVerification(null)
        } else {
          toast.error(result.message)
        }
      }
    } catch (error) {
      toast.error('Failed to submit verification')
    } finally {
      setSubmitting(false)
    }
  }

  if (!showModal || !verification) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="clay-card p-6 max-w-md w-full space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Presence Verification</h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            ⚠️ Please verify your presence by answering the question below (30 seconds):
          </p>
          <p className="text-lg font-semibold text-gray-800">{verification.prompt}</p>
          {verification.promptTime && (
            <CountdownTimer 
              startTime={verification.promptTime} 
              duration={30}
              onExpire={() => {
                toast.error('Time expired!')
                setShowModal(false)
                setVerification(null)
              }}
            />
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-4 py-2 clay-input"
              placeholder="Enter your answer"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center">
          This verification helps ensure continuous presence during work hours
        </p>
      </div>
    </div>
  )
}

export default PresenceVerification

