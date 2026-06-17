import { useRef, useEffect, useState } from 'react'
import {
  format, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { Skeleton } from '../ui/Skeleton'
import { fetchMonthSummary, type MonthSummary } from '../../hooks/useAttendance'
import { isAcademyDay } from '../../lib/schedule'
import { cn } from '../../lib/utils'
import type { BatchType } from '../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

type BatchFilter = BatchType | 'All'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Lerp a color between red → amber → green based on 0–100 attendance % */
function heatColor(percent: number): string {
  if (percent === 0)   return 'rgba(255,61,87,0.15)'
  if (percent < 50)    return `rgba(255,${Math.round(61 + (percent / 50) * 122)},87,0.6)`
  if (percent < 80)    return `rgba(${Math.round(255 - ((percent - 50) / 30) * 255)},${Math.round(184 + ((percent - 50) / 30) * 71)},0,0.7)`
  return `rgba(0,255,135,${0.4 + (percent - 80) / 100})`
}

function heatGlow(percent: number): string {
  if (percent >= 80) return '0 0 6px rgba(0,255,135,0.5)'
  if (percent >= 50) return '0 0 4px rgba(255,184,0,0.4)'
  if (percent > 0)   return '0 0 4px rgba(255,61,87,0.35)'
  return 'none'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color = 'text-white',
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
             style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {icon}
        </div>
        <span className="font-body text-xs text-slate-400">{label}</span>
      </div>
      <p className={cn('font-display text-2xl leading-none', color)}>{value}</p>
      {sub && <p className="font-body text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

// ─── Calendar heatmap ─────────────────────────────────────────────────────────

function MonthHeatmap({
  month,
  dailyStats,
}: {
  month: Date
  dailyStats: MonthSummary['dailyStats']
}) {
  const statsMap = Object.fromEntries(dailyStats.map(d => [d.date, d]))
  const days     = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const offset   = getDay(startOfMonth(month))

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center font-body text-[10px] text-slate-600 font-semibold uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => <div key={`b-${i}`} />)}
        {days.map(day => {
          const key       = format(day, 'yyyy-MM-dd')
          const stat      = statsMap[key]
          const inFuture  = day > new Date()
          const isAcademy = isAcademyDay(day)

          return (
            <div
              key={key}
              title={
                !isAcademy ? 'No session (not Tue/Thu/Sat)'
                : stat ? `${stat.present}/${stat.total} · ${stat.percent}%`
                : inFuture ? undefined
                : 'No data'
              }
              className={cn(
                'relative flex flex-col items-center gap-1 py-1.5 rounded-lg transition-transform cursor-default',
                isAcademy && !inFuture && 'hover:scale-110',
              )}
              style={{
                background: !isAcademy
                  ? 'transparent'
                  : stat
                  ? heatColor(stat.percent)
                  : inFuture
                  ? 'transparent'
                  : 'rgba(255,255,255,0.03)',
                boxShadow:  stat && isAcademy ? heatGlow(stat.percent) : 'none',
                border:     stat && isAcademy ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                opacity:    !isAcademy ? 0.25 : 1,
              }}
            >
              <span className={cn(
                'font-body text-[11px] leading-none',
                stat && isAcademy ? 'text-white font-semibold' : 'text-slate-600',
              )}>
                {format(day, 'd')}
              </span>
              {stat && isAcademy && (
                <span className="font-body text-[9px] leading-none text-white/70">
                  {stat.percent}%
                </span>
              )}
              {/* Session dot for academy days without data */}
              {isAcademy && !stat && !inFuture && (
                <span className="w-1 h-1 rounded-full bg-white/10" />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="font-body text-[10px] text-slate-600">Low</span>
        {[0, 25, 50, 75, 100].map(p => (
          <span
            key={p}
            className="w-4 h-4 rounded"
            style={{ background: heatColor(p === 0 ? 5 : p) }}
          />
        ))}
        <span className="font-body text-[10px] text-slate-600">High</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const BATCH_FILTERS: { label: string; value: BatchFilter }[] = [
  { label: 'All',    value: 'All'    },
  { label: '5-6 PM', value: '5-6 PM' },
  { label: '6-7 PM', value: '6-7 PM' },
]

export function AttendanceHistory() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Default: current month
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(new Date()))
  const [batchFilter,   setBatchFilter]   = useState<BatchFilter>('All')
  const [summary,       setSummary]       = useState<MonthSummary | null>(null)
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  // Fetch whenever month or batch changes
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchMonthSummary(
      selectedMonth.getMonth() + 1,
      selectedMonth.getFullYear(),
      batchFilter,
    )
      .then(data => {
        if (cancelled) return
        setSummary(data)
        setIsLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load history')
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedMonth, batchFilter])

  // GSAP entrance when data arrives
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('[data-card]')
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'back.out(1.2)', clearProps: 'all' },
      )
    }
  }, [isLoading, selectedMonth, batchFilter])

  const canGoForward = selectedMonth < startOfMonth(new Date())

  const prevMonth = () => setSelectedMonth(m => startOfMonth(subMonths(m, 1)))
  const nextMonth = () => {
    if (!canGoForward) return
    setSelectedMonth(m => startOfMonth(subMonths(m, -1)))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Month navigator + batch filter ────────────────────────────────────── */}
      <div className="glass rounded-2xl p-3 flex items-center gap-3 flex-wrap">
        {/* Month nav */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="flex-1 text-center font-display text-base text-white tracking-wide">
            {format(selectedMonth, 'MMMM yyyy')}
          </p>
          <button
            onClick={nextMonth}
            disabled={!canGoForward}
            className="w-8 h-8 rounded-lg glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Batch filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          {BATCH_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setBatchFilter(f.value)}
              className={[
                'px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all duration-150',
                batchFilter === f.value
                  ? 'text-pitch bg-grass shadow-[0_0_12px_rgba(0,255,135,0.25)]'
                  : 'text-slate-400 glass glass-hover hover:text-white',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      {error ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="font-body text-sm text-danger">{error}</p>
        </div>
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : !summary || summary.totalSessions === 0 ? (
        <EmptyState month={selectedMonth} />
      ) : (
        <div ref={containerRef} className="space-y-4">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div data-card>
              <StatCard
                icon={<Calendar size={14} className="text-ice" />}
                label="Sessions Held"
                value={String(summary.totalSessions)}
                sub="this month"
                color="text-ice"
              />
            </div>
            <div data-card>
              <StatCard
                icon={<Activity size={14} className="text-grass" />}
                label="Avg Attendance"
                value={`${summary.avgPercent}%`}
                sub="across all sessions"
                color={summary.avgPercent >= 75 ? 'text-grass' : summary.avgPercent >= 50 ? 'text-amber' : 'text-danger'}
              />
            </div>
            {summary.bestDay && (
              <div data-card>
                <StatCard
                  icon={<TrendingUp size={14} className="text-grass" />}
                  label="Best Day"
                  value={`${summary.bestDay.percent}%`}
                  sub={format(new Date(summary.bestDay.date + 'T12:00:00'), 'EEE, d MMM')}
                  color="text-grass"
                />
              </div>
            )}
            {summary.worstDay && (
              <div data-card>
                <StatCard
                  icon={<TrendingDown size={14} className="text-danger" />}
                  label="Worst Day"
                  value={`${summary.worstDay.percent}%`}
                  sub={format(new Date(summary.worstDay.date + 'T12:00:00'), 'EEE, d MMM')}
                  color="text-danger"
                />
              </div>
            )}
          </div>

          {/* Heatmap calendar */}
          <div data-card className="glass rounded-2xl p-5">
            <h3 className="font-display text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Daily Attendance Heatmap
            </h3>
            <MonthHeatmap month={selectedMonth} dailyStats={summary.dailyStats} />
          </div>

          {/* Daily breakdown list — top 5 + bottom 5 */}
          {summary.dailyStats.length > 0 && (
            <div data-card className="glass rounded-2xl p-5">
              <h3 className="font-display text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                All Sessions
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1"
                   style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                {[...summary.dailyStats]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(stat => (
                    <div
                      key={stat.date}
                      className="flex items-center gap-3"
                    >
                      <span className="font-body text-xs text-slate-500 w-24 shrink-0">
                        {format(new Date(stat.date + 'T12:00:00'), 'EEE, d MMM')}
                      </span>
                      {/* Bar */}
                      <div className="flex-1 h-2 rounded-full overflow-hidden"
                           style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${stat.percent}%`,
                            background: heatColor(stat.percent),
                          }}
                        />
                      </div>
                      <span className="font-body text-xs font-semibold w-16 text-right shrink-0"
                            style={{ color: heatColor(stat.percent) }}>
                        {stat.present}/{stat.total}
                        <span className="text-slate-500 font-normal ml-1">({stat.percent}%)</span>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-3">
            <Skeleton height={10} className="w-2/3" />
            <Skeleton height={28} className="w-1/2" />
            <Skeleton height={9}  className="w-1/3" />
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-5 space-y-3">
        <Skeleton height={10} className="w-1/3 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} height={40} rounded="rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ month }: { month: Date }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <Calendar size={32} className="text-slate-600 mx-auto mb-3" />
      <p className="font-display text-base text-slate-500 uppercase tracking-wider">
        No sessions recorded
      </p>
      <p className="font-body text-xs text-slate-600 mt-1">
        {format(month, 'MMMM yyyy')}
      </p>
    </div>
  )
}
