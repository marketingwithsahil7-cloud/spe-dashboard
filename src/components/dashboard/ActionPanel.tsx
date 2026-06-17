import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInDays } from 'date-fns'
import { MessageCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SkeletonCard } from '../ui/Skeleton'
import { cn, formatCurrency, formatDate } from '../../lib/utils'
import { getWhatsAppURL, ROUTES } from '../../lib/constants'
import type { FeesActionItem, DashboardReturn } from '../../hooks/useDashboard'
import type { Trial } from '../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionPanelProps {
  feesActionList: FeesActionItem[]
  pendingTrials: DashboardReturn['pendingTrials']
  onMarkPaid: (studentId: string, amount: number) => void
  isLoading: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): string {
  const d = differenceInDays(new Date(), new Date(dateStr))
  if (d === 0) return 'today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

function trialWhatsAppURL(trial: Trial): string {
  const phone = trial.parent_phone ?? ''
  const name  = trial.parent_name ?? trial.name
  const msg   = `Namaste 🙏 ${name} ji, ${trial.name} ka trial ${formatDate(trial.trial_date)} ko hua tha. Kya aap Soccer Pro Elite Academy join karna chahenge? — Coach`
  const cleaned = phone.replace(/\D/g, '')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}
      >
        <CheckCircle size={18} className="text-grass" />
      </div>
      <p className="font-body text-sm text-slate-400 text-center">{message}</p>
    </div>
  )
}

// ─── Fees panel ───────────────────────────────────────────────────────────────

interface FeesPanelProps {
  feesActionList: FeesActionItem[]
  onMarkPaid: (studentId: string, amount: number) => void
  isLoading: boolean
}

function FeesPanel({ feesActionList, onMarkPaid, isLoading }: FeesPanelProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading || !listRef.current || feesActionList.length === 0) return
    const rows = listRef.current.querySelectorAll<HTMLElement>('.fee-row')
    gsap.fromTo(
      rows,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out', clearProps: 'all' },
    )
  }, [isLoading, feesActionList.length])

  return (
    <div className="glass p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white uppercase tracking-wide">
          Fees Due
        </h3>
        {feesActionList.length > 0 && (
          <span
            className="font-display text-xs font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)', color: '#FFB800' }}
          >
            {feesActionList.length}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : feesActionList.length === 0 ? (
        <EmptyState message="All fees collected 🎉" />
      ) : (
        <div ref={listRef} className="flex flex-col gap-3">
          {feesActionList.map(({ student, feeStatus, daysOverdue }) => {
            const isOverdue = feeStatus === 'overdue'
            const waURL = student.parent_phone
              ? getWhatsAppURL(
                  student.parent_phone,
                  student.parent_name ?? student.name,
                  student.name,
                  new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
                  student.monthly_fee,
                )
              : null

            return (
              <div
                key={student.id}
                className={cn(
                  'fee-row rounded-xl p-3.5 flex flex-col gap-3 transition-colors',
                  isOverdue
                    ? 'bg-danger/[0.06] border border-danger/20'
                    : 'bg-white/[0.03] border border-white/[0.06]',
                )}
              >
                {/* Student info row */}
                <div className="flex items-center gap-3">
                  <Avatar name={student.name} src={student.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-white truncate">
                      {student.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant={student.batch === '5-6 PM' ? 'head' : 'active'} label={student.batch} />
                    </div>
                  </div>
                  {/* Amount + status */}
                  <div className="text-right shrink-0">
                    <p className={cn('font-display text-base font-bold', isOverdue ? 'text-danger' : 'text-amber')}>
                      {formatCurrency(student.monthly_fee)}
                    </p>
                    {isOverdue ? (
                      <p className="font-body text-[10px] text-danger/80 mt-0.5">
                        {daysOverdue}d overdue
                      </p>
                    ) : (
                      <p className="font-body text-[10px] text-amber/80 mt-0.5">due today</p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<MessageCircle size={13} />}
                    className="flex-1 text-xs"
                    disabled={!waURL}
                    onClick={() => waURL && window.open(waURL, '_blank')}
                  >
                    Remind
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<CheckCircle size={13} />}
                    className="flex-1 text-xs"
                    onClick={() => onMarkPaid(student.id, student.monthly_fee)}
                  >
                    Mark Paid
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Trials panel ─────────────────────────────────────────────────────────────

interface TrialsPanelProps {
  pendingTrials: Trial[]
  isLoading: boolean
}

function TrialsPanel({ pendingTrials, isLoading }: TrialsPanelProps) {
  const navigate = useNavigate()
  const listRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading || !listRef.current || pendingTrials.length === 0) return
    const rows = listRef.current.querySelectorAll<HTMLElement>('.trial-row')
    gsap.fromTo(
      rows,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out', clearProps: 'all' },
    )
  }, [isLoading, pendingTrials.length])

  return (
    <div className="glass p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white uppercase tracking-wide">
          Trial Follow-ups
        </h3>
        {pendingTrials.length > 0 && (
          <span
            className="font-display text-xs font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)', color: '#FFB800' }}
          >
            {pendingTrials.length}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : pendingTrials.length === 0 ? (
        <EmptyState message="No pending trials ✓" />
      ) : (
        <div ref={listRef} className="flex flex-col gap-3">
          {pendingTrials.map(trial => {
            const waURL = trial.parent_phone ? trialWhatsAppURL(trial) : null

            return (
              <div
                key={trial.id}
                className="trial-row rounded-xl p-3.5 flex flex-col gap-3 bg-white/[0.03] border border-white/[0.06] transition-colors"
              >
                {/* Trial info */}
                <div className="flex items-start gap-3">
                  <Avatar name={trial.name} src={trial.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-white truncate">
                      {trial.name}
                    </p>
                    <p className="font-body text-[11px] text-slate-400 mt-0.5">
                      Trial: {formatDate(trial.trial_date)} · {daysSince(trial.trial_date)}
                    </p>
                  </div>
                  <Badge variant={trial.status} />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<MessageCircle size={13} />}
                    className="flex-1 text-xs"
                    disabled={!waURL}
                    onClick={() => waURL && window.open(waURL, '_blank')}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ArrowRight size={13} />}
                    className="flex-1 text-xs"
                    onClick={() => navigate(ROUTES.TRIALS)}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Exported panel ───────────────────────────────────────────────────────────

export function ActionPanel({ feesActionList, pendingTrials, onMarkPaid, isLoading }: ActionPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FeesPanel feesActionList={feesActionList} onMarkPaid={onMarkPaid} isLoading={isLoading} />
      <TrialsPanel pendingTrials={pendingTrials} isLoading={isLoading} />
    </div>
  )
}
