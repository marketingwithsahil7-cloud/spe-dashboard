import { useRef, useState } from 'react'
import { differenceInDays } from 'date-fns'
import { MapPin, Calendar, Copy, Check, Edit2, BarChart2 } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { generateBroadcastMessage } from '../../hooks/useEvents'
import { Button } from '../ui/Button'
import { cn, formatDate } from '../../lib/utils'
import { usePermissions } from '../../hooks/usePermissions'
import type { EventWithAvailability } from '../../hooks/useEvents'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventCardProps {
  event:              EventWithAvailability
  totalStudents:      number
  onViewAvailability: (event: EventWithAvailability) => void
  onEdit:             (event: EventWithAvailability) => void
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'tournament' | 'friendly' | null }) {
  if (!type) return null
  const isTournament = type === 'tournament'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md font-display text-[10px] font-bold uppercase tracking-wider"
      style={
        isTournament
          ? { background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.3)', color: '#FFB800' }
          : { background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }
      }
    >
      {isTournament ? '🏆 Tournament' : '⚽ Friendly'}
    </span>
  )
}

// ─── Availability dot row ─────────────────────────────────────────────────────

interface AvailSummaryProps {
  available:    number
  notAvailable: number
  maybe:        number
  noResponse:   number
  total:        number
}

function AvailSummary({ available, notAvailable, maybe, noResponse, total }: AvailSummaryProps) {
  const pct = total > 0 ? Math.round((available / total) * 100) : 0

  return (
    <div className="space-y-2">
      {/* Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 font-body text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-grass inline-block" />
          <span className="text-grass font-semibold">{available}</span>
          <span className="text-slate-500">avail</span>
        </span>
        <span className="flex items-center gap-1 font-body text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" />
          <span className="text-danger font-semibold">{notAvailable}</span>
          <span className="text-slate-500">out</span>
        </span>
        <span className="flex items-center gap-1 font-body text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" />
          <span className="text-amber font-semibold">{maybe}</span>
          <span className="text-slate-500">maybe</span>
        </span>
        <span className="flex items-center gap-1 font-body text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
          <span className="text-slate-400 font-semibold">{noResponse}</span>
          <span className="text-slate-500">no resp</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="font-body text-[10px] text-slate-500">
            {available}/{total} available
          </span>
          <span className="font-display text-[10px] font-bold text-grass">{pct}%</span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #00FF87 0%, #00D4FF 100%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function EventCard({ event, totalStudents, onViewAvailability, onEdit }: EventCardProps) {
  const cardRef    = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const { canManageEvents } = usePermissions()

  const available    = event.availability.filter(a => a.status === 'available').length
  const notAvailable = event.availability.filter(a => a.status === 'not_available').length
  const maybe        = event.availability.filter(a => a.status === 'maybe').length
  const responded    = event.availability.length
  const noResponse   = Math.max(0, totalStudents - responded)

  // Date + relative label
  let dateLabel = ''
  let relativeLabel = ''
  let isPast = false
  if (event.date) {
    dateLabel = formatDate(event.date)
    const diff = differenceInDays(new Date(event.date), new Date())
    isPast = diff < 0
    if (diff === 0)       relativeLabel = 'Today'
    else if (diff === 1)  relativeLabel = 'Tomorrow'
    else if (diff > 1)    relativeLabel = `in ${diff} days`
    else if (diff === -1) relativeLabel = 'Yesterday'
    else                  relativeLabel = `${Math.abs(diff)} days ago`
  }

  function handleMouseEnter() {
    if (!cardRef.current) return
    gsap.to(cardRef.current, { scale: 1.015, duration: 0.2, ease: 'power2.out' })
  }
  function handleMouseLeave() {
    if (!cardRef.current) return
    gsap.to(cardRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })
  }

  async function handleBroadcast() {
    const msg = generateBroadcastMessage(event)
    await navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      ref={cardRef}
      className="event-card glass rounded-2xl overflow-hidden will-change-transform"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={isPast ? { opacity: 0.75 } : undefined}
    >
      {/* Top accent line — tournament = amber, friendly = ice */}
      <div
        className="h-0.5"
        style={{
          background: event.type === 'tournament'
            ? 'linear-gradient(90deg, #FFB800 0%, rgba(255,184,0,0) 100%)'
            : 'linear-gradient(90deg, #00D4FF 0%, rgba(0,212,255,0) 100%)',
        }}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <TypeBadge type={event.type} />
              {isPast && (
                <span className="font-body text-[10px] text-slate-600 uppercase tracking-wider">Past</span>
              )}
            </div>
            <h3 className="font-display text-base font-bold text-white leading-tight truncate">
              {event.title}
            </h3>
          </div>

          {/* Avatar placeholder for visual balance */}
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
            style={{
              background: event.type === 'tournament'
                ? 'rgba(255,184,0,0.08)'
                : 'rgba(0,212,255,0.06)',
              border: event.type === 'tournament'
                ? '1px solid rgba(255,184,0,0.2)'
                : '1px solid rgba(0,212,255,0.18)',
            }}
          >
            <span className="text-lg">{event.type === 'tournament' ? '🏆' : '⚽'}</span>
          </div>
        </div>

        {/* Date + Location */}
        <div className="space-y-1.5">
          {event.date && (
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-500 shrink-0" />
              <span className="font-body text-xs text-slate-300">{dateLabel}</span>
              <span
                className={cn(
                  'font-display text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                  isPast
                    ? 'text-slate-500'
                    : relativeLabel === 'Today' || relativeLabel === 'Tomorrow'
                      ? 'text-grass'
                      : 'text-ice',
                )}
                style={{
                  background: isPast
                    ? 'rgba(255,255,255,0.04)'
                    : relativeLabel === 'Today' || relativeLabel === 'Tomorrow'
                      ? 'rgba(0,255,135,0.08)'
                      : 'rgba(0,212,255,0.06)',
                }}
              >
                {relativeLabel}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-slate-500 shrink-0" />
              <span className="font-body text-xs text-slate-400 truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Details */}
        {event.details && (
          <p
            className="font-body text-xs text-slate-500 leading-relaxed"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.details}
          </p>
        )}

        {/* Availability */}
        <AvailSummary
          available={available}
          notAvailable={notAvailable}
          maybe={maybe}
          noResponse={noResponse}
          total={totalStudents}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <Button
            size="sm"
            variant="secondary"
            icon={<BarChart2 size={13} />}
            className="flex-1 text-xs"
            onClick={() => onViewAvailability(event)}
          >
            Availability
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={copied ? <Check size={13} /> : <Copy size={13} />}
            className={cn('text-xs', copied ? 'text-grass' : '')}
            onClick={handleBroadcast}
          >
            {copied ? 'Copied!' : 'Broadcast'}
          </Button>
          {canManageEvents && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Edit2 size={13} />}
              className="text-xs"
              onClick={() => onEdit(event)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
