import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Attendance, BatchType } from '../types/index'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  studentId: string
  date:      string
  batch:     BatchType
  present:   boolean
}

export interface MonthSummary {
  totalSessions:  number
  avgPercent:     number
  bestDay:        { date: string; present: number; total: number; percent: number } | null
  worstDay:       { date: string; present: number; total: number; percent: number } | null
  dailyStats:     Array<{ date: string; present: number; total: number; percent: number }>
}

export interface UseAttendanceReturn {
  attendance:    Attendance[]
  attendanceMap: Record<string, boolean>   // studentId → present
  isLoading:     boolean
  error:         string | null
  markAttendance:     (studentId: string, date: string, batch: BatchType, present: boolean) => Promise<void>
  markBulkAttendance: (records: AttendanceRecord[]) => Promise<void>
  refetch:       () => void
}

// ─── Standalone async helpers (used by AttendanceHistory) ────────────────────
// These are exported functions, not hooks — callers manage their own state.

export async function fetchAttendanceHistory(
  studentId: string,
  month: number,
  year: number,
): Promise<Record<string, boolean>> {
  const start = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
  const end   = format(new Date(year, month - 1, getDaysInMonth(new Date(year, month - 1))), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('attendance')
    .select('date, present')
    .eq('student_id', studentId)
    .gte('date', start)
    .lte('date', end)

  if (error) throw error
  const map: Record<string, boolean> = {}
  ;(data ?? []).forEach(r => { map[r.date] = r.present })
  return map
}

export async function fetchMonthSummary(
  month: number,
  year: number,
  batch: BatchType | 'All',
): Promise<MonthSummary> {
  const start = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
  const end   = format(endOfMonth(new Date(year, month - 1)),   'yyyy-MM-dd')

  let query = supabase
    .from('attendance')
    .select('date, present, student_id')
    .gte('date', start)
    .lte('date', end)

  if (batch !== 'All') query = query.eq('batch', batch)

  const { data, error } = await query
  if (error) throw error

  const records = data ?? []

  // Group by date
  const byDate: Record<string, { present: number; total: number }> = {}
  records.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { present: 0, total: 0 }
    byDate[r.date].total++
    if (r.present) byDate[r.date].present++
  })

  const dailyStats = Object.entries(byDate).map(([date, { present, total }]) => ({
    date,
    present,
    total,
    percent: total > 0 ? Math.round((present / total) * 100) : 0,
  })).sort((a, b) => a.date.localeCompare(b.date))

  const totalSessions = dailyStats.length
  const avgPercent    = totalSessions > 0
    ? Math.round(dailyStats.reduce((s, d) => s + d.percent, 0) / totalSessions)
    : 0

  const sorted = [...dailyStats].sort((a, b) => b.percent - a.percent)
  const bestDay  = sorted[0]  ?? null
  const worstDay = sorted[sorted.length - 1] ?? null

  return { totalSessions, avgPercent, bestDay, worstDay, dailyStats }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAttendance(date: string, batch: BatchType): UseAttendanceReturn {
  const userId = useAuthStore(s => s.user?.id ?? null)

  const [attendance,    setAttendance]    = useState<Attendance[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({})
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date)
        .eq('batch', batch)

      if (err) throw err

      const records = (data ?? []) as Attendance[]
      setAttendance(records)

      const map: Record<string, boolean> = {}
      records.forEach(r => { map[r.student_id] = r.present })
      setAttendanceMap(map)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance')
    } finally {
      setIsLoading(false)
    }
  }, [date, batch])

  useEffect(() => { load() }, [load])

  // ── Optimistic single mark ─────────────────────────────────────────────────

  const markAttendance = useCallback(async (
    studentId: string,
    markDate:  string,
    markBatch: BatchType,
    present:   boolean,
  ): Promise<void> => {
    // Optimistic update
    const prevMap = { ...attendanceMap }
    setAttendanceMap(m => ({ ...m, [studentId]: present }))

    try {
      const { error: err } = await supabase
        .from('attendance')
        .upsert(
          { student_id: studentId, date: markDate, batch: markBatch, present, marked_by: userId },
          { onConflict: 'student_id,date,batch' },
        )
      if (err) throw err

      // Sync local attendance array too
      setAttendance(prev => {
        const existing = prev.findIndex(r => r.student_id === studentId && r.date === markDate && r.batch === markBatch)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = { ...next[existing], present }
          return next
        }
        return [
          ...prev,
          { id: `${studentId}-${markDate}-${markBatch}`, student_id: studentId, date: markDate, batch: markBatch, present, marked_by: userId, created_at: new Date().toISOString() },
        ]
      })
    } catch (err) {
      // Revert on failure
      setAttendanceMap(prevMap)
      throw err
    }
  }, [attendanceMap, userId])

  // ── Bulk mark ─────────────────────────────────────────────────────────────

  const markBulkAttendance = useCallback(async (records: AttendanceRecord[]): Promise<void> => {
    const prevMap = { ...attendanceMap }

    // Optimistic update
    const optimistic: Record<string, boolean> = {}
    records.forEach(r => { optimistic[r.studentId] = r.present })
    setAttendanceMap(m => ({ ...m, ...optimistic }))

    try {
      const rows = records.map(r => ({
        student_id: r.studentId,
        date:       r.date,
        batch:      r.batch,
        present:    r.present,
        marked_by:  userId,
      }))

      const { error: err } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,date,batch' })

      if (err) throw err
      await load()
    } catch (err) {
      setAttendanceMap(prevMap)
      throw err
    }
  }, [attendanceMap, userId, load])

  return { attendance, attendanceMap, isLoading, error, markAttendance, markBulkAttendance, refetch: load }
}
