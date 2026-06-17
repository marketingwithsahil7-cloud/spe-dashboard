import { useState } from 'react'
import { format } from 'date-fns'
import { UserPlus, Loader2, AlertCircle } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import type { TrialInput } from '../../hooks/useTrials'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrialFormProps {
  isOpen:  boolean
  onClose: () => void
  onSave:  (data: TrialInput) => Promise<void>
}

// ─── Input field ──────────────────────────────────────────────────────────────

function Field({
  label, optional, children,
}: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label}
        {optional && <span className="font-normal text-slate-600 normal-case ml-1">(optional)</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = cn(
  'w-full px-4 py-3 rounded-xl font-body text-sm text-white',
  'bg-white/[0.04] border border-white/[0.08]',
  'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
  'transition-colors placeholder:text-slate-600',
)

const dateClass = cn(inputClass, '[color-scheme:dark]')

// ─── Component ────────────────────────────────────────────────────────────────

export function TrialForm({ isOpen, onClose, onSave }: TrialFormProps) {
  const [name,         setName]         = useState('')
  const [parentName,   setParentName]   = useState('')
  const [parentPhone,  setParentPhone]  = useState('+91')
  const [trialDate,    setTrialDate]    = useState(format(new Date(), 'yyyy-MM-dd'))
  const [followUpDate, setFollowUpDate] = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const reset = () => {
    setName('')
    setParentName('')
    setParentPhone('+91')
    setTrialDate(format(new Date(), 'yyyy-MM-dd'))
    setFollowUpDate('')
    setError(null)
  }

  const handleClose = () => {
    if (saving) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Candidate name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const phone = parentPhone.trim().replace(/\s/g, '')
      await onSave({
        name:           name.trim(),
        parent_name:    parentName.trim() || null,
        parent_phone:   (phone === '+91' || phone === '') ? null : phone,
        trial_date:     trialDate,
        follow_up_date: followUpDate || null,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const drawerFooter = (
    <div className="flex gap-3">
      <Button variant="ghost" className="flex-1" onClick={handleClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        variant="primary"
        className="flex-1"
        icon={saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        onClick={handleSubmit}
        disabled={saving || !name.trim()}
      >
        {saving ? 'Saving…' : 'Add Trial'}
      </Button>
    </div>
  )

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Add Trial" width="400px" footer={drawerFooter}>
      <div className="flex flex-col gap-6">

        <Field label="Candidate Name">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Arjun Sharma"
            autoFocus
            className={inputClass}
          />
        </Field>

        <Field label="Parent Name" optional>
          <input
            type="text"
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            placeholder="e.g. Ramesh Sharma"
            className={inputClass}
          />
        </Field>

        <Field label="Parent Phone" optional>
          <input
            type="tel"
            value={parentPhone}
            onChange={e => setParentPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className={inputClass}
          />
        </Field>

        <Field label="Trial Date">
          <input
            type="date"
            value={trialDate}
            onChange={e => setTrialDate(e.target.value)}
            className={dateClass}
          />
        </Field>

        <Field label="Follow-up Date" optional>
          <input
            type="date"
            value={followUpDate}
            onChange={e => setFollowUpDate(e.target.value)}
            className={dateClass}
          />
        </Field>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
               style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.2)' }}>
            <AlertCircle size={14} className="text-danger shrink-0" />
            <p className="font-body text-xs text-danger">{error}</p>
          </div>
        )}

      </div>
    </Drawer>
  )
}
