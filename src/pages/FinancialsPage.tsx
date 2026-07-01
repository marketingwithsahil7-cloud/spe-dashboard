import { useState, lazy, Suspense } from 'react'
import { format, differenceInDays, subMonths } from 'date-fns'
import { Wallet, TrendingUp, ShieldAlert, StickyNote, AlertTriangle, Clock, Download, Loader2 } from 'lucide-react'
import { PageGlow } from '../components/ui/PageGlow'
import { cn, formatCurrency } from '../lib/utils'
import { useFinancials } from '../hooks/useFinancials'
import { usePermissions } from '../hooks/usePermissions'
import { RevenueFund } from '../components/financials/RevenueFund'
import { EmergencyFund } from '../components/financials/EmergencyFund'
import { FinancialNotes } from '../components/financials/FinancialNotes'
import { MonthSelector } from '../components/fees/MonthSelector'
const AmbientBackground = lazy(() => import('../components/ui/AmbientBackground'))

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = 'revenue' | 'emergency' | 'notes'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'revenue',   label: 'Revenue Fund',   icon: <TrendingUp  size={13} /> },
  { key: 'emergency', label: 'Emergency Fund',  icon: <ShieldAlert size={13} /> },
  { key: 'notes',     label: 'Notes',           icon: <StickyNote  size={13} /> },
]

// ─── Personal advance alert ───────────────────────────────────────────────────

interface PendingAdvance {
  coachName: string
  amount: number
  date: string
  daysSince: number
}

function PersonalAdvanceAlert({ advances }: { advances: PendingAdvance[] }) {
  if (advances.length === 0) return null
  return (
    <div
      className="rounded-2xl px-4 py-3 space-y-2"
      style={{
        background: 'rgba(255,184,0,0.07)',
        border: '1px solid rgba(255,184,0,0.25)',
        boxShadow: '0 0 20px rgba(255,184,0,0.08)',
      }}
    >
      {advances.map((adv, i) => {
        const isOverdue = adv.daysSince > 30
        return (
          <div key={i} className="flex items-center gap-3">
            {isOverdue
              ? <AlertTriangle size={14} className="text-danger shrink-0" />
              : <Clock size={14} className="text-amber shrink-0" />
            }
            <p className="font-body text-sm text-white flex-1">
              <span className="font-semibold text-amber">{adv.coachName}</span>
              {' '}has{' '}
              <span className="font-semibold text-white">{formatCurrency(adv.amount)}</span>
              {' '}pending personal advance
              <span className={cn('ml-1', isOverdue ? 'text-danger font-semibold' : 'text-slate-400')}>
                ({adv.daysSince} days ago
                {isOverdue ? ' — overdue!' : ''})
              </span>
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancialsPage() {
  const today = new Date()
  const { isHeadOrOwner } = usePermissions()

  const [activeTab,        setActiveTab]        = useState<Tab>('revenue')
  const [selectedMonth,    setSelectedMonth]    = useState(() => format(today, 'yyyy-MM'))
  const [isGeneratingPdf,  setIsGeneratingPdf]  = useState(false)

  const minMonth   = format(subMonths(today, 11), 'yyyy-MM') // 12-month range including current
  const filterYear  = Number(selectedMonth.split('-')[0])
  const filterMonth = Number(selectedMonth.split('-')[1])

  const handleDownloadReport = async () => {
    setIsGeneratingPdf(true)
    try {
      const { generateMonthlyReport } = await import('../lib/generateMonthlyReport')
      await generateMonthlyReport(filterMonth, filterYear)
    } catch (err) {
      console.error('[SPE] PDF generation failed:', err)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const {
    expenses,
    transactions,
    coaches,
    headCoaches,
    notes,
    revenueSummary,
    emergencyBalance,
    monthlyTrend,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addEmergencyTransaction,
    markRepaid,
    addNote,
    deleteNote,
  } = useFinancials(filterMonth, filterYear)

  const netPositive = revenueSummary.netRevenue >= 0

  // Build personal advance alert data from pending repayments
  const pendingAdvances: PendingAdvance[] = emergencyBalance.pendingRepayments.map(tx => ({
    coachName: tx.coach?.name ?? 'Unknown',
    amount:    tx.amount,
    date:      tx.transaction_date,
    daysSince: differenceInDays(new Date(), new Date(tx.transaction_date)),
  }))

  return (
    <div className="relative space-y-5 pb-24 md:pb-8">
      <PageGlow variant="gold" />
      <Suspense fallback={null}><AmbientBackground variant="financials" /></Suspense>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={20} className="text-grass" strokeWidth={1.5} />
            <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
              Financials
            </h1>
          </div>
          <div className="mt-2">
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} min={minMonth} />
          </div>
        </div>

        {/* Quick stat chips + Download button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <TrendingUp size={13} className={netPositive ? 'text-grass' : 'text-danger'} />
            <span className="font-body text-xs text-slate-400">Net</span>
            <span className={cn('font-display text-sm font-semibold', netPositive ? 'text-grass' : 'text-danger')}>
              {formatCurrency(Math.abs(revenueSummary.netRevenue))}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ShieldAlert size={13} className={
              emergencyBalance.currentBalance < 1000 ? 'text-danger'
              : emergencyBalance.currentBalance < 5000 ? 'text-amber'
              : 'text-grass'
            } />
            <span className="font-body text-xs text-slate-400">Emergency</span>
            <span className={cn(
              'font-display text-sm font-semibold',
              emergencyBalance.currentBalance < 1000 ? 'text-danger'
              : emergencyBalance.currentBalance < 5000 ? 'text-amber'
              : 'text-grass',
            )}>
              {formatCurrency(emergencyBalance.currentBalance)}
            </span>
          </div>

          {/* Download Monthly Report — head/owner only */}
          {isHeadOrOwner && (
            <button
              onClick={handleDownloadReport}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-display text-xs font-semibold uppercase tracking-wider text-pitch bg-grass transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: isGeneratingPdf ? 'none' : '0 0 16px rgba(0,255,135,0.25)' }}
              title={`Download ${format(new Date(filterYear, filterMonth - 1, 1), 'MMMM yyyy')} Report`}
            >
              {isGeneratingPdf
                ? <><Loader2 size={12} className="animate-spin" />Generating…</>
                : <><Download size={12} />Report</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Personal advance alert ───────────────────────────────────────── */}
      <PersonalAdvanceAlert advances={pendingAdvances} />

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center p-1 rounded-2xl gap-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl',
              'font-display text-xs font-semibold uppercase tracking-wider transition-all duration-200',
              activeTab === key ? 'text-grass' : 'text-slate-500 hover:text-slate-300',
            )}
            style={
              activeTab === key
                ? { background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.15)' }
                : { background: 'transparent', border: '1px solid transparent' }
            }
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">
              {key === 'revenue' ? 'Revenue' : key === 'emergency' ? 'Emergency' : 'Notes'}
            </span>
            {/* Badge: pending advances count on emergency tab */}
            {key === 'emergency' && pendingAdvances.length > 0 && (
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center font-display text-[9px] font-bold text-pitch bg-amber"
              >
                {pendingAdvances.length}
              </span>
            )}
            {/* Badge: notes count on notes tab */}
            {key === 'notes' && notes.length > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full font-display text-[9px] font-bold"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}
              >
                {notes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {activeTab === 'revenue' && (
        <RevenueFund
          expenses={expenses}
          summary={revenueSummary}
          trend={monthlyTrend}
          headCoaches={headCoaches}
          coaches={coaches}
          isLoading={isLoading}
          isHeadOrOwner={isHeadOrOwner}
          onAddExpense={addExpense}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
        />
      )}

      {activeTab === 'emergency' && (
        <EmergencyFund
          transactions={transactions}
          balance={emergencyBalance}
          coaches={coaches}
          isLoading={isLoading}
          isHeadOrOwner={isHeadOrOwner}
          onAddTransaction={addEmergencyTransaction}
          onMarkRepaid={markRepaid}
        />
      )}

      {activeTab === 'notes' && (
        <FinancialNotes
          notes={notes}
          isHeadOrOwner={isHeadOrOwner}
          isLoading={isLoading}
          onAdd={addNote}
          onDelete={deleteNote}
        />
      )}
    </div>
  )
}
