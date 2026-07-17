import { useRef, useEffect, useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import {
  ShieldAlert, ArrowDownCircle, ArrowUpCircle, RefreshCw,
  Clock, CheckCircle2, AlertCircle, Plus, Loader2, IndianRupee, Trash2,
} from 'lucide-react'
import { gsap } from '../../lib/animations'
import { Drawer } from '../ui/Drawer'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { cn, formatCurrency } from '../../lib/utils'
import type { EmergencyFundTransactionWithCoach, EmergencyFundBalance, EmergencyTxInput } from '../../hooks/useFinancials'

// ─── Types ────────────────────────────────────────────────────────────────────

type TxFilter = 'all' | 'deposit' | 'withdrawal'

// ─── Balance hero card ────────────────────────────────────────────────────────

function BalanceHero({ balance }: { balance: EmergencyFundBalance }) {
  const heroRef  = useRef<HTMLDivElement>(null)
  const isLow      = balance.currentBalance <= 5000 && balance.currentBalance >= 1000
  const isCritical = balance.currentBalance < 1000

  const accentColor = isCritical ? '#FF3D57' : isLow ? '#FFB800' : '#00FF87'
  const statusLabel = isCritical ? 'Critical' : isLow ? 'Low' : 'Healthy'

  useEffect(() => {
    if (!heroRef.current) return
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: 20, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.2)' },
    )
  }, [])

  return (
    <div
      ref={heroRef}
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accentColor}12 0%, rgba(255,255,255,0.03) 100%)`,
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 0 40px ${accentColor}18`,
      }}
    >
      {/* Decorative glow */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} style={{ color: accentColor }} />
            <span className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Emergency Fund
            </span>
          </div>
          <span
            className="px-2.5 py-1 rounded-lg font-body text-xs font-semibold"
            style={{
              color:      accentColor,
              background: `${accentColor}18`,
              border:     `1px solid ${accentColor}30`,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Balance */}
        <p className="font-display text-5xl font-bold leading-none mb-1" style={{ color: accentColor }}>
          {formatCurrency(balance.currentBalance)}
        </p>
        <p className="font-body text-xs text-slate-400 mb-5">Current Balance</p>

        {/* Sub-stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Deposited',  value: balance.totalDeposited,  color: '#00FF87' },
            { label: 'Total Withdrawn',  value: balance.totalWithdrawn,  color: '#FF3D57' },
            { label: 'Total Repaid',     value: balance.totalRepaid,     color: '#00D4FF' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="font-display text-lg font-bold leading-none" style={{ color }}>{formatCurrency(value)}</p>
              <p className="font-body text-[11px] text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Pending repayment card ───────────────────────────────────────────────────

function PendingRepaymentCard({
  tx, onMarkRepaid, isHeadOrOwner,
}: {
  tx:            EmergencyFundTransactionWithCoach
  onMarkRepaid:  (id: string, amount: number, date: string) => Promise<void>
  isHeadOrOwner: boolean
}) {
  const [open,     setOpen]    = useState(false)
  const [amount,   setAmount]  = useState(String(tx.amount))
  const [date,     setDate]    = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving,   setSaving]  = useState(false)
  const [error,    setError]   = useState<string | null>(null)

  const daysSince = differenceInDays(new Date(), new Date(tx.transaction_date))
  const isOverdue = daysSince > 30

  const handleMark = async () => {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    setError(null)
    try {
      await onMarkRepaid(tx.id, Math.round(parsed), date)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as repaid')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = cn(
    'w-full px-3 py-2 rounded-lg font-body text-sm text-white',
    'bg-white/[0.04] border border-white/[0.08]',
    'focus:outline-none focus:ring-1 focus:ring-grass/40 focus:border-grass/40',
    'transition-colors placeholder:text-slate-600',
  )

  return (
    <div
      data-row
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        background: isOverdue ? 'rgba(255,61,87,0.06)' : 'rgba(255,255,255,0.03)',
        border:     isOverdue ? '1px solid rgba(255,61,87,0.25)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow:  isOverdue ? '0 0 16px rgba(255,61,87,0.12)' : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar name={tx.coach?.name ?? '?'} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-white">{tx.coach?.name ?? 'Unknown Coach'}</p>
          <p className="font-body text-xs text-slate-500">
            Withdrawn {format(new Date(tx.transaction_date), 'd MMM yyyy')} · {daysSince}d ago
            {isOverdue && <span className="text-danger ml-1 font-semibold">· Overdue</span>}
          </p>
          {tx.note && <p className="font-body text-xs text-slate-500 mt-0.5 truncate">{tx.note}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-lg font-bold text-danger">{formatCurrency(tx.amount)}</p>
          {isHeadOrOwner && (
            <button
              onClick={() => setOpen(o => !o)}
              className="font-body text-xs font-semibold text-grass hover:text-grassDim transition-colors mt-1"
            >
              {open ? 'Cancel' : 'Mark Repaid'}
            </button>
          )}
        </div>
      </div>

      {/* Inline repayment form */}
      {open && isHeadOrOwner && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grass"><IndianRupee size={13} /></span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={cn(inputCls, 'pl-8')}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={date}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setDate(e.target.value)}
                className={cn(inputCls, '[color-scheme:dark]')}
              />
            </div>
          </div>
          {error && (
            <p className="font-body text-xs text-danger flex items-center gap-1.5">
              <AlertCircle size={12} />{error}
            </p>
          )}
          <Button
            variant="primary"
            className="w-full"
            icon={saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            onClick={handleMark}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Confirm Repayment'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Add transaction drawer ───────────────────────────────────────────────────

function TransactionDrawer({
  isOpen, coaches, onClose, onSave,
}: {
  isOpen:  boolean
  coaches: { id: string; name: string }[]
  onClose: () => void
  onSave:  (data: EmergencyTxInput) => Promise<void>
}) {
  const [txType,  setTxType]  = useState<'deposit' | 'withdrawal'>('deposit')
  const [amount,  setAmount]  = useState('')
  const [coachId, setCoachId] = useState('')
  const [date,    setDate]    = useState(format(new Date(), 'yyyy-MM-dd'))
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTxType('deposit')
      setAmount('')
      setCoachId(coaches[0]?.id ?? '')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setNote('')
      setError(null)
    }
  }, [isOpen, coaches])

  const handleClose = () => { if (!saving) onClose() }

  const handleSubmit = async () => {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount'); return }
    if (txType === 'withdrawal' && !coachId) { setError('Select the coach who withdrew'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        type:             txType,
        amount:           Math.round(parsed),
        transaction_date: date,
        coach_id:         txType === 'withdrawal' ? coachId : null,
        note:             note.trim() || null,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = cn(
    'w-full px-4 py-3 rounded-xl font-body text-sm text-white',
    'bg-white/[0.04] border border-white/[0.08]',
    'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
    'transition-colors placeholder:text-slate-600',
  )

  const drawerFooter = (
    <div className="flex gap-3">
      <Button variant="ghost" className="flex-1" onClick={handleClose} disabled={saving}>Cancel</Button>
      <Button
        variant="primary"
        className="flex-1"
        icon={saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        onClick={handleSubmit}
        disabled={saving || !amount}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Add Fund Transaction" width="420px" footer={drawerFooter}>
      <div className="flex flex-col gap-5">

        {/* Type selector */}
        <div className="flex flex-col gap-2">
          <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'deposit',    label: 'Deposit',    color: '#00FF87' },
              { value: 'withdrawal', label: 'Withdrawal', color: '#FF3D57' },
            ] as const).map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setTxType(value)}
                className={cn(
                  'py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-150',
                  txType === value ? 'text-pitch' : 'text-slate-400 hover:text-white',
                )}
                style={
                  txType === value
                    ? { background: color, boxShadow: `0 0 12px ${color}44` }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grass"><IndianRupee size={14} /></span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="5000"
              className={cn(inputCls, 'pl-9')}
            />
          </div>
        </div>

        {/* Coach selector (withdrawal only) */}
        {txType === 'withdrawal' && (
          <div className="flex flex-col gap-2">
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Coach (Withdrew)</label>
            <select
              value={coachId}
              onChange={e => setCoachId(e.target.value)}
              className={cn(inputCls, 'appearance-none [color-scheme:dark]')}
            >
              <option value="">Select coach…</option>
              {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Date */}
        <div className="flex flex-col gap-2">
          <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={date}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setDate(e.target.value)}
            className={cn(inputCls, '[color-scheme:dark]')}
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-2">
          <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Note <span className="text-slate-600 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Reason for deposit / withdrawal…"
            rows={2}
            className={cn(inputCls, 'resize-none')}
          />
        </div>

        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.2)' }}
          >
            <AlertCircle size={14} className="text-danger shrink-0" />
            <p className="font-body text-xs text-danger">{error}</p>
          </div>
        )}

      </div>
    </Drawer>
  )
}

// ─── Purpose labels ───────────────────────────────────────────────────────────

const PURPOSE_LABELS: Record<string, string> = {
  personal_advance: 'Personal Advance',
  academy_expense:  'Academy Expense',
  equipment:        'Equipment',
  other:            'Other',
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TxRow({ tx, isHeadOrOwner, onDelete }: {
  tx:            EmergencyFundTransactionWithCoach
  isHeadOrOwner: boolean
  onDelete?:     (tx: EmergencyFundTransactionWithCoach) => void
}) {
  const isDeposit    = tx.type === 'deposit'
  const isWithdrawal = tx.type === 'withdrawal'
  const isRepaid     = isWithdrawal && tx.repaid
  const purposeLabel = tx.purpose ? (PURPOSE_LABELS[tx.purpose] ?? tx.purpose) : null

  return (
    <div
      data-row
      className="flex items-center gap-3 px-4 py-3 rounded-xl glass glass-hover"
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: isDeposit ? 'rgba(0,255,135,0.1)' : 'rgba(255,61,87,0.1)',
          border:     isDeposit ? '1px solid rgba(0,255,135,0.2)' : '1px solid rgba(255,61,87,0.2)',
        }}
      >
        {isDeposit
          ? <ArrowDownCircle size={15} className="text-grass" />
          : <ArrowUpCircle   size={15} className="text-danger" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-body text-sm font-semibold text-white">
            {isDeposit ? 'Deposit' : 'Withdrawal'}
          </span>
          {tx.coach?.name && (
            <span className="font-body text-xs font-semibold text-amber">— {tx.coach.name}</span>
          )}
          {purposeLabel && (
            <span
              className="px-1.5 py-0.5 rounded font-body text-[10px] font-semibold text-slate-300"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              {purposeLabel}
            </span>
          )}
          {isRepaid && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-md font-body text-[10px] font-semibold text-grass"
              style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}
            >
              <CheckCircle2 size={10} /> Repaid
            </span>
          )}
        </div>
        <p className="font-body text-xs text-slate-500">
          {format(new Date(tx.transaction_date), 'd MMM yyyy')}
          {tx.note && ` · ${tx.note}`}
        </p>
      </div>

      {/* Amount */}
      <span
        className={cn('font-display text-base font-bold shrink-0', isDeposit ? 'text-grass' : 'text-danger')}
      >
        {isDeposit ? '+' : '-'}{formatCurrency(tx.amount)}
      </span>

      {/* Delete */}
      {isHeadOrOwner && onDelete && (
        <button
          onClick={() => onDelete(tx)}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-danger transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          title="Delete transaction"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EmergencyFundProps {
  transactions:        EmergencyFundTransactionWithCoach[]
  balance:             EmergencyFundBalance
  coaches:             { id: string; name: string }[]
  isLoading:           boolean
  isHeadOrOwner:       boolean
  onAddTransaction:    (data: EmergencyTxInput) => Promise<void>
  onMarkRepaid:        (id: string, amount: number, date: string) => Promise<void>
  onDeleteTransaction: (id: string) => Promise<void>
}

const TX_FILTER_TABS: { key: TxFilter; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'deposit',    label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
]

export function EmergencyFund({
  transactions, balance, coaches, isLoading, isHeadOrOwner, onAddTransaction, onMarkRepaid, onDeleteTransaction,
}: EmergencyFundProps) {
  const listRef      = useRef<HTMLDivElement>(null)
  const pendingRef   = useRef<HTMLDivElement>(null)

  const [txFilter,     setTxFilter]     = useState<TxFilter>('all')
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EmergencyFundTransactionWithCoach | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDeleteTransaction(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // ConfirmDialog stays open — coach can retry
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (isLoading || !pendingRef.current) return
    gsap.fromTo(
      pendingRef.current.querySelectorAll('[data-row]'),
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', clearProps: 'all' },
    )
  }, [isLoading])

  useEffect(() => {
    if (isLoading || !listRef.current) return
    gsap.fromTo(
      listRef.current.querySelectorAll('[data-row]'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out', clearProps: 'all' },
    )
  }, [isLoading, txFilter])

  const filtered = transactions.filter(tx => {
    if (txFilter === 'all') return true
    return tx.type === txFilter
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 rounded-2xl skeleton" />
        <div className="h-32 rounded-2xl skeleton" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl skeleton" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Balance hero ─────────────────────────────────────────────────── */}
      <BalanceHero balance={balance} />

      {/* ── Pending repayments ────────────────────────────────────────────── */}
      {balance.pendingRepayments.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Clock size={14} className="text-amber" />
            <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider">
              Pending Repayments
            </h3>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center font-display text-[10px] font-bold text-pitch bg-amber"
            >
              {balance.pendingRepayments.length}
            </span>
          </div>
          <div ref={pendingRef} className="space-y-3">
            {balance.pendingRepayments.map(tx => (
              <PendingRepaymentCard key={tx.id} tx={tx} onMarkRepaid={onMarkRepaid} isHeadOrOwner={isHeadOrOwner} />
            ))}
          </div>
        </div>
      )}

      {/* ── Transaction history ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider">
            Transaction History
          </h3>
          {isHeadOrOwner && (
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => setDrawerOpen(true)}
            >
              Add Transaction
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div
          className="flex items-center p-1 rounded-xl mb-4 gap-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {TX_FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTxFilter(key)}
              className={cn(
                'flex-1 py-1.5 rounded-lg font-body text-xs font-semibold transition-all duration-150',
                txFilter === key ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {label}
              <span className="ml-1.5 font-display text-[10px]">
                {key === 'all'
                  ? transactions.length
                  : transactions.filter(t => t.type === key).length
                }
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <RefreshCw size={28} className="text-slate-600" />
            <p className="font-display text-base text-slate-400 uppercase tracking-wider">No transactions</p>
          </div>
        ) : (
          <div ref={listRef} className="space-y-2">
            {filtered.map(tx => (
              <TxRow key={tx.id} tx={tx} isHeadOrOwner={isHeadOrOwner} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </div>

      {/* Add transaction drawer */}
      <TransactionDrawer
        isOpen={drawerOpen}
        coaches={coaches}
        onClose={() => setDrawerOpen(false)}
        onSave={onAddTransaction}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this transaction?"
        description="This permanently removes the fund transaction and cannot be undone."
        confirmLabel="Delete Transaction"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
