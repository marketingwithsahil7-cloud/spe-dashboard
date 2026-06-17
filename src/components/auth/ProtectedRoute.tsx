import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../lib/constants'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-pitch flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing badge — matches .skeleton shimmer from global CSS */}
        <div className="w-16 h-16 rounded-full skeleton" />
        <div className="w-32 h-3 rounded skeleton" />
        <div className="w-24 h-3 rounded skeleton" />
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <LoadingScreen />

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  return <Outlet />
}
