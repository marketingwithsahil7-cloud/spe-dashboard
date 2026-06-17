import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Event, EventAvailability, AvailabilityStatus } from '../types/index'

// ─── Extended types ───────────────────────────────────────────────────────────

export interface EventWithAvailability extends Event {
  availability: EventAvailability[]
}

interface UseEventsReturn {
  events: EventWithAvailability[]
  totalStudents: number
  isLoading: boolean
  error: string | null
  addEvent: (data: Omit<Event, 'id' | 'created_at'>) => Promise<void>
  updateEvent: (id: string, data: Partial<Omit<Event, 'id' | 'created_at'>>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  updateAvailability: (eventId: string, studentId: string, status: AvailabilityStatus) => Promise<void>
  refetch: () => void
}

// ─── Standalone helpers ───────────────────────────────────────────────────────

export async function fetchEvent(id: string): Promise<EventWithAvailability | null> {
  const [eventRes, availRes] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    supabase.from('event_availability').select('*').eq('event_id', id),
  ])
  if (eventRes.error) throw eventRes.error
  if (availRes.error) throw availRes.error
  if (!eventRes.data) return null
  return {
    ...(eventRes.data as Event),
    availability: (availRes.data ?? []) as EventAvailability[],
  }
}

export async function fetchAvailability(eventId: string): Promise<EventAvailability[]> {
  const { data, error } = await supabase
    .from('event_availability')
    .select('*')
    .eq('event_id', eventId)
  if (error) throw error
  return (data ?? []) as EventAvailability[]
}

export function generateBroadcastMessage(event: Event): string {
  const dateStr = event.date ? format(new Date(event.date), 'EEEE, d MMMM yyyy') : 'TBD'
  const lines: string[] = [
    `⚽ Soccer Pro Elite — ${event.title}`,
    `📅 Date: ${dateStr}`,
  ]
  if (event.location) lines.push(`📍 Location: ${event.location}`)
  if (event.details)  lines.push(`📝 ${event.details}`)
  lines.push(
    '',
    'Please confirm your availability:',
    'Reply 1 — Available ✅',
    'Reply 2 — Not Available ❌',
    'Reply 3 — Maybe 🤔',
    '',
    '— Soccer Pro Elite Academy',
  )
  return lines.join('\n')
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEvents(): UseEventsReturn {
  const [events,        setEvents]        = useState<EventWithAvailability[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [eventsRes, availRes, countRes] = await Promise.all([
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('event_availability').select('*'),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ])

      if (eventsRes.error) throw eventsRes.error
      if (availRes.error)  throw availRes.error
      if (countRes.error)  throw countRes.error

      const rawEvents = (eventsRes.data ?? []) as Event[]
      const allAvail  = (availRes.data  ?? []) as EventAvailability[]

      const enriched: EventWithAvailability[] = rawEvents.map(ev => ({
        ...ev,
        availability: allAvail.filter(a => a.event_id === ev.id),
      }))

      setEvents(enriched)
      setTotalStudents(countRes.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addEvent = useCallback(async (data: Omit<Event, 'id' | 'created_at'>): Promise<void> => {
    const row = { ...data, age_category: data.age_category || 'all' }
    const { error: err } = await supabase.from('events').insert(row)
    if (err) throw err
    await load()
  }, [load])

  const updateEvent = useCallback(async (
    id: string,
    data: Partial<Omit<Event, 'id' | 'created_at'>>,
  ): Promise<void> => {
    const { error: err } = await supabase.from('events').update(data).eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('events').delete().eq('id', id)
    if (err) throw err
    await load()
  }, [load])

  const updateAvailability = useCallback(async (
    eventId:   string,
    studentId: string,
    status:    AvailabilityStatus,
  ): Promise<void> => {
    // upsert via ON CONFLICT requires a unique index — use explicit select+insert/update
    // so it works even before the DB constraint is backfilled
    const { data: rows, error: selectErr } = await supabase
      .from('event_availability')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .limit(1)

    if (selectErr) throw selectErr

    const existing = rows?.[0] ?? null

    if (existing) {
      const { error: err } = await supabase
        .from('event_availability')
        .update({ status })
        .eq('id', existing.id)
      if (err) throw err
    } else {
      const { error: err } = await supabase
        .from('event_availability')
        .insert({ event_id: eventId, student_id: studentId, status })
      if (err) throw err
    }
  }, [])

  return {
    events,
    totalStudents,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    updateAvailability,
    refetch: load,
  }
}
