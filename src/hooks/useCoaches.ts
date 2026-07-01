import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Coach, CoachAttendance } from '../types/index'

// ─── Extended types ───────────────────────────────────────────────────────────

export interface CoachWithStats extends Coach {
  sessionsThisMonth: number
  earningsThisMonth: number
}

export interface PayrollSummary {
  coach: Coach
  totalSessions: number
  confirmedSessions: number
  verifiedSessions: number
  disputedSessions: number
  payout: number
  attendance: CoachAttendance[]
}

export interface UseCoachesReturn {
  coaches: CoachWithStats[]
  isLoading: boolean
  error: string | null
  markCoachAttendance: (
    coachId: string,
    date: string,
    batch: string,
    session: string,
    markedBy: string,
    note?: string,
  ) => Promise<void>
  confirmAttendance:       (id: string) => Promise<void>
  disputeAttendance:       (id: string) => Promise<void>
  verifyAttendance:        (id: string) => Promise<void>
  ownerConfirmAttendance:  (id: string) => Promise<void>
  refetch: () => void
}

// ─── Standalone helpers (called on-demand by components) ──────────────────────

export async function fetchCoachAttendance(
  coachId: string,
  month: number,
  year: number,
): Promise<CoachAttendance[]> {
  const d     = new Date(year, month - 1)
  const start = format(startOfMonth(d), 'yyyy-MM-dd')
  const end   = format(endOfMonth(d),   'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('coach_attendance')
    .select('*')
    .eq('coach_id', coachId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []) as CoachAttendance[]
}

export async function fetchAllCoachAttendanceForMonth(
  month: number,
  year: number,
): Promise<CoachAttendance[]> {
  const d     = new Date(year, month - 1)
  const start = format(startOfMonth(d), 'yyyy-MM-dd')
  const end   = format(endOfMonth(d),   'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('coach_attendance')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []) as CoachAttendance[]
}

export async function fetchCoachAttendanceRange(
  coachId: string,
  startDate: string,
  endDate: string,
): Promise<CoachAttendance[]> {
  const { data, error } = await supabase
    .from('coach_attendance')
    .select('*')
    .eq('coach_id', coachId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []) as CoachAttendance[]
}

export async function fetchDayAttendance(date: string): Promise<CoachAttendance[]> {
  const { data, error } = await supabase
    .from('coach_attendance')
    .select('*')
    .eq('date', date)

  if (error) throw error
  return (data ?? []) as CoachAttendance[]
}

export async function fetchMonthlyPayroll(
  month: number,
  year: number,
  coaches: Coach[],
): Promise<PayrollSummary[]> {
  const d     = new Date(year, month - 1)
  const start = format(startOfMonth(d), 'yyyy-MM-dd')
  const end   = format(endOfMonth(d),   'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('coach_attendance')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })

  if (error) throw error
  const atts = (data ?? []) as CoachAttendance[]

  return coaches.map(coach => {
    const coachAtts   = atts.filter(a => a.coach_id === coach.id)
    const confirmed   = coachAtts.filter(a => a.confirmed_by_coach && !a.disputed)
    const verified    = coachAtts.filter(a => a.verified)
    const disputed    = coachAtts.filter(a => a.disputed)

    return {
      coach,
      totalSessions:     coachAtts.length,
      confirmedSessions: confirmed.length,
      verifiedSessions:  verified.length,
      disputedSessions:  disputed.length,
      payout:            verified.length * coach.per_session_rate,
      attendance:        coachAtts,
    }
  })
}

export async function calculatePayroll(
  coachId: string,
  month: number,
  year: number,
  perSessionRate: number,
): Promise<{ sessions: number; payout: number }> {
  const atts     = await fetchCoachAttendance(coachId, month, year)
  const verified = atts.filter(a => a.confirmed_by_coach && a.verified && !a.disputed)
  return { sessions: verified.length, payout: verified.length * perSessionRate }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCoaches(): UseCoachesReturn {
  const [coaches,   setCoaches]   = useState<CoachWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const today      = new Date()
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
      const monthEnd   = format(endOfMonth(today),   'yyyy-MM-dd')

      const [coachesRes, attRes] = await Promise.all([
        supabase.from('coaches').select('*').order('name'),
        supabase
          .from('coach_attendance')
          .select('*')
          .gte('date', monthStart)
          .lte('date', monthEnd),
      ])

      if (coachesRes.error) throw coachesRes.error
      if (attRes.error)     throw attRes.error

      const raw  = (coachesRes.data ?? []) as Coach[]
      const atts = (attRes.data     ?? []) as CoachAttendance[]

      const enriched: CoachWithStats[] = raw.map(coach => {
        const mine         = atts.filter(a => a.coach_id === coach.id)
        const verifiedMine = mine.filter(a => a.confirmed_by_coach && a.verified)
        return {
          ...coach,
          sessionsThisMonth: mine.length,
          earningsThisMonth: verifiedMine.length * coach.per_session_rate,
        }
      })

      setCoaches(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coaches')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Mutations ───────────────────────────────────────────────────────────────

  const markCoachAttendance = useCallback(async (
    coachId:  string,
    date:     string,
    batch:    string,
    session:  string,
    markedBy: string,
    note?:    string,
  ): Promise<void> => {
    // Owner's mark is instantly confirmed + verified — no peer confirmation needed
    const ownerMarking = useAuthStore.getState().isOwner()
    const { error: err } = await supabase
      .from('coach_attendance')
      .insert({
        coach_id:           coachId,
        date,
        batch,
        session,
        marked_by:          markedBy,
        confirmed_by_coach: ownerMarking,
        disputed:           false,
        verified:           ownerMarking,
        session_note:       note?.trim() || null,
      })
    if (err) throw err
  }, [])

  const confirmAttendance = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('coach_attendance')
      .update({ confirmed_by_coach: true })
      .eq('id', id)
    if (err) throw err
  }, [])

  const disputeAttendance = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('coach_attendance')
      .update({ disputed: true, confirmed_by_coach: false })
      .eq('id', id)
    if (err) throw err
  }, [])

  const verifyAttendance = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('coach_attendance')
      .update({ verified: true })
      .eq('id', id)
    if (err) throw err
  }, [])

  // Owner bypasses peer-confirm flow: sets confirmed + verified in one shot
  const ownerConfirmAttendance = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('coach_attendance')
      .update({ confirmed_by_coach: true, verified: true })
      .eq('id', id)
    if (err) throw err
  }, [])

  return {
    coaches,
    isLoading,
    error,
    markCoachAttendance,
    confirmAttendance,
    disputeAttendance,
    verifyAttendance,
    ownerConfirmAttendance,
    refetch: load,
  }
}
