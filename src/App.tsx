import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import { useLenis } from './hooks/useLenis'
import { CustomCursor } from './components/ui/CustomCursor'
import { ToastContainer } from './components/ui/Toast'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PermissionRoute } from './components/auth/PermissionRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ROUTES } from './lib/constants'
import { useAuthStore } from './store/authStore'

// Eager — needed before auth resolves
import LoginPage from './pages/LoginPage'

// Lazy — only loaded after login
const DashboardPage      = lazy(() => import('./pages/DashboardPage'))
const StudentsPage       = lazy(() => import('./pages/StudentsPage'))
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage'))
const AttendancePage     = lazy(() => import('./pages/AttendancePage'))
const FeesPage           = lazy(() => import('./pages/FeesPage'))
const TrialsPage         = lazy(() => import('./pages/TrialsPage'))
const CoachesPage        = lazy(() => import('./pages/CoachesPage'))
const EventsPage         = lazy(() => import('./pages/EventsPage'))
const FinancialsPage     = lazy(() => import('./pages/FinancialsPage'))
const SettingsPage       = lazy(() => import('./pages/SettingsPage'))

function PageSkeleton() {
  return (
    <div className="space-y-4 pt-2">
      <div className="h-8 w-48 rounded-xl skeleton" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl skeleton" />
        ))}
      </div>
      <div className="h-64 rounded-xl skeleton" />
    </div>
  )
}

// Sends each role to their correct home page on root / unknown routes
function DefaultRedirect() {
  const { role } = useAuthStore()
  return <Navigate to={role === 'assistant' ? ROUTES.ATTENDANCE : ROUTES.DASHBOARD} replace />
}

// Inner component lives inside BrowserRouter so hooks that need router context work
function AppInner() {
  useAuth()    // single auth subscription for the app lifetime
  useLenis()   // single Lenis instance

  return (
    <>
      <CustomCursor />
      <ToastContainer />
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Root → role-aware home */}
            <Route index element={<DefaultRedirect />} />

            {/* Head-coach only */}
            <Route element={<PermissionRoute permKey="canSeeDashboard" />}>
              <Route
                path={ROUTES.DASHBOARD}
                element={<Suspense fallback={<PageSkeleton />}><DashboardPage /></Suspense>}
              />
            </Route>

            <Route element={<PermissionRoute permKey="canSeeStudents" />}>
              <Route
                path={ROUTES.STUDENTS}
                element={<Suspense fallback={<PageSkeleton />}><StudentsPage /></Suspense>}
              />
              <Route
                path={`${ROUTES.STUDENTS}/:id`}
                element={<Suspense fallback={<PageSkeleton />}><StudentProfilePage /></Suspense>}
              />
            </Route>

            <Route element={<PermissionRoute permKey="canSeeFees" />}>
              <Route
                path={ROUTES.FEES}
                element={<Suspense fallback={<PageSkeleton />}><FeesPage /></Suspense>}
              />
            </Route>

            <Route element={<PermissionRoute permKey="canSeeTrials" />}>
              <Route
                path={ROUTES.TRIALS}
                element={<Suspense fallback={<PageSkeleton />}><TrialsPage /></Suspense>}
              />
            </Route>

            <Route element={<PermissionRoute permKey="canSeeFinancials" />}>
              <Route
                path={ROUTES.FINANCIALS}
                element={<Suspense fallback={<PageSkeleton />}><FinancialsPage /></Suspense>}
              />
            </Route>

            {/* Accessible to all coaches */}
            <Route
              path={ROUTES.ATTENDANCE}
              element={<Suspense fallback={<PageSkeleton />}><AttendancePage /></Suspense>}
            />
            <Route
              path={ROUTES.COACHES}
              element={<Suspense fallback={<PageSkeleton />}><CoachesPage /></Suspense>}
            />
            <Route
              path={ROUTES.EVENTS}
              element={<Suspense fallback={<PageSkeleton />}><EventsPage /></Suspense>}
            />
            <Route
              path={ROUTES.SETTINGS}
              element={<Suspense fallback={<PageSkeleton />}><SettingsPage /></Suspense>}
            />

            {/* Fallback for any unknown protected path */}
            <Route path="*" element={<DefaultRedirect />} />
          </Route>
        </Route>

        {/* Fallback for unauthenticated unknown paths */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  const [loaderVisible, setLoaderVisible] = useState(
    () => !sessionStorage.getItem('spe-loaded')
  )

  useEffect(() => {
    if (!loaderVisible) return
    const t = setTimeout(() => {
      sessionStorage.setItem('spe-loaded', '1')
      setLoaderVisible(false)
    }, 2200)
    return () => clearTimeout(t)
  }, [loaderVisible])

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {loaderVisible && <LoadingScreen key="loader" />}
      </AnimatePresence>
      <AppInner />
    </BrowserRouter>
  )
}
