import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentQRCode, startQRCodeRefresh } from '../utils/qrCode'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// QR Code component using canvas
const QRCodeCanvas = ({ value, size = 200 }) => {
  const canvasRef = useRef(null)
  
  useEffect(() => {
    if (!canvasRef.current || !value) return
    
    // Use QRCode library from CDN (loaded in index.html)
    if (window.QRCode && canvasRef.current) {
      window.QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }, (error) => {
        if (error) {
          console.error('QR code generation error:', error)
          // Fallback to text display
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            ctx.clearRect(0, 0, size, size)
            ctx.fillStyle = '#000'
            ctx.font = '14px monospace'
            ctx.textAlign = 'center'
            ctx.fillText('QR Code', size / 2, size / 2 - 10)
            ctx.fillText('Generation', size / 2, size / 2 + 10)
            ctx.fillText('Failed', size / 2, size / 2 + 30)
          }
        }
      })
    } else {
      // Fallback if library not loaded
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = '#000'
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Loading QR Code...', size / 2, size / 2)
      }
    }
  }, [value, size])
  
  return (
    <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
      <canvas ref={canvasRef} width={size} height={size} className="mx-auto block"></canvas>
      <p className="text-xs text-gray-500 mt-2 text-center font-mono break-all px-2">
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1 text-center">
        Scan this code or enter manually
      </p>
    </div>
  )
}

const QRCodeDisplay = () => {
  const { userData } = useAuth()
  const [qrCode, setQrCode] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userData || userData.role !== 'manager') {
      return
    }

    const loadQRCode = async () => {
      try {
        setLoading(true)
        const qr = await getCurrentQRCode()
        setQrCode(qr)
        calculateTimeLeft(qr.expiresAt)
      } catch (error) {
        console.error('Error loading QR code:', error)
        toast.error('Failed to load QR code')
      } finally {
        setLoading(false)
      }
    }

    loadQRCode()

    // Start auto-refresh every 30 seconds
    const cleanup = startQRCodeRefresh((newQRCode) => {
      setQrCode(newQRCode)
      calculateTimeLeft(newQRCode.expiresAt)
    })

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      if (qrCode) {
        calculateTimeLeft(qrCode.expiresAt)
      }
    }, 1000)

    return () => {
      cleanup()
      clearInterval(countdownInterval)
    }
  }, [userData])

  const calculateTimeLeft = (expiresAt) => {
    const now = new Date()
    const expiry = expiresAt?.toDate?.() || new Date(expiresAt)
    const diff = Math.max(0, Math.floor((expiry - now) / 1000))
    setTimeLeft(diff)
  }

  if (!userData || userData.role !== 'manager') {
    return null
  }

  if (loading) {
    return (
      <div className="clay-card p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="clay-card p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Attendance QR Code</h2>
      <div className="flex flex-col items-center space-y-4">
        {qrCode && (
          <>
            <QRCodeCanvas value={qrCode.qrData} size={200} />
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${timeLeft > 10 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <p className="text-sm text-gray-600">
                  Expires in: <span className="font-bold text-gray-800">{timeLeft}s</span>
                </p>
              </div>
              <p className="text-xs text-gray-500">
                QR code refreshes every 30 seconds
              </p>
              <p className="text-xs text-gray-500">
                Generated: {format(qrCode.timestamp, 'HH:mm:ss')}
              </p>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 text-center">
                ⚠️ Employees must scan this QR code within the time window to mark attendance
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default QRCodeDisplay

