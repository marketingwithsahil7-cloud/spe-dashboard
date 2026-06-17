import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, differenceInDays, subMonths, startOfYear,
} from 'date-fns'
import {
  ArrowLeft, Pencil, User, Calendar, IndianRupee,
  CheckCircle2, XCircle, MessageCircle, PlusCircle, RefreshCw,
} from 'lucide-react'
import { gsap } from '../../lib/animations'
import { supabase } from '../../lib/supabase'
import { usePermissions } from '../../hooks/usePermissions'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SkeletonCard, Skeleton } from '../ui/Skeleton'
import { cn, formatCurrency, formatDate, formatPhone } from '../../lib/utils'
import { getWhatsAppURL, ROUTES } from '../../lib/constants'
import type { Student, Attendance, Payment, FeeStatus } from '../../types/index'
import type { StudentWithFee } from '../../hooks/useStudents'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'attendance' | 'payments'

interface ProfileState {
  student:        StudentWithFee | null
  attendance:     Record<string, boolean>   // 'yyyy-MM-dd' → present
  attendanceStats:{ present: number; total: number; percent: number }
  payments:       Payment[]
  totalPaidYear:  number
  isLoading:      boolean
  error:          string | null
}

// ─── Fee-status helpers (replicated from useDashboard — no import cycle) ─────

function computeFeeStatus(
  student: Student,
  paidThisMonth: Set<string>,
  today: Date,
): { feeStatus: FeeStatus; daysOverdue: number; nextDueDate: string } {
  if (student.status !== 'active') return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: '' }
  const day = student.billing_cycle_day ?? 1
  const year = today.getFullYear(); const month = today.getMonth()
  if (paidThisMonth.has(student.id)) {
    const nm = month === 11 ? 0 : month + 1; const ny = month === 11 ? year + 1 : year
    return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: format(new Date(ny, nm, day), 'yyyy-MM-dd') }
  }
  const dueDate = new Date(year, month, day); const diff = differenceInDays(today, dueDate)
  if (diff > 0)   return { feeStatus: 'overdue',   daysOverdue: diff, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  if (diff === 0) return { feeStatus: 'due_today',  daysOverdue: 0,   nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  if (diff >= -3) return { feeStatus: 'due_soon',   daysOverdue: 0,   nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
}

// ─── Local data hook ──────────────────────────────────────────────────────────

function useStudentProfile(id: string, selectedMonth: Date) {
  const [state, setState] = useState<ProfileState>({
    student: null, attendance: {}, attendanceStats: { present: 0, total: 0, percent: 0 },
    payments: [], totalPaidYear: 0, isLoading: true, error: null,
  })

  const load = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const today      = new Date()
      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
      const monthEnd   = format(endOfMonth(selectedMonth),   'yyyy-MM-dd')
      const yearStart  = format(startOfYear(today), 'yyyy-MM-dd')
      const curStart   = format(startOfMonth(today), 'yyyy-MM-dd')
      const curEnd     = format(endOfMonth(today),   'yyyy-MM-dd')

      const [stuRes, attRes, payRes, curPaidRes] = await Promise.all([
        supabase.from('students').select('*').eq('id', id).single(),
        supabase.from('attendance').select('*').eq('student_id', id)
          .gte('date', monthStart).lte('date', monthEnd).order('date'),
        supabase.from('payments').select('*').eq('student_id', id)
          .gte('paid_date', yearStart).order('paid_date', { ascending: false }),
        supabase.from('payments').select('student_id')
          .eq('student_id', id).gte('paid_date', curStart).lte('paid_date', curEnd),
      ])

      if (stuRes.error) throw stuRes.error

      const student  = stuRes.data as Student
      const paidIds  = new Set((curPaidRes.data ?? []).map((p: { student_id: string }) => p.student_id))
      const feeInfo  = computeFeeStatus(student, paidIds, today)
      const rich: StudentWithFee = { ...student, ...feeInfo }

      const attRecords  = (attRes.data ?? []) as Attendance[]
      const attMap: Record<string, boolean> = {}
      attRecords.forEach(r => { attMap[r.date] = r.present })

      const present = attRecords.filter(r => r.present).length
      const total   = attRecords.length
      const percent = total > 0 ? Math.round((present / total) * 100) : 0

      const payments    = (payRes.data ?? []) as Payment[]
      const totalPaidYear = payments.reduce((s, p) => s + (p.amount ?? 0), 0)

      setState({
        student: rich,
        attendance: attMap,
        attendanceStats: { present, total, percent },
        payments,
        totalPaidYear,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      setState(s => ({ ...s, isLoading: false, error: err instanceof Error ? err.message : 'Failed to load' }))
    }
  }, [id, selectedMonth])

  useEffect(() => { load() }, [load])

  return { ...state, refetch: load }
}

// ─── Batch badge ──────────────────────────────────────────────────────────────

function BatchBadge({ batch }: { batch: string }) {
  const styles: Record<string, React.CSSProperties> = {
    '5-6 PM': { background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00FF87' },
    '6-7 PM': { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' },
    'Both':   { background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' },
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-display font-medium uppercase tracking-wider"
      style={styles[batch] ?? styles['Both']}>
      {batch}
    </span>
  )
}

// ─── Quick stat ───────────────────────────────────────────────────────────────

function QuickStat({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn('font-display text-2xl font-semibold', color)}>{value}</span>
      <span className="font-body text-[11px] text-slate-500 text-center leading-tight">{label}</span>
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ student }: { student: StudentWithFee }) {
  const waURL = student.parent_phone
    ? getWhatsAppURL(student.parent_phone, student.parent_name ?? student.name, student.name,
        new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), student.monthly_fee)
    : null

  const feeStatusColors: Record<FeeStatus, string> = {
    paid: '#00FF87', due_soon: '#FFB800', due_today: '#FFB800', overdue: '#FF3D57',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Parent card */}
      <div className="glass p-5 flex flex-col gap-3">
        <h4 className="font-display text-xs font-semibold text-slate-400 uppercase tracking-widest">Parent / Guardian</h4>
        {student.parent_name ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <User size={15} className="text-ice" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-semibold text-white">{student.parent_name}</p>
              {student.parent_phone && (
                <p className="font-body text-xs text-slate-400 mt-0.5">{formatPhone(student.parent_phone)}</p>
              )}
            </div>
            {waURL && (
              <Button size="sm" variant="ghost" icon={<MessageCircle size={13} />}
                onClick={() => window.open(waURL, '_blank')}>
                WhatsApp
              </Button>
            )}
          </div>
        ) : (
          <p className="font-body text-sm text-slate-500">No parent info on record</p>
        )}
      </div>

      {/* Fee card */}
      <div className="glass p-5 flex flex-col gap-3">
        <h4 className="font-display text-xs font-semibold text-slate-400 uppercase tracking-widest">Fee Details</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Monthly Fee', value: formatCurrency(student.monthly_fee) },
            { label: 'Billing Day', value: `Day ${student.billing_cycle_day ?? 1}` },
            { label: 'Next Due', value: student.nextDueDate ? formatDate(student.nextDueDate) : '—' },
            { label: 'Status', value: (
              <span style={{ color: feeStatusColors[student.feeStatus] }} className="font-display font-semibold">
                {student.feeStatus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )},
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="font-body text-[11px] text-slate-500">{label}</span>
              <span className="font-body text-sm font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Academy info card */}
      <div className="glass p-5 flex flex-col gap-3">
        <h4 className="font-display text-xs font-semibold text-slate-400 uppercase tracking-widest">Academy Info</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Join Date',  value: formatDate(student.join_date) },
            { label: 'Batch',      value: student.batch },
            { label: 'Status',     value: student.status.charAt(0).toUpperCase() + student.status.slice(1) },
            { label: 'Student ID', value: student.id.slice(0, 8).toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="font-body text-[11px] text-slate-500">{label}</span>
              <span className="font-body text-sm font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Attendance calendar ──────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function AttendanceCalendar({ month, attendance }: { month: Date; attendance: Record<string, boolean> }) {
  const days       = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startDay   = getDay(startOfMonth(month))   // 0=Sun

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center font-body text-[10px] text-slate-600 font-semibold uppercase py-1">{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Blank cells before month start */}
        {Array.from({ length: startDay }).map((_, i) => <div key={`blank-${i}`} />)}
        {/* Day cells */}
        {days.map(day => {
          const key     = format(day, 'yyyy-MM-dd')
          const hasData = key in attendance
          const present = attendance[key]
          return (
            <div key={key} className="flex flex-col items-center gap-1 py-1">
              <span className="font-body text-[11px] text-slate-500">{format(day, 'd')}</span>
              {hasData ? (
                present
                  ? <span className="w-2 h-2 rounded-full" style={{ background: '#00FF87', boxShadow: '0 0 5px rgba(0,255,135,0.6)' }} />
                  : <span className="w-2 h-2 rounded-full" style={{ background: '#FF3D57', boxShadow: '0 0 5px rgba(255,61,87,0.5)' }} />
              ) : (
                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Attendance tab ───────────────────────────────────────────────────────────

function AttendanceTab({
  attendance, stats, selectedMonth, onMonthChange,
}: {
  attendance: Record<string, boolean>
  stats: ProfileState['attendanceStats']
  selectedMonth: Date
  onMonthChange: (d: Date) => void
}) {
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy'), date: d }
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Month selector */}
      <div className="glass p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <select
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={e => {
              const opt = monthOptions.find(o => o.value === e.target.value)
              if (opt) onMonthChange(opt.date)
            }}
            className="w-full h-10 pl-3 pr-8 rounded-xl font-body text-sm text-white appearance-none outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {monthOptions.map(o => (
              <option key={o.value} value={o.value} style={{ background: '#12121A' }}>{o.label}</option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▾</span>
        </div>
        {/* Quick summary chips */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-grass" />
            <span className="font-display text-xs font-semibold text-white">{stats.present}</span>
            <span className="font-body text-xs text-slate-500">present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger" />
            <span className="font-display text-xs font-semibold text-white">{stats.total - stats.present}</span>
            <span className="font-body text-xs text-slate-500">absent</span>
          </div>
        </div>
      </div>

      {/* Attendance % summary */}
      {stats.total > 0 && (
        <div className="glass p-4 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-xl"
            style={{
              background: stats.percent >= 75 ? 'rgba(0,255,135,0.1)' : 'rgba(255,184,0,0.1)',
              border: `1px solid ${stats.percent >= 75 ? 'rgba(0,255,135,0.3)' : 'rgba(255,184,0,0.3)'}`,
              color: stats.percent >= 75 ? '#00FF87' : '#FFB800',
            }}
          >
            {stats.percent}%
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-white">
              {stats.present} of {stats.total} sessions attended
            </p>
            <p className="font-body text-xs text-slate-500 mt-0.5">
              {format(selectedMonth, 'MMMM yyyy')}
            </p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="glass p-5">
        <AttendanceCalendar month={selectedMonth} attendance={attendance} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-1">
        {[
          { color: '#00FF87', label: 'Present' },
          { color: '#FF3D57', label: 'Absent'  },
          { color: 'rgba(255,255,255,0.08)', label: 'No record' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="font-body text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {stats.total === 0 && (
        <div className="glass p-8 flex flex-col items-center gap-3">
          <Calendar size={28} className="text-slate-600" />
          <p className="font-body text-sm text-slate-500">No attendance records for this month</p>
        </div>
      )}
    </div>
  )
}

// ─── Payments tab ─────────────────────────────────────────────────────────────

function PaymentsTab({
  payments, totalPaidYear, studentId,
}: {
  payments: Payment[]
  totalPaidYear: number
  studentId: string
}) {
  const navigate = useNavigate()
  const { canRecordPayment } = usePermissions()

  return (
    <div className="flex flex-col gap-4">
      {/* Total + add button */}
      <div className="glass p-4 flex items-center justify-between">
        <div>
          <p className="font-body text-xs text-slate-500">Total Paid This Year</p>
          <p className="font-display text-2xl font-semibold text-grass mt-0.5">{formatCurrency(totalPaidYear)}</p>
        </div>
        {canRecordPayment && (
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle size={14} />}
            onClick={() => navigate(`${ROUTES.FEES}?student=${studentId}`)}
          >
            Add Payment
          </Button>
        )}
      </div>

      {/* Payment table */}
      {payments.length === 0 ? (
        <div className="glass p-8 flex flex-col items-center gap-3">
          <IndianRupee size={28} className="text-slate-600" />
          <p className="font-body text-sm text-slate-500">No payments recorded this year</p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          {/* Table header */}
          <div
            className="grid font-body text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3"
            style={{ gridTemplateColumns: '1fr 1fr auto auto', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>Date</span>
            <span>Amount</span>
            <span>Mode</span>
            <span className="text-right">Cycle</span>
          </div>
          {/* Rows */}
          {payments.map((p, i) => (
            <div
              key={p.id}
              className="grid items-center px-4 py-3 transition-colors hover:bg-white/[0.03]"
              style={{
                gridTemplateColumns: '1fr 1fr auto auto',
                borderBottom: i < payments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-grass shrink-0" />
                <span className="font-body text-sm text-white">{formatDate(p.paid_date)}</span>
              </div>
              <span className="font-display text-sm font-semibold text-grass">{formatCurrency(p.amount)}</span>
              <span
                className="font-body text-[11px] px-2 py-0.5 rounded-md capitalize"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}
              >
                {p.mode ?? '—'}
              </span>
              <span className="font-body text-xs text-slate-500 text-right">{p.for_cycle ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hero section skeleton ────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="glass p-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <Skeleton width={96} height={96} rounded="rounded-full" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <Skeleton height={24} className="w-48" />
          <Skeleton height={14} className="w-32" />
          <Skeleton height={14} className="w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={48} className="rounded-xl" />)}
      </div>
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'attendance', label: 'Attendance' },
  { id: 'payments',   label: 'Payments'   },
]

// ─── Main export ──────────────────────────────────────────────────────────────

export function StudentProfile({ onEdit }: { onEdit: (student: StudentWithFee) => void }) {
  const { id }          = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { canEditStudent } = usePermissions()

  const [activeTab,     setActiveTab]     = useState<TabId>('overview')
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const heroRef = useRef<HTMLDivElement>(null)

  const { student, attendance, attendanceStats, payments, totalPaidYear, isLoading, error, refetch } =
    useStudentProfile(id ?? '', selectedMonth)

  // GSAP hero entrance
  useEffect(() => {
    if (!heroRef.current || isLoading) return
    gsap.fromTo(heroRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
  }, [isLoading])

  if (!id) { navigate(ROUTES.STUDENTS); return null }

  if (error) {
    return (
      <div className="glass p-8 flex flex-col items-center gap-4 text-center"
        style={{ border: '1px solid rgba(255,61,87,0.3)' }}>
        <XCircle size={28} className="text-danger" />
        <p className="font-body text-sm text-slate-400">{error}</p>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={refetch}>Retry</Button>
      </div>
    )
  }

  const daysSinceJoined = student ? differenceInDays(new Date(), new Date(student.join_date)) : 0

  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* ── Back button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(ROUTES.STUDENTS)}
        className="inline-flex items-center gap-2 font-body text-sm text-slate-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        All Students
      </button>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      {isLoading ? <HeroSkeleton /> : student && (
        <div ref={heroRef} className="glass p-6 flex flex-col gap-5">
          {/* Identity row */}
          <div className="flex items-start gap-4">
            <Avatar name={student.name} src={student.photo_url} size="xl" className="w-24 h-24 text-3xl shrink-0" />
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-display text-2xl font-semibold text-white leading-tight">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <BatchBadge batch={student.batch} />
                <Badge variant={student.status} />
                <Badge variant={student.feeStatus} />
              </div>
              {student.daysOverdue > 0 && (
                <p className="font-body text-xs text-danger mt-1.5">
                  {student.daysOverdue} days overdue
                </p>
              )}
            </div>
            {canEditStudent && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Pencil size={13} />}
                className="shrink-0"
                onClick={() => onEdit(student)}
              >
                Edit
              </Button>
            )}
          </div>

          {/* Quick stats row */}
          <div
            className="grid grid-cols-3 gap-4 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <QuickStat
              label="Attendance"
              value={`${attendanceStats.percent}%`}
              color={attendanceStats.percent >= 75 ? 'text-grass' : 'text-amber'}
            />
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <QuickStat
                label="Fees Paid"
                value={payments.length}
                color="text-white"
              />
            </div>
            <QuickStat
              label="Days Since Joined"
              value={daysSinceJoined}
              color="text-ice"
            />
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl self-start"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'h-9 px-4 rounded-lg font-body text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-grass text-pitch font-semibold shadow-[0_0_12px_rgba(0,255,135,0.25)]'
                : 'text-slate-400 hover:text-white',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : student ? (
            <>
              {activeTab === 'overview' && <OverviewTab student={student} />}
              {activeTab === 'attendance' && (
                <AttendanceTab
                  attendance={attendance}
                  stats={attendanceStats}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                />
              )}
              {activeTab === 'payments' && (
                <PaymentsTab
                  payments={payments}
                  totalPaidYear={totalPaidYear}
                  studentId={student.id}
                />
              )}
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
