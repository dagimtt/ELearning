import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="p-8">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!roles.some((r) => user.roles.includes(r)))
    return <Navigate to="/" replace />
  return children
}