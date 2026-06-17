import { lazy, Suspense } from 'react'
import { FeeDashboard } from '../components/fees/FeeDashboard'
import { PageGlow } from '../components/ui/PageGlow'

const AmbientBackground = lazy(() => import('../components/ui/AmbientBackground'))

export default function FeesPage() {
  return (
    <div className="relative">
      <PageGlow variant="amber" />
      <Suspense fallback={null}><AmbientBackground variant="fees" /></Suspense>
      <FeeDashboard />
    </div>
  )
}
