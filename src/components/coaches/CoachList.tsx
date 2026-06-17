import { useRef, useEffect } from 'react'
import { Phone, MessageCircle, CalendarDays, IndianRupee, TrendingUp } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { cn, formatCurrency, formatPhone } from '../../lib/utils'
import type { CoachWithStats } from '../../hooks/useCoaches'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoachListProps {
  coaches:          CoachWithStats[]
  isLoading:        boolean
  onViewAttendance: (coach: CoachWithStats) => void
}

// ─── Coach card ───────────────────────────────────────────────────────────────

interface CoachCardProps {
  coach:            CoachWithStats
  onViewAttendance: (coach: CoachWithStats) => void
}

function CoachCard({ coach, onViewAttendance }: CoachCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, { scale: 1.02, duration: 0.2, ease: 'power2.out' })
  }
  const handleMouseLeave = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })
  }

  const waURL = coach.phone
    ? `https://wa.me/${coach.phone.replace(/\D/g, '')}`
    : null

  const isHead = coach.role === 'head'

  return (
    <div
      ref={cardRef}
      className="coach-card glass rounded-2xl p-5 flex flex-col gap-4 will-change-transform"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Avatar name={coach.name} size="xl" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-white leading-tight truncate">
            {coach.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant={isHead ? 'head' : 'assistant'} />
            <span
              className="font-display text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
            >
              ₹{coach.per_session_rate}/session
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-xl p-3 flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <CalendarDays size={13} className="text-grass shrink-0" />
          <div>
            <p className="font-display text-xl font-bold text-white leading-none">
              {coach.sessionsThisMonth}
            </p>
            <p className="font-body text-[10px] text-slate-500 mt-0.5">sessions</p>
          </div>
        </div>
        <div
          className="rounded-xl p-3 flex items-center gap-2"
          style={{ background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.12)' }}
        >
          <IndianRupee size={13} className="text-grass shrink-0" />
          <div>
            <p className="font-display text-xl font-bold text-grass leading-none">
              {formatCurrency(coach.earningsThisMonth)}
            </p>
            <p className="font-body text-[10px] text-slate-500 mt-0.5">earned</p>
          </div>
        </div>
      </div>

      {/* ── Phone ──────────────────────────────────────────────────── */}
      {coach.phone ? (
        <div className="flex items-center gap-2 text-slate-400 text-xs font-body">
          <Phone size={11} className="shrink-0" />
          <span>{formatPhone(coach.phone)}</span>
        </div>
      ) : (
        <p className="text-[11px] font-body text-slate-600">No phone on file</p>
      )}

      {/* ── Actions ────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          icon={<MessageCircle size={13} />}
          className="flex-1 text-xs"
          disabled={!waURL}
          onClick={() => waURL && window.open(waURL, '_blank')}
        >
          WhatsApp
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<TrendingUp size={13} />}
          className="flex-1 text-xs"
          onClick={() => onViewAttendance(coach)}
        >
          Attendance
        </Button>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function CoachCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <Skeleton width={56} height={56} rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={18} className="w-3/5" />
          <div className="flex gap-2">
            <Skeleton width={72} height={18} rounded="rounded-md" />
            <Skeleton width={88} height={18} rounded="rounded-md" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton height={56} rounded="rounded-xl" />
        <Skeleton height={56} rounded="rounded-xl" />
      </div>
      <Skeleton height={12} className="w-2/5" />
      <div className="flex gap-2">
        <Skeleton height={32} className="flex-1 rounded-xl" />
        <Skeleton height={32} className="flex-1 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CoachList({ coaches, isLoading, onViewAttendance }: CoachListProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading || !gridRef.current) return
    const cards = gridRef.current.querySelectorAll<HTMLElement>('.coach-card')
    if (cards.length === 0) return
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)', clearProps: 'all' },
    )
  }, [isLoading])

  if (!isLoading && coaches.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="font-body text-sm text-slate-500">No coaches found.</p>
      </div>
    )
  }

  return (
    <div
      ref={gridRef}
      className={cn('grid gap-4', 'grid-cols-1 md:grid-cols-2')}
    >
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => <CoachCardSkeleton key={i} />)
        : coaches.map(coach => (
            <CoachCard
              key={coach.id}
              coach={coach}
              onViewAttendance={onViewAttendance}
            />
          ))
      }
    </div>
  )
}
