import { useEffect, useRef } from 'react'
import { CalendarDays, IndianRupee, ClipboardCheck } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../lib/utils'
import type { CoachWithStats } from '../../hooks/useCoaches'

interface MyCoachPanelProps {
  coach:            CoachWithStats | null
  isLoading:        boolean
  onGoToAttendance: () => void
}

export function MyCoachPanel({ coach, isLoading, onGoToAttendance }: MyCoachPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const cards = containerRef.current.querySelectorAll('[data-card]')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' },
    )
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-36 rounded-2xl skeleton" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 rounded-2xl skeleton" />
          <div className="h-28 rounded-2xl skeleton" />
        </div>
        <div className="h-24 rounded-2xl skeleton" />
      </div>
    )
  }

  if (!coach) return null

  return (
    <div ref={containerRef} className="flex flex-col gap-4">

      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <div
        data-card
        className="glass rounded-2xl p-6 flex items-center gap-5"
      >
        <Avatar name={coach.name} size="xl" className="w-20 h-20 text-2xl shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl font-bold text-white leading-tight">
            {coach.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="assistant" />
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-body text-xs text-slate-400"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <IndianRupee size={10} />
              {formatCurrency(coach.per_session_rate)} / session
            </span>
          </div>
          {coach.phone && (
            <p className="font-body text-sm text-slate-500 mt-2">{coach.phone}</p>
          )}
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div data-card className="glass rounded-2xl p-5 flex flex-col gap-2">
          <CalendarDays size={18} className="text-grass" />
          <p className="font-display text-4xl font-bold text-white leading-none">
            {coach.sessionsThisMonth}
          </p>
          <p className="font-body text-xs text-slate-500">Sessions this month</p>
        </div>
        <div data-card className="glass rounded-2xl p-5 flex flex-col gap-2">
          <IndianRupee size={18} className="text-amber" />
          <p className="font-display text-4xl font-bold text-white leading-none">
            {formatCurrency(coach.earningsThisMonth)}
          </p>
          <p className="font-body text-xs text-slate-500">Earnings this month</p>
        </div>
      </div>

      {/* ── Confirm CTA ──────────────────────────────────────────────────── */}
      <div
        data-card
        className="glass rounded-2xl p-5 flex items-center justify-between gap-4"
        style={{ border: '1px solid rgba(0,255,135,0.1)' }}
      >
        <div>
          <p className="font-body text-sm font-semibold text-white">
            Confirm your sessions
          </p>
          <p className="font-body text-xs text-slate-500 mt-0.5">
            Review attendance records marked for you and confirm or dispute them.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<ClipboardCheck size={14} />}
          onClick={onGoToAttendance}
        >
          My Attendance
        </Button>
      </div>

    </div>
  )
}
