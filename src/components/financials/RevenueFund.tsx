import { useRef, useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  TrendingUp, TrendingDown, IndianRupee, Receipt,
  Plus, Pencil, Trash2, Loader2, CheckCircle2, AlertCircle, Link2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { gsap } from '../../lib/animations'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { cn, formatCurrency } from '../../lib/utils'
import type { Expense } from '../../types/index'
import type {
  ExpenseInput, RevenueSummary, MonthlyTrendData, CoachOption,
} from '../../hooks/useFinancials'

// ─── Constants ────────────────────────────────────────────────────────────────

const REVENUE_CATEGORIES = ['jerseys', 'equipment', 'maintenance', 'personal', 'other'] as const

const CATEGORY_LABELS: Record<string, string> = {
  jerseys:     'Jerseys',
  equipment:   'Equipment',
  maintenance: 'Maintenance',
  personal:    'Personal',
  other:       'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  jerseys:     '#00FF87',
  equipment:   '#00D4FF',
  maintenance: '#FFB800',
  personal:    '#FF3D57',
  other:       '#94A3B8',
}

const PURPOSES = [
  { value: 'personal_advance', label: 'Personal Advance',      hint: 'Will be repaid' },
  { value: 'academy_expense',  label: 'Academy Expense',       hint: 'Permanent spend' },
  { value: 'equipment',        label: 'Equipment',             hint: 'Permanent spend' },
  { value: 'other',            label: 'Other',                 hint: '' },
] as const

type PurposeValue = typeof PURPOSES[number]['value']

const REPAYABLE_PURPOSES: PurposeValue[] = ['personal_advance']

function getMonthYearOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    return {
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      label: format(d, 'MMMM yyyy'),
    }
  })
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TipProps { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }

function ExpenseTooltip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-4 py-3 rounded-xl font-body text-sm"
      style={{
        background: 'rgba(18,18,26,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map(e => (
        <p key={e.name} className="font-semibold" style={{ color: e.color }}>
          {e.name}: {formatCurrency(e.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }: {
  icon:   React.ReactNode
  label:  string
  value:  string
  sub?:   string
  accent: string
}) {
  return (
    <div data-stat className="glass rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <span className="font-body text-xs text-slate-400">{label}</span>
      </div>
      <p className="font-display text-2xl leading-none" style={{ color: accent }}>{value}</p>
      {sub && <p className="font-body text-[11px] text-slate-500">{sub}</p>}
    </div>
  )
}

// ─── Expense form drawer ──────────────────────────────────────────────────────

interface ExpenseFormProps {
  isOpen:       boolean
  expense:      Expense | null
  headCoaches:  CoachOption[]
  coachesById:  Map<string, string>
  onClose:      () => void
  onSave:       (data: ExpenseInput) => Promise<void>
  onUpdate:     (id: string, data: Partial<ExpenseInput>) => Promise<void>
}

const inputCls = cn(
  'w-full px-4 py-3 rounded-xl font-body text-sm text-white',
  'bg-white/[0.04] border border-white/[0.08]',
  'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
  'transition-colors placeholder:text-slate-600',
)

function ExpenseFormDrawer({
  isOpen, expense, headCoaches, onClose, onSave, onUpdate,
}: ExpenseFormProps) {
  const [title,          setTitle]          = useState('')
  const [amount,         setAmount]         = useState('')
  const [fundType,       setFundType]       = useState<'revenue' | 'emergency'>('revenue')
  const [category,       setCategory]       = useState('other')
  const [date,           setDate]           = useState(format(new Date(), 'yyyy-MM-dd'))
  const [note,           setNote]           = useState('')
  // Emergency-specific
  const [withdrawnBy,    setWithdrawnBy]    = useState('')
  const [purpose,        setPurpose]        = useState<PurposeValue>('personal_advance')
  const [repaymentDate,  setRepaymentDate]  = useState('')
  // Cross-fund
  const [isCrossFund,    setIsCrossFund]    = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const isEdit        = !!expense
  const isEmergency   = fundType === 'emergency'
  const needsRepayDate = isEmergency && REPAYABLE_PURPOSES.includes(purpose)

  useEffect(() => {
    if (!isOpen) return
    if (expense) {
      setTitle(expense.title)
      setAmount(String(expense.amount))
      setFundType(expense.fund_type)
      setCategory(expense.category)
      setDate(expense.expense_date)
      setNote(expense.note ?? '')
      setWithdrawnBy(expense.withdrawn_by ?? '')
      setPurpose((expense.purpose as PurposeValue) ?? 'personal_advance')
      setRepaymentDate(expense.expected_repayment_date ?? '')
      setIsCrossFund(expense.is_cross_fund ?? false)
    } else {
      setTitle('')
      setAmount('')
      setFundType('revenue')
      setCategory('other')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setNote('')
      setWithdrawnBy(headCoaches[0]?.id ?? '')
      setPurpose('personal_advance')
      setRepaymentDate('')
      setIsCrossFund(false)
    }
    setError(null)
  }, [isOpen, expense, headCoaches])

  // Reset emergency fields when switching fund type
  useEffect(() => {
    if (!isEmergency) {
      setWithdrawnBy(headCoaches[0]?.id ?? '')
      setPurpose('personal_advance')
      setRepaymentDate('')
    }
  }, [isEmergency, headCoaches])

  const handleClose = () => { if (!saving) onClose() }

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount'); return }
    if (isEmergency && !withdrawnBy) { setError('Select who is withdrawing'); return }

    setSaving(true)
    setError(null)
    try {
      const data: ExpenseInput = {
        title:                   title.trim(),
        amount:                  Math.round(parsed),
        expense_date:            date,
        fund_type:               fundType,
        category:                isEmergency ? 'other' : category,
        note:                    note.trim() || null,
        withdrawn_by:            isEmergency ? withdrawnBy : null,
        purpose:                 isEmergency ? purpose : null,
        expected_repayment_date: (isEmergency && needsRepayDate && repaymentDate) ? repaymentDate : null,
        is_cross_fund:           !isEmergency && isCrossFund,
      }
      if (isEdit && expense) {
        await onUpdate(expense.id, data)
      } else {
        await onSave(data)
      }
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const drawerFooter = (
    <div className="flex gap-3">
      <Button variant="ghost" className="flex-1" onClick={handleClose} disabled={saving}>Cancel</Button>
      <Button
        variant="primary"
        className="flex-1"
        icon={saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        onClick={handleSubmit}
        disabled={saving || !title.trim() || !amount}
      >
        {saving ? 'Saving…' : isEdit ? 'Update' : isEmergency ? 'Record Withdrawal' : 'Add Expense'}
      </Button>
    </div>
  )

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Expense' : 'Add Expense'}
      width="440px"
      footer={drawerFooter}
    >
      <div className="flex flex-col gap-5">

        {/* Fund type toggle */}
        <div className="flex flex-col gap-2">
          <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Fund</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'revenue',   label: 'Revenue Fund',   active: '#00FF87' },
              { value: 'emergency', label: 'Emergency Fund', active: '#FFB800' },
            ] as const).map(ft => (
              <button
                key={ft.value}
                onClick={() => setFundType(ft.value)}
                className={cn(
                  'py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-150',
                  fundType === ft.value ? 'text-pitch' : 'text-slate-400 hover:text-white',
                )}
                style={
                  fundType === ft.value
                    ? { background: ft.active, boxShadow: `0 0 12px ${ft.active}44` }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {isEmergency ? 'What is this for?' : 'Title'} <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isEmergency ? 'e.g. Personal advance for travel' : 'e.g. Jersey set — 20 players'}
            className={inputCls}
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Amount <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-grass"><IndianRupee size={14} /></span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="2000"
              className={cn(inputCls, 'pl-9')}
            />
          </div>
        </div>

        {/* ── Revenue-specific fields ── */}
        {!isEmergency && (
          <>
            {/* Category pills */}
            <div className="flex flex-col gap-2">
              <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-2">
                {REVENUE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all duration-150',
                      category === cat ? 'text-pitch' : 'text-slate-400 hover:text-white',
                    )}
                    style={
                      category === cat
                        ? { background: CATEGORY_COLORS[cat], boxShadow: `0 0 10px ${CATEGORY_COLORS[cat]}44` }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Cross-fund checkbox */}
            <label
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
              style={{ background: isCrossFund ? 'rgba(255,184,0,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isCrossFund ? 'rgba(255,184,0,0.25)' : 'rgba(255,255,255,0.08)'}` }}
            >
              <input
                type="checkbox"
                checked={isCrossFund}
                onChange={e => setIsCrossFund(e.target.checked)}
                className="mt-0.5 accent-amber shrink-0"
              />
              <div>
                <p className="font-body text-sm font-semibold text-white">Paid from Emergency Fund</p>
                <p className="font-body text-xs text-slate-500 mt-0.5">
                  Revenue category expense, but Emergency Fund was used because Revenue was insufficient
                </p>
              </div>
            </label>
          </>
        )}

        {/* ── Emergency-specific fields ── */}
        {isEmergency && (
          <>
            {/* Who is withdrawing */}
            <div className="flex flex-col gap-2">
              <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Who is withdrawing? <span className="text-danger">*</span>
              </label>
              <select
                value={withdrawnBy}
                onChange={e => setWithdrawnBy(e.target.value)}
                className={cn(inputCls, 'appearance-none [color-scheme:dark]')}
              >
                <option value="">Select coach…</option>
                {headCoaches.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Purpose */}
            <div className="flex flex-col gap-2">
              <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Purpose</label>
              <div className="grid grid-cols-2 gap-2">
                {PURPOSES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPurpose(p.value)}
                    className={cn(
                      'flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                      purpose === p.value ? '' : 'hover:border-white/20',
                    )}
                    style={
                      purpose === p.value
                        ? { background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.35)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    <span className={cn('font-body text-xs font-semibold', purpose === p.value ? 'text-amber' : 'text-slate-300')}>
                      {p.label}
                    </span>
                    {p.hint && (
                      <span className="font-body text-[10px] text-slate-500 mt-0.5">{p.hint}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected repayment date — only for repayable purposes */}
            {needsRepayDate && (
              <div className="flex flex-col gap-2">
                <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Expected Repayment Date <span className="text-slate-600 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={repaymentDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => setRepaymentDate(e.target.value)}
                  className={cn(inputCls, '[color-scheme:dark]')}
                />
                {repaymentDate && (
                  <p className="font-body text-xs text-amber">
                    A pending repayment alert will appear until this is marked repaid.
                  </p>
                )}
              </div>
            )}
          </>
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
            placeholder="Additional details…"
            rows={2}
            className={cn(inputCls, 'resize-none')}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.2)' }}
          >
            <AlertCircle size={14} className="text-danger shrink-0" />
            <p className="font-body text-xs text-danger">{error}</p>
          </div>
        )}

        {/* Info for emergency */}
        {isEmergency && !isEdit && (
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)' }}
          >
            <AlertCircle size={13} className="text-amber shrink-0 mt-0.5" />
            <p className="font-body text-xs text-slate-400">
              This will create an Emergency Fund withdrawal and update the fund balance.
            </p>
          </div>
        )}

      </div>
    </Drawer>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RevenueFundProps {
  expenses:        Expense[]
  summary:         RevenueSummary
  trend:           MonthlyTrendData[]
  filterMonth:     number
  filterYear:      number
  headCoaches:     CoachOption[]
  coaches:         CoachOption[]
  onFilterChange:  (month: number, year: number) => void
  isLoading:       boolean
  onAddExpense:    (data: ExpenseInput) => Promise<void>
  onUpdateExpense: (id: string, data: Partial<ExpenseInput>) => Promise<void>
  onDeleteExpense: (id: string) => Promise<void>
}

const Y_TICK  = { fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter' }
const X_TICK  = { fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter' }
const AXIS_LN = { stroke: 'rgba(255,255,255,0.08)' }

function formatY(v: number) {
  if (v === 0) return '₹0'
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`
  return `₹${v}`
}

const PURPOSE_LABELS: Record<string, string> = {
  personal_advance: 'Personal Advance',
  academy_expense:  'Academy Expense',
  equipment:        'Equipment',
  other:            'Other',
}

export function RevenueFund({
  expenses, summary, trend, filterMonth, filterYear,
  headCoaches, coaches, onFilterChange, isLoading,
  onAddExpense, onUpdateExpense, onDeleteExpense,
}: RevenueFundProps) {
  const statsRef = useRef<HTMLDivElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [editExpense,   setEditExpense]   = useState<Expense | null>(null)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Coach name lookup map
  const coachesById = new Map(coaches.map(c => [c.id, c.name]))

  useEffect(() => {
    if (isLoading || !statsRef.current) return
    gsap.fromTo(
      statsRef.current.querySelectorAll('[data-stat]'),
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' },
    )
  }, [isLoading])

  useEffect(() => {
    if (isLoading || !listRef.current) return
    gsap.fromTo(
      listRef.current.querySelectorAll('[data-row]'),
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', clearProps: 'all' },
    )
  }, [isLoading, filterMonth, filterYear])

  const monthOptions = getMonthYearOptions()

  // Group by category for revenue, by purpose for emergency
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, exp) => {
    const key = exp.fund_type === 'emergency' ? `__emg__${exp.purpose ?? 'other'}` : exp.category
    if (!acc[key]) acc[key] = []
    acc[key].push(exp)
    return acc
  }, {})

  const handleEdit = (exp: Expense) => { setEditExpense(exp); setDrawerOpen(true) }
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await onDeleteExpense(id) } catch { /* parent handles */ }
    finally { setDeletingId(null); setConfirmDelete(null) }
  }
  const handleDrawerClose = () => { setDrawerOpen(false); setEditExpense(null) }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
        <div className="h-48 rounded-2xl skeleton" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl skeleton" />)}
        </div>
      </div>
    )
  }

  const netPositive = summary.netRevenue >= 0

  return (
    <div className="space-y-6">

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp size={14} />} label="Collected" value={formatCurrency(summary.totalCollected)} sub="This month" accent="#00FF87" />
        <StatCard icon={<Receipt size={14} />} label="Expenses" value={formatCurrency(summary.totalExpenses)} sub={`${expenses.filter(e => e.fund_type === 'revenue').length} revenue items`} accent="#FFB800" />
        <StatCard
          icon={netPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          label="Net Revenue" value={formatCurrency(Math.abs(summary.netRevenue))}
          sub={netPositive ? 'Surplus' : 'Deficit'}
          accent={netPositive ? '#00FF87' : '#FF3D57'}
        />
        <StatCard icon={<IndianRupee size={14} />} label="Expense Count" value={String(expenses.length)} sub="All fund types" accent="#00D4FF" />
      </div>

      {/* ── 6-month chart ────────────────────────────────────────────────────── */}
      <div className="glass p-5 rounded-2xl">
        <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Expense Trend — Last 6 Months
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={trend} barGap={3} barCategoryGap="30%">
            <XAxis dataKey="month" tick={X_TICK} axisLine={AXIS_LN} tickLine={false} />
            <YAxis tickFormatter={formatY} tick={Y_TICK} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<ExpenseTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }} />
            <Bar dataKey="revenueExpenses"   name="Revenue"   fill="#00FF87" radius={[4,4,0,0]} animationDuration={700} />
            <Bar dataKey="emergencyExpenses" name="Emergency" fill="#FFB800" radius={[4,4,0,0]} animationDuration={700} animationBegin={120} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-3">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-grass" /><span className="font-body text-xs text-slate-400">Revenue</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber" /><span className="font-body text-xs text-slate-400">Emergency</span></div>
        </div>
      </div>

      {/* ── Filter + Add ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={`${filterYear}-${filterMonth}`}
          onChange={e => { const [y, m] = e.target.value.split('-').map(Number); onFilterChange(m, y) }}
          className={cn('flex-1 min-w-[160px] px-4 py-2.5 rounded-xl font-body text-sm text-white', 'bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-grass/40 [color-scheme:dark] appearance-none')}
        >
          {monthOptions.map(opt => (
            <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>{opt.label}</option>
          ))}
        </select>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => { setEditExpense(null); setDrawerOpen(true) }}>
          Add Expense
        </Button>
      </div>

      {/* ── Expense list ─────────────────────────────────────────────────────── */}
      <div ref={listRef} className="space-y-4">
        {expenses.length === 0 ? (
          <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <Receipt size={32} className="text-slate-600" />
            <p className="font-display text-base text-slate-400 uppercase tracking-wider">No expenses this month</p>
            <p className="font-body text-sm text-slate-500">Click Add Expense to start tracking.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([groupKey, items]) => {
            const isEmgGroup = groupKey.startsWith('__emg__')
            const groupLabel = isEmgGroup
              ? `Emergency — ${PURPOSE_LABELS[groupKey.replace('__emg__', '')] ?? 'Other'}`
              : CATEGORY_LABELS[groupKey] ?? groupKey
            const groupColor = isEmgGroup ? '#FFB800' : (CATEGORY_COLORS[groupKey] ?? '#94A3B8')

            return (
              <div key={groupKey}>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="px-2.5 py-1 rounded-lg font-body text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: groupColor, background: `${groupColor}18`, border: `1px solid ${groupColor}30` }}
                  >
                    {groupLabel}
                  </span>
                  <span className="font-body text-xs text-slate-500">
                    {formatCurrency(items.reduce((s, i) => s + i.amount, 0))}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>

                <div className="space-y-2">
                  {items.map(exp => {
                    const coachName = exp.withdrawn_by ? coachesById.get(exp.withdrawn_by) : null
                    return (
                      <div key={exp.id} data-row className="glass glass-hover rounded-xl px-4 py-3 flex items-center gap-3">
                        {/* Fund badge */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span
                            className={cn('px-1.5 py-0.5 rounded font-display text-[9px] font-bold uppercase tracking-wider', exp.fund_type === 'revenue' ? 'text-grass' : 'text-amber')}
                            style={{ background: exp.fund_type === 'revenue' ? 'rgba(0,255,135,0.1)' : 'rgba(255,184,0,0.1)' }}
                          >
                            {exp.fund_type === 'revenue' ? 'REV' : 'EMG'}
                          </span>
                          {exp.is_cross_fund && (
                            <Link2 size={10} className="text-amber" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-semibold text-white truncate">{exp.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {coachName && (
                              <span className="font-body text-xs text-amber">{coachName}</span>
                            )}
                            {exp.note && (
                              <span className="font-body text-xs text-slate-500 truncate">{exp.note}</span>
                            )}
                            {exp.expected_repayment_date && !exp.is_cross_fund && (
                              <span className="font-body text-[10px] text-slate-500">
                                Due {format(new Date(exp.expected_repayment_date), 'd MMM')}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="font-body text-xs text-slate-500 shrink-0 hidden sm:block">
                          {format(new Date(exp.expense_date), 'd MMM')}
                        </span>
                        <span className="font-display text-base font-semibold text-white shrink-0">
                          {formatCurrency(exp.amount)}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleEdit(exp)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-ice transition-colors"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <Pencil size={13} />
                          </button>
                          {confirmDelete === exp.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(exp.id)} disabled={deletingId === exp.id}
                                className="px-2 py-1 rounded-lg font-body text-[11px] font-semibold text-white bg-danger/80 hover:bg-danger transition-colors">
                                {deletingId === exp.id ? '…' : 'Delete'}
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="px-2 py-1 rounded-lg font-body text-[11px] text-slate-400 hover:text-white transition-colors"
                                style={{ background: 'rgba(255,255,255,0.06)' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(exp.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-danger transition-colors"
                              style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Category breakdown */}
      {summary.expenseBreakdown.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="font-body text-xs text-slate-400 uppercase tracking-wider mb-3">Revenue Breakdown</p>
          <div className="space-y-2">
            {summary.expenseBreakdown.map(({ category: cat, amount }) => {
              const pct = summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-xs text-slate-300">{CATEGORY_LABELS[cat] ?? cat}</span>
                    <span className="font-display text-xs text-white">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] ?? '#94A3B8' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ExpenseFormDrawer
        isOpen={drawerOpen}
        expense={editExpense}
        headCoaches={headCoaches}
        coachesById={coachesById}
        onClose={handleDrawerClose}
        onSave={onAddExpense}
        onUpdate={onUpdateExpense}
      />
    </div>
  )
}
