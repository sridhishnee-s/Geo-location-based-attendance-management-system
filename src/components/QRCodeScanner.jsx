import { useState, useRef } from 'react'
import { validateQRCode } from '../utils/qrCode'
import toast from 'react-hot-toast'

const QRCodeScanner = ({ onQRCodeScanned }) => {
  const [scanning, setScanning] = useState(false)
  const [qrValue, setQrValue] = useState('')
  const inputRef = useRef(null)

  const handleScan = async () => {
    if (!qrValue.trim()) {
      toast.error('Please enter or scan QR code')
      return
    }

    setScanning(true)
    try {
      const result = await validateQRCode(qrValue.trim())
      if (result.valid) {
        toast.success(result.message)
        if (onQRCodeScanned) {
          onQRCodeScanned(qrValue)
        }
        setQrValue('')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to validate QR code')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scan or Enter QR Code
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleScan()
              }
            }}
            placeholder="Scan QR code or enter code manually"
            className="flex-1 px-4 py-2 clay-input"
            disabled={scanning}
          />
          <button
            onClick={handleScan}
            disabled={scanning || !qrValue.trim()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {scanning ? 'Validating...' : 'Validate'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          QR code expires every 30 seconds. Make sure to scan the latest code.
        </p>
      </div>
    </div>
  )
}

export default QRCodeScanner

