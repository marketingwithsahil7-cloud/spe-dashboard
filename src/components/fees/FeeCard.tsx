import { useRef } from 'react'
import { MessageCircle, PlusCircle, Clock } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { gsap } from '../../lib/animations'
import { cn, formatCurrency, formatDate } from '../../lib/utils'
import { getWhatsAppURL } from '../../lib/constants'
import { usePermissions } from '../../hooks/usePermissions'
import type { StudentWithFee } from '../../hooks/useStudents'

interface FeeCardProps {
  student:     StudentWithFee
  onRecordPay: (student: StudentWithFee) => void
}

// ─── Remind button config based on fee scenario ───────────────────────────────

function getRemindConfig(feeStatus: string, daysOverdue: number): {
  label:   string
  variant: 'ghost' | 'secondary' | 'danger'
  pulse:   boolean
  style?:  React.CSSProperties
} {
  if (feeStatus === 'due_soon') {
    return { label: 'Remind', variant: 'ghost', pulse: false, style: { color: '#00FF87', borderColor: 'rgba(0,255,135,0.3)' } }
  }
  if (feeStatus === 'due_today') {
    return { label: 'Remind Now', variant: 'ghost', pulse: false, style: { color: '#FFB800', borderColor: 'rgba(255,184,0,0.4)' } }
  }
  if (feeStatus === 'overdue') {
    if (daysOverdue <= 3)  return { label: 'Urgent Remind', variant: 'danger', pulse: false }
    if (daysOverdue <= 7)  return { label: 'Final Reminder', variant: 'danger', pulse: false, style: { background: 'rgba(255,61,87,0.15)' } }
    return { label: 'Notice', variant: 'danger', pulse: true }
  }
  return { label: 'Remind', variant: 'ghost', pulse: false }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FeeCard({ student, onRecordPay }: FeeCardProps) {
  const { canRecordPayment } = usePermissions()
  const cardRef = useRef<HTMLDivElement>(null)

  const { feeStatus, daysOverdue, nextDueDate, monthly_fee } = student
  const isOverdue  = feeStatus === 'overdue'
  const isDueToday = feeStatus === 'due_today'
  const isDueSoon  = feeStatus === 'due_soon'
  const isPaid     = feeStatus === 'paid'

  const remindConfig = getRemindConfig(feeStatus, daysOverdue)

  const waURL = student.parent_phone
    ? getWhatsAppURL(
        student.parent_phone,
        student.parent_name ?? student.name,
        student.name,
        new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        monthly_fee,
        feeStatus,
        daysOverdue,
        nextDueDate,
      )
    : null

  const handleMouseEnter = () => {
    if (!cardRef.current || isPaid) return
    gsap.to(cardRef.current, { scale: 1.015, duration: 0.18, ease: 'power2.out' })
  }
  const handleMouseLeave = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, { scale: 1, duration: 0.22, ease: 'back.out(1.5)' })
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'rounded-2xl p-4 flex flex-col gap-3 will-change-transform transition-colors',
        isOverdue  && 'border border-danger/20',
        isDueToday && 'border border-amber/25',
        isDueSoon  && 'border border-amber/15',
        isPaid     && 'border border-white/[0.06]',
      )}
      style={{
        background: isOverdue
          ? 'rgba(255,61,87,0.05)'
          : isDueToday || isDueSoon
          ? 'rgba(255,184,0,0.04)'
          : 'rgba(255,255,255,0.03)',
        ...(isOverdue && {
          boxShadow: daysOverdue > 7
            ? '0 0 24px rgba(255,61,87,0.15)'
            : '0 0 12px rgba(255,61,87,0.06)',
        }),
      }}
    >
      {/* Top row */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar name={student.name} src={student.photo_url} size="sm" />
          {isOverdue && (
            <span className="absolute -inset-0.5 rounded-full border border-danger/60 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-white truncate">{student.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-body text-[11px] text-slate-500">{student.batch}</span>
          </div>
        </div>

        {/* Amount + status */}
        <div className="text-right shrink-0">
          <p className={cn(
            'font-display text-base font-bold leading-none',
            isOverdue             ? 'text-danger'
            : isDueToday || isDueSoon ? 'text-amber'
            : 'text-grass',
          )}>
            {formatCurrency(monthly_fee)}
          </p>
          <div className="mt-1">
            {isOverdue ? (
              <p className="font-body text-[10px] text-danger/80 flex items-center justify-end gap-0.5">
                <Clock size={10} />
                {daysOverdue}d overdue
              </p>
            ) : isDueToday ? (
              <p className="font-body text-[10px] text-amber/80">due today</p>
            ) : isDueSoon ? (
              <p className="font-body text-[10px] text-amber/70">
                due {formatDate(nextDueDate)}
              </p>
            ) : (
              <p className="font-body text-[10px] text-grass/70">paid ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* Badge row */}
      <div className="flex items-center gap-2">
        <Badge variant={feeStatus} />
        {student.status === 'trial' && (
          <Badge variant="trial" label="Trial Student" />
        )}
      </div>

      {/* Action buttons */}
      {!isPaid && (
        <div className="flex gap-2">
          {waURL && (
            <Button
              size="sm"
              variant={remindConfig.variant}
              icon={<MessageCircle size={13} />}
              className={cn('flex-1 text-xs', remindConfig.pulse && 'animate-pulse')}
              style={remindConfig.style}
              onClick={() => window.open(waURL, '_blank')}
            >
              {remindConfig.label}
            </Button>
          )}
          {canRecordPayment && (
            <Button
              size="sm"
              variant="primary"
              icon={<PlusCircle size={13} />}
              className="flex-1 text-xs"
              onClick={() => onRecordPay(student)}
            >
              Record Payment
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
