import { lazy, Suspense } from 'react'
import { TrialList } from '../components/trials/TrialList'
import { PageGlow } from '../components/ui/PageGlow'

const AmbientBackground = lazy(() => import('../components/ui/AmbientBackground'))

export default function TrialsPage() {
  return (
    <div className="relative">
      <PageGlow variant="ice" />
      <Suspense fallback={null}><AmbientBackground variant="trials" /></Suspense>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
            Trials
          </h1>
          <p className="font-body text-sm text-slate-400 mt-1">
            Track trial sessions and convert promising players to the academy
          </p>
        </div>
        <TrialList />
      </div>
    </div>
  )
}
