import { useState, useEffect, useCallback, useMemo } from 'react'
import { Check, Copy, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateBroadcastMessage } from '../../hooks/useEvents'
import { Drawer } from '../ui/Drawer'
import { Avatar } from '../ui/Avatar'
import { Skeleton } from '../ui/Skeleton'
import { cn, formatDate } from '../../lib/utils'
import { getAgeCategory, AGE_CATEGORIES } from '../../lib/ageCategories'
import type { AgeCategory } from '../../lib/ageCategories'
import type { Student, AvailabilityStatus } from '../../types/index'
import type { EventWithAvailability } from '../../hooks/useEvents'

// ─── Local data hook ─────────────────────────────────────────────────────────

function useActiveStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase
      .from('students')
      .select('*')
      .eq('status', 'active')
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) setStudents(data as Student[])
        setLoading(false)
      })
  }, [])

  return { students, loading }
}

// ─── Status pill button ───────────────────────────────────────────────────────

interface StatusPillProps {
  status:   AvailabilityStatus
  current:  AvailabilityStatus
  label:    string
  emoji:    string
  onClick:  () => void
  loading:  boolean
}

const PILL_STYLES: Record<AvailabilityStatus, { active: React.CSSProperties; inactive: React.CSSProperties }> = {
  available: {
    active:   { background: 'rgba(0,255,135,0.15)',  border: '1px solid rgba(0,255,135,0.4)',  color: '#00FF87' },
    inactive: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' },
  },
  not_available: {
    active:   { background: 'rgba(255,61,87,0.15)',  border: '1px solid rgba(255,61,87,0.4)',  color: '#FF3D57' },
    inactive: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' },
  },
  maybe: {
    active:   { background: 'rgba(255,184,0,0.15)',  border: '1px solid rgba(255,184,0,0.4)',  color: '#FFB800' },
    inactive: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' },
  },
  no_response: {
    active:   { background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.3)', color: '#94A3B8' },
    inactive: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' },
  },
}

function StatusPill({ status, current, label, emoji, onClick, loading }: StatusPillProps) {
  const isActive = current === status
  const style    = isActive ? PILL_STYLES[status].active : PILL_STYLES[status].inactive
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1 px-2 py-1 rounded-lg font-body text-[11px] font-semibold transition-all duration-150 disabled:opacity-60"
      style={style}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}

// ─── Filter tab types ─────────────────────────────────────────────────────────

type FilterTab = 'all' | AvailabilityStatus

const FILTER_TABS: { id: FilterTab; label: string; emoji: string }[] = [
  { id: 'all',           label: 'All',         emoji: '👥' },
  { id: 'available',     label: 'Available',   emoji: '✅' },
  { id: 'not_available', label: 'Not Avail',   emoji: '❌' },
  { id: 'maybe',         label: 'Maybe',       emoji: '🤔' },
  { id: 'no_response',   label: 'No Response', emoji: '⏳' },
]

// ─── Broadcast message section ────────────────────────────────────────────────

function BroadcastSection({ event }: { event: EventWithAvailability }) {
  const [copied,   setCopied]   = useState(false)
  const [expanded, setExpanded] = useState(false)

  const message = useMemo(() => generateBroadcastMessage(event), [event])

  async function handleCopy() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,255,135,0.15)', background: 'rgba(0,255,135,0.03)' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-xs font-semibold text-grass uppercase tracking-widest">
          Broadcast Message
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 font-body text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Preview'}
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all duration-200',
              copied
                ? 'text-grass'
                : 'text-slate-300 hover:text-white',
            )}
            style={{
              background: copied ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.06)',
              border: copied ? '1px solid rgba(0,255,135,0.3)' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy Message'}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: '1px solid rgba(0,255,135,0.08)' }}
        >
          <pre className="font-body text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap mt-3">
            {message}
          </pre>
        </div>
      )}
    </div>
  )
}

// ─── Summary chips ─────────────────────────────────────────────────────────────

function SummaryChips({
  available, notAvailable, maybe, noResponse,
}: { available: number; notAvailable: number; maybe: number; noResponse: number }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[
        { emoji: '✅', count: available,    color: '#00FF87', bg: 'rgba(0,255,135,0.08)',  border: 'rgba(0,255,135,0.2)'  },
        { emoji: '❌', count: notAvailable, color: '#FF3D57', bg: 'rgba(255,61,87,0.08)',  border: 'rgba(255,61,87,0.2)'  },
        { emoji: '🤔', count: maybe,        color: '#FFB800', bg: 'rgba(255,184,0,0.08)',  border: 'rgba(255,184,0,0.2)'  },
        { emoji: '⏳', count: noResponse,   color: '#94A3B8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.18)' },
      ].map(({ emoji, count, color, bg, border }) => (
        <span
          key={emoji}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-body text-xs font-semibold"
          style={{ background: bg, border: `1px solid ${border}`, color }}
        >
          {emoji} {count}
        </span>
      ))}
    </div>
  )
}

// ─── Message by age category ─────────────────────────────────────────────────

function MessageByCategory({
  students,
  localAvail,
  event,
}: {
  students: Student[]
  localAvail: Record<string, AvailabilityStatus>
  event: EventWithAvailability
}) {
  const [expanded, setExpanded] = useState(false)
  const [copiedCat, setCopiedCat] = useState<AgeCategory | null>(null)

  const grouped = useMemo(() => {
    const result: Record<AgeCategory, Student[]> = { U10: [], U15: [], Open: [] }
    for (const s of students) {
      const status = localAvail[s.id] ?? 'no_response'
      if (status !== 'available') continue
      const cat = getAgeCategory(s.dob)
      if (cat) result[cat].push(s)
    }
    return result
  }, [students, localAvail])

  const totalWithCategory = students.filter(s => getAgeCategory(s.dob) !== null).length
  if (totalWithCategory === 0) return null

  function buildMessage(cat: AgeCategory, list: Student[]): string {
    const names = list.map(s => s.name).join(', ')
    const dateStr = event.date
      ? new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'upcoming event'
    return `Hi! This message is for ${cat} category parents.\n\n${event.title} is on ${dateStr}${event.location ? ' at ' + event.location : ''}.\n\nConfirmed players: ${names || 'None yet'}.\n\nPlease ensure your ward is ready on time.\n\n— Soccer Pro Elite Academy`
  }

  async function handleCopy(cat: AgeCategory) {
    await navigator.clipboard.writeText(buildMessage(cat, grouped[cat]))
    setCopiedCat(cat)
    setTimeout(() => setCopiedCat(null), 2000)
  }

  const CAT_STYLE: Record<AgeCategory, { color: string; bg: string; border: string }> = {
    U10:  { color: '#00FF87', bg: 'rgba(0,255,135,0.08)',  border: 'rgba(0,255,135,0.2)'  },
    U15:  { color: '#00D4FF', bg: 'rgba(0,212,255,0.08)',  border: 'rgba(0,212,255,0.2)'  },
    Open: { color: '#FFB800', bg: 'rgba(255,184,0,0.08)',  border: 'rgba(255,184,0,0.2)'  },
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(0,212,255,0.15)', background: 'rgba(0,212,255,0.03)' }}
    >
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={13} className="text-ice" />
          <span className="font-display text-xs font-semibold text-ice uppercase tracking-widest">
            Message by Age Group
          </span>
        </div>
        {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}>
          <p className="font-body text-[11px] text-slate-500 mt-3">
            Copy a message for each age group's parents. Shows available players only.
          </p>
          {AGE_CATEGORIES.map(cat => {
            const list = grouped[cat]
            const style = CAT_STYLE[cat]
            return (
              <div
                key={cat}
                className="rounded-xl p-3 space-y-2"
                style={{ background: style.bg, border: `1px solid ${style.border}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-display text-xs font-bold uppercase tracking-wider"
                      style={{ color: style.color }}
                    >
                      {cat}
                    </span>
                    <span className="font-body text-[11px] text-slate-400">
                      {list.length} available
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(cat)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-body text-xs font-semibold transition-all duration-200',
                      copiedCat === cat ? 'text-grass' : 'text-slate-300 hover:text-white',
                    )}
                    style={{
                      background: copiedCat === cat ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.06)',
                      border: copiedCat === cat ? '1px solid rgba(0,255,135,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {copiedCat === cat ? <Check size={11} /> : <Copy size={11} />}
                    {copiedCat === cat ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {list.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {list.map(s => (
                      <span
                        key={s.id}
                        className="font-body text-[10px] px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}
                      >
                        {s.name}
                        {s.parent_phone && (
                          <a
                            href={`https://wa.me/${s.parent_phone.replace(/\D/g, '')}?text=${encodeURIComponent(buildMessage(cat, list))}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1.5 text-grass hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            WA
                          </a>
                        )}
                      </span>
                    ))}
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

// ─── Main component ───────────────────────────────────────────────────────────

interface AvailabilityTrackerProps {
  event:              EventWithAvailability | null
  isOpen:             boolean
  onClose:            () => void
  updateAvailability: (eventId: string, studentId: string, status: AvailabilityStatus) => Promise<void>
}

export function AvailabilityTracker({ event, isOpen, onClose, updateAvailability }: AvailabilityTrackerProps) {
  const { students, loading: studentsLoading } = useActiveStudents()

  // Local optimistic availability map: studentId → status
  const [localAvail,   setLocalAvail]   = useState<Record<string, AvailabilityStatus>>({})
  const [updating,     setUpdating]     = useState<Record<string, boolean>>({})
  const [activeTab,    setActiveTab]    = useState<FilterTab>('all')
  const [updateError,  setUpdateError]  = useState<string | null>(null)

  // Sync localAvail when event changes
  useEffect(() => {
    if (!event) return
    const map: Record<string, AvailabilityStatus> = {}
    for (const a of event.availability) {
      map[a.student_id] = a.status
    }
    setLocalAvail(map)
    setActiveTab('all')
  }, [event])

  const getStatus = useCallback(
    (studentId: string): AvailabilityStatus => localAvail[studentId] ?? 'no_response',
    [localAvail],
  )

  async function handleStatusChange(studentId: string, status: AvailabilityStatus) {
    if (!event) return
    const prev = getStatus(studentId)
    setUpdateError(null)
    setLocalAvail(m => ({ ...m, [studentId]: status }))
    setUpdating(m => ({ ...m, [studentId]: true }))
    try {
      await updateAvailability(event.id, studentId, status)
    } catch (err) {
      setLocalAvail(m => ({ ...m, [studentId]: prev }))
      setUpdateError(err instanceof Error ? err.message : 'Failed to save — please try again')
    } finally {
      setUpdating(m => ({ ...m, [studentId]: false }))
    }
  }

  // Counts
  const available    = Object.values(localAvail).filter(s => s === 'available').length
  const notAvailable = Object.values(localAvail).filter(s => s === 'not_available').length
  const maybe        = Object.values(localAvail).filter(s => s === 'maybe').length
  const responded    = Object.values(localAvail).length
  const noResponse   = Math.max(0, students.length - responded)

  // Filtered students
  const visibleStudents = useMemo(() => {
    if (activeTab === 'all') return students
    return students.filter(s => getStatus(s.id) === activeTab)
  }, [students, activeTab, getStatus])

  if (!event) return null

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      width="min(560px, 100vw)"
    >
      <div className="space-y-5">

        {/* Event meta */}
        <div className="space-y-1">
          {event.date && (
            <p className="font-body text-xs text-slate-400">{formatDate(event.date)}</p>
          )}
          {event.location && (
            <p className="font-body text-xs text-slate-500">{event.location}</p>
          )}
        </div>

        {/* Summary chips */}
        <SummaryChips
          available={available}
          notAvailable={notAvailable}
          maybe={maybe}
          noResponse={noResponse}
        />

        {/* Update error banner */}
        {updateError && (
          <div
            className="rounded-xl px-3 py-2 font-body text-xs text-danger"
            style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.2)' }}
          >
            {updateError}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_TABS.map(tab => {
            const count =
              tab.id === 'all'           ? students.length :
              tab.id === 'available'     ? available :
              tab.id === 'not_available' ? notAvailable :
              tab.id === 'maybe'         ? maybe :
              noResponse
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-1 px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all duration-150',
                  activeTab === tab.id
                    ? 'text-pitch bg-grass shadow-[0_0_12px_rgba(0,255,135,0.2)]'
                    : 'text-slate-400 glass glass-hover hover:text-white',
                ].join(' ')}
              >
                {tab.emoji} {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold ml-0.5 px-1 py-0.5 rounded-md leading-none',
                    activeTab === tab.id ? 'bg-pitch/20 text-pitch' : 'bg-white/10 text-slate-400',
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Student list */}
        <div className="space-y-2">
          {studentsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 glass rounded-xl p-3">
                <Skeleton width={36} height={36} rounded="rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height={10} className="w-2/5" />
                  <Skeleton height={8} className="w-1/4" />
                </div>
                <div className="flex gap-1.5">
                  {[1,2,3,4].map(n => <Skeleton key={n} width={60} height={26} rounded="rounded-lg" />)}
                </div>
              </div>
            ))
          ) : visibleStudents.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="font-body text-sm text-slate-500">No students in this view</p>
            </div>
          ) : (
            visibleStudents.map(student => {
              const status   = getStatus(student.id)
              const isUpdating = updating[student.id] ?? false
              return (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-xl p-3 transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Avatar name={student.name} size="sm" src={student.photo_url ?? undefined} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-white font-medium truncate">{student.name}</p>
                    <p className="font-body text-[10px] text-slate-500">{student.batch}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusPill status="available"     current={status} label="Yes"   emoji="✅" loading={isUpdating} onClick={() => handleStatusChange(student.id, 'available')} />
                    <StatusPill status="not_available" current={status} label="No"    emoji="❌" loading={isUpdating} onClick={() => handleStatusChange(student.id, 'not_available')} />
                    <StatusPill status="maybe"         current={status} label="Maybe" emoji="🤔" loading={isUpdating} onClick={() => handleStatusChange(student.id, 'maybe')} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Broadcast section */}
        <BroadcastSection event={event} />

        {/* Message by age category */}
        <MessageByCategory students={students} localAvail={localAvail} event={event} />
      </div>
    </Drawer>
  )
}
