import { lazy, Suspense, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { gsap } from '../lib/animations'
import { useAuthStore } from '../store/authStore'
import { useDashboard } from '../hooks/useDashboard'
import { ROUTES } from '../lib/constants'
import { StatsCards } from '../components/dashboard/StatsCards'
import { TrialAlertBar } from '../components/dashboard/TrialAlertBar'
import { ActionPanel } from '../components/dashboard/ActionPanel'
import { Charts } from '../components/dashboard/Charts'
import { Button } from '../components/ui/Button'
import { SkeletonStat } from '../components/ui/Skeleton'

const SoccerBall3D = lazy(() => import('../components/dashboard/SoccerBall3D'))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const coach    = useAuthStore(state => state.coach)
  const firstName = coach?.name.split(' ')[0] ?? 'Coach'

  const { stats, pendingTrials, feesActionList, monthlyTrend, batchBreakdown, isLoading, error, refetch } = useDashboard()

  const hasOverdue = feesActionList.some(item => item.feeStatus === 'overdue')

  // Section refs for GSAP entrance timeline
  const headerRef  = useRef<HTMLDivElement>(null)
  const statsRef   = useRef<HTMLDivElement>(null)
  const actionRef  = useRef<HTMLDivElement>(null)
  const chartsRef  = useRef<HTMLDivElement>(null)
  const ballRef    = useRef<HTMLDivElement>(null)

  // Master page-load GSAP timeline
  useEffect(() => {
    const ctx = gsap.context(() => {
      const targets = [headerRef.current, statsRef.current, actionRef.current]

      // Set initial invisible states
      gsap.set(targets, { opacity: 0, y: 20 })
      gsap.set(chartsRef.current, { opacity: 0, y: 20, scale: 0.95 })
      gsap.set(ballRef.current,   { opacity: 0 })

      const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'all' } })

      // Step 1 – header
      tl.to(headerRef.current,  { opacity: 1, y: 0, duration: 0.4 }, 0)
      // Step 3 – stats cards
      tl.to(statsRef.current,   { opacity: 1, y: 0, duration: 0.4 }, 0.3)
      // Step 4 – action panel
      tl.to(actionRef.current,  { opacity: 1, y: 0, duration: 0.4 }, 0.6)
      // Step 5 – charts
      tl.to(chartsRef.current,  { opacity: 1, y: 0, scale: 1, duration: 0.5 }, 0.8)
      // Step 6 – soccer ball
      tl.to(ballRef.current,    { opacity: 1, duration: 0.3 }, 1.0)
    })

    return () => ctx.revert()
  }, [])

  // ── Mark Paid: navigates to fees page with student pre-selected (Phase 5 wires full form)
  const handleMarkPaid = (studentId: string) => {
    navigate(`${ROUTES.FEES}?student=${studentId}`)
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
          className="glass p-8 flex flex-col items-center gap-4 text-center"
          style={{ border: '1px solid rgba(255,61,87,0.35)' }}
        >
          <p className="font-display text-lg text-danger uppercase tracking-wide">
            Failed to load dashboard
          </p>
          <p className="font-body text-sm text-slate-400">{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={refetch}>
            Retry
          </Button>
        </div>
    )
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative space-y-6 pb-8">

      {/* ── Perspective grid — depth-feel background ──────────────────────── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-20%',
            right: '-20%',
            height: '55%',
            backgroundImage:
              'linear-gradient(rgba(0,255,135,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,135,0.03) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            transform: 'perspective(600px) rotateX(52deg)',
            transformOrigin: '50% 100%',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <div ref={headerRef} className="relative min-h-[80px]">
        <div className="pr-0 md:pr-[300px]">

          {/* LIVE indicator */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-grass opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-grass" />
            </span>
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-grass/70">
              Live
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-5xl font-semibold text-white leading-tight">
            {getGreeting()}, {firstName}&nbsp;👋
          </h1>
          <p className="font-body text-sm text-slate-400 mt-1.5">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>

        {/* Soccer ball — absolute top-right, desktop only */}
        <div
          ref={ballRef}
          className="absolute top-0 right-0 hidden md:block"
          style={{ pointerEvents: 'none' }}
        >
          {/* pointerEvents restored on the canvas itself via R3F mesh raycasting */}
          <div style={{ pointerEvents: 'auto' }}>
            <Suspense fallback={null}>
              <SoccerBall3D />
            </Suspense>
          </div>
        </div>
      </div>

      {/* ── 2. Trial alert bar (self-animates, only if trials exist) ──────── */}
      <TrialAlertBar pendingTrials={pendingTrials} />

      {/* ── 3. Stats cards ────────────────────────────────────────────────── */}
      <div ref={statsRef}>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <StatsCards stats={stats} hasOverdue={hasOverdue} isLoading={false} />
        )}
      </div>

      {/* ── 4. Action panel ───────────────────────────────────────────────── */}
      <div ref={actionRef}>
        <ActionPanel
          feesActionList={feesActionList}
          pendingTrials={pendingTrials}
          onMarkPaid={handleMarkPaid}
          isLoading={isLoading}
        />
      </div>

      {/* ── 5. Charts ─────────────────────────────────────────────────────── */}
      <div ref={chartsRef}>
        <Charts
          monthlyTrend={monthlyTrend}
          batchBreakdown={batchBreakdown}
          totalStudents={stats.totalStudents}
          isLoading={isLoading}
        />
      </div>

    </div>
  )
}
