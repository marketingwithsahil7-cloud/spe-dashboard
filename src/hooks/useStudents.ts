import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { ACADEMY_ID } from '../lib/constants'
import type { Student, BatchType, StudentStatus, FeeStatus } from '../types/index'

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
  billing_cycle_day?: number | null
  join_date?: string
  dob?: string | null
  photo_url?: string | null
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
  searchStudents: (query: string) => StudentWithFee[]
  filterByBatch: (batch: BatchType | 'All') => StudentWithFee[]
  filterByStatus: (status: StudentStatus | 'All') => StudentWithFee[]
}

// ─── Fee status helper ────────────────────────────────────────────────────────

function computeFeeStatus(
  student: Student,
  paidThisMonth: Set<string>,
  today: Date,
): { feeStatus: FeeStatus; daysOverdue: number; nextDueDate: string } {
  // Non-active students don't have fee cycles
  if (student.status !== 'active') {
    return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: '' }
  }

  const day   = student.billing_cycle_day ?? 1
  const year  = today.getFullYear()
  const month = today.getMonth()

  if (paidThisMonth.has(student.id)) {
    const nm = month === 11 ? 0 : month + 1
    const ny = month === 11 ? year + 1 : year
    return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: format(new Date(ny, nm, day), 'yyyy-MM-dd') }
  }

  const dueDate = new Date(year, month, day)
  const diff    = differenceInDays(today, dueDate)

  if (diff > 0)   return { feeStatus: 'overdue',   daysOverdue: diff, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  if (diff === 0) return { feeStatus: 'due_today',  daysOverdue: 0,   nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  if (diff >= -3) return { feeStatus: 'due_soon',   daysOverdue: 0,   nextDueDate: format(dueDate, 'yyyy-MM-dd') }
  return { feeStatus: 'paid', daysOverdue: 0, nextDueDate: format(dueDate, 'yyyy-MM-dd') }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudents(): UseStudentsReturn {
  const [students, setStudents] = useState<StudentWithFee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const today      = new Date()
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
      const monthEnd   = format(endOfMonth(today),   'yyyy-MM-dd')

      const [studentsRes, paidRes] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('payments')
          .select('student_id')
          .gte('paid_date', monthStart)
          .lte('paid_date', monthEnd),
      ])

      if (studentsRes.error) throw studentsRes.error
      if (paidRes.error)     throw paidRes.error

      const raw    = (studentsRes.data ?? []) as Student[]
      const paidIds = new Set((paidRes.data ?? []).map(p => p.student_id))

      const enriched: StudentWithFee[] = raw.map(s => ({
        ...s,
        ...computeFeeStatus(s, paidIds, today),
      }))

      setStudents(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Mutations ───────────────────────────────────────────────────────────────

  const addStudent = useCallback(async (data: StudentInput): Promise<Student> => {
    const row = {
      name:               data.name,
      batch:              data.batch,
      status:             data.status,
      parent_name:        data.parent_name   ?? null,
      parent_phone:       data.parent_phone  ?? null,
      monthly_fee:        data.monthly_fee   ?? 2000,
      billing_cycle_day:  data.billing_cycle_day ?? null,
      join_date:          data.join_date     ?? format(new Date(), 'yyyy-MM-dd'),
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

  // Soft delete — sets status to 'closed' rather than hard deleting
  const deleteStudent = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('students')
      .update({ status: 'closed' })
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
    searchStudents,
    filterByBatch,
    filterByStatus,
  }
}
