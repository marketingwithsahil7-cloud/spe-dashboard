import { useState, useEffect, useRef } from 'react'
import {
  format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isToday as isTodayFn,
} from 'date-fns'
import {
  Search, MessageCircle, UserSearch, Activity,
  TrendingUp, Calendar, Zap, ChevronDown,
} from 'lucide-react'
import { gsap } from '../../lib/animations'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { cn, getBatchColor } from '../../lib/utils'
import { isAcademyDay } from '../../lib/schedule'
import type { Student, BatchType } from '../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

type BatchFilter = 'All' | BatchType

interface StudentReport {
  thisMonthPercent:  number
  thisMonthPresent:  number
  thisMonthSessions: number
  lastMonthPercent:  number
  streak:            number
  allTimeTotal:      number
  monthAttendance:   Record<string, boolean | null>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getGreeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
}

function attendanceLabel(pct: number): string {
  if (pct >= 80) return 'Excellent 🌟'
  if (pct >= 60) return 'Good 👍'
  return 'Needs Improvement ⚠️'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniStatCard({
  icon, label, value, color,
}: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {icon}
        </div>
        <span className="font-body text-[11px] text-slate-500">{label}</span>
      </div>
      <p className={cn('font-display text-xl font-bold leading-none', color)}>{value}</p>
    </div>
  )
}

// ─── Student calendar ─────────────────────────────────────────────────────────

function StudentCalendar({
  month,
  attendance,
}: {
  month:      Date
  attendance: Record<string, boolean | null>
}) {
  const days   = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const offset = getDay(startOfMonth(month))
  const today  = new Date()

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => (
          <div
            key={d}
            className="text-center font-body text-[10px] text-slate-600 font-semibold uppercase py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => <div key={`b-${i}`} />)}
        {days.map(day => {
          const key       = format(day, 'yyyy-MM-dd')
          const isAcademy = isAcademyDay(day)
          const inFuture  = day > today
          const isToday   = isTodayFn(day)
          const present   = attendance[key]   // true | false | null | undefined

          return (
            <div
              key={key}
              title={
                !isAcademy
                  ? 'No session'
                  : present === true
                  ? 'Present'
                  : present === false
                  ? 'Absent'
                  : 'No data'
              }
              className={cn(
                'relative flex flex-col items-center justify-center py-2 rounded-xl transition-all',
                isToday && 'ring-1 ring-white/30',
                (!isAcademy || inFuture) && 'opacity-25',
              )}
              style={{
                background: isAcademy && !inFuture
                  ? present === true  ? 'rgba(0,255,135,0.15)'
                  : present === false ? 'rgba(255,61,87,0.15)'
                  : 'rgba(255,255,255,0.03)'
                  : 'transparent',
              }}
            >
              <span className={cn(
                'font-body text-[11px] leading-none',
                isAcademy && !inFuture
                  ? present === true  ? 'text-grass font-semibold'
                  : present === false ? 'text-danger font-semibold'
                  : 'text-slate-600'
                  : 'text-slate-700',
              )}>
                {format(day, 'd')}
              </span>

              {isAcademy && !inFuture && (
                <span
                  className={cn(
                    'mt-0.5 w-1.5 h-1.5 rounded-full',
                    present === true  ? 'bg-grass'
                    : present === false ? 'bg-danger'
                    : 'bg-white/10',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 justify-end">
        <span className="flex items-center gap-1.5 font-body text-[10px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-grass inline-block" />
          Present
        </span>
        <span className="flex items-center gap-1.5 font-body text-[10px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" />
          Absent
        </span>
        <span className="flex items-center gap-1.5 font-body text-[10px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-white/10 inline-block" />
          No data
        </span>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <Skeleton height={64} rounded="rounded-full" className="w-16 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton height={22} className="w-1/2" />
            <Skeleton height={12} className="w-1/3" />
          </div>
          <Skeleton height={48} className="w-16 shrink-0" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-2">
            <Skeleton height={10} className="w-2/3" />
            <Skeleton height={24} className="w-1/2" />
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-5 space-y-3">
        <Skeleton height={10} className="w-1/3 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} height={40} rounded="rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentAttendanceView() {
  const [batchFilter,      setBatchFilter]      = useState<BatchFilter>('All')
  const [search,           setSearch]           = useState('')
  const [students,         setStudents]         = useState<Student[]>([])
  const [studentsLoading,  setStudentsLoading]  = useState(true)
  const [selectedStudent,  setSelectedStudent]  = useState<Student | null>(null)
  const [selectedMonth,    setSelectedMonth]    = useState<Date>(() => startOfMonth(new Date()))
  const [report,           setReport]           = useState<StudentReport | null>(null)
  const [reportLoading,    setReportLoading]    = useState(false)
  const [showMonthPicker,  setShowMonthPicker]  = useState(false)

  const selectorRef = useRef<HTMLDivElement>(null)
  const reportRef   = useRef<HTMLDivElement>(null)

  // Load active/trial students
  useEffect(() => {
    supabase
      .from('students')
      .select('*')
      .in('status', ['active', 'trial'])
      .order('name')
      .then(({ data }) => {
        setStudents((data ?? []) as Student[])
        setStudentsLoading(false)
      })
  }, [])

  // GSAP stagger when student cards appear
  useEffect(() => {
    if (studentsLoading || !selectorRef.current) return
    const cards = selectorRef.current.querySelectorAll('[data-student-card]')
    gsap.fromTo(
      cards,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'back.out(1.2)', clearProps: 'all' },
    )
  }, [studentsLoading, batchFilter, search])

  // Load report when student or month changes
  useEffect(() => {
    if (!selectedStudent) return
    setReportLoading(true)
    setReport(null)

    const load = async () => {
      const today      = new Date()
      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
      const monthEnd   = format(endOfMonth(selectedMonth),   'yyyy-MM-dd')
      const prevMonth  = subMonths(selectedMonth, 1)
      const prevStart  = format(startOfMonth(prevMonth), 'yyyy-MM-dd')
      const prevEnd    = format(endOfMonth(prevMonth),   'yyyy-MM-dd')

      type AttRow = { date: string; present: boolean }
      const [{ data: allTime }, { data: thisMonthData }, { data: prevMonthData }] = await Promise.all([
        supabase
          .from('attendance')
          .select('date, present')
          .eq('student_id', selectedStudent.id)
          .order('date', { ascending: false }),
        supabase
          .from('attendance')
          .select('date, present')
          .eq('student_id', selectedStudent.id)
          .gte('date', monthStart)
          .lte('date', monthEnd),
        supabase
          .from('attendance')
          .select('date, present')
          .eq('student_id', selectedStudent.id)
          .gte('date', prevStart)
          .lte('date', prevEnd),
      ]) as [
        { data: AttRow[] | null; error: unknown },
        { data: AttRow[] | null; error: unknown },
        { data: AttRow[] | null; error: unknown },
      ]

      // Build month attendance map (null = no record on academy day)
      const monthAttendance: Record<string, boolean | null> = {}
      eachDayOfInterval({ start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) })
        .filter(isAcademyDay)
        .forEach(d => { monthAttendance[format(d, 'yyyy-MM-dd')] = null })
      ;(thisMonthData ?? []).forEach(r => { monthAttendance[r.date] = r.present })

      // This month stats (academy days up to today only)
      const academyDaysThisMonth = eachDayOfInterval({
        start: startOfMonth(selectedMonth),
        end:   endOfMonth(selectedMonth),
      }).filter(d => isAcademyDay(d) && d <= today)
      const thisMonthSessions = academyDaysThisMonth.length
      const thisMonthPresent  = (thisMonthData ?? []).filter(r => r.present).length
      const thisMonthPercent  = thisMonthSessions > 0
        ? Math.round((thisMonthPresent / thisMonthSessions) * 100)
        : 0

      // Last month stats (all academy days)
      const prevDays     = eachDayOfInterval({ start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) })
      const prevAcademy  = prevDays.filter(isAcademyDay)
      const prevPresent  = (prevMonthData ?? []).filter(r => r.present).length
      const lastMonthPercent = prevAcademy.length > 0
        ? Math.round((prevPresent / prevAcademy.length) * 100)
        : 0

      // All-time total present
      const allTimeTotal = (allTime ?? []).filter(r => r.present).length

      // Streak: consecutive recent academy days with present=true
      let streak = 0
      if (allTime && allTime.length > 0) {
        const presentSet = new Set(allTime.filter(r => r.present).map(r => r.date))
        const lookbackStart = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        const lookbackAcademy = eachDayOfInterval({ start: lookbackStart, end: today })
          .filter(d => isAcademyDay(d) && d <= today)
          .reverse()  // most recent first

        for (const d of lookbackAcademy) {
          if (presentSet.has(format(d, 'yyyy-MM-dd'))) {
            streak++
          } else {
            break
          }
        }
      }

      setReport({ thisMonthPercent, thisMonthPresent, thisMonthSessions, lastMonthPercent, streak, allTimeTotal, monthAttendance })
    }

    load()
      .catch(console.error)
      .finally(() => setReportLoading(false))
  }, [selectedStudent, selectedMonth])

  // GSAP stagger report sections when loaded
  useEffect(() => {
    if (!reportLoading && report && reportRef.current) {
      const sections = reportRef.current.querySelectorAll('[data-section]')
      gsap.fromTo(
        sections,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.09, ease: 'back.out(1.2)', clearProps: 'all' },
      )
    }
  }, [reportLoading, report])

  // Filter students
  const filtered = students.filter(s => {
    const matchBatch  = batchFilter === 'All' || s.batch === batchFilter || s.batch === 'Both'
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    return matchBatch && matchSearch
  })

  // Last 6 months for month picker
  const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(startOfMonth(new Date()), i))

  // WhatsApp share report
  const handleShare = () => {
    if (!selectedStudent || !report) return
    const monthName = format(selectedMonth, 'MMMM yyyy')
    const pct    = report.thisMonthPercent
    const status = attendanceLabel(pct)
    const lines  = [
      `${getGreeting()},`,
      '',
      `Dear Parent, here is ${selectedStudent.name}'s attendance report for ${monthName}:`,
      `Present: ${report.thisMonthPresent} out of ${report.thisMonthSessions} sessions (${pct}%)`,
      `Status: ${status}`,
      '',
      '— Soccer Pro Elite Football Academy ⚽',
    ]
    const phone = selectedStudent.parent_phone?.replace(/\D/g, '') ?? ''
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
    }
  }

  const pctColor = !report ? 'text-white'
    : report.thisMonthPercent >= 80 ? 'text-grass'
    : report.thisMonthPercent >= 60 ? 'text-amber'
    : 'text-danger'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Student selector ─────────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4 space-y-4">

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 font-body text-sm text-white placeholder-slate-600 focus:outline-none focus:border-grass/40 focus:ring-1 focus:ring-grass/20 transition-all"
            />
          </div>

          {/* Batch filter */}
          <div className="flex gap-1.5">
            {(['All', '5-6 PM', '6-7 PM'] as BatchFilter[]).map(b => (
              <button
                key={b}
                onClick={() => setBatchFilter(b)}
                className={cn(
                  'px-3 py-2 rounded-xl font-body text-xs font-semibold transition-all duration-150',
                  batchFilter === b
                    ? 'text-pitch bg-grass shadow-[0_0_12px_rgba(0,255,135,0.25)]'
                    : 'text-slate-400 glass glass-hover hover:text-white',
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Student cards row */}
        {studentsLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-28 glass rounded-xl p-3 space-y-2">
                <Skeleton height={40} rounded="rounded-full" className="w-10 mx-auto" />
                <Skeleton height={9} className="w-full" />
                <Skeleton height={8} className="w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <UserSearch size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="font-body text-sm text-slate-500">No students found</p>
          </div>
        ) : (
          <div
            className="overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            <div ref={selectorRef} className="flex gap-3 min-w-max">
              {filtered.map(s => (
                <button
                  key={s.id}
                  data-student-card
                  onClick={() => setSelectedStudent(prev => prev?.id === s.id ? null : s)}
                  className={cn(
                    'shrink-0 w-28 rounded-xl p-3 flex flex-col items-center gap-2 text-center transition-all duration-200 focus:outline-none',
                    selectedStudent?.id === s.id
                      ? 'border-2 border-grass shadow-[0_0_16px_rgba(0,255,135,0.2)]'
                      : 'glass glass-hover border border-white/[0.06]',
                  )}
                  style={selectedStudent?.id === s.id ? { background: 'rgba(0,255,135,0.08)' } : {}}
                >
                  <Avatar name={s.name} src={s.photo_url} size="sm" />
                  <p className="font-body text-[11px] font-semibold text-white leading-tight line-clamp-2">
                    {s.name}
                  </p>
                  <span className={cn('font-body text-[10px] font-medium', getBatchColor(s.batch))}>
                    {s.batch}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Report ─────────────────────────────────────────────────────────────── */}
      {!selectedStudent ? (
        <div className="glass rounded-2xl p-14 text-center">
          <UserSearch size={40} className="text-slate-700 mx-auto mb-4" />
          <p className="font-display text-base text-slate-500 uppercase tracking-wider">
            Select a Student
          </p>
          <p className="font-body text-xs text-slate-600 mt-1.5">
            Pick a student above to view their attendance report
          </p>
        </div>
      ) : reportLoading ? (
        <ReportSkeleton />
      ) : report ? (
        <div ref={reportRef} className="space-y-4">

          {/* Hero */}
          <div data-section className="glass rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <Avatar name={selectedStudent.name} src={selectedStudent.photo_url} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl text-white font-bold leading-tight">
                  {selectedStudent.name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant={selectedStudent.status} />
                  <span className={cn('font-body text-xs font-semibold', getBatchColor(selectedStudent.batch))}>
                    {selectedStudent.batch}
                  </span>
                </div>
                {selectedStudent.parent_name && (
                  <p className="font-body text-xs text-slate-500 mt-1">{selectedStudent.parent_name}</p>
                )}
              </div>

              {/* Big percentage */}
              <div className="text-right shrink-0">
                <p className={cn('font-display text-5xl font-bold leading-none', pctColor)}>
                  {report.thisMonthPercent}%
                </p>
                <p className="font-body text-[11px] text-slate-500 mt-1">
                  {report.thisMonthPresent}/{report.thisMonthSessions} sessions
                </p>
                <p className={cn('font-body text-[10px] mt-0.5', pctColor)}>
                  {attendanceLabel(report.thisMonthPercent)}
                </p>
              </div>
            </div>
          </div>

          {/* Month selector */}
          <div data-section className="relative">
            <button
              onClick={() => setShowMonthPicker(p => !p)}
              className="glass glass-hover rounded-2xl px-4 py-2.5 flex items-center gap-2 w-full"
            >
              <Calendar size={14} className="text-grass shrink-0" />
              <span className="font-display text-sm text-white flex-1 text-left">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <ChevronDown
                size={14}
                className={cn('text-slate-400 transition-transform duration-200', showMonthPicker && 'rotate-180')}
              />
            </button>

            {showMonthPicker && (
              <div
                className="absolute top-full left-0 right-0 mt-2 z-20 glass rounded-2xl p-3 flex gap-2 flex-wrap"
                style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
              >
                {monthOptions.map(m => {
                  const key      = format(m, 'yyyy-MM')
                  const selected = key === format(selectedMonth, 'yyyy-MM')
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelectedMonth(m); setShowMonthPicker(false) }}
                      className={cn(
                        'flex-1 min-w-[80px] px-3 py-2 rounded-xl font-body text-xs font-semibold transition-all duration-150',
                        selected
                          ? 'text-pitch bg-grass shadow-[0_0_10px_rgba(0,255,135,0.3)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.06]',
                      )}
                    >
                      {format(m, 'MMM yy')}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div data-section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStatCard
              icon={<Activity size={14} className="text-grass" />}
              label="This Month"
              value={`${report.thisMonthPercent}%`}
              color={report.thisMonthPercent >= 80 ? 'text-grass' : report.thisMonthPercent >= 60 ? 'text-amber' : 'text-danger'}
            />
            <MiniStatCard
              icon={<TrendingUp size={14} className="text-ice" />}
              label="Last Month"
              value={`${report.lastMonthPercent}%`}
              color={report.lastMonthPercent >= 80 ? 'text-grass' : report.lastMonthPercent >= 60 ? 'text-amber' : 'text-danger'}
            />
            <MiniStatCard
              icon={<Zap size={14} className="text-amber" />}
              label="Streak"
              value={`${report.streak}${report.streak === 1 ? ' day' : ' days'}`}
              color={report.streak >= 5 ? 'text-grass' : report.streak >= 2 ? 'text-amber' : 'text-slate-400'}
            />
            <MiniStatCard
              icon={<Calendar size={14} className="text-ice" />}
              label="All-Time"
              value={`${report.allTimeTotal}`}
              color="text-ice"
            />
          </div>

          {/* Calendar */}
          <div data-section className="glass rounded-2xl p-5">
            <h3 className="font-display text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              {format(selectedMonth, 'MMMM yyyy')} — Session Calendar
            </h3>
            <StudentCalendar month={selectedMonth} attendance={report.monthAttendance} />
          </div>

          {/* WhatsApp share */}
          {selectedStudent.parent_phone && (
            <div data-section>
              <button
                onClick={handleShare}
                className="w-full rounded-2xl p-4 flex items-center justify-center gap-2.5 font-body text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(0,255,135,0.06)',
                  border:     '1px solid rgba(0,255,135,0.25)',
                  color:      '#00FF87',
                }}
                onMouseEnter={e => {
                  const t = e.currentTarget
                  t.style.background = 'rgba(0,255,135,0.12)'
                  t.style.boxShadow  = '0 0 20px rgba(0,255,135,0.15)'
                }}
                onMouseLeave={e => {
                  const t = e.currentTarget
                  t.style.background = 'rgba(0,255,135,0.06)'
                  t.style.boxShadow  = 'none'
                }}
              >
                <MessageCircle size={16} />
                Share Report via WhatsApp
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
