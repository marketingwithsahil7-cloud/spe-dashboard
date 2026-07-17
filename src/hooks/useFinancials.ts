import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { ACADEMY_ID } from '../lib/constants'
import type { Expense, EmergencyFundTransaction, FinancialNote } from '../types/index'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ExpenseInput {
  title: string
  amount: number
  expense_date: string
  fund_type: 'revenue' | 'emergency'
  category: string
  note?: string | null
  // Emergency-only fields
  withdrawn_by?: string | null
  purpose?: string | null
  expected_repayment_date?: string | null
  // Cross-fund: revenue expense paid from emergency fund
  is_cross_fund?: boolean
}

export interface EmergencyTxInput {
  type: 'deposit' | 'withdrawal'
  amount: number
  transaction_date: string
  coach_id?: string | null
  purpose?: string | null
  note?: string | null
}

export interface RevenueSummary {
  totalCollected: number
  totalExpenses: number
  netRevenue: number
  expenseBreakdown: { category: string; amount: number }[]
}

export interface EmergencyFundTransactionWithCoach extends EmergencyFundTransaction {
  coach: { id: string; name: string } | null
}

export interface FinancialNoteWithAuthor extends FinancialNote {
  author: { id: string; name: string } | null
}

export interface EmergencyFundBalance {
  totalDeposited: number
  totalWithdrawn: number
  totalRepaid: number
  currentBalance: number
  // Only personal_advance withdrawals that are unrepaid
  pendingRepayments: EmergencyFundTransactionWithCoach[]
}

export interface MonthlyTrendData {
  month: string
  revenueExpenses: number
  emergencyExpenses: number
}

export interface CoachOption {
  id: string
  name: string
  role: string | null
}

export interface UseFinancialsReturn {
  expenses: Expense[]
  transactions: EmergencyFundTransactionWithCoach[]
  coaches: CoachOption[]
  headCoaches: CoachOption[]
  notes: FinancialNoteWithAuthor[]
  revenueSummary: RevenueSummary
  emergencyBalance: EmergencyFundBalance
  monthlyTrend: MonthlyTrendData[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  addExpense: (data: ExpenseInput) => Promise<void>
  updateExpense: (id: string, data: Partial<ExpenseInput>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addEmergencyTransaction: (data: EmergencyTxInput) => Promise<void>
  deleteEmergencyTransaction: (id: string) => Promise<void>
  markRepaid: (id: string, repaidAmount: number, repaidDate: string) => Promise<void>
  addNote: (content: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFinancials(filterMonth: number, filterYear: number): UseFinancialsReturn {
  const coachId = useAuthStore(s => s.coach?.id ?? null)

  const [expenses,             setExpenses]             = useState<Expense[]>([])
  const [transactions,         setTransactions]         = useState<EmergencyFundTransactionWithCoach[]>([])
  const [coaches,              setCoaches]              = useState<CoachOption[]>([])
  const [notes,                setNotes]                = useState<FinancialNoteWithAuthor[]>([])
  const [monthlyPaymentsTotal, setMonthlyPaymentsTotal] = useState(0)
  const [monthlyTrend,         setMonthlyTrend]         = useState<MonthlyTrendData[]>([])
  const [isLoading,            setIsLoading]            = useState(true)
  const [error,                setError]                = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const monthStart = new Date(filterYear, filterMonth - 1, 1)
      const startDate  = format(startOfMonth(monthStart), 'yyyy-MM-dd')
      const endDate    = format(endOfMonth(monthStart),   'yyyy-MM-dd')

      const [expensesRes, txRes, paymentsRes, coachesRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
          .order('expense_date', { ascending: false }),
        supabase
          .from('emergency_fund_transactions')
          .select('*, coach:coach_id(id, name)')
          .order('transaction_date', { ascending: false }),
        supabase
          .from('payments')
          .select('amount')
          .gte('paid_date', startDate)
          .lte('paid_date', endDate),
        supabase
          .from('coaches')
          .select('id, name, role')
          .order('name'),
      ])

      if (expensesRes.error)  throw expensesRes.error
      if (txRes.error)        throw txRes.error
      if (paymentsRes.error)  throw paymentsRes.error
      if (coachesRes.error)   throw coachesRes.error

      setExpenses((expensesRes.data ?? []) as Expense[])
      setTransactions((txRes.data ?? []) as EmergencyFundTransactionWithCoach[])
      setMonthlyPaymentsTotal(
        ((paymentsRes.data ?? []) as { amount: number }[]).reduce((s, p) => s + p.amount, 0)
      )
      setCoaches((coachesRes.data ?? []) as CoachOption[])

      // financial_notes is non-fatal — table may not exist until enhancement SQL is run
      const notesRes = await supabase
        .from('financial_notes')
        .select('*, author:author_id(id, name)')
        .order('created_at', { ascending: false })
        .limit(100)
      setNotes(notesRes.error ? [] : (notesRes.data ?? []) as FinancialNoteWithAuthor[])

      // 6-month expense trend (parallel)
      const trendData = await Promise.all(
        Array.from({ length: 6 }, (_, i) => {
          const d = subMonths(monthStart, 5 - i)
          const s = format(startOfMonth(d), 'yyyy-MM-dd')
          const e = format(endOfMonth(d),   'yyyy-MM-dd')
          return supabase
            .from('expenses')
            .select('amount, fund_type')
            .gte('expense_date', s)
            .lte('expense_date', e)
            .then(({ data }) => ({
              month:             format(d, 'MMM yy'),
              revenueExpenses:   (data ?? []).filter(r => r.fund_type === 'revenue').reduce((acc, r) => acc + r.amount, 0),
              emergencyExpenses: (data ?? []).filter(r => r.fund_type === 'emergency').reduce((acc, r) => acc + r.amount, 0),
            }))
        })
      )
      setMonthlyTrend(trendData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financials')
    } finally {
      setIsLoading(false)
    }
  }, [filterMonth, filterYear])

  useEffect(() => { load() }, [load])

  // ─── Computed ──────────────────────────────────────────────────────────────

  const headCoaches = useMemo(
    () => coaches.filter(c => c.role === 'head'),
    [coaches],
  )

  const revenueSummary = useMemo((): RevenueSummary => {
    const revenueExpenses = expenses.filter(e => e.fund_type === 'revenue')
    const totalExpenses   = revenueExpenses.reduce((s, e) => s + e.amount, 0)
    const breakdownMap    = new Map<string, number>()
    for (const exp of revenueExpenses) {
      breakdownMap.set(exp.category, (breakdownMap.get(exp.category) ?? 0) + exp.amount)
    }
    return {
      totalCollected:   monthlyPaymentsTotal,
      totalExpenses,
      netRevenue:       monthlyPaymentsTotal - totalExpenses,
      expenseBreakdown: Array.from(breakdownMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
    }
  }, [expenses, monthlyPaymentsTotal])

  const emergencyBalance = useMemo((): EmergencyFundBalance => {
    const totalDeposited = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
    const totalWithdrawn = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0)
    const totalRepaid    = transactions
      .filter(t => t.type === 'withdrawal' && t.repaid && t.repaid_amount != null)
      .reduce((s, t) => s + (t.repaid_amount ?? 0), 0)

    // Only personal advances create a repayment obligation
    const pendingRepayments = transactions.filter(
      t => t.type === 'withdrawal' && !t.repaid && t.purpose === 'personal_advance',
    )

    return {
      totalDeposited,
      totalWithdrawn,
      totalRepaid,
      currentBalance:   totalDeposited - totalWithdrawn + totalRepaid,
      pendingRepayments,
    }
  }, [transactions])

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const addExpense = useCallback(async (data: ExpenseInput): Promise<void> => {
    // 1. Insert the expense record
    const { error: expErr } = await supabase.from('expenses').insert({
      title:        data.title,
      amount:       data.amount,
      expense_date: data.expense_date,
      fund_type:    data.fund_type,
      category:     data.category,
      note:         data.note ?? null,
      recorded_by:  coachId,
      academy_id:   ACADEMY_ID,
      // Enhancement columns — only include if non-null/non-false to avoid errors on older DB schema
      ...(data.withdrawn_by            != null  && { withdrawn_by:            data.withdrawn_by }),
      ...(data.is_cross_fund                    && { is_cross_fund:           true }),
      ...(data.expected_repayment_date != null  && { expected_repayment_date: data.expected_repayment_date }),
      ...(data.purpose                 != null  && { purpose:                 data.purpose }),
    })
    if (expErr) throw expErr

    // 2. Emergency expense → auto-create emergency fund withdrawal
    if (data.fund_type === 'emergency' && data.withdrawn_by) {
      const { error: txErr } = await supabase.from('emergency_fund_transactions').insert({
        type:             'withdrawal',
        amount:           data.amount,
        transaction_date: data.expense_date,
        coach_id:         data.withdrawn_by,
        note:             data.title,
        recorded_by:      coachId,
        academy_id:       ACADEMY_ID,
        ...(data.purpose != null && { purpose: data.purpose }),
      })
      if (txErr) throw txErr
    }

    // 3. Cross-fund revenue expense → emergency withdrawal (no coach, academy use)
    if (data.fund_type === 'revenue' && data.is_cross_fund) {
      const { error: txErr } = await supabase.from('emergency_fund_transactions').insert({
        type:             'withdrawal',
        amount:           data.amount,
        transaction_date: data.expense_date,
        coach_id:         null,
        note:             `[Cross-fund] ${data.title}`,
        recorded_by:      coachId,
        academy_id:       ACADEMY_ID,
        purpose:          'academy_expense',
      })
      if (txErr) throw txErr
    }

    await load()
  }, [coachId, load])

  const updateExpense = useCallback(async (id: string, data: Partial<ExpenseInput>): Promise<void> => {
    const { error: err } = await supabase.from('expenses').update({
      title:        data.title,
      amount:       data.amount,
      expense_date: data.expense_date,
      fund_type:    data.fund_type,
      category:     data.category,
      note:         data.note ?? null,
      ...(data.withdrawn_by            !== undefined && { withdrawn_by:            data.withdrawn_by ?? null }),
      ...(data.is_cross_fund           !== undefined && { is_cross_fund:           data.is_cross_fund ?? false }),
      ...(data.expected_repayment_date !== undefined && { expected_repayment_date: data.expected_repayment_date ?? null }),
      ...(data.purpose                 !== undefined && { purpose:                 data.purpose ?? null }),
    }).eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('expenses').delete().eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  const addEmergencyTransaction = useCallback(async (data: EmergencyTxInput): Promise<void> => {
    const { error: err } = await supabase.from('emergency_fund_transactions').insert({
      type:             data.type,
      amount:           data.amount,
      transaction_date: data.transaction_date,
      coach_id:         data.coach_id ?? null,
      note:             data.note ?? null,
      recorded_by:      coachId,
      academy_id:       ACADEMY_ID,
      ...(data.purpose != null && { purpose: data.purpose }),
    })
    if (err) throw err
    await load()
  }, [coachId, load])

  const deleteEmergencyTransaction = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('emergency_fund_transactions').delete().eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  const markRepaid = useCallback(async (id: string, repaidAmount: number, repaidDate: string): Promise<void> => {
    const { error: err } = await supabase
      .from('emergency_fund_transactions')
      .update({ repaid: true, repaid_amount: repaidAmount, repaid_date: repaidDate })
      .eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  const addNote = useCallback(async (content: string): Promise<void> => {
    const { error: err } = await supabase.from('financial_notes').insert({
      content,
      author_id:  coachId,
      academy_id: ACADEMY_ID,
    })
    if (err) throw err
    await load()
  }, [coachId, load])

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('financial_notes').delete().eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  return {
    expenses,
    transactions,
    coaches,
    headCoaches,
    notes,
    revenueSummary,
    emergencyBalance,
    monthlyTrend,
    isLoading,
    error,
    refetch: load,
    addExpense,
    updateExpense,
    deleteExpense,
    addEmergencyTransaction,
    deleteEmergencyTransaction,
    markRepaid,
    addNote,
    deleteNote,
  }
}
