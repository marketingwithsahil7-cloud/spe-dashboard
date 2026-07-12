import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import { IndianRupee, ArrowRight, RefreshCw } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { useAuthStore } from '../../store/authStore'
import { useAcademySettings } from '../../hooks/useAcademySettings'
import { fetchCoachAttendance, fetchCoachAttendanceRange, groupAttendanceByDate, countSessionDays, countVerifiedSessionDays } from '../../hooks/useCoaches'
import { ROUTES, getGreeting } from '../../lib/constants'
import { formatCurrency } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { CoachAttendance } from '../../types/index'

// Only these two are real session slots on coach_attendance — 'Both' is a
// student-batch concept and never appears as a coach session record.
const SESSION_BATCHES = ['5-6 PM', '6-7 PM'] as const

function sessionStatus(records: CoachAttendance[], batch: string): 'verified' | 'pending' | 'not_marked' {
  const record = records.find(r => r.batch === batch)
  if (!record) return 'not_marked'
  return record.verified ? 'verified' : 'pending'
}

export function AssistantDashboard() {
  const navigate = useNavigate()
  const { coach } = useAuthStore()
  const { settings, isLoading: settingsLoading } = useAcademySettings()

  const [monthAttendance,  setMonthAttendance]  = useState<CoachAttendance[]>([])
  const [recentAttendance, setRecentAttendance] = useState<CoachAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!coach) return
    setIsLoading(true)
    setError(null)
    try {
      const today = new Date()
      const [monthRes, recentRes] = await Promise.all([
        fetchCoachAttendance(coach.id, today.getMonth() + 1, today.getFullYear()),
        fetchCoachAttendanceRange(coach.id, format(subDays(today, 6), 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')),
      ])
      setMonthAttendance(monthRes)
      setRecentAttendance(recentRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your coaching data')
    } finally {
      setIsLoading(false)
    }
  }, [coach])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const cards = containerRef.current.querySelectorAll('[data-card]')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' },
    )
  }, [isLoading])

  if (error) {
    return (
      <div className="glass p-8 flex flex-col items-center gap-4 text-center" style={{ border: '1px solid rgba(255,61,87,0.35)' }}>
        <p className="font-display text-lg text-danger uppercase tracking-wide">Failed to load dashboard</p>
        <p className="font-body text-sm text-slate-400">{error}</p>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={load}>Retry</Button>
      </div>
    )
  }

  if (isLoading || settingsLoading || !coach) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-16 rounded-2xl skeleton" />
        <div className="h-32 rounded-2xl skeleton" />
        <div className="h-40 rounded-2xl skeleton" />
        <div className="h-48 rounded-2xl skeleton" />
      </div>
    )
  }

  const firstName      = coach.name.split(' ')[0]
  const today          = new Date()
  const todayStr       = format(today, 'yyyy-MM-dd')
  const todayDayLower  = format(today, 'EEEE').toLowerCase()
  const trainingDays   = settings?.training_days ?? []
  const isTrainingDay  = trainingDays.includes(todayDayLower)
  const todayRecords   = recentAttendance.filter(r => r.date === todayStr)

  let nextTrainingDay: string | null = null
  if (!isTrainingDay) {
    for (let i = 1; i <= 7; i++) {
      const d = addDays(today, i)
      if (trainingDays.includes(format(d, 'EEEE').toLowerCase())) {
        nextTrainingDay = format(d, 'EEEE')
        break
      }
    }
  }

  const sessionsThisMonth  = countSessionDays(monthAttendance)
  const verifiedSessionsCt = countVerifiedSessionDays(monthAttendance)
  const pendingSessions    = sessionsThisMonth - verifiedSessionsCt
  const estimatedEarnings  = verifiedSessionsCt * coach.per_session_rate

  const recentSessions = Array.from(groupAttendanceByDate(recentAttendance).entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, records]) => ({
      date,
      batches:  records.map(r => r.batch).join(', '),
      verified: records.every(r => r.verified),
    }))

  return (
    <div ref={containerRef} className="space-y-5 pb-8">

      {/* ── 1. Greeting ─────────────────────────────────────────────────── */}
      <div data-card>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-white leading-tight">
          {getGreeting()}, {firstName}&nbsp;👋
        </h1>
        <p className="font-body text-sm text-slate-400 mt-1.5">{format(today, 'EEEE, d MMMM yyyy')}</p>
        <p className="font-body text-xs text-slate-500 mt-1">Your coaching summary</p>
      </div>

      {/* ── 2. Today's session status ───────────────────────────────────── */}
      <div data-card className="glass rounded-2xl p-5">
        <p className="font-display text-sm uppercase tracking-wider text-slate-400 mb-4">Today's Sessions</p>
        {isTrainingDay ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SESSION_BATCHES.map(batch => {
              const status = sessionStatus(todayRecords, batch)
              return (
                <div
                  key={batch}
                  className="rounded-xl p-4 flex items-center justify-between gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="font-body text-sm font-semibold text-white">{batch}</p>
                  {status === 'verified'   && <Badge variant="paid"    label="Verified by Sahil" />}
                  {status === 'pending'    && <Badge variant="pending" label="Pending verification" />}
                  {status === 'not_marked' && <Badge variant="closed"  label="Not marked yet" />}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="font-body text-sm text-slate-300">No session today</p>
            {nextTrainingDay && (
              <p className="font-body text-xs text-slate-500 mt-1">Next session: {nextTrainingDay}</p>
            )}
          </div>
        )}
      </div>

      {/* ── 3. This month's earnings ────────────────────────────────────── */}
      <div data-card className="glass rounded-2xl p-5">
        <p className="font-display text-sm uppercase tracking-wider text-slate-400 mb-4">This Month</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="font-display text-2xl font-bold text-white leading-none">{sessionsThisMonth}</p>
            <p className="font-body text-xs text-slate-500 mt-1">Sessions</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-grass leading-none">{verifiedSessionsCt}</p>
            <p className="font-body text-xs text-slate-500 mt-1">Verified</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-amber leading-none">{pendingSessions}</p>
            <p className="font-body text-xs text-slate-500 mt-1">Pending</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <IndianRupee size={18} className="text-grass shrink-0" />
          <p className="font-display text-3xl font-bold text-white">{formatCurrency(estimatedEarnings)}</p>
        </div>
        <p className="font-body text-xs text-slate-500 mt-2">
          Estimated earnings — final amount subject to payroll approval by Coach Sahil
        </p>
      </div>

      {/* ── 4. Recent sessions ───────────────────────────────────────────── */}
      <div data-card className="glass rounded-2xl p-5">
        <p className="font-display text-sm uppercase tracking-wider text-slate-400 mb-4">Recent Sessions</p>
        {recentSessions.length === 0 ? (
          <p className="font-body text-sm text-slate-500 text-center py-4">No sessions in the last 7 days</p>
        ) : (
          <div className="space-y-1">
            {recentSessions.map(r => (
              <div
                key={r.date}
                className="flex items-center justify-between gap-3 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <p className="font-body text-xs text-slate-400 w-16 shrink-0">{format(new Date(r.date), 'd MMM')}</p>
                  <p className="font-body text-sm text-white truncate">{r.batches}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.verified
                    ? <Badge variant="paid"    label="Verified" />
                    : <Badge variant="pending" label="Pending" />}
                  <p className="font-body text-sm text-slate-300 w-16 text-right">{formatCurrency(coach.per_session_rate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. Quick action ──────────────────────────────────────────────── */}
      <div data-card>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<ArrowRight size={14} />}
          onClick={() => navigate(`${ROUTES.COACHES}?tab=attendance`)}
        >
          Mark Today's Attendance
        </Button>
      </div>

    </div>
  )
}
