import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useRole } from '../../contexts/RoleContext'
import { ROLES } from '../../lib/permissions'

export default function PublicOnlyRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { role, roleLoading } = useRole()

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (user) {
    if (role === ROLES.BENEFICIARY) {
      return <Navigate to="/beneficiaire" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}
