import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays, ClipboardList, History, BarChart3, Calendar, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from '../lib/animations'
import { PageGlow } from '../components/ui/PageGlow'
import { AttendanceSheet } from '../components/attendance/AttendanceSheet'
import { AttendanceHistory } from '../components/attendance/AttendanceHistory'
import { StudentAttendanceView } from '../components/attendance/StudentAttendanceView'
import {
  isAcademyDay,
  getNextAcademyDay,
  getPrevAcademyDay,
  getDefaultAttendanceDate,
} from '../lib/schedule'
import { cn } from '../lib/utils'
import type { BatchType } from '../types/index'

const BATCHES: BatchType[] = ['5-6 PM', '6-7 PM']
const AmbientBackground = lazy(() => import('../components/ui/AmbientBackground'))

type View = 'today' | 'history' | 'student'

// ─── Mini calendar picker ─────────────────────────────────────────────────────

const CAL_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function MiniCalendar({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: string
  onSelect:     (date: string) => void
  onClose:      () => void
}) {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    return new Date(y, m - 1, d)
  })

  const today = new Date()
  const days  = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  const offset = getDay(startOfMonth(viewMonth))

  const prevMonth = () => setViewMonth(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))
  const nextMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    if (next <= startOfMonth(today)) setViewMonth(next)
  }
  const canGoNext = viewMonth.getFullYear() < today.getFullYear() ||
                    viewMonth.getMonth()    < today.getMonth()

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl p-4"
        style={{
          background:  'rgba(18,18,26,0.98)',
          backdropFilter: 'blur(24px)',
          border:      '1px solid rgba(255,255,255,0.1)',
          boxShadow:   '0 16px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth}
            className="w-7 h-7 rounded-lg glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={14} />
          </button>
          <p className="font-display text-sm text-white tracking-wide">{format(viewMonth, 'MMMM yyyy')}</p>
          <button onClick={nextMonth} disabled={!canGoNext}
            className="w-7 h-7 rounded-lg glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {CAL_DAYS.map(d => (
            <div key={d} className="text-center font-body text-[10px] text-slate-600 font-semibold py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: offset }).map((_, i) => <div key={`b-${i}`} />)}
          {days.map(day => {
            const key        = format(day, 'yyyy-MM-dd')
            const isAcademy  = isAcademyDay(day)
            const isFuture   = day > today
            const isSelected = key === selectedDate
            const isToday    = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
            const inMonth    = isSameMonth(day, viewMonth)

            if (!inMonth || isFuture) {
              return (
                <div key={key}
                  className="aspect-square flex items-center justify-center rounded-lg opacity-20">
                  <span className="font-body text-[11px] text-slate-700">{format(day, 'd')}</span>
                </div>
              )
            }

            return (
              <button
                key={key}
                disabled={!isAcademy}
                onClick={() => { onSelect(key); onClose() }}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-150 relative',
                  isSelected  ? 'bg-grass text-pitch' : '',
                  isAcademy && !isSelected ? 'hover:bg-white/[0.08] text-white' : '',
                  !isAcademy  ? 'text-slate-700 cursor-not-allowed' : '',
                  isToday && !isSelected ? 'ring-1 ring-white/20' : '',
                )}
              >
                <span className={cn(
                  'font-body text-[12px] leading-none',
                  isSelected ? 'font-bold' : '',
                )}>
                  {format(day, 'd')}
                </span>
                {isAcademy && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-grass/60" />
                )}
              </button>
            )
          })}
        </div>

        {/* Academy day note */}
        <p className="font-body text-[10px] text-slate-600 text-center mt-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-grass/60 mr-1" />
          Tue · Thu · Sat are session days
        </p>
      </motion.div>
    </>
  )
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir * 20 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit:   (dir: number) => ({ opacity: 0, x: dir * -20, transition: { duration: 0.15 } }),
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [view,          setView]          = useState<View>('today')
  const [selectedDate,  setSelectedDate]  = useState(() => format(getDefaultAttendanceDate(), 'yyyy-MM-dd'))
  const [selectedBatch, setSelectedBatch] = useState<BatchType>('5-6 PM')
  const [slideDir,      setSlideDir]      = useState(1)
  const [showCalendar,  setShowCalendar]  = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
    )
  }, [])

  const parsedDate       = (() => { const [y, m, d] = selectedDate.split('-').map(Number); return new Date(y, m - 1, d) })()
  const selectedIsToday  = format(new Date(), 'yyyy-MM-dd') === selectedDate
  const selectedIsAcademy = isAcademyDay(parsedDate)

  const prevDay = () => {
    setSlideDir(-1)
    setSelectedDate(format(getPrevAcademyDay(parsedDate), 'yyyy-MM-dd'))
  }
  const nextDay = () => {
    const next = getNextAcademyDay(parsedDate)
    if (next > new Date()) return
    setSlideDir(1)
    setSelectedDate(format(next, 'yyyy-MM-dd'))
  }
  const goToday = () => {
    setSlideDir(1)
    setSelectedDate(format(getDefaultAttendanceDate(), 'yyyy-MM-dd'))
  }

  const switchView = (v: View) => {
    const order: View[] = ['today', 'history', 'student']
    setSlideDir(order.indexOf(v) > order.indexOf(view) ? 1 : -1)
    setView(v)
    setShowCalendar(false)
  }

  // ── Next academy day exists (for forward nav guard)
  const canGoForward = (() => {
    try {
      const next = getNextAcademyDay(parsedDate)
      return next <= new Date()
    } catch { return false }
  })()

  return (
    <div className="relative space-y-5">
      <PageGlow variant="green" />
      <Suspense fallback={null}><AmbientBackground variant="attendance" /></Suspense>
      {/* ── View tabs ─────────────────────────────────────────────────────────── */}
      <div ref={headerRef} className="flex items-center gap-2">
        <button
          onClick={() => switchView('today')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-200',
            view === 'today'
              ? 'text-pitch bg-grass shadow-[0_0_18px_rgba(0,255,135,0.3)]'
              : 'text-slate-400 glass glass-hover hover:text-white',
          )}
        >
          <ClipboardList size={15} />
          Mark Attendance
        </button>
        <button
          onClick={() => switchView('history')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-200',
            view === 'history'
              ? 'text-pitch bg-grass shadow-[0_0_18px_rgba(0,255,135,0.3)]'
              : 'text-slate-400 glass glass-hover hover:text-white',
          )}
        >
          <History size={15} />
          History
        </button>
        <button
          onClick={() => switchView('student')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-200',
            view === 'student'
              ? 'text-pitch bg-grass shadow-[0_0_18px_rgba(0,255,135,0.3)]'
              : 'text-slate-400 glass glass-hover hover:text-white',
          )}
        >
          <BarChart3 size={15} />
          Student Report
        </button>
      </div>

      <AnimatePresence mode="wait" custom={slideDir}>

        {/* ── Mark Attendance view ─────────────────────────────────────────────── */}
        {view === 'today' && (
          <motion.div
            key="today"
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-4"
          >
            {/* Date navigator */}
            <div className="glass rounded-2xl p-3 flex items-center justify-between gap-4 relative">
              <button
                onClick={prevDay}
                aria-label="Previous session day"
                className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Clickable date → calendar popup */}
              <div className="flex-1 text-center relative">
                <button
                  onClick={() => setShowCalendar(v => !v)}
                  className="group inline-flex flex-col items-center gap-0.5 focus:outline-none"
                >
                  <p className="font-display text-lg text-white tracking-wide leading-tight group-hover:text-grass transition-colors">
                    {format(parsedDate, 'EEEE, d MMMM yyyy')}
                  </p>
                  <span className="flex items-center gap-1 font-body text-xs">
                    {selectedIsToday
                      ? <span className="text-grass">Today</span>
                      : <span className="text-slate-500">Past session</span>}
                    <Calendar size={10} className="text-slate-600 group-hover:text-grass transition-colors" />
                  </span>
                </button>

                <AnimatePresence>
                  {showCalendar && (
                    <MiniCalendar
                      selectedDate={selectedDate}
                      onSelect={d => { setSelectedDate(d); setSlideDir(1) }}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={nextDay}
                disabled={!canGoForward}
                aria-label="Next session day"
                className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Batch tabs + today shortcut */}
            <div className="flex items-center gap-3 flex-wrap">
              {!selectedIsToday && (
                <button
                  onClick={goToday}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-medium text-grass transition-all"
                  style={{ border: '1px solid rgba(0,255,135,0.3)', background: 'rgba(0,255,135,0.06)' }}
                >
                  <CalendarDays size={12} />
                  Back to Today
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {BATCHES.map(b => (
                  <button
                    key={b}
                    onClick={() => setSelectedBatch(b)}
                    className={cn(
                      'px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all duration-200',
                      selectedBatch === b
                        ? 'text-pitch bg-grass shadow-[0_0_18px_rgba(0,255,135,0.3)]'
                        : 'text-slate-400 glass glass-hover hover:text-white',
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Non-academy day guard */}
            {!selectedIsAcademy ? (
              <div className="glass rounded-2xl p-10 text-center">
                <AlertCircle size={28} className="text-slate-600 mx-auto mb-3" />
                <p className="font-display text-base text-slate-400 uppercase tracking-wider">
                  No Session on {format(parsedDate, 'EEEE')}
                </p>
                <p className="font-body text-sm text-slate-600 mt-1.5">
                  Academy runs on Tuesday, Thursday &amp; Saturday only.
                </p>
              </div>
            ) : (
              <AttendanceSheet
                key={`${selectedDate}-${selectedBatch}`}
                date={selectedDate}
                batch={selectedBatch}
              />
            )}
          </motion.div>
        )}

        {/* ── History view ─────────────────────────────────────────────────────── */}
        {view === 'history' && (
          <motion.div
            key="history"
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <AttendanceHistory />
          </motion.div>
        )}

        {/* ── Student Report view ───────────────────────────────────────────────── */}
        {view === 'student' && (
          <motion.div
            key="student"
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <StudentAttendanceView />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
