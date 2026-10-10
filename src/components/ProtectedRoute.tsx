import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import Spinner from './Spinner'

/** Redirects to /login when signed out, and to /placement before the first placement check. */
export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <PlacementGate />
}

function PlacementGate() {
  const { ready, profile } = useData()
  const location = useLocation()
  if (!ready) return <Spinner label="Loading your progress…" />
  if (profile && !profile.placementResult && location.pathname !== '/placement') return <Navigate to="/placement" replace />
  return <Outlet />
}
