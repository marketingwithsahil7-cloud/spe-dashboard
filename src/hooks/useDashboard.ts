import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Trial, Student, FeeStatus } from '../types/index'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface FeesActionItem {
  student: Student
  feeStatus: FeeStatus
  daysOverdue: number
  nextDueDate: string
}

export interface MonthlyRevenueTrend {
  month: string     // e.g. "Jun 25"
  collected: number
  pending: number
}

export interface BatchCount {
  batch: string
  count: number
  color: string
}

export interface DashboardReturn {
  stats: {
    totalStudents: number
    todayAttendance: number
    attendancePercent: number
    monthlyRevenue: number
    pendingFees: number
  }
  pendingTrials: Trial[]
  feesActionList: FeesActionItem[]
  monthlyTrend: MonthlyRevenueTrend[]
  batchBreakdown: BatchCount[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// ─── Fee status helpers ───────────────────────────────────────────────────────

function computeFeeStatus(
  student: Student,
  paidThisMonth: Set<string>,
  today: Date,
): { feeStatus: FeeStatus; daysOverdue: number; nextDueDate: string } {
  const day = student.billing_cycle_day ?? 1
  const year = today.getFullYear()
  const month = today.getMonth()

  if (paidThisMonth.has(student.id)) {
    const nm = month === 11 ? 0 : month + 1
    const ny = month === 11 ? year + 1 : year
    return {
      feeStatus: 'paid',
      daysOverdue: 0,
      nextDueDate: format(new Date(ny, nm, day), 'yyyy-MM-dd'),
    }
  }

  const dueDate = new Date(year, month, day)
  const diff = differenceInDays(today, dueDate) // positive = past due

  if (diff > 0)  return { feeStatus: 'overdue',   daysOverdue: diff, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  if (diff === 0) return { feeStatus: 'due_today', daysOverdue: 0,    nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  if (diff >= -3) return { feeStatus: 'due_soon',  daysOverdue: 0,    nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const EMPTY_STATS = {
  totalStudents: 0,
  todayAttendance: 0,
  attendancePercent: 0,
  monthlyRevenue: 0,
  pendingFees: 0,
}

export function useDashboard(): DashboardReturn {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [pendingTrials, setPendingTrials] = useState<Trial[]>([])
  const [feesActionList, setFeesActionList] = useState<FeesActionItem[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyRevenueTrend[]>([])
  const [batchBreakdown, setBatchBreakdown] = useState<BatchCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const today = new Date()
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
      const monthEnd   = format(endOfMonth(today),   'yyyy-MM-dd')
      const trendStart = format(subMonths(startOfMonth(today), 5), 'yyyy-MM-dd')

      const [statsRes, studentsRes, trialsRes, paidRes, trendRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),
        supabase.from('students').select('*').eq('status', 'active'),
        supabase
          .from('trials')
          .select('*')
          .in('status', ['pending', 'no_response'])
          .order('trial_date', { ascending: false }),
        supabase
          .from('payments')
          .select('student_id')
          .gte('paid_date', monthStart)
          .lte('paid_date', monthEnd),
        supabase
          .from('payments')
          .select('paid_date, amount')
          .gte('paid_date', trendStart),
      ])

      if (statsRes.error)    throw statsRes.error
      if (studentsRes.error) throw studentsRes.error
      if (trialsRes.error)   throw trialsRes.error
      if (paidRes.error)     throw paidRes.error
      if (trendRes.error)    throw trendRes.error

      const rpc         = statsRes.data?.[0]
      const students    = (studentsRes.data ?? []) as Student[]
      const trials      = (trialsRes.data ?? []) as Trial[]
      const paidIds     = new Set((paidRes.data ?? []).map(p => p.student_id))
      const allPayments = trendRes.data ?? []

      // ── Aggregate stats ───────────────────────────────────────────────────
      const totalStudents     = rpc?.total_active      ?? students.length
      const todayAttendance   = rpc?.today_attendance  ?? 0
      const monthlyRevenue    = rpc?.monthly_revenue   ?? 0
      const pendingFees       = rpc?.pending_fees      ?? 0
      const attendancePercent = totalStudents > 0
        ? Math.round((todayAttendance / totalStudents) * 100)
        : 0

      setStats({ totalStudents, todayAttendance, attendancePercent, monthlyRevenue, pendingFees })

      // ── Trials ───────────────────────────────────────────────────────────
      setPendingTrials(trials)

      // ── Fees action list (overdue + due_today only) ───────────────────────
      const actionList: FeesActionItem[] = students
        .map(student => ({ student, ...computeFeeStatus(student, paidIds, today) }))
        .filter(item => item.feeStatus === 'overdue' || item.feeStatus === 'due_today')
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
      setFeesActionList(actionList)

      // ── Batch breakdown ───────────────────────────────────────────────────
      const counts: BatchCount[] = [
        { batch: '5-6 PM', count: students.filter(s => s.batch === '5-6 PM').length, color: '#00D4FF' },
        { batch: '6-7 PM', count: students.filter(s => s.batch === '6-7 PM').length, color: '#00FF87' },
        { batch: 'Both',   count: students.filter(s => s.batch === 'Both').length,   color: '#FFB800' },
      ].filter(b => b.count > 0)
      setBatchBreakdown(counts)

      // ── Monthly revenue trend (last 6 months) ────────────────────────────
      const trend: MonthlyRevenueTrend[] = Array.from({ length: 6 }, (_, i) => {
        const d      = subMonths(today, 5 - i)
        const mStart = format(startOfMonth(d), 'yyyy-MM-dd')
        const mEnd   = format(endOfMonth(d),   'yyyy-MM-dd')
        const collected = allPayments
          .filter(p => p.paid_date >= mStart && p.paid_date <= mEnd)
          .reduce((sum, p) => sum + (p.amount ?? 0), 0)
        const isCurrent = format(d, 'yyyy-MM') === format(today, 'yyyy-MM')
        return {
          month: format(d, 'MMM yy'),
          collected,
          pending: isCurrent ? pendingFees : 0,
        }
      })
      setMonthlyTrend(trend)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { stats, pendingTrials, feesActionList, monthlyTrend, batchBreakdown, isLoading, error, refetch: load }
}
