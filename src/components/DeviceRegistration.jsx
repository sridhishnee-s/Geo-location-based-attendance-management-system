import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getDeviceBinding, bindDevice } from '../utils/deviceBinding'
import { generateDeviceFingerprint } from '../utils/deviceBinding'
import toast from 'react-hot-toast'

const DeviceRegistration = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [deviceInfo, setDeviceInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadEmployees()
    loadCurrentDeviceInfo()
  }, [])

  const loadEmployees = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'employee'))
      const snapshot = await getDocs(usersQuery)
      const employeeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      setEmployees(employeeList)
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadCurrentDeviceInfo = async () => {
    const fingerprint = generateDeviceFingerprint()
    setDeviceInfo({
      fingerprint,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: `${screen.width}x${screen.height}`,
    })
  }

  const handleRegisterDevice = async () => {
    if (!selectedEmployee || !deviceInfo) {
      toast.error('Please select an employee')
      return
    }

    try {
      setLoading(true)
      const result = await bindDevice(selectedEmployee.id, deviceInfo.fingerprint)
      if (result.success) {
        toast.success(`Device registered for ${selectedEmployee.name || selectedEmployee.email}`)
        setSelectedEmployee(null)
      }
    } catch (error) {
      toast.error('Failed to register device')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckDevice = async (employeeId) => {
    try {
      setLoading(true)
      const binding = await getDeviceBinding(employeeId)
      if (binding) {
        toast.success(`Device registered: ${binding.deviceFingerprint.substring(0, 10)}...`)
      } else {
        toast.info('No device registered for this employee')
      }
    } catch (error) {
      toast.error('Failed to check device')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="clay-card p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Device Registration</h2>
      
      {/* Current Device Info */}
      {deviceInfo && (
        <div className="p-4 bg-white/30 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">Current Device Information</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Fingerprint:</span> {deviceInfo.fingerprint.substring(0, 20)}...</p>
            <p><span className="font-medium">Platform:</span> {deviceInfo.platform}</p>
            <p><span className="font-medium">Screen:</span> {deviceInfo.screenSize}</p>
          </div>
        </div>
      )}

      {/* Register Device for Employee */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-700">Register Device for Employee</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === e.target.value)
                setSelectedEmployee(emp)
              }}
              className="w-full px-3 py-2 clay-input"
            >
              <option value="">Select employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRegisterDevice}
              disabled={!selectedEmployee || loading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Device'}
            </button>
          </div>
        </div>
      </div>

      {/* Employee Device List */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-700">Employee Devices</h3>
        {employees.map(employee => (
          <div key={employee.id} className="p-4 bg-white/30 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-800">{employee.name || employee.email}</p>
              <p className="text-sm text-gray-600">{employee.email}</p>
            </div>
            <button
              onClick={() => handleCheckDevice(employee.id)}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Check Device
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DeviceRegistration

