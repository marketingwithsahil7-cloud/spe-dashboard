import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Receipt } from 'lucide-react'
import { Skeleton } from '../ui/Skeleton'
import { formatCurrency } from '../../lib/utils'
import { fetchStudentPayments } from '../../hooks/usePayments'
import type { Payment, PaymentMode } from '../../types/index'

// ─── Mode pill ────────────────────────────────────────────────────────────────

const MODE_STYLE: Record<PaymentMode, { label: string; style: React.CSSProperties }> = {
  cash:   { label: 'Cash',   style: { background: 'rgba(0,255,135,0.08)',  border: '1px solid rgba(0,255,135,0.2)',  color: '#00FF87' } },
  upi:    { label: 'UPI',    style: { background: 'rgba(0,212,255,0.08)',  border: '1px solid rgba(0,212,255,0.2)',  color: '#00D4FF' } },
  online: { label: 'Online', style: { background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)', color: '#FFB800' } },
}

// ─── Single-student payment history (for student profile) ─────────────────────

interface StudentPaymentHistoryProps {
  studentId: string
}

export function StudentPaymentHistory({ studentId }: StudentPaymentHistoryProps) {
  const [payments,  setPayments]  = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchStudentPayments(studentId)
      .then(data => { if (!cancelled) { setPayments(data); setIsLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message); setIsLoading(false) } })
    return () => { cancelled = true }
  }, [studentId])

  if (isLoading) return <PaymentListSkeleton />
  if (error)     return <p className="font-body text-xs text-danger">{error}</p>
  if (!payments.length) return <PaymentEmptyState />

  return <PaymentList payments={payments} />
}

// ─── Shared list (fees page — accepts pre-fetched payments) ───────────────────

interface PaymentListProps {
  payments: Payment[]
  studentNames?: Record<string, string>  // studentId → name (optional, for cross-student views)
}

export function PaymentList({ payments, studentNames }: PaymentListProps) {
  return (
    <div className="space-y-2">
      {payments.map(p => {
        const modeConfig = p.mode ? MODE_STYLE[p.mode] : null
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Date */}
            <div className="shrink-0 text-center w-10">
              <p className="font-display text-base text-white leading-none">
                {format(new Date(p.paid_date + 'T12:00:00'), 'd')}
              </p>
              <p className="font-body text-[9px] text-slate-500 uppercase">
                {format(new Date(p.paid_date + 'T12:00:00'), 'MMM')}
              </p>
            </div>

            <div className="w-px h-8 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              {studentNames && (
                <p className="font-body text-xs font-semibold text-white truncate">
                  {studentNames[p.student_id] ?? 'Unknown'}
                </p>
              )}
              {p.note && (
                <p className="font-body text-[11px] text-slate-500 truncate mt-0.5">{p.note}</p>
              )}
              {!p.note && !studentNames && (
                <p className="font-body text-[11px] text-slate-500">
                  {p.for_cycle
                    ? format(new Date(p.for_cycle + '-01T12:00:00'), 'MMMM yyyy')
                    : 'Payment'}
                </p>
              )}
            </div>

            {/* Mode badge */}
            {modeConfig && (
              <span
                className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0"
                style={modeConfig.style}
              >
                {modeConfig.label}
              </span>
            )}

            {/* Amount */}
            <p className="font-display text-sm font-bold text-grass shrink-0">
              {formatCurrency(p.amount)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function PaymentListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Skeleton width={40} height={36} rounded="rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton height={10} className="w-2/5" />
            <Skeleton height={9}  className="w-1/3" />
          </div>
          <Skeleton width={60} height={22} rounded="rounded-md" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function PaymentEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <Receipt size={24} className="text-slate-600" />
      <p className="font-body text-xs text-slate-500">No payments recorded</p>
    </div>
  )
}
