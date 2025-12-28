import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getUserSalaryConfig,
  setUserSalaryConfig,
  calculateMonthlySalary,
  generateSalarySlip,
  getUserSalarySlips,
} from '../utils/salaryManagement'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const SalaryManagement = ({ isManager = false, userId = null }) => {
  const { currentUser, userData } = useAuth()
  const [salaryConfig, setSalaryConfig] = useState({
    baseSalary: 0,
    standardWorkingHours: 8,
    workingDaysPerMonth: 22,
    hourlyRate: 0,
    overtimeRate: 1.5,
    leaveDeductionRate: 1,
  })
  const [salaryCalculation, setSalaryCalculation] = useState(null)
  const [salarySlips, setSalarySlips] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [showConfig, setShowConfig] = useState(false)

  const targetUserId = userId || currentUser?.uid

  useEffect(() => {
    if (targetUserId) {
      loadSalaryConfig()
      loadSalarySlips()
    }
  }, [targetUserId])

  useEffect(() => {
    if (targetUserId && salaryConfig.baseSalary > 0) {
      calculateSalary()
    }
  }, [targetUserId, selectedMonth, salaryConfig])

  const loadSalaryConfig = async () => {
    try {
      const config = await getUserSalaryConfig(targetUserId)
      if (config) {
        setSalaryConfig(config)
      } else {
        // Calculate hourly rate from base salary if not set
        const calculatedHourlyRate = salaryConfig.baseSalary / (salaryConfig.workingDaysPerMonth * salaryConfig.standardWorkingHours)
        setSalaryConfig(prev => ({
          ...prev,
          hourlyRate: calculatedHourlyRate,
        }))
      }
    } catch (error) {
      console.error('Error loading salary config:', error)
    }
  }

  const loadSalarySlips = async () => {
    try {
      const slips = await getUserSalarySlips(targetUserId)
      setSalarySlips(slips)
    } catch (error) {
      console.error('Error loading salary slips:', error)
    }
  }

  const calculateSalary = async () => {
    try {
      setLoading(true)
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const calculation = await calculateMonthlySalary(targetUserId, year, month)
      setSalaryCalculation(calculation)
    } catch (error) {
      console.error('Error calculating salary:', error)
      toast.error('Failed to calculate salary. Please configure salary settings first.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setLoading(true)
      await setUserSalaryConfig(targetUserId, salaryConfig)
      toast.success('Salary configuration saved!')
      setShowConfig(false)
      calculateSalary()
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSlip = async () => {
    try {
      setLoading(true)
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const slip = await generateSalarySlip(targetUserId, year, month)
      toast.success('Salary slip generated!')
      loadSalarySlips()
    } catch (error) {
      toast.error('Failed to generate salary slip')
    } finally {
      setLoading(false)
    }
  }

  if (!isManager && !salaryConfig.baseSalary) {
    return (
      <div className="clay-card p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Salary Management</h2>
        <p className="text-gray-600 mb-4">Salary configuration is required. Please contact your administrator.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Salary Configuration */}
      {isManager && (
        <div className="clay-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Salary Configuration</h2>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {showConfig ? 'Hide' : 'Configure'}
            </button>
          </div>

          {showConfig && (
            <div className="space-y-4 p-4 bg-white/30 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Salary (per month)
                  </label>
                  <input
                    type="number"
                    value={salaryConfig.baseSalary}
                    onChange={(e) => {
                      const newBase = parseFloat(e.target.value) || 0
                      const newHourly = newBase / (salaryConfig.workingDaysPerMonth * salaryConfig.standardWorkingHours)
                      setSalaryConfig({
                        ...salaryConfig,
                        baseSalary: newBase,
                        hourlyRate: newHourly,
                      })
                    }}
                    className="w-full px-3 py-2 clay-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    value={salaryConfig.hourlyRate.toFixed(2)}
                    onChange={(e) => setSalaryConfig({
                      ...salaryConfig,
                      hourlyRate: parseFloat(e.target.value) || 0,
                    })}
                    className="w-full px-3 py-2 clay-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standard Working Hours (per day)
                  </label>
                  <input
                    type="number"
                    value={salaryConfig.standardWorkingHours}
                    onChange={(e) => setSalaryConfig({
                      ...salaryConfig,
                      standardWorkingHours: parseFloat(e.target.value) || 8,
                    })}
                    className="w-full px-3 py-2 clay-input"
                    min="1"
                    max="24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Working Days (per month)
                  </label>
                  <input
                    type="number"
                    value={salaryConfig.workingDaysPerMonth}
                    onChange={(e) => setSalaryConfig({
                      ...salaryConfig,
                      workingDaysPerMonth: parseFloat(e.target.value) || 22,
                    })}
                    className="w-full px-3 py-2 clay-input"
                    min="1"
                    max="31"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overtime Rate (multiplier)
                  </label>
                  <input
                    type="number"
                    value={salaryConfig.overtimeRate}
                    onChange={(e) => setSalaryConfig({
                      ...salaryConfig,
                      overtimeRate: parseFloat(e.target.value) || 1.5,
                    })}
                    className="w-full px-3 py-2 clay-input"
                    min="1"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">e.g., 1.5 for 1.5x pay</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Deduction Rate
                  </label>
                  <input
                    type="number"
                    value={salaryConfig.leaveDeductionRate}
                    onChange={(e) => setSalaryConfig({
                      ...salaryConfig,
                      leaveDeductionRate: parseFloat(e.target.value) || 1,
                    })}
                    className="w-full px-3 py-2 clay-input"
                    min="0"
                    max="1"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">1 = full day, 0.5 = half day</p>
                </div>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Salary Calculation */}
      <div className="clay-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Salary Calculation</h2>
          <div className="flex gap-2">
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
              className="px-3 py-2 clay-input"
            />
            {isManager && (
              <button
                onClick={handleGenerateSlip}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Generate Slip
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : salaryCalculation ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="clay-stat-card p-4">
                <p className="text-sm text-gray-600">Base Salary</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{salaryCalculation.baseSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="clay-stat-card p-4">
                <p className="text-sm text-gray-600">Present Days</p>
                <p className="text-2xl font-bold text-green-600">{salaryCalculation.presentDays}</p>
              </div>
              <div className="clay-stat-card p-4">
                <p className="text-sm text-gray-600">Leave Days</p>
                <p className="text-2xl font-bold text-red-600">{salaryCalculation.totalLeaveDays}</p>
              </div>
              <div className="clay-stat-card p-4">
                <p className="text-sm text-gray-600">Overtime Hours</p>
                <p className="text-2xl font-bold text-blue-600">{salaryCalculation.totalOvertimeHours.toFixed(1)}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="p-4 bg-white/30 rounded-lg space-y-2">
              <h3 className="font-semibold text-gray-800 mb-3">Salary Breakdown</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Salary:</span>
                <span className="font-medium">₹{salaryCalculation.breakdown.base.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overtime Bonus:</span>
                <span className="font-medium text-green-600">
                  +₹{salaryCalculation.breakdown.overtime.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Leave Deduction:</span>
                <span className="font-medium text-red-600">
                  -₹{Math.abs(salaryCalculation.breakdown.leaveDeduction).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">Net Salary:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ₹{salaryCalculation.breakdown.net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-white/30 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Working Hours</h4>
                <p>Total: {salaryCalculation.totalWorkingHours.toFixed(1)} hours</p>
                <p>Standard: {salaryCalculation.standardHoursWorked.toFixed(1)} hours</p>
                <p>Overtime: {salaryCalculation.totalOvertimeHours.toFixed(1)} hours</p>
              </div>
              <div className="p-4 bg-white/30 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Calculations</h4>
                <p>Per Day: ₹{salaryCalculation.perDaySalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p>Worked Days Value: ₹{salaryCalculation.workedDaysValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                <p>Hours Based: ₹{salaryCalculation.hoursBasedSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No salary data available</p>
        )}
      </div>

      {/* Salary Slips History */}
      <div className="clay-card p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Salary Slips History</h2>
        {salarySlips.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No salary slips generated yet</p>
        ) : (
          <div className="space-y-3">
            {salarySlips.map((slip) => (
              <div key={slip.id} className="p-4 bg-white/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">
                      {format(new Date(slip.year, slip.month - 1, 1), 'MMMM yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Generated: {format(slip.generatedAt?.toDate?.() || new Date(slip.generatedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      ₹{slip.netSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {slip.presentDays} days • {slip.totalOvertimeHours.toFixed(1)}h OT
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SalaryManagement

