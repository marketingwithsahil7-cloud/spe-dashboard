import { useState, useEffect, useCallback, useRef } from 'react'
import { format, differenceInDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { ACADEMY_ID } from '../lib/constants'
import type { Student, BatchType, StudentStatus, FeeStatus } from '../types/index'

// Columns needed by the Fees page — excludes photo_url/join_date/academy_id
// which are unused there (Avatar already falls back to initials without a photo).
const LITE_COLUMNS =
  'id, name, batch, parent_name, parent_phone, billing_cycle_day, monthly_fee, fee_is_fixed, status, dob'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface StudentWithFee extends Student {
  feeStatus: FeeStatus
  daysOverdue: number
  nextDueDate: string
}

export type StudentInput = {
  name: string
  batch: BatchType
  status: StudentStatus
  parent_name?: string | null
  parent_phone?: string | null
  monthly_fee?: number
  fee_is_fixed?: boolean
  billing_cycle_day?: number | null
  join_date?: string | null
  dob?: string | null
  photo_url?: string | null
}

export interface UseStudentsOptions {
  // Fetch only the columns the Fees page needs — skips photo_url/join_date/academy_id.
  lite?: boolean
  // Billing cycle to compute fee status against, e.g. '2026-05'. Defaults to the
  // current calendar month. Passing a past month switches computeFeeStatus into
  // audit mode (paid/missing only — due_soon/due_today never apply to past months).
  month?: string
}

export interface UseStudentsReturn {
  students: StudentWithFee[]
  isLoading: boolean
  error: string | null
  addStudent: (data: StudentInput) => Promise<Student>
  updateStudent: (id: string, data: Partial<StudentInput>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  uploadPhoto: (file: File, studentId: string) => Promise<string>
  refetch: () => void
  // Updates one student's cached fee status locally instead of a full refetch —
  // used right after recording a payment so the other 19+ cards don't re-render.
  applyPaymentOptimistic: (studentId: string, forCycle: string | null | undefined, hasPayment?: boolean) => void
  searchStudents: (query: string) => StudentWithFee[]
  filterByBatch: (batch: BatchType | 'All') => StudentWithFee[]
  filterByStatus: (status: StudentStatus | 'All') => StudentWithFee[]
}

// ─── Fee status helper ────────────────────────────────────────────────────────

export function computeFeeStatus(
  student: Student,
  paidForCycle: Set<string>,
  today: Date,
  targetCycle: string,
): { feeStatus: FeeStatus; daysOverdue: number; nextDueDate: string } {
  // Non-active students don't have fee cycles
  if (student.status !== 'active') {
    return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: '' }
  }

  const day = student.billing_cycle_day ?? 1
  const [ty, tm] = targetCycle.split('-').map(Number) // tm is 1-indexed
  const isCurrentMonth = targetCycle === format(today, 'yyyy-MM')

  if (paidForCycle.has(student.id)) {
    const nm = tm === 12 ? 1 : tm + 1
    const ny = tm === 12 ? ty + 1 : ty
    return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: format(new Date(ny, nm - 1, day), 'yyyy-MM-dd') }
  }

  const dueDate = new Date(ty, tm - 1, day)

  // Past months never get due_soon/due_today treatment — either paid or missing.
  if (!isCurrentMonth) {
    const diff = Math.max(differenceInDays(today, dueDate), 0)
    return { feeStatus: 'overdue', daysOverdue: diff, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  }

  const diff = differenceInDays(today, dueDate)

  if (diff > 0)   return { feeStatus: 'overdue',   daysOverdue: diff, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  if (diff === 0) return { feeStatus: 'due_today',  daysOverdue: 0,   nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  if (diff >= -2) return { feeStatus: 'due_soon',   daysOverdue: 0,   nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudents(options?: UseStudentsOptions): UseStudentsReturn {
  const lite  = options?.lite ?? false
  const month = options?.month

  const [students, setStudents] = useState<StudentWithFee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Only show the loading skeleton on the very first fetch of this hook instance —
  // subsequent refetches (e.g. after add/edit) swap data in without blanking the list.
  const hasLoadedOnce = useRef(false)

  const load = useCallback(async () => {
    if (!hasLoadedOnce.current) setIsLoading(true)
    setError(null)

    try {
      const today       = new Date()
      const targetCycle = month ?? format(today, 'yyyy-MM')

      const studentsQuery = lite
        ? supabase.from('students').select(LITE_COLUMNS).order('name', { ascending: true })
        : supabase.from('students').select('*').order('name', { ascending: true })

      const [studentsRes, paidRes] = await Promise.all([
        studentsQuery,
        supabase
          .from('payments')
          .select('student_id')
          .eq('for_cycle', targetCycle),
      ])

      if (studentsRes.error) throw studentsRes.error
      if (paidRes.error)     throw paidRes.error

      const raw    = (studentsRes.data ?? []) as Student[]
      const paidIds = new Set((paidRes.data ?? []).map(p => p.student_id))

      const enriched: StudentWithFee[] = raw.map(s => ({
        ...s,
        ...computeFeeStatus(s, paidIds, today, targetCycle),
      }))

      setStudents(enriched)
      hasLoadedOnce.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }, [lite, month])

  useEffect(() => { load() }, [load])

  // Flips a single student's cached fee status right after a payment is added or
  // removed for the cycle currently being viewed — avoids a full students+payments
  // refetch (and the resulting re-render/re-animation of every other fee card).
  // `hasPayment` defaults to true (a payment was just recorded); pass false after
  // deleting a payment when no other payment row remains for that student+cycle.
  const applyPaymentOptimistic = useCallback((
    studentId: string,
    forCycle: string | null | undefined,
    hasPayment: boolean = true,
  ) => {
    const targetCycle = month ?? format(new Date(), 'yyyy-MM')
    if (forCycle !== targetCycle) return // payment wasn't for the viewed cycle — status unchanged

    const paidSet = hasPayment ? new Set([studentId]) : new Set<string>()
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      return { ...s, ...computeFeeStatus(s, paidSet, new Date(), targetCycle) }
    }))
  }, [month])

  // ── Mutations ───────────────────────────────────────────────────────────────

  const addStudent = useCallback(async (data: StudentInput): Promise<Student> => {
    const row = {
      name:               data.name,
      batch:              data.batch,
      status:             data.status,
      parent_name:        data.parent_name   ?? null,
      parent_phone:       data.parent_phone  ?? null,
      monthly_fee:        data.monthly_fee   ?? 2000,
      fee_is_fixed:       data.fee_is_fixed  ?? true,
      billing_cycle_day:  data.billing_cycle_day ?? null,
      join_date:          data.join_date     ?? null,
      dob:                data.dob           ?? null,
      photo_url:          data.photo_url     ?? null,
      academy_id:         ACADEMY_ID,
    }

    const { data: inserted, error: err } = await supabase
      .from('students')
      .insert(row)
      .select()
      .single()

    if (err) throw err
    await load()
    return inserted as Student
  }, [load])

  const updateStudent = useCallback(async (id: string, data: Partial<StudentInput>): Promise<void> => {
    const { error: err } = await supabase
      .from('students')
      .update(data)
      .eq('id', id)

    if (err) throw err
    await load()
  }, [load])

  // Hard delete — removes the student and all related records (attendance,
  // payments, event availability, report cards). Explicit cleanup rather than
  // relying solely on DB-level ON DELETE CASCADE, since not every FK is
  // guaranteed to have cascade configured on the live database.
  const deleteStudent = useCallback(async (id: string): Promise<void> => {
    const [attErr, payErr, availErr, reportErr] = await Promise.all([
      supabase.from('attendance').delete().eq('student_id', id).then(r => r.error),
      supabase.from('payments').delete().eq('student_id', id).then(r => r.error),
      supabase.from('event_availability').delete().eq('student_id', id).then(r => r.error),
      supabase.from('student_reports').delete().eq('student_id', id).then(r => r.error),
    ])
    if (attErr)    throw attErr
    if (payErr)    throw payErr
    if (availErr)  throw availErr
    if (reportErr) throw reportErr

    const { error: err } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (err) throw err
    await load()
  }, [load])

  const uploadPhoto = useCallback(async (file: File, studentId: string): Promise<string> => {
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${studentId}/avatar.${ext}`

    const { error: upErr } = await supabase.storage
      .from('student-photos')
      .upload(path, file, { cacheControl: '3600', upsert: true })

    if (upErr) throw upErr

    const { data: urlData } = supabase.storage
      .from('student-photos')
      .getPublicUrl(path)

    return urlData.publicUrl
  }, [])

  // ── Client-side filters (operate on already-loaded state) ──────────────────

  const searchStudents = useCallback((query: string): StudentWithFee[] => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.parent_name ?? '').toLowerCase().includes(q) ||
      (s.parent_phone ?? '').includes(q)
    )
  }, [students])

  const filterByBatch = useCallback((batch: BatchType | 'All'): StudentWithFee[] => {
    if (batch === 'All') return students
    return students.filter(s => s.batch === batch)
  }, [students])

  const filterByStatus = useCallback((status: StudentStatus | 'All'): StudentWithFee[] => {
    if (status === 'All') return students
    return students.filter(s => s.status === status)
  }, [students])

  return {
    students,
    isLoading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    uploadPhoto,
    refetch: load,
    applyPaymentOptimistic,
    searchStudents,
    filterByBatch,
    filterByStatus,
  }
}
