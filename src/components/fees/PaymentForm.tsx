import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  IndianRupee, Loader2, CheckCircle2, AlertCircle,
  MessageCircle, X, Share2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
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
import { getAgeCategory } from '../../lib/ageCategories'
import { sharePdfFile } from '../../lib/sharePdf'
import { useToast } from '../ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  student:   StudentWithFee | null
  isOpen:    boolean
  onClose:   () => void
  onSave:    (data: PaymentInput) => Promise<Payment>
}

interface InvoiceResult {
  pdfUrl:      string
  whatsappUrl: string
  pdfBlob:     Blob
}

// Month options: current + 2 previous
function getMonthOptions() {
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return {
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy'),
    }
  })
}

const MODE_LABELS: Record<PaymentMode, string> = {
  cash:   'Cash',
  upi:    'UPI',
  online: 'Online',
}

// ─── Invoice generator (lazy) ─────────────────────────────────────────────────

async function buildInvoice(
  payment: Payment,
  student: StudentWithFee,
  coachName: string,
): Promise<InvoiceResult> {
  // Fetch academy name (cheap single-row query)
  const { data: settings } = await supabase
    .from('academy_settings')
    .select('academy_name')
    .single()
  const academyName = settings?.academy_name ?? 'Soccer Pro Elite Football Academy'

  const ageLabel = student.dob ? getAgeCategory(student.dob) : null

  // Next due date: compute from billing_cycle_day for NEXT month (since this month is now paid)
  const today = new Date()
  const day   = student.billing_cycle_day ?? 1
  const nm    = today.getMonth() === 11 ? 0 : today.getMonth() + 1
  const ny    = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear()
  const nextDue = format(new Date(ny, nm, day), 'yyyy-MM-dd')

  // Dynamically import to keep jsPDF out of initial bundle
  const { generateInvoice } = await import('../../lib/generateInvoice')

  const blob = await generateInvoice({
    paymentId:   payment.id,
    studentName: student.name,
    parentName:  student.parent_name,
    parentPhone: student.parent_phone,
    batch:       student.batch,
    ageLabel:    ageLabel ?? null,
    amount:      payment.amount,
    paidDate:    payment.paid_date,
    mode:        payment.mode,
    forCycle:    payment.for_cycle,
    nextDueDate: nextDue,
    coachName,
    academyName,
  })

  // Upload to Supabase storage
  const path = `${payment.id}.pdf`
  await supabase.storage
    .from('payment-invoices')
    .upload(path, blob, { contentType: 'application/pdf', upsert: true })

  const { data: urlData } = supabase.storage
    .from('payment-invoices')
    .getPublicUrl(path)

  const pdfUrl = urlData.publicUrl

  const forMonth = payment.for_cycle
    ? format(new Date(payment.for_cycle + '-01'), 'MMMM yyyy')
    : 'this month'

  const phone = student.parent_phone?.replace(/\D/g, '') ?? ''
  const waPhone = phone.startsWith('91') ? phone : `91${phone}`

  const msg = [
    `Hello ${student.parent_name ?? student.name},`,
    ``,
    `✅ Payment received for ${student.name}`,
    `Amount: ₹${payment.amount.toLocaleString('en-IN')} | ${forMonth}`,
    ``,
    `View your receipt here:`,
    pdfUrl,
    ``,
    `Thank you!`,
    `— ${academyName} ⚽`,
  ].join('\n')

  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`

  return { pdfUrl, whatsappUrl, pdfBlob: blob }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentForm({ student, isOpen, onClose, onSave }: PaymentFormProps) {
  const coach = useAuthStore(s => s.coach)
  const toast = useToast()

  const [amount,   setAmount]   = useState('')
  const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mode,     setMode]     = useState<PaymentMode>('cash')
  const [forCycle, setForCycle] = useState(format(new Date(), 'yyyy-MM'))
  const [note,     setNote]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Post-payment success state
  const [invoice,        setInvoice]        = useState<InvoiceResult | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError,   setInvoiceError]   = useState<string | null>(null)
  const [showSuccess,    setShowSuccess]    = useState(false)

  // Reset form when a new student is selected
  const handleOpen = useCallback(() => {
    if (student) {
      // Flexible-fee students start with empty amount — coach enters the correct amount each time
      setAmount(student.fee_is_fixed ? String(student.monthly_fee) : '')
      setPaidDate(format(new Date(), 'yyyy-MM-dd'))
      setMode('cash')
      setForCycle(format(new Date(), 'yyyy-MM'))
      setNote('')
      setError(null)
      setShowSuccess(false)
      setInvoice(null)
      setInvoiceError(null)
    }
  }, [student])

  if (isOpen && !saving && !error && !showSuccess && amount === '') {
    handleOpen()
  }

  const handleClose = () => {
    if (saving) return
    setAmount('')
    setError(null)
    setShowSuccess(false)
    setInvoice(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!student) return
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payment = await onSave({
        student_id: student.id,
        amount:     parsed,
        paid_date:  paidDate,
        for_cycle:  forCycle,
        mode,
        note:       note.trim() || null,
      })
      setShowSuccess(true)

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

  const monthOptions = getMonthOptions()

  // ── Success state footer ───────────────────────────────────────────────────
  const successFooter = (
    <div className="flex flex-col gap-2">
      {invoiceLoading ? (
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
        disabled={saving || !amount}
      >
        {saving ? 'Saving…' : 'Record Payment'}
      </Button>
    </div>
  )

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={showSuccess ? 'Payment Recorded' : 'Record Payment'}
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
            <p className="font-display text-2xl font-bold text-grass">
              ₹{parseFloat(amount).toLocaleString('en-IN')}
            </p>
            <p className="font-body text-sm text-white mt-1">Payment recorded</p>
            <p className="font-body text-xs text-slate-500 mt-0.5">
              {student.name} · {forCycle ? format(new Date(forCycle + '-01'), 'MMMM yyyy') : ''}
            </p>
          </div>

          {/* Mini details */}
          <div
            className="w-full rounded-2xl p-4 flex flex-col gap-2 text-left"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              ['Date',  format(new Date(paidDate), 'd MMM yyyy')],
              ['Mode',  MODE_LABELS[mode]],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="font-body text-xs text-slate-500">{label}</span>
                <span className="font-body text-xs font-semibold text-white">{value}</span>
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
                placeholder={student.fee_is_fixed ? String(student.monthly_fee) : 'Enter amount for this month'}
                className={cn(
                  'w-full pl-9 pr-4 py-3 rounded-xl font-body text-sm font-semibold text-white',
                  'bg-white/[0.04] border border-white/[0.08]',
                  'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
                  'transition-colors placeholder:text-slate-600',
                )}
              />
            </div>
          </div>

          {/* Payment mode */}
          <div className="flex flex-col gap-2">
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_MODES.map(m => (
                <button
                  key={m}
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
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Note <span className="text-slate-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Paid in two instalments"
              rows={2}
              className={cn(
                'w-full px-4 py-3 rounded-xl font-body text-sm text-white resize-none',
                'bg-white/[0.04] border border-white/[0.08]',
                'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
                'transition-colors placeholder:text-slate-600',
              )}
            />
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
