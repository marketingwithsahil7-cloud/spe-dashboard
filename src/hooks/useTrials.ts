import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { ACADEMY_ID } from '../lib/constants'
import type { Trial, TrialStatus, BatchType } from '../types/index'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TrialInput {
  name: string
  parent_name?: string | null
  parent_phone?: string | null
  trial_date: string
  follow_up_date?: string | null
}

export interface TrialResolveData {
  status: Exclude<TrialStatus, 'pending'>
  reason?: string | null
  follow_up_date?: string | null
}

export interface ConvertStudentData {
  batch: BatchType
  monthly_fee: number
  billing_cycle_day: number | null
}

export interface UseTrialsReturn {
  trials: Trial[]
  isLoading: boolean
  error: string | null
  addTrial: (data: TrialInput) => Promise<Trial>
  resolveTrial: (id: string, data: TrialResolveData) => Promise<void>
  convertToStudent: (trial: Trial, data: ConvertStudentData) => Promise<void>
  deleteTrial: (id: string) => Promise<void>
  refetch: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrials(): UseTrialsReturn {
  const [trials,    setTrials]    = useState<Trial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('trials')
        .select('*')
        .order('trial_date', { ascending: false })
      if (err) throw err
      setTrials((data ?? []) as Trial[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trials')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addTrial = useCallback(async (data: TrialInput): Promise<Trial> => {
    const { data: inserted, error: err } = await supabase
      .from('trials')
      .insert({
        name:           data.name,
        parent_name:    data.parent_name    ?? null,
        parent_phone:   data.parent_phone   ?? null,
        trial_date:     data.trial_date,
        follow_up_date: data.follow_up_date ?? null,
        status:         'pending',
      })
      .select()
      .single()
    if (err) throw err
    await load()
    return inserted as Trial
  }, [load])

  const resolveTrial = useCallback(async (id: string, data: TrialResolveData): Promise<void> => {
    const { error: err } = await supabase
      .from('trials')
      .update({
        status:         data.status,
        reason:         data.reason         ?? null,
        follow_up_date: data.follow_up_date ?? null,
      })
      .eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  // Marks trial closed, then inserts an active student from trial data
  const convertToStudent = useCallback(async (trial: Trial, data: ConvertStudentData): Promise<void> => {
    const { error: resolveErr } = await supabase
      .from('trials')
      .update({ status: 'closed' })
      .eq('id', trial.id)
    if (resolveErr) throw resolveErr

    const { error: studentErr } = await supabase
      .from('students')
      .insert({
        name:               trial.name,
        parent_name:        trial.parent_name  ?? null,
        parent_phone:       trial.parent_phone ?? null,
        batch:              data.batch,
        status:             'active',
        monthly_fee:        data.monthly_fee,
        billing_cycle_day:  data.billing_cycle_day,
        join_date:          format(new Date(), 'yyyy-MM-dd'),
        academy_id:         ACADEMY_ID,
        photo_url:          null,
      })
    if (studentErr) throw studentErr

    await load()
  }, [load])

  const deleteTrial = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('trials').delete().eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  return { trials, isLoading, error, addTrial, resolveTrial, convertToStudent, deleteTrial, refetch: load }
}
