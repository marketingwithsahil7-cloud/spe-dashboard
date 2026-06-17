import { useState } from 'react'
import { CheckCircle2, XCircle, MessageSquareX, UserCheck, Loader2, AlertCircle } from 'lucide-react'
import { SuccessOverlay } from '../ui/SuccessOverlay'
import { Drawer } from '../ui/Drawer'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn, formatDate } from '../../lib/utils'
import { BATCHES } from '../../lib/constants'
import type { Trial, TrialStatus, BatchType } from '../../types/index'
import type { TrialResolveData, ConvertStudentData } from '../../hooks/useTrials'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrialResolveProps {
  trial:     Trial | null
  isOpen:    boolean
  onClose:   () => void
  onResolve: (id: string, data: TrialResolveData) => Promise<void>
  onConvert: (trial: Trial, data: ConvertStudentData) => Promise<void>
}

type ResolveStatus = Exclude<TrialStatus, 'pending'>

// ─── Option config ────────────────────────────────────────────────────────────

const RESOLVE_OPTIONS: {
  status:  ResolveStatus
  label:   string
  desc:    string
  icon:    React.ReactNode
  color:   string
  bg:      string
  border:  string
}[] = [
  {
    status: 'closed',
    label:  'Joined',
    desc:   'Student has joined the academy',
    icon:   <CheckCircle2 size={16} />,
    color:  'text-grass',
    bg:     'rgba(0,255,135,0.08)',
    border: 'rgba(0,255,135,0.25)',
  },
  {
    status: 'not_closed',
    label:  'Did Not Join',
    desc:   'Student decided not to join',
    icon:   <XCircle size={16} />,
    color:  'text-danger',
    bg:     'rgba(255,61,87,0.08)',
    border: 'rgba(255,61,87,0.25)',
  },
  {
    status: 'no_response',
    label:  'No Response',
    desc:   'Parent / student not responding',
    icon:   <MessageSquareX size={16} />,
    color:  'text-slate-400',
    bg:     'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.2)',
  },
]

const NOTE_PLACEHOLDERS: Record<ResolveStatus, string> = {
  closed:      'e.g. Very promising, fast learner',
  not_closed:  'e.g. Too far from home, cost concern',
  no_response: 'e.g. Called 3 times — no reply',
}

const inputClass = cn(
  'w-full px-4 py-3 rounded-xl font-body text-sm text-white',
  'bg-white/[0.04] border border-white/[0.08]',
  'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
  'transition-colors placeholder:text-slate-600',
)

// ─── Component ────────────────────────────────────────────────────────────────

export function TrialResolve({ trial, isOpen, onClose, onResolve, onConvert }: TrialResolveProps) {
  const [selectedStatus, setSelectedStatus] = useState<ResolveStatus>('closed')
  const [reason,         setReason]         = useState('')
  const [convertMode,    setConvertMode]    = useState(false)
  const [batch,          setBatch]          = useState<BatchType>('5-6 PM')
  const [fee,            setFee]            = useState('2000')
  const [billingDay,     setBillingDay]     = useState('1')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [showSuccess,  setShowSuccess]  = useState(false)

  const handleClose = () => {
    if (saving) return
    setSelectedStatus('closed')
    setReason('')
    setConvertMode(false)
    setBatch('5-6 PM')
    setFee('2000')
    setBillingDay('1')
    setError(null)
    onClose()
  }

  const handleStatusSelect = (status: ResolveStatus) => {
    setSelectedStatus(status)
    if (status !== 'closed') setConvertMode(false)
  }

  const handleSubmit = async () => {
    if (!trial) return
    setSaving(true)
    setError(null)
    try {
      if (selectedStatus === 'closed' && convertMode) {
        const feeNum = parseInt(fee, 10)
        if (isNaN(feeNum) || feeNum <= 0) {
          setError('Enter a valid monthly fee')
          setSaving(false)
          return
        }
        await onConvert(trial, {
          batch,
          monthly_fee:       feeNum,
          billing_cycle_day: parseInt(billingDay, 10) || null,
        })
      } else {
        await onResolve(trial.id, {
          status: selectedStatus,
          reason: reason.trim() || null,
        })
      }
      setShowSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!trial) return null

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
        disabled={saving}
      >
        {saving ? 'Saving…' : convertMode ? 'Add to Academy' : 'Save Outcome'}
      </Button>
    </div>
  )

  return (
    <>
    {showSuccess && <SuccessOverlay message="Trial resolved!" onDone={handleClose} />}
    <Drawer isOpen={isOpen} onClose={handleClose} title="Resolve Trial" width="440px" footer={drawerFooter}>
      <div className="flex flex-col gap-5">

        {/* Trial summary */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Avatar name={trial.name} src={trial.photo_url} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-white truncate">{trial.name}</p>
            <p className="font-body text-xs text-slate-400 mt-0.5">Trial: {formatDate(trial.trial_date)}</p>
            {trial.parent_name && (
              <p className="font-body text-xs text-slate-500 mt-0.5">{trial.parent_name}</p>
            )}
          </div>
          <Badge variant={trial.status} />
        </div>

        {/* Outcome selection */}
        <div>
          <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Outcome
          </p>
          <div className="flex flex-col gap-2">
            {RESOLVE_OPTIONS.map(opt => {
              const isSelected = selectedStatus === opt.status
              return (
                <button
                  key={opt.status}
                  onClick={() => handleStatusSelect(opt.status)}
                  className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-150 hover:opacity-90"
                  style={isSelected
                    ? { background: opt.bg, border: `1px solid ${opt.border}` }
                    : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }
                  }
                >
                  <span className={opt.color}>{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-body text-sm font-semibold', isSelected ? opt.color : 'text-slate-300')}>
                      {opt.label}
                    </p>
                    <p className="font-body text-[11px] text-slate-500">{opt.desc}</p>
                  </div>
                  {/* Radio indicator */}
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                    isSelected ? opt.color + ' border-current' : 'border-slate-600',
                  )}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Note */}
        <div className="flex flex-col gap-2">
          <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Note <span className="font-normal text-slate-600 normal-case">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={NOTE_PLACEHOLDERS[selectedStatus]}
            rows={2}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {/* Convert to student — only when "Joined" is selected */}
        {selectedStatus === 'closed' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setConvertMode(v => !v)}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-150',
                convertMode
                  ? 'bg-grass/[0.10] border border-grass/30'
                  : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05]',
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                convertMode ? 'bg-grass/20 text-grass' : 'bg-white/[0.06] text-slate-400',
              )}>
                <UserCheck size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-body text-sm font-semibold transition-colors', convertMode ? 'text-grass' : 'text-slate-300')}>
                  Convert to Active Student
                </p>
                <p className="font-body text-[11px] text-slate-500">
                  Automatically add to the students list
                </p>
              </div>
              {/* Toggle */}
              <div
                className="shrink-0 relative transition-colors rounded-full"
                style={{
                  width: 40, height: 22,
                  background: convertMode ? '#00FF87' : 'rgba(71,85,105,0.6)',
                }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  style={{ transform: convertMode ? 'translateX(20px)' : 'translateX(3px)' }}
                />
              </div>
            </button>

            {/* Convert fields */}
            {convertMode && (
              <div className="flex flex-col gap-4 p-4 rounded-xl"
                   style={{ background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.15)' }}>

                {/* Batch */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Batch
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BATCHES.map(b => (
                      <button
                        key={b}
                        onClick={() => setBatch(b)}
                        className={cn(
                          'py-2.5 rounded-xl font-body text-xs font-semibold transition-all duration-150',
                          batch === b
                            ? 'text-pitch bg-grass shadow-[0_0_12px_rgba(0,255,135,0.25)]'
                            : 'text-slate-400 hover:text-white',
                        )}
                        style={batch !== b
                          ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                          : undefined
                        }
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly fee */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Monthly Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    placeholder="2000"
                    className={inputClass}
                  />
                </div>

                {/* Billing day */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Billing Day <span className="font-normal text-slate-600 normal-case">(1–31, optional)</span>
                  </label>
                  <input
                    type="number"
                    value={billingDay}
                    min={1}
                    max={31}
                    onChange={e => setBillingDay(e.target.value)}
                    placeholder="e.g. 1"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
               style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.2)' }}>
            <AlertCircle size={14} className="text-danger shrink-0" />
            <p className="font-body text-xs text-danger">{error}</p>
          </div>
        )}

      </div>
    </Drawer>
    </>
  )
}
