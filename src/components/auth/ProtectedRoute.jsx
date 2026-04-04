import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../contexts/RoleContext'
import { hasPermission } from '../../lib/permissions'

export default function ProtectedRoute({ children, requiredPermission, requiredRole }) {
  const { user, userProfile, loading: authLoading } = useAuth()
  const { role, status, roleLoading } = useRole()

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Forcer le changement de mot de passe temporaire
  if (userProfile?.mustChangePassword) {
    return <Navigate to="/changer-mot-de-passe" replace />
  }

  if (status === 'disabled') {
    return <Navigate to="/compte-desactive" replace />
  }

  if (status === 'pending_approval' && !role) {
    return <Navigate to="/en-attente" replace />
  }

  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    return <Navigate to="/acces-refuse" replace />
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(role)) {
      return <Navigate to="/acces-refuse" replace />
    }
  }

  return children
}
