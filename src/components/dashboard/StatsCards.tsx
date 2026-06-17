import { useRef, useEffect } from 'react'
import { Users, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { SkeletonStat } from '../ui/Skeleton'
import { cn } from '../../lib/utils'
import type { DashboardReturn } from '../../hooks/useDashboard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsCardsProps {
  stats: DashboardReturn['stats']
  hasOverdue: boolean
  isLoading: boolean
}

interface StatCardConfig {
  Icon: LucideIcon
  iconClass: string
  iconStyle: React.CSSProperties
  label: string
  value: number
  prefix?: string
  suffix?: string
  subtitle: string
  numberClass: string
  glowClass: string
  borderClass: string
  pulse?: boolean
}

// ─── Slot-machine count-up ────────────────────────────────────────────────────

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}

function AnimatedNumber({ value, prefix, suffix, className }: AnimatedNumberProps) {
  const numRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = numRef.current
    if (!el) return

    // Phase 1 — slot machine flash (600ms, 50ms ticks)
    const FLASH_DURATION = 600
    const TICK = 50
    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += TICK
      el.textContent = Math.floor(Math.random() * value * 1.5).toLocaleString('en-IN')
      if (elapsed >= FLASH_DURATION) {
        clearInterval(interval)
        // Phase 2 — GSAP settle to real value (800ms)
        const obj = { val: Math.floor(Math.random() * value * 1.5) }
        const tween = gsap.to(obj, {
          val: value,
          duration: 0.8,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = Math.round(obj.val).toLocaleString('en-IN') },
        })
        return () => tween.kill()
      }
    }, TICK)

    return () => clearInterval(interval)
  }, [value])

  return (
    <span className={cn('font-display font-semibold leading-none', className)}>
      {prefix && <span className="text-2xl mr-0.5">{prefix}</span>}
      <span ref={numRef} className="tabular-nums">0</span>
      {suffix && <span className="text-2xl ml-0.5">{suffix}</span>}
    </span>
  )
}

// ─── Inner card — handles GSAP hover ─────────────────────────────────────────

interface StatCardProps extends StatCardConfig {
  className?: string
}

function StatCard({
  Icon, iconClass, iconStyle, label, value, prefix, suffix,
  subtitle, numberClass, glowClass, borderClass, pulse, className,
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const onEnter = () => gsap.to(el, { scale: 1.02, duration: 0.2, ease: 'power2.out' })
    const onLeave = () => gsap.to(el, { scale: 1,    duration: 0.25, ease: 'power2.out' })
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={cn(
        'glass p-5 flex flex-col gap-3 cursor-default will-change-transform',
        glowClass,
        borderClass && `border ${borderClass}`,
        pulse && 'glow-red',
        className,
      )}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between">
        <p className="font-body text-xs text-slate-400 uppercase tracking-wider leading-none pt-0.5">
          {label}
        </p>
        <div className="p-2.5 rounded-xl shrink-0" style={iconStyle}>
          <Icon size={18} className={iconClass} />
        </div>
      </div>

      {/* Animated number */}
      <AnimatedNumber
        value={value}
        prefix={prefix}
        suffix={suffix}
        className={cn('text-4xl', numberClass)}
      />

      {/* Subtitle */}
      <p className="font-body text-xs text-slate-500 leading-none">{subtitle}</p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function StatsCards({ stats, hasOverdue, isLoading }: StatsCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const cards = containerRef.current.querySelectorAll<HTMLElement>('.stat-card')
    gsap.matchMedia().add('(min-width: 768px)', () => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' },
      )
    })
    gsap.matchMedia().add('(max-width: 767px)', () => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', clearProps: 'all' },
      )
    })
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
    )
  }

  const lowAttendance = stats.attendancePercent < 70

  const cards: StatCardConfig[] = [
    {
      Icon: Users,
      iconClass: 'text-grass',
      iconStyle: { background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' },
      label: 'Active Students',
      value: stats.totalStudents,
      subtitle: '2 batches',
      numberClass: 'text-white',
      glowClass: 'hover:shadow-[0_0_30px_rgba(0,255,135,0.2)]',
      borderClass: 'border-white/[0.08]',
    },
    {
      Icon: CheckSquare,
      iconClass: lowAttendance ? 'text-amber' : 'text-ice',
      iconStyle: lowAttendance
        ? { background: 'rgba(255,184,0,0.1)',  border: '1px solid rgba(255,184,0,0.2)' }
        : { background: 'rgba(0,212,255,0.1)',  border: '1px solid rgba(0,212,255,0.2)' },
      label: "Today's Attendance",
      value: stats.attendancePercent,
      suffix: '%',
      subtitle: `${stats.todayAttendance} present`,
      numberClass: lowAttendance ? 'text-amber' : 'text-ice',
      glowClass: lowAttendance
        ? 'hover:shadow-[0_0_30px_rgba(255,184,0,0.2)]'
        : 'hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]',
      borderClass: lowAttendance ? 'border-amber/20' : 'border-white/[0.08]',
    },
    {
      Icon: TrendingUp,
      iconClass: 'text-grass',
      iconStyle: { background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' },
      label: 'Revenue This Month',
      value: stats.monthlyRevenue,
      prefix: '₹',
      subtitle: 'collected',
      numberClass: 'text-white',
      glowClass: 'hover:shadow-[0_0_30px_rgba(0,255,135,0.2)]',
      borderClass: 'border-white/[0.08]',
    },
    {
      Icon: AlertCircle,
      iconClass: hasOverdue ? 'text-danger' : 'text-amber',
      iconStyle: hasOverdue
        ? { background: 'rgba(255,61,87,0.12)',  border: '1px solid rgba(255,61,87,0.3)' }
        : { background: 'rgba(255,184,0,0.1)',   border: '1px solid rgba(255,184,0,0.2)' },
      label: 'Pending Fees',
      value: stats.pendingFees,
      prefix: '₹',
      subtitle: 'needs collection',
      numberClass: hasOverdue ? 'text-danger' : 'text-amber',
      glowClass: '',
      borderClass: hasOverdue ? 'border-danger/40' : stats.pendingFees > 0 ? 'border-amber/30' : 'border-white/[0.08]',
      pulse: hasOverdue,
    },
  ]

  return (
    <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} className="stat-card" />
      ))}
    </div>
  )
}
