import { useRef, useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Trophy, CalendarDays, Users, Plus } from 'lucide-react'
import { gsap } from '../lib/animations'
import { useEvents } from '../hooks/useEvents'
import { usePermissions } from '../hooks/usePermissions'
import { EventCard } from '../components/events/EventCard'
import { EventForm } from '../components/events/EventForm'
import { AvailabilityTracker } from '../components/events/AvailabilityTracker'
import { Skeleton } from '../components/ui/Skeleton'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { EventWithAvailability } from '../hooks/useEvents'
import type { EventType } from '../types/index'

// ─── Filter types ─────────────────────────────────────────────────────────────

type TimeFilter = 'upcoming' | 'past' | 'all'
type TypeFilter = 'all' | EventType

const TIME_TABS: { id: TimeFilter; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past',     label: 'Past'     },
  { id: 'all',      label: 'All'      },
]

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
  { id: 'all',        label: 'All Types'  },
  { id: 'tournament', label: '🏆 Tournaments' },
  { id: 'friendly',   label: '⚽ Friendlies'  },
]

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: {
  icon:  React.ReactNode
  label: string
  value: string | number
  sub?:  string
}) {
  return (
    <div data-stat className="glass rounded-2xl p-4 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {icon}
      </div>
      <div>
        <p className="font-display text-xl font-bold text-white leading-none">{value}</p>
        <p className="font-body text-[10px] text-slate-500 mt-0.5">{label}{sub ? ` · ${sub}` : ''}</p>
      </div>
    </div>
  )
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton width={80} height={18} rounded="rounded-md" />
          <Skeleton height={18} className="w-3/4" />
        </div>
        <Skeleton width={40} height={40} rounded="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton height={12} className="w-1/2" />
        <Skeleton height={12} className="w-2/5" />
      </div>
      <Skeleton height={10} className="w-full" />
      <Skeleton height={6} className="w-full rounded-full" />
      <div className="flex gap-2">
        <Skeleton height={32} className="flex-1 rounded-xl" />
        <Skeleton height={32} className="flex-1 rounded-xl" />
        <Skeleton height={32} width={60} rounded="rounded-xl" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const statsRef = useRef<HTMLDivElement>(null)
  const gridRef  = useRef<HTMLDivElement>(null)

  const { canManageEvents } = usePermissions()
  const { events, totalStudents, isLoading, error, addEvent, updateEvent, deleteEvent, updateAvailability, refetch } = useEvents()

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const [formOpen,       setFormOpen]       = useState(false)
  const [editTarget,     setEditTarget]     = useState<EventWithAvailability | null>(null)
  const [trackerEvent,   setTrackerEvent]   = useState<EventWithAvailability | null>(null)
  const [trackerOpen,    setTrackerOpen]    = useState(false)
  const [deleteTarget,   setDeleteTarget]   = useState<EventWithAvailability | null>(null)
  const [deleting,       setDeleting]       = useState(false)

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Filtered event list
  const visible = useMemo(() => {
    let list = events

    if (timeFilter === 'upcoming') list = list.filter(e => e.date && e.date >= todayStr)
    if (timeFilter === 'past')     list = list.filter(e => e.date && e.date < todayStr)
    if (typeFilter !== 'all')      list = list.filter(e => e.type === typeFilter)

    return list
  }, [events, timeFilter, typeFilter, todayStr])

  // Stats
  const upcomingCount = useMemo(() => events.filter(e => e.date && e.date >= todayStr).length, [events, todayStr])

  const avgAvailPct = useMemo(() => {
    if (events.length === 0 || totalStudents === 0) return 0
    const total = events.reduce((sum, e) => {
      const avail = e.availability.filter(a => a.status === 'available').length
      return sum + (avail / totalStudents) * 100
    }, 0)
    return Math.round(total / events.length)
  }, [events, totalStudents])

  // GSAP stat entrance
  useEffect(() => {
    if (!isLoading && statsRef.current) {
      gsap.fromTo(
        statsRef.current.querySelectorAll('[data-stat]'),
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' },
      )
    }
  }, [isLoading])

  // GSAP card stagger on filter change
  useEffect(() => {
    if (isLoading || !gridRef.current) return
    const cards = gridRef.current.querySelectorAll<HTMLElement>('.event-card')
    if (!cards.length) return
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' },
    )
  }, [isLoading, timeFilter, typeFilter, visible.length])

  function handleEdit(event: EventWithAvailability) {
    setEditTarget(event)
    setFormOpen(true)
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditTarget(null)
  }

  function handleTrackerOpen(event: EventWithAvailability) {
    setTrackerEvent(event)
    setTrackerOpen(true)
  }

  function handleTrackerClose() {
    setTrackerOpen(false)
    refetch()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteEvent(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // ConfirmDialog stays open — coach can retry
    } finally {
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-3">
          <p className="font-body text-sm text-danger">{error}</p>
          <button onClick={refetch} className="font-body text-xs text-grass underline">Retry</button>
        </div>
    )
  }

  return (
    <>
      <div className="space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
              Events
            </h1>
            <p className="font-body text-sm text-slate-400 mt-1">
              {format(new Date(), 'MMMM yyyy')} · Tournaments & Friendlies
            </p>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3">
                <Skeleton width={36} height={36} rounded="rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton height={20} className="w-12" />
                  <Skeleton height={10} className="w-20" />
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                icon={<CalendarDays size={16} className="text-grass" />}
                label="Upcoming"
                value={upcomingCount}
              />
              <StatCard
                icon={<Trophy size={16} className="text-amber" />}
                label="Total Events"
                value={events.length}
              />
              <StatCard
                icon={<Users size={16} className="text-ice" />}
                label="Avg Availability"
                value={`${avgAvailPct}%`}
                sub={`${totalStudents} students`}
              />
            </>
          )}
        </div>

        {/* ── Filters ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Time tabs */}
          <div className="flex items-center gap-2">
            {TIME_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={[
                  'px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all duration-150',
                  timeFilter === tab.id
                    ? 'text-pitch bg-grass shadow-[0_0_16px_rgba(0,255,135,0.25)]'
                    : 'text-slate-400 glass glass-hover hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            {TYPE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={[
                  'px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all duration-150',
                  typeFilter === tab.id
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300',
                ].join(' ')}
                style={typeFilter === tab.id
                  ? { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Event grid ────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="glass rounded-2xl p-14 text-center space-y-3">
            <p className="text-4xl">
              {timeFilter === 'upcoming' ? '⚽' : timeFilter === 'past' ? '📅' : '🗓️'}
            </p>
            <p className="font-body text-sm text-slate-400">
              {timeFilter === 'upcoming'
                ? 'No upcoming events. Create one!'
                : timeFilter === 'past'
                  ? 'No past events yet'
                  : 'No events found'}
            </p>
            {canManageEvents && timeFilter === 'upcoming' && (
              <button
                onClick={() => setFormOpen(true)}
                className="font-body text-xs text-grass underline"
              >
                Add your first event →
              </button>
            )}
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visible.map(event => (
              <EventCard
                key={event.id}
                event={event}
                totalStudents={totalStudents}
                onViewAvailability={handleTrackerOpen}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      {canManageEvents && (
        <button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          data-magnetic
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-lg glow-green transition-all duration-200 hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00FF87 0%, #00D4FF 100%)' }}
          aria-label="Add event"
        >
          <Plus size={22} className="text-pitch" strokeWidth={2.5} />
        </button>
      )}

      {/* ── Drawers ──────────────────────────────────────────────────────────── */}
      <EventForm
        isOpen={formOpen}
        onClose={handleFormClose}
        onSave={addEvent}
        onUpdate={updateEvent}
        editEvent={editTarget}
      />

      <AvailabilityTracker
        event={trackerEvent}
        isOpen={trackerOpen}
        onClose={handleTrackerClose}
        updateAvailability={updateAvailability}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title ?? ''}"?`}
        description="This permanently removes the event and all recorded player availability. This cannot be undone."
        confirmLabel="Delete Event"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
