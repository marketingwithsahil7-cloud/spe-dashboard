import { useRef, useEffect, useState, useCallback } from 'react'
import { Users, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAttendance } from '../../hooks/useAttendance'
import { AttendanceToggle } from './AttendanceToggle'
import { Avatar } from '../ui/Avatar'
import { Skeleton } from '../ui/Skeleton'
import { gsap } from '../../lib/animations'
import { cn } from '../../lib/utils'
import type { Student, BatchType } from '../../types/index'

interface AttendanceSheetProps {
  date:  string
  batch: BatchType
}

export function AttendanceSheet({ date, batch }: AttendanceSheetProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const [students,        setStudents]        = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError,   setStudentsError]   = useState<string | null>(null)
  const [bulkSaving,      setBulkSaving]      = useState(false)

  const {
    attendanceMap,
    isLoading: attLoading,
    error:     attError,
    markAttendance,
    markBulkAttendance,
  } = useAttendance(date, batch)

  // Fetch active/trial students visible in this batch
  useEffect(() => {
    let cancelled = false
    setStudentsLoading(true)
    setStudentsError(null)

    supabase
      .from('students')
      .select('*')
      .in('batch', [batch, 'Both'])
      .neq('status', 'closed')
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setStudentsError(error.message)
        else       setStudents((data ?? []) as Student[])
        setStudentsLoading(false)
      })

    return () => { cancelled = true }
  }, [batch])

  // GSAP row stagger once both students + attendance are ready
  useEffect(() => {
    if (studentsLoading || attLoading || !listRef.current) return
    const rows = listRef.current.querySelectorAll('[data-row]')
    if (!rows.length) return
    gsap.fromTo(
      rows,
      { opacity: 0, y: 20, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.045, ease: 'back.out(1.2)', clearProps: 'all' },
    )
  }, [studentsLoading, attLoading, students.length])

  const presentCount = students.filter(s => attendanceMap[s.id] === true).length
  const totalCount   = students.length
  const isLoading    = studentsLoading || attLoading
  const error        = studentsError || attError

  const handleMarkAll = useCallback(async (present: boolean) => {
    if (!students.length || bulkSaving) return
    setBulkSaving(true)
    try {
      await markBulkAttendance(students.map(s => ({ studentId: s.id, date, batch, present })))
    } finally {
      setBulkSaving(false)
    }
  }, [students, date, batch, markBulkAttendance, bulkSaving])

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3">
        <AlertCircle size={28} className="text-danger" />
        <p className="font-body text-sm text-danger text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* ── Summary + bulk actions ─────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">

        {/* Present counter */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(0,255,135,0.10)', border: '1px solid rgba(0,255,135,0.2)' }}>
            <Users size={18} className="text-grass" />
          </div>
          <div>
            {isLoading ? (
              <>
                <Skeleton height={24} className="w-16 mb-1" />
                <Skeleton height={10} className="w-20" />
              </>
            ) : (
              <>
                <p className="font-display text-2xl text-white leading-none">
                  <span className="text-grass">{presentCount}</span>
                  <span className="text-slate-500">/{totalCount}</span>
                </p>
                <p className="font-body text-xs text-slate-400 mt-0.5">present today</p>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isLoading && totalCount > 0 && (
          <div className="flex-1 hidden sm:block max-w-[160px]">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((presentCount / totalCount) * 100)}%`,
                  background: 'linear-gradient(90deg, #00FF87, #00D4FF)',
                }}
              />
            </div>
            <p className="font-body text-xs text-slate-500 mt-1 text-right">
              {Math.round((presentCount / totalCount) * 100)}%
            </p>
          </div>
        )}

        {/* Bulk actions */}
        {!isLoading && totalCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleMarkAll(true)}
              disabled={bulkSaving}
              className="glass-button flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-semibold text-grass transition-all disabled:opacity-50"
              style={{ border: '1px solid rgba(0,255,135,0.2)' }}
            >
              {bulkSaving
                ? <Loader2 size={13} className="animate-spin" />
                : <CheckCircle2 size={13} />}
              All Present
            </button>
            <button
              onClick={() => handleMarkAll(false)}
              disabled={bulkSaving}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-semibold transition-all disabled:opacity-50',
                'text-slate-400 hover:text-white',
              )}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {bulkSaving
                ? <Loader2 size={13} className="animate-spin" />
                : <XCircle size={13} />}
              All Absent
            </button>
          </div>
        )}
      </div>

      {/* ── Student rows ───────────────────────────────────────────────────────── */}
      <div ref={listRef} className="space-y-2">
        {isLoading ? (
          // Skeleton rows
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="glass rounded-2xl px-4 py-3 flex items-center gap-4"
            >
              <Skeleton width={32} height={32} rounded="rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton height={12} className="w-2/5" />
                <Skeleton height={10} className="w-1/4" />
              </div>
              <Skeleton width={128} height={44} rounded="rounded-xl" />
            </div>
          ))
        ) : totalCount === 0 ? (
          // Empty state
          <div className="glass rounded-2xl p-12 text-center">
            <Users size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="font-display text-base text-slate-500 uppercase tracking-wider">
              No students in this batch
            </p>
          </div>
        ) : (
          students.map(student => {
            const isPresent = attendanceMap[student.id] ?? false
            return (
              <div
                key={student.id}
                data-row
                className="glass glass-hover rounded-2xl px-4 py-3 flex items-center gap-4 will-change-transform"
              >
                {/* Avatar */}
                <Avatar name={student.name} src={student.photo_url} size="sm" className="shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-white truncate">{student.name}</p>
                  <p className="font-body text-xs text-slate-500 mt-0.5">
                    {student.status === 'trial'
                      ? <span className="text-amber">Trial</span>
                      : student.batch}
                  </p>
                </div>

                {/* Toggle */}
                <div className="w-32 shrink-0">
                  <AttendanceToggle
                    present={isPresent}
                    onChange={(p) => markAttendance(student.id, date, batch, p)}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
