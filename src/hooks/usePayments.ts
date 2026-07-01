import { useState, useEffect, useCallback, useRef } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Payment, PaymentMode } from '../types/index'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PaymentInput {
  student_id: string
  amount: number
  paid_date: string
  for_cycle?: string | null
  mode?: PaymentMode | null
  note?: string | null
}

export interface UsePaymentsReturn {
  payments:   Payment[]
  isLoading:  boolean
  error:      string | null
  addPayment: (data: PaymentInput) => Promise<Payment>
  refetch:    () => void
}

// Standalone helper — for PaymentHistory within student profile / fee page
export async function fetchStudentPayments(studentId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', studentId)
    .order('paid_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Payment[]
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePayments(): UsePaymentsReturn {
  const userId = useAuthStore(s => s.user?.id ?? null)

  const [payments,  setPayments]  = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // Only show the loading skeleton on the very first fetch — refetches shouldn't
  // blank out an already-populated payment list.
  const hasLoadedOnce = useRef(false)

  const load = useCallback(async () => {
    if (!hasLoadedOnce.current) setIsLoading(true)
    setError(null)
    try {
      const today = new Date()
      const start = format(startOfMonth(today), 'yyyy-MM-dd')
      const end   = format(endOfMonth(today),   'yyyy-MM-dd')

      const { data, error: err } = await supabase
        .from('payments')
        .select('*')
        .gte('paid_date', start)
        .lte('paid_date', end)
        .order('paid_date', { ascending: false })

      if (err) throw err
      setPayments((data ?? []) as Payment[])
      hasLoadedOnce.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addPayment = useCallback(async (data: PaymentInput): Promise<Payment> => {
    const row = {
      student_id:  data.student_id,
      amount:      data.amount,
      paid_date:   data.paid_date,
      for_cycle:   data.for_cycle  ?? format(new Date(), 'yyyy-MM'),
      mode:        data.mode       ?? null,
      note:        data.note       ?? null,
      recorded_by: userId,
    }

    const { data: inserted, error: err } = await supabase
      .from('payments')
      .insert(row)
      .select()
      .single()

    if (err) throw err
    const payment = inserted as Payment

    // Optimistic local update instead of a full month refetch — only append if the
    // payment actually falls within the currently-loaded calendar-month window.
    const today = new Date()
    const start = format(startOfMonth(today), 'yyyy-MM-dd')
    const end   = format(endOfMonth(today),   'yyyy-MM-dd')
    if (payment.paid_date >= start && payment.paid_date <= end) {
      setPayments(prev => [payment, ...prev])
    }

    return payment
  }, [userId])

  return { payments, isLoading, error, addPayment, refetch: load }
}
