import { useRef } from 'react'
import { differenceInDays } from 'date-fns'
import { MessageCircle, CheckCircle2, Calendar } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn, formatDate } from '../../lib/utils'
import { getTrialWhatsAppURL } from '../../lib/constants'
import { usePermissions } from '../../hooks/usePermissions'
import type { Trial } from '../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrialCardProps {
  trial:     Trial
  onResolve: (trial: Trial) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSinceNum(dateStr: string): number {
  return Math.max(0, differenceInDays(new Date(), new Date(dateStr)))
}

function daysSinceLabel(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function getWAButtonConfig(days: number): { label: string; style?: React.CSSProperties } {
  if (days <= 1) {
    return {
      label: 'Thank You Message',
      style: { color: '#00FF87', borderColor: 'rgba(0,255,135,0.3)', background: 'rgba(0,255,135,0.05)' },
    }
  }
  if (days <= 3) {
    return {
      label: 'Follow Up',
      style: { color: '#FFB800', borderColor: 'rgba(255,184,0,0.35)', background: 'rgba(255,184,0,0.05)' },
    }
  }
  return {
    label: 'Final Follow-Up',
    style: { color: '#FF3D57', borderColor: 'rgba(255,61,87,0.35)', background: 'rgba(255,61,87,0.05)' },
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrialCard({ trial, onResolve }: TrialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { canSeeTrials } = usePermissions()

  const needsAction = trial.status === 'pending' || trial.status === 'no_response'
  const isJoined    = trial.status === 'closed'
  const days        = daysSinceNum(trial.trial_date)
  const waURL       = trial.parent_phone ? getTrialWhatsAppURL(trial, days) : null
  const waConfig    = getWAButtonConfig(days)

  const handleMouseEnter = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, { scale: 1.02, duration: 0.2, ease: 'power2.out' })
  }
  const handleMouseLeave = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' })
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        'trial-card rounded-2xl p-4 flex flex-col gap-4 will-change-transform',
        needsAction
          ? 'bg-amber/[0.04] border border-amber/20'
          : isJoined
          ? 'bg-grass/[0.04] border border-grass/20'
          : 'glass',
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={trial.name} src={trial.photo_url} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-white truncate">{trial.name}</p>
          {trial.parent_name && (
            <p className="font-body text-[11px] text-slate-400 mt-0.5 truncate">
              {trial.parent_name}
            </p>
          )}
          {trial.parent_phone && (
            <p className="font-body text-[11px] text-slate-500 mt-0.5">{trial.parent_phone}</p>
          )}
        </div>
        <Badge variant={trial.status} />
      </div>

      {/* Trial date */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <Calendar size={11} className="text-slate-500 shrink-0" />
        <span className="font-body text-slate-400">
          {formatDate(trial.trial_date)}
        </span>
        <span className="text-slate-600">·</span>
        <span className="font-body text-slate-500">{daysSinceLabel(days)}</span>
      </div>

      {/* Follow-up date */}
      {trial.follow_up_date && (
        <p className="font-body text-[11px] text-ice/80">
          Follow-up: {formatDate(trial.follow_up_date)}
        </p>
      )}

      {/* Reason / note */}
      {trial.reason && (
        <p className="font-body text-[11px] text-slate-500 italic truncate">
          "{trial.reason}"
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          disabled={!waURL}
          onClick={() => waURL && window.open(waURL, '_blank')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg font-body text-xs font-semibold transition-all border disabled:opacity-40 disabled:cursor-not-allowed',
          )}
          style={waURL ? waConfig.style : {}}
        >
          <MessageCircle size={13} />
          {waConfig.label}
        </button>

        {needsAction && canSeeTrials && (
          <Button
            size="sm"
            variant="primary"
            icon={<CheckCircle2 size={13} />}
            className="flex-1 text-xs"
            onClick={() => onResolve(trial)}
          >
            Resolve
          </Button>
        )}
      </div>
    </div>
  )
}
