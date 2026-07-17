import { useRef, useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
  Users, Clock, Loader2, CalendarOff,
} from 'lucide-react'
import { gsap } from '../../lib/animations'
import { useAuthStore } from '../../store/authStore'
import { useAcademySettings } from '../../hooks/useAcademySettings'
import { fetchDayAttendance, fetchCoachAttendance, fetchAllCoachAttendanceForMonth } from '../../hooks/useCoaches'
import { Avatar } from '../ui/Avatar'
import { Skeleton } from '../ui/Skeleton'
import { cn, formatDate } from '../../lib/utils'
import { BATCHES } from '../../lib/constants'
import type { Coach, CoachAttendance as CoachAttRecord } from '../../types/index'

// Falls back to Tue/Thu/Sat when academy_settings.training_days hasn't been configured.
const DEFAULT_ACADEMY_DAYS = ['tuesday', 'thursday', 'saturday']

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoachAttendanceProps {
  coaches:                 Coach[]
  markCoachAttendance:     (coachId: string, date: string, batch: string, session: string, markedBy: string, note?: string) => Promise<void>
  confirmAttendance:       (id: string) => Promise<void>
  disputeAttendance:       (id: string) => Promise<void>
  ownerConfirmAttendance?: (id: string) => Promise<void>
}

// ─── Batch colors ─────────────────────────────────────────────────────────────

const BATCH_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  '5-6 PM': { text: 'text-ice',   bg: 'rgba(0,212,255,0.06)',  border: 'rgba(0,212,255,0.2)'  },
  '6-7 PM': { text: 'text-grass', bg: 'rgba(0,255,135,0.06)',  border: 'rgba(0,255,135,0.2)'  },
}

// ─── Status chip ──────────────────────────────────────────────────────────────

function StatusChip({ record }: { record: CoachAttRecord }) {
  if (record.disputed) {
    return (
      <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(255,61,87,0.12)', border: '1px solid rgba(255,61,87,0.3)', color: '#FF3D57' }}>
        <XCircle size={10} /> Disputed
      </span>
    )
  }
  if (record.verified) {
    return (
      <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.3)', color: '#00FF87' }}>
        <CheckCircle2 size={10} /> Verified
      </span>
    )
  }
  if (record.confirmed_by_coach) {
    return (
      <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
        <CheckCircle2 size={10} /> Confirmed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(255,184,0,0.10)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}>
      <Clock size={10} /> Pending
    </span>
  )
}

// ─── Section A — Mark today's sessions ───────────────────────────────────────

interface SectionAProps {
  coaches:                 Coach[]
  markCoachAttendance:     CoachAttendanceProps['markCoachAttendance']
  ownerConfirmAttendance?: (id: string) => Promise<void>
}

function SectionA({ coaches, markCoachAttendance, ownerConfirmAttendance }: SectionAProps) {
  const currentCoach     = useAuthStore(s => s.coach)
  const isOwnerUser      = useAuthStore(s => s.role === 'owner')
  const isHeadOrOwnerUser = useAuthStore(s => s.role === 'owner' || s.role === 'head')
  const { settings: academySettings } = useAcademySettings()

  // Assistants can only mark/view their own row — head/owner see everyone
  const visibleCoaches = isHeadOrOwnerUser
    ? coaches
    : coaches.filter(c => c.id === currentCoach?.id)

  const academyDays = academySettings?.training_days?.length
    ? academySettings.training_days
    : DEFAULT_ACADEMY_DAYS

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const selectedDayName = format(new Date(`${selectedDate}T12:00:00`), 'EEEE').toLowerCase()
  const isAcademyDay = academyDays.includes(selectedDayName)
  const [dayRecords,   setDayRecords]   = useState<CoachAttRecord[]>([])
  const [loadingDay,   setLoadingDay]   = useState(false)
  const [markingId,    setMarkingId]    = useState<string | null>(null)  // coachId-batch
  const [markingAll,   setMarkingAll]   = useState<string | null>(null)  // batch
  const [noteDrafts,   setNoteDrafts]   = useState<Record<string, string>>({})  // batch -> draft note
  const listRef = useRef<HTMLDivElement>(null)

  const loadDay = useCallback(async (date: string) => {
    setLoadingDay(true)
    try {
      const records = await fetchDayAttendance(date)
      setDayRecords(records)
    } catch {
      // silent — UI still shows
    } finally {
      setLoadingDay(false)
    }
  }, [])

  useEffect(() => { loadDay(selectedDate) }, [selectedDate, loadDay])

  useEffect(() => {
    if (loadingDay || !listRef.current) return
    const rows = listRef.current.querySelectorAll<HTMLElement>('.mark-row')
    if (!rows.length) return
    gsap.fromTo(
      rows,
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' },
    )
  }, [loadingDay, selectedDate])

  // Lookup: is this coach already marked for this date + batch?
  function getRecord(coachId: string, batch: string): CoachAttRecord | null {
    return dayRecords.find(r => r.coach_id === coachId && r.batch === batch) ?? null
  }

  async function handleMark(coach: Coach, batch: string) {
    if (!currentCoach || !isAcademyDay) return
    const key  = `${coach.id}-${batch}`
    const note = noteDrafts[batch]?.trim() || null
    setMarkingId(key)
    try {
      await markCoachAttendance(
        coach.id,
        selectedDate,
        batch,
        batch,          // session = batch
        currentCoach.id,
        note ?? undefined,
      )
      // Optimistically add to local state — owner gets instant confirmed+verified
      setDayRecords(prev => [...prev, {
        id:                 `tmp-${Date.now()}`,
        coach_id:           coach.id,
        date:               selectedDate,
        batch,
        session:            batch,
        marked_by:          currentCoach.id,
        confirmed_by_coach: isOwnerUser,
        disputed:           false,
        verified:           isOwnerUser,
        session_note:       note,
        created_at:         new Date().toISOString(),
      }])
      setNoteDrafts(prev => ({ ...prev, [batch]: '' }))
    } catch {
      // Revert optimistic on error
      await loadDay(selectedDate)
    } finally {
      setMarkingId(null)
    }
  }

  async function handleMarkAll(batch: string) {
    if (!currentCoach || !isAcademyDay) return
    const note = noteDrafts[batch]?.trim() || undefined
    setMarkingAll(batch)
    try {
      const unmarked = visibleCoaches.filter(c => !getRecord(c.id, batch))
      await Promise.all(
        unmarked.map(c =>
          markCoachAttendance(c.id, selectedDate, batch, batch, currentCoach.id, note),
        ),
      )
      await loadDay(selectedDate)
      setNoteDrafts(prev => ({ ...prev, [batch]: '' }))
    } catch {
      await loadDay(selectedDate)
    } finally {
      setMarkingAll(null)
    }
  }

  async function handleOwnerConfirm(record: CoachAttRecord) {
    if (!ownerConfirmAttendance) return
    const key = `confirm-${record.id}`
    setMarkingId(key)
    try {
      await ownerConfirmAttendance(record.id)
      setDayRecords(prev => prev.map(r =>
        r.id === record.id ? { ...r, confirmed_by_coach: true, verified: true } : r,
      ))
    } catch {
      await loadDay(selectedDate)
    } finally {
      setMarkingId(null)
    }
  }

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    // Don't allow future dates
    if (d > new Date()) return
    setSelectedDate(format(d, 'yyyy-MM-dd'))
  }

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-white uppercase tracking-widest">
            Mark Sessions
          </h3>
          <p className="font-body text-xs text-slate-500 mt-0.5">
            Who coached each session today?
          </p>
        </div>
        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="w-8 h-8 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-body text-xs text-white min-w-[80px] text-center">
            {isToday ? 'Today' : format(new Date(`${selectedDate}T12:00:00`), 'd MMM')}
          </span>
          <button
            onClick={() => navigateDate(1)}
            disabled={isToday}
            className="w-8 h-8 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Batch sections */}
      {!isAcademyDay ? (
        <div
          className="rounded-xl p-6 flex flex-col items-center gap-2 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <CalendarOff size={20} className="text-slate-500" />
          <p className="font-body text-sm text-slate-400">
            Not an academy day — attendance can only be marked on{' '}
            {academyDays.map(d => d[0].toUpperCase() + d.slice(1)).join(', ')}.
          </p>
        </div>
      ) : loadingDay ? (
        <div className="space-y-4">
          {BATCHES.filter(b => b !== 'Both').map(b => (
            <div key={b} className="rounded-xl p-4 space-y-3"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Skeleton height={14} className="w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton width={32} height={32} rounded="rounded-full" />
                  <Skeleton height={12} className="flex-1" />
                  <Skeleton width={72} height={28} rounded="rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div ref={listRef} className="space-y-4">
          {BATCHES.filter(b => b !== 'Both').map(batch => {
            const color         = BATCH_COLORS[batch] ?? BATCH_COLORS['5-6 PM']
            const allMarked     = visibleCoaches.every(c => !!getRecord(c.id, batch))
            const isMarkingAll  = markingAll === batch
            const showBulkMark  = visibleCoaches.length > 1

            return (
              <div
                key={batch}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: color.bg, border: `1px solid ${color.border}` }}
              >
                {/* Batch header */}
                <div className="flex items-center justify-between">
                  <span className={cn('font-display text-xs font-bold uppercase tracking-widest', color.text)}>
                    {batch}
                  </span>
                  {showBulkMark && !allMarked && (
                    <button
                      disabled={isMarkingAll}
                      onClick={() => handleMarkAll(batch)}
                      className="flex items-center gap-1.5 font-body text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}
                    >
                      {isMarkingAll
                        ? <><Loader2 size={10} className="animate-spin" /> Marking…</>
                        : <><Users size={10} /> Mark All</>
                      }
                    </button>
                  )}
                  {showBulkMark && allMarked && (
                    <span className="font-body text-[11px] text-grass flex items-center gap-1">
                      <CheckCircle2 size={11} /> All marked
                    </span>
                  )}
                </div>

                {/* Coach rows */}
                {visibleCoaches.map(coach => {
                  const record  = getRecord(coach.id, batch)
                  const key     = `${coach.id}-${batch}`
                  const marking = markingId === key

                  return (
                    <div key={coach.id} className="mark-row flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <Avatar name={coach.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-semibold text-white truncate">
                            {coach.name}
                          </p>
                          {record && (
                            <p className="font-body text-[10px] text-slate-500 mt-0.5">
                              Marked by {coaches.find(c => c.id === record.marked_by)?.name ?? 'Unknown'}
                            </p>
                          )}
                        </div>

                        {record ? (
                          isOwnerUser && !record.confirmed_by_coach && !record.disputed ? (
                            <button
                              disabled={markingId === `confirm-${record.id}`}
                              onClick={() => handleOwnerConfirm(record)}
                              className="flex items-center gap-1.5 font-body text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                              style={{
                                background: 'rgba(0,255,135,0.1)',
                                border:     '1px solid rgba(0,255,135,0.25)',
                                color:      '#00FF87',
                              }}
                            >
                              {markingId === `confirm-${record.id}`
                                ? <Loader2 size={11} className="animate-spin" />
                                : <CheckCircle2 size={11} />
                              }
                              {markingId === `confirm-${record.id}` ? 'Confirming…' : 'Confirm'}
                            </button>
                          ) : (
                            <StatusChip record={record} />
                          )
                        ) : (
                          <button
                            disabled={marking}
                            onClick={() => handleMark(coach, batch)}
                            className="flex items-center gap-1.5 font-body text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                            style={{
                              background: 'rgba(0,255,135,0.1)',
                              border:     '1px solid rgba(0,255,135,0.25)',
                              color:      '#00FF87',
                            }}
                          >
                            {marking
                              ? <Loader2 size={11} className="animate-spin" />
                              : <CheckCircle2 size={11} />
                            }
                            {marking ? 'Marking…' : 'Mark Present'}
                          </button>
                        )}
                      </div>

                      {record?.session_note && (
                        <p className="font-body text-[11px] text-slate-400 italic pl-11">
                          📝 &ldquo;{record.session_note}&rdquo;
                        </p>
                      )}
                    </div>
                  )
                })}

                {/* Session note — attaches to whichever row is marked next */}
                {!allMarked && (
                  <div className="pt-1">
                    <label className="flex items-center gap-1.5 font-body text-[11px] text-slate-500 mb-1.5">
                      📝 Session Note (optional)
                    </label>
                    <textarea
                      value={noteDrafts[batch] ?? ''}
                      onChange={e => setNoteDrafts(prev => ({ ...prev, [batch]: e.target.value }))}
                      placeholder="e.g. Left early due to emergency, covered first 30 mins..."
                      rows={2}
                      className="w-full rounded-lg px-3 py-2 font-body text-xs text-white placeholder:text-slate-600 resize-none focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Section B — My confirmations ─────────────────────────────────────────────

interface SectionBProps {
  coaches:                 Coach[]
  confirmAttendance:       CoachAttendanceProps['confirmAttendance']
  disputeAttendance:       CoachAttendanceProps['disputeAttendance']
  ownerConfirmAttendance?: (id: string) => Promise<void>
}

function SectionB({ coaches, confirmAttendance, disputeAttendance, ownerConfirmAttendance }: SectionBProps) {
  const currentCoach = useAuthStore(s => s.coach)
  const isOwnerUser  = useAuthStore(s => s.role === 'owner')

  const [records,     setRecords]     = useState<CoachAttRecord[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [actingId,    setActingId]    = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const today = new Date()

  const loadMyRecords = useCallback(async () => {
    if (!currentCoach) return
    setLoadingRecs(true)
    try {
      // Owner sees all coaches' records; others see only their own
      const recs = isOwnerUser
        ? await fetchAllCoachAttendanceForMonth(today.getMonth() + 1, today.getFullYear())
        : await fetchCoachAttendance(currentCoach.id, today.getMonth() + 1, today.getFullYear())
      setRecords(recs)
    } catch {
      // silent
    } finally {
      setLoadingRecs(false)
    }
  }, [currentCoach, isOwnerUser]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadMyRecords() }, [loadMyRecords])

  useEffect(() => {
    if (loadingRecs || !listRef.current) return
    const rows = listRef.current.querySelectorAll<HTMLElement>('.confirm-row')
    if (!rows.length) return
    gsap.fromTo(
      rows,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' },
    )
  }, [loadingRecs])

  async function handleConfirm(record: CoachAttRecord) {
    setActingId(record.id)
    try {
      await confirmAttendance(record.id)
      setRecords(prev => prev.map(r =>
        r.id === record.id ? { ...r, confirmed_by_coach: true } : r,
      ))
    } catch {
      // silent
    } finally {
      setActingId(null)
    }
  }

  async function handleDispute(record: CoachAttRecord) {
    setActingId(`d-${record.id}`)
    try {
      await disputeAttendance(record.id)
      setRecords(prev => prev.map(r =>
        r.id === record.id ? { ...r, disputed: true, confirmed_by_coach: false } : r,
      ))
    } catch {
      // silent
    } finally {
      setActingId(null)
    }
  }

  async function handleOwnerConfirmRec(record: CoachAttRecord) {
    if (!ownerConfirmAttendance) return
    setActingId(record.id)
    try {
      await ownerConfirmAttendance(record.id)
      setRecords(prev => prev.map(r =>
        r.id === record.id ? { ...r, confirmed_by_coach: true, verified: true } : r,
      ))
    } catch {
      // silent
    } finally {
      setActingId(null)
    }
  }

  const coachMap = Object.fromEntries(coaches.map(c => [c.id, c.name]))

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div>
        <h3 className="font-display text-sm font-semibold text-white uppercase tracking-widest">
          {isOwnerUser ? 'All Sessions' : 'My Sessions'} — {format(today, 'MMMM yyyy')}
        </h3>
        <p className="font-body text-xs text-slate-500 mt-0.5">
          {isOwnerUser
            ? 'Confirm any pending session instantly — your word is final'
            : 'Confirm or dispute your recorded sessions'
          }
        </p>
      </div>

      {/* Sessions list */}
      {loadingRecs ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton height={12} className="w-20" />
              <Skeleton height={12} className="w-16" />
              <div className="flex-1" />
              <Skeleton width={80} height={28} rounded="rounded-lg" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="py-8 text-center">
          <p className="font-body text-sm text-slate-500">No sessions recorded this month</p>
        </div>
      ) : (
        <div ref={listRef} className="flex flex-col gap-1">
          {/* Column headers */}
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-1 pb-1"
               style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="font-body text-[10px] text-slate-600 uppercase tracking-wider w-20">Date</span>
            <span className="font-body text-[10px] text-slate-600 uppercase tracking-wider">
              {isOwnerUser ? 'Coach · Batch' : 'Batch'}
            </span>
            <span className="font-body text-[10px] text-slate-600 uppercase tracking-wider">Marked by</span>
            <span className="font-body text-[10px] text-slate-600 uppercase tracking-wider">Status</span>
          </div>

          {records.map(record => {
            const canAct    = !record.confirmed_by_coach && !record.disputed
            const isActing  = actingId === record.id
            const isDispute = actingId === `d-${record.id}`

            return (
              <div
                key={record.id}
                className={cn(
                  'confirm-row grid items-center gap-3 py-2.5 px-1 rounded-xl transition-colors',
                  record.disputed
                    ? 'bg-danger/[0.04]'
                    : record.verified
                    ? 'bg-grass/[0.04]'
                    : '',
                )}
                style={{ gridTemplateColumns: 'auto 1fr auto auto' }}
              >
                <span className="font-body text-xs text-slate-300 w-20 shrink-0">
                  {formatDate(record.date)}
                </span>
                <span className="font-body text-xs text-white font-medium truncate">
                  {isOwnerUser && (
                    <span className="text-slate-500 mr-1">
                      {coachMap[record.coach_id] ?? 'Unknown'} ·
                    </span>
                  )}
                  {record.batch}
                </span>
                <span className="font-body text-xs text-slate-500 shrink-0">
                  {record.marked_by ? (coachMap[record.marked_by] ?? 'Unknown') : '—'}
                </span>

                <div className="shrink-0 flex items-center gap-1.5">
                  {canAct ? (
                    isOwnerUser ? (
                      <button
                        disabled={isActing}
                        onClick={() => handleOwnerConfirmRec(record)}
                        className="flex items-center gap-1 font-body text-[10px] font-semibold px-2 py-1 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00FF87' }}
                      >
                        {isActing ? <Loader2 size={9} className="animate-spin" /> : <CheckCircle2 size={9} />}
                        Confirm
                      </button>
                    ) : (
                      <>
                        <button
                          disabled={isActing || isDispute}
                          onClick={() => handleConfirm(record)}
                          className="flex items-center gap-1 font-body text-[10px] font-semibold px-2 py-1 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00FF87' }}
                        >
                          {isActing ? <Loader2 size={9} className="animate-spin" /> : <CheckCircle2 size={9} />}
                          Confirm
                        </button>
                        <button
                          disabled={isActing || isDispute}
                          onClick={() => handleDispute(record)}
                          className="flex items-center gap-1 font-body text-[10px] font-semibold px-2 py-1 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.25)', color: '#FF3D57' }}
                        >
                          {isDispute ? <Loader2 size={9} className="animate-spin" /> : <AlertTriangle size={9} />}
                          Dispute
                        </button>
                      </>
                    )
                  ) : (
                    <StatusChip record={record} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Exported component ───────────────────────────────────────────────────────

export function CoachAttendance({
  coaches,
  markCoachAttendance,
  confirmAttendance,
  disputeAttendance,
  ownerConfirmAttendance,
}: CoachAttendanceProps) {
  return (
    <div className="space-y-5">
      <SectionA coaches={coaches} markCoachAttendance={markCoachAttendance} ownerConfirmAttendance={ownerConfirmAttendance} />
      <SectionB coaches={coaches} confirmAttendance={confirmAttendance} disputeAttendance={disputeAttendance} ownerConfirmAttendance={ownerConfirmAttendance} />
    </div>
  )
}
