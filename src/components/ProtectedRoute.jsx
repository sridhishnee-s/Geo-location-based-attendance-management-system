import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isAdmin } from '../utils/roleHelpers'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, userData, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center clay-bg">
        <div className="clay-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // If role is required, check it
  if (requiredRole) {
    if (requiredRole === 'manager' && !isAdmin(userData)) {
      return <Navigate to="/employee/dashboard" replace />
    }
  }

  // Auto-redirect based on role
  if (!requiredRole && userData) {
    if (isAdmin(userData) && window.location.pathname === '/employee/dashboard') {
      return <Navigate to="/manager/dashboard" replace />
    }
    if (!isAdmin(userData) && window.location.pathname === '/manager/dashboard') {
      return <Navigate to="/employee/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute





