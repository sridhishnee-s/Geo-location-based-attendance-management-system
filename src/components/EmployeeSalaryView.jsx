import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import SalaryManagement from './SalaryManagement'
import toast from 'react-hot-toast'

const EmployeeSalaryView = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'employee'))
      const snapshot = await getDocs(usersQuery)
      const employeeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      setEmployees(employeeList)
    } catch (error) {
      console.error('Error loading employees:', error)
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
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
    <div className="space-y-6">
      {/* Employee Selection */}
      <div className="clay-card p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Employee</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {employees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => setSelectedEmployee(employee.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedEmployee === employee.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white/30 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-800">{employee.name || employee.email}</p>
              <p className="text-sm text-gray-600">{employee.email}</p>
            </button>
          ))}
        </div>
        {employees.length === 0 && (
          <p className="text-center text-gray-500 py-4">No employees found</p>
        )}
      </div>

      {/* Salary Management for Selected Employee */}
      {selectedEmployee && (
        <SalaryManagement isManager={true} userId={selectedEmployee} />
      )}
    </div>
  )
}

export default EmployeeSalaryView

