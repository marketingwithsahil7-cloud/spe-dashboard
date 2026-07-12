import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
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
  // true when this row is a saved "reason for not paying" rather than an
  // actual payment — amount is stored as 0 and excluded from revenue by nature.
  is_reason_only?: boolean
}

export interface UsePaymentsReturn {
  payments:      Payment[]
  isLoading:     boolean
  error:         string | null
  addPayment:    (data: PaymentInput) => Promise<Payment>
  deletePayment: (id: string) => Promise<Payment>
  refetch:       () => void
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

// month: billing cycle to load, e.g. '2026-05'. Defaults to the current calendar
// month. Payments are matched by for_cycle (not paid_date) so a payment recorded
// late/early for a given month's fee still shows up under that month — same rule
// fee-status computation in useStudents follows.
export function usePayments(month?: string): UsePaymentsReturn {
  const userId = useAuthStore(s => s.user?.id ?? null)
  const targetCycle = month ?? format(new Date(), 'yyyy-MM')

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
      const { data, error: err } = await supabase
        .from('payments')
        .select('*')
        .eq('for_cycle', targetCycle)
        .order('paid_date', { ascending: false })

      if (err) throw err
      setPayments((data ?? []) as Payment[])
      hasLoadedOnce.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments')
    } finally {
      setIsLoading(false)
    }
  }, [targetCycle])

  useEffect(() => { load() }, [load])

  const addPayment = useCallback(async (data: PaymentInput): Promise<Payment> => {
    const row = {
      student_id:     data.student_id,
      amount:         data.amount,
      paid_date:      data.paid_date,
      for_cycle:      data.for_cycle  ?? targetCycle,
      mode:           data.mode       ?? null,
      note:           data.note       ?? null,
      is_reason_only: data.is_reason_only ?? false,
      recorded_by:    userId,
    }

    const { data: inserted, error: err } = await supabase
      .from('payments')
      .insert(row)
      .select()
      .single()

    if (err) throw err
    const payment = inserted as Payment

    // Optimistic local update instead of a full refetch — only append if the
    // payment is actually for the cycle currently loaded/viewed.
    if (payment.for_cycle === targetCycle) {
      setPayments(prev => [payment, ...prev])
    }

    return payment
  }, [userId, targetCycle])

  const deletePayment = useCallback(async (id: string): Promise<Payment> => {
    const target = payments.find(p => p.id === id)
    if (!target) throw new Error('Payment not found')

    const { error: err } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (err) throw err
    setPayments(prev => prev.filter(p => p.id !== id))
    return target
  }, [payments])

  return { payments, isLoading, error, addPayment, deletePayment, refetch: load }
}
