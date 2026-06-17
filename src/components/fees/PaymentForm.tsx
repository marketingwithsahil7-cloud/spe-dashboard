import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { IndianRupee, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { SuccessOverlay } from '../ui/SuccessOverlay'
import { Drawer } from '../ui/Drawer'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { PAYMENT_MODES } from '../../lib/constants'
import type { PaymentInput } from '../../hooks/usePayments'
import type { StudentWithFee } from '../../hooks/useStudents'
import type { PaymentMode } from '../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  student:   StudentWithFee | null
  isOpen:    boolean
  onClose:   () => void
  onSave:    (data: PaymentInput) => Promise<void>
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

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentForm({ student, isOpen, onClose, onSave }: PaymentFormProps) {
  const [amount,   setAmount]   = useState('')
  const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mode,     setMode]     = useState<PaymentMode>('cash')
  const [forCycle, setForCycle] = useState(format(new Date(), 'yyyy-MM'))
  const [note,     setNote]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Reset form when a new student is selected
  const handleOpen = useCallback(() => {
    if (student) {
      setAmount(String(student.monthly_fee))
      setPaidDate(format(new Date(), 'yyyy-MM-dd'))
      setMode('cash')
      setForCycle(format(new Date(), 'yyyy-MM'))
      setNote('')
      setError(null)
    }
  }, [student])

  // Trigger reset when drawer opens
  if (isOpen && !saving && !error && amount === '') {
    handleOpen()
  }

  const handleClose = () => {
    if (saving) return
    setAmount('')
    setError(null)
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
      await onSave({
        student_id: student.id,
        amount:     parsed,
        paid_date:  paidDate,
        for_cycle:  forCycle,
        mode,
        note:       note.trim() || null,
      })
      setShowSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment')
    } finally {
      setSaving(false)
    }
  }

  const monthOptions = getMonthOptions()

  const drawerFooter = (
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
    <>
    {showSuccess && <SuccessOverlay message="Payment recorded!" onDone={handleClose} />}
    <Drawer isOpen={isOpen} onClose={handleClose} title="Record Payment" width="400px" footer={drawerFooter}>
      {!student ? null : (
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
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grass">
                <IndianRupee size={15} />
              </span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="2000"
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
    </>
  )
}
