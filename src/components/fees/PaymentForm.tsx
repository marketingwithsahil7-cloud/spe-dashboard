import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  IndianRupee, Loader2, CheckCircle2, AlertCircle,
  MessageCircle, X, Share2,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Drawer } from '../ui/Drawer'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { PAYMENT_MODES } from '../../lib/constants'
import type { PaymentInput } from '../../hooks/usePayments'
import type { StudentWithFee } from '../../hooks/useStudents'
import type { Payment, PaymentMode } from '../../types/index'
import { buildInvoice, type InvoiceResult } from '../../lib/invoiceHelpers'
import { sharePdfFile } from '../../lib/sharePdf'
import { useToast } from '../ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  student:      StudentWithFee | null
  isOpen:       boolean
  onClose:      () => void
  onSave:       (data: PaymentInput) => Promise<Payment>
  // Billing cycle ('yyyy-MM') the coach was viewing on the Fees page when they
  // opened this drawer — pre-selects "For Month" so recording a missed past
  // month's fee doesn't require an extra manual dropdown change every time.
  defaultMonth?: string
}

// Month options: last 6 months, plus defaultMonth if it falls outside that window
// (a coach auditing an old month should still find it pre-selected in the list).
function getMonthOptions(defaultMonth?: string) {
  const opts = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return {
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy'),
    }
  })
  if (defaultMonth && !opts.some(o => o.value === defaultMonth)) {
    opts.push({ value: defaultMonth, label: format(new Date(defaultMonth + '-01T12:00:00'), 'MMMM yyyy') })
    opts.sort((a, b) => b.value.localeCompare(a.value))
  }
  return opts
}

const MODE_LABELS: Record<PaymentMode, string> = {
  cash:   'Cash',
  upi:    'UPI',
  online: 'Online',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentForm({ student, isOpen, onClose, onSave, defaultMonth }: PaymentFormProps) {
  const coach = useAuthStore(s => s.coach)
  const toast = useToast()

  const [amount,      setAmount]      = useState('')
  const [paidDate,    setPaidDate]    = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mode,        setMode]        = useState<PaymentMode>('cash')
  const [forCycle,    setForCycle]    = useState(defaultMonth ?? format(new Date(), 'yyyy-MM'))
  const [note,        setNote]        = useState('')
  const [isHalfMonth, setIsHalfMonth] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Post-payment success state
  const [invoice,        setInvoice]        = useState<InvoiceResult | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError,   setInvoiceError]   = useState<string | null>(null)
  const [showSuccess,    setShowSuccess]    = useState(false)

  // Reset form whenever the drawer opens for a (possibly new) student. Keyed on
  // student?.id rather than the whole student object — a background fee-status
  // update while the drawer is open must not wipe out what the coach has typed
  // (the old render-phase reset re-ran on every render for flexible-fee students,
  // since their `amount` field starts and can stay '' — silently erasing note/
  // date/mode as soon as the user touched any other field first).
  useEffect(() => {
    if (isOpen && student) {
      // Flexible-fee students start with empty amount — coach enters the correct amount each time
      setAmount(student.fee_is_fixed ? String(student.monthly_fee) : '')
      setPaidDate(format(new Date(), 'yyyy-MM-dd'))
      setMode('cash')
      setForCycle(defaultMonth ?? format(new Date(), 'yyyy-MM'))
      setNote('')
      setIsHalfMonth(false)
      setError(null)
      setShowSuccess(false)
      setInvoice(null)
      setInvoiceError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, student?.id, defaultMonth])

  const handleClose = () => {
    if (saving) return
    setAmount('')
    setError(null)
    setShowSuccess(false)
    setInvoice(null)
    onClose()
  }

  // A filled-in note means "this student isn't paying this month, here's why" —
  // no payment is recorded, the reason is saved instead and the fee is excluded
  // from revenue (amount stored as 0).
  const isReasonMode = note.trim().length > 0

  const handleSubmit = async () => {
    if (!student) return

    let parsed = 0
    if (!isReasonMode) {
      parsed = parseFloat(amount)
      if (!amount || isNaN(parsed) || parsed <= 0) {
        setError('Enter a valid amount')
        return
      }
    }

    setSaving(true)
    setError(null)
    try {
      const payment = await onSave({
        student_id:     student.id,
        amount:         parsed,
        paid_date:      paidDate,
        for_cycle:      forCycle,
        mode:           isReasonMode ? null : mode,
        note:           note.trim() || null,
        is_reason_only: isReasonMode,
      })
      setShowSuccess(true)

      // Reason-only entries aren't real payments — no invoice to generate.
      if (isReasonMode) return

      // Generate invoice in background — non-blocking
      setInvoiceLoading(true)
      buildInvoice(payment, student, coach?.name ?? 'Coach')
        .then(result => {
          setInvoice(result)
          setInvoiceLoading(false)
        })
        .catch(() => {
          setInvoiceError('Invoice generation failed')
          setInvoiceLoading(false)
        })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment')
    } finally {
      setSaving(false)
    }
  }

  const handleShareInvoice = async () => {
    if (!invoice?.pdfBlob || !student) return
    const monthLabel = forCycle
      ? format(new Date(forCycle + '-01'), 'MMMM_yyyy')
      : 'Payment'
    const safeName = student.name.replace(/\s+/g, '_')
    try {
      const res = await sharePdfFile(
        invoice.pdfBlob,
        `Invoice_${safeName}_${monthLabel}.pdf`,
        'Payment Invoice',
        `Payment receipt for ${student.name}`,
      )
      if (res.method === 'cancelled') return
      toast.success(
        res.method === 'native_share' ? 'Shared successfully!' : 'PDF downloaded',
      )
    } catch {
      toast.error('Share failed — try the WhatsApp link instead')
    }
  }

  const handleSetAmountType = (half: boolean) => {
    if (half === isHalfMonth) return
    setIsHalfMonth(half)
    if (student?.fee_is_fixed) {
      setAmount(half ? String(Math.round(student.monthly_fee / 2)) : String(student.monthly_fee))
    }
  }

  const monthOptions = getMonthOptions(defaultMonth)

  // ── Success state footer ───────────────────────────────────────────────────
  const successFooter = (
    <div className="flex flex-col gap-2">
      {isReasonMode ? null : invoiceLoading ? (
        <div className="flex items-center gap-2 justify-center py-2 text-slate-400">
          <Loader2 size={14} className="animate-spin" />
          <span className="font-body text-xs">Generating invoice…</span>
        </div>
      ) : invoice ? (
        <div className="flex flex-col gap-2">
          {/* Primary: native share sheet with PDF file — falls back to download on desktop */}
          <Button
            variant="primary"
            fullWidth
            icon={<Share2 size={14} />}
            onClick={handleShareInvoice}
          >
            Share PDF
          </Button>
          {/* Secondary: link-only WhatsApp fallback for desktop / older browsers */}
          <Button
            variant="secondary"
            fullWidth
            icon={<MessageCircle size={14} />}
            onClick={() => window.open(invoice.whatsappUrl, '_blank')}
          >
            WhatsApp Link
          </Button>
          <p className="font-body text-[10px] text-slate-600 text-center">
            Share PDF opens native share sheet on mobile
          </p>
        </div>
      ) : invoiceError ? (
        <p className="font-body text-xs text-slate-500 text-center">{invoiceError}</p>
      ) : null}
      <Button variant="ghost" fullWidth onClick={handleClose} icon={<X size={14} />}>
        Done
      </Button>
    </div>
  )

  // ── Payment form footer ────────────────────────────────────────────────────
  const formFooter = (
    <div className="flex gap-3">
      <Button variant="ghost" className="flex-1" onClick={handleClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        variant="primary"
        className="flex-1"
        icon={saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        onClick={handleSubmit}
        disabled={saving || (!isReasonMode && !amount)}
      >
        {saving ? 'Saving…' : isReasonMode ? 'Save Reason' : 'Record Payment'}
      </Button>
    </div>
  )

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={showSuccess ? (isReasonMode ? 'Reason Saved' : 'Payment Recorded') : (isReasonMode ? 'Save Reason' : 'Record Payment')}
      width="400px"
      footer={showSuccess ? successFooter : formFooter}
    >
      {!student ? null : showSuccess ? (

        /* ── Success view ─────────────────────────────────────────────────── */
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,255,135,0.1)',
              border: '2px solid rgba(0,255,135,0.35)',
              boxShadow: '0 0 40px rgba(0,255,135,0.2)',
            }}
          >
            <CheckCircle2 size={36} className="text-grass" />
          </div>

          <div>
            {isReasonMode ? (
              <p className="font-display text-lg font-bold text-amber" style={{ color: '#FFB800' }}>
                Not Paying This Month
              </p>
            ) : (
              <p className="font-display text-2xl font-bold text-grass">
                ₹{parseFloat(amount).toLocaleString('en-IN')}
              </p>
            )}
            <p className="font-body text-sm text-white mt-1">
              {isReasonMode ? 'Reason saved — no payment recorded' : 'Payment recorded'}
            </p>
            <p className="font-body text-xs text-slate-500 mt-0.5">
              {student.name} · {forCycle ? format(new Date(forCycle + '-01'), 'MMMM yyyy') : ''}
            </p>
          </div>

          {/* Mini details */}
          <div
            className="w-full rounded-2xl p-4 flex flex-col gap-2 text-left"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(isReasonMode
              ? [['Reason', note.trim()]]
              : [
                  ['Date', format(new Date(paidDate), 'd MMM yyyy')],
                  ['Mode', MODE_LABELS[mode]],
                ]
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between items-center gap-3">
                <span className="font-body text-xs text-slate-500 shrink-0">{label}</span>
                <span className="font-body text-xs font-semibold text-white text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

      ) : (

        /* ── Payment form ─────────────────────────────────────────────────── */
        <div className="flex flex-col gap-6">

          {/* Student info */}
          <div className="flex items-center gap-3 p-4 rounded-2xl"
               style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Avatar name={student.name} src={student.photo_url} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-semibold text-white truncate">{student.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={student.feeStatus} />
                <span className="font-body text-xs text-slate-500">{student.batch}</span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Amount
            </label>
            {!student.fee_is_fixed && (
              <p className="font-body text-[11px] text-amber leading-relaxed"
                 style={{ color: '#FFB800' }}>
                This student has flexible fees — enter the amount for this specific payment
              </p>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grass">
                <IndianRupee size={15} />
              </span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={isReasonMode}
                placeholder={student.fee_is_fixed ? String(student.monthly_fee) : 'Enter amount for this month'}
                className={cn(
                  'w-full pl-9 pr-4 py-3 rounded-xl font-body text-sm font-semibold text-white',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
                  'transition-colors placeholder:text-slate-600',
                  isReasonMode && 'opacity-40 cursor-not-allowed',
                )}
              />
            </div>

            {isHalfMonth && !isReasonMode && (
              <p className="font-body text-[11px] text-amber" style={{ color: '#FFB800' }}>
                Half month fee applied
              </p>
            )}
          </div>

          {/* Amount type */}
          <div className={cn('flex flex-col gap-2', isReasonMode && 'opacity-40 pointer-events-none')}>
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Amount Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { half: false, label: 'Full Month' },
                { half: true,  label: 'Half Month' },
              ] as const).map(opt => {
                const active = isHalfMonth === opt.half
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={isReasonMode}
                    onClick={() => handleSetAmountType(opt.half)}
                    className={cn(
                      'py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-150',
                      active
                        ? 'text-pitch bg-grass shadow-[0_0_12px_rgba(0,255,135,0.25)]'
                        : 'text-slate-400 hover:text-white',
                    )}
                    style={!active ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } : undefined}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Payment mode */}
          <div className={cn('flex flex-col gap-2', isReasonMode && 'opacity-40 pointer-events-none')}>
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_MODES.map(m => (
                <button
                  key={m}
                  disabled={isReasonMode}
                  onClick={() => setMode(m)}
                  className={cn(
                    'py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-150',
                    mode === m
                      ? 'text-pitch bg-grass shadow-[0_0_12px_rgba(0,255,135,0.25)]'
                      : 'text-slate-400 hover:text-white',
                  )}
                  style={mode !== m ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } : undefined}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Paid date */}
          <div className="flex flex-col gap-2">
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Payment Date
            </label>
            <input
              type="date"
              value={paidDate}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setPaidDate(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl font-body text-sm text-white',
                'bg-white/[0.04] border border-white/[0.08]',
                'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
                'transition-colors [color-scheme:dark]',
              )}
            />
          </div>

          {/* For month */}
          <div className="flex flex-col gap-2">
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
              For Month
            </label>
            <select
              value={forCycle}
              onChange={e => setForCycle(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl font-body text-sm text-white',
                'bg-white/[0.04] border border-white/[0.08]',
                'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
                'transition-colors appearance-none [color-scheme:dark]',
              )}
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-2">
            <label className="font-body text-sm font-semibold text-white">
              Note / Reason <span className="text-slate-500 text-xs normal-case font-normal">(optional, but recommended)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                'Leave blank for a normal payment.\nFill this in if the student is NOT paying this month —\ne.g. Student on long vacation, discount agreed, dropped out temporarily...'
              }
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl font-body text-sm text-white resize-none',
                'bg-white/[0.04] border border-white/[0.1]',
                'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
                'transition-colors placeholder:text-slate-600 placeholder:leading-relaxed',
              )}
            />
            {isReasonMode ? (
              <p className="font-body text-[11px] text-amber leading-relaxed" style={{ color: '#FFB800' }}>
                No payment will be recorded — this reason is saved instead and the fee is excluded from revenue.
              </p>
            ) : (
              <p className="font-body text-[10px] text-slate-600">
                Filling this in switches to "Save Reason" mode — no payment gets recorded.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                 style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.2)' }}>
              <AlertCircle size={14} className="text-danger shrink-0" />
              <p className="font-body text-xs text-danger">{error}</p>
            </div>
          )}

        </div>
      )}
    </Drawer>
  )
}
