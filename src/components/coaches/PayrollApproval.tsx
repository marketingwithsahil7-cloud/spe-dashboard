import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle2, XCircle, AlertTriangle, ShieldAlert,
  ChevronDown, ChevronUp, Copy, Check, IndianRupee, Loader2,
} from 'lucide-react'
import { gsap } from '../../lib/animations'
import { fetchMonthlyPayroll } from '../../hooks/useCoaches'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Coach, CoachAttendance } from '../../types/index'
import type { PayrollSummary } from '../../hooks/useCoaches'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayrollApprovalProps {
  coaches:          Coach[]
  verifyAttendance: (id: string) => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthOptions() {
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return { value: d.getMonth() + 1, year: d.getFullYear(), label: format(d, 'MMMM yyyy') }
  })
}

function isMarkedLate(record: CoachAttendance): boolean {
  if (!record.created_at) return false
  const h = new Date(record.created_at).getHours()
  return h >= 20
}

function isSelfMarked(record: CoachAttendance): boolean {
  return !!record.marked_by && record.marked_by === record.coach_id
}

function rowStyle(record: CoachAttendance): { bg: string; border: string } {
  if (record.disputed)           return { bg: 'rgba(255,61,87,0.06)',   border: 'rgba(255,61,87,0.2)'   }
  if (record.verified)           return { bg: 'rgba(0,255,135,0.05)',   border: 'rgba(0,255,135,0.15)'  }
  if (record.confirmed_by_coach) return { bg: 'rgba(255,184,0,0.05)',   border: 'rgba(255,184,0,0.15)'  }
  return                                { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)' }
}

// ─── Fraud flag ───────────────────────────────────────────────────────────────

function FraudFlag({ record }: { record: CoachAttendance }) {
  const late = isMarkedLate(record)
  const self = isSelfMarked(record)
  if (!late && !self) return null
  return (
    <span
      className="ml-1 inline-flex items-center gap-0.5 text-amber cursor-help"
      title={[late && 'Marked after 8 PM', self && 'Self-marked — verify manually'].filter(Boolean).join(' · ')}
    >
      <ShieldAlert size={10} />
    </span>
  )
}

// ─── Per-coach payroll card ───────────────────────────────────────────────────

interface CoachPayrollCardProps {
  summary:          PayrollSummary
  verifyAttendance: (id: string) => Promise<void>
  coachNameMap:     Record<string, string>
  onVerified:       () => void
}

function CoachPayrollCard({ summary, verifyAttendance, onVerified }: CoachPayrollCardProps) {
  const { coach, attendance, disputedSessions, verifiedSessions, payout } = summary
  const [expanded,  setExpanded]  = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [approved,  setApproved]  = useState(false)

  const confirmedNotDisputed = attendance.filter(a => a.confirmed_by_coach && !a.disputed)
  const allVerified = confirmedNotDisputed.length > 0 && confirmedNotDisputed.every(a => a.verified)
  const pendingVerify = confirmedNotDisputed.filter(a => !a.verified)
  const pendingVerifyDays = new Set(pendingVerify.map(r => r.date)).size

  async function handleApproveAll() {
    setVerifying(true)
    try {
      await Promise.all(pendingVerify.map(r => verifyAttendance(r.id)))
      onVerified()
    } catch {
      // silent
    } finally {
      setVerifying(false)
    }
  }

  async function handleApprovePayout() {
    setApproved(true)
    // No DB operation — payout is managed outside the app
    setTimeout(() => setApproved(false), 3000)
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="p-5 flex items-start gap-4">
        <Avatar name={coach.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base font-bold text-white truncate">{coach.name}</h3>
            <Badge variant={coach.role === 'head' ? 'head' : 'assistant'} />
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="font-body text-xs text-slate-400">
              <span className="text-white font-semibold">{summary.totalSessions}</span> sessions
            </span>
            <span className="font-body text-xs text-slate-400">
              <span className="text-grass font-semibold">{verifiedSessions}</span> verified
            </span>
            {disputedSessions > 0 && (
              <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(255,61,87,0.12)', border: '1px solid rgba(255,61,87,0.3)', color: '#FF3D57' }}>
                <AlertTriangle size={9} /> {disputedSessions} disputed
              </span>
            )}
          </div>
        </div>

        {/* Payout + expand */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="font-display text-xl font-bold text-grass">{formatCurrency(payout)}</p>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 font-body text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Expandable session breakdown */}
      {expanded && attendance.length > 0 && (
        <div
          className="px-5 pb-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="mt-4 space-y-1.5">
            {/* Column headers */}
            <div className="grid gap-2 px-2 pb-1"
                 style={{ gridTemplateColumns: '1fr 1fr auto auto auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Date', 'Batch', 'Confirmed', 'Verified', 'Disputed'].map(h => (
                <span key={h} className="font-body text-[10px] text-slate-600 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {attendance.map(record => {
              const style = rowStyle(record)
              return (
                <div
                  key={record.id}
                  className="grid gap-2 px-2 py-2 rounded-lg items-center"
                  style={{ gridTemplateColumns: '1fr 1fr auto auto auto', background: style.bg, border: `1px solid ${style.border}` }}
                >
                  <span className="font-body text-xs text-slate-300">
                    {formatDate(record.date)}
                    <FraudFlag record={record} />
                  </span>
                  <span className="font-body text-xs text-white font-medium">{record.batch}</span>
                  <span className="text-center">
                    {record.confirmed_by_coach
                      ? <CheckCircle2 size={13} className="text-grass mx-auto" />
                      : <XCircle size={13} className="text-slate-600 mx-auto" />}
                  </span>
                  <span className="text-center">
                    {record.verified
                      ? <CheckCircle2 size={13} className="text-grass mx-auto" />
                      : <XCircle size={13} className="text-slate-600 mx-auto" />}
                  </span>
                  <span className="text-center">
                    {record.disputed
                      ? <AlertTriangle size={13} className="text-danger mx-auto" />
                      : <span className="text-slate-700 font-body text-xs mx-auto block text-center">—</span>}
                  </span>
                </div>
              )
            })}

            {/* Fraud warnings */}
            {(attendance.some(isMarkedLate) || attendance.some(isSelfMarked)) && (() => {
              const lateCount = attendance.filter(isMarkedLate).length
              const selfCount = attendance.filter(isSelfMarked).length
              return (
                <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg"
                     style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.2)' }}>
                  <ShieldAlert size={12} className="text-amber shrink-0 mt-0.5" />
                  <p className="font-body text-[11px] text-amber/80">
                    {lateCount > 0 && `${lateCount} session${lateCount > 1 ? 's' : ''} marked after 8 PM. `}
                    {selfCount > 0 && `${selfCount} self-marked session${selfCount > 1 ? 's' : ''} — verify manually.`}
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div
        className="px-5 py-3.5 flex items-center gap-3 flex-wrap"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        {pendingVerify.length > 0 ? (
          <Button
            size="sm"
            variant="primary"
            icon={verifying ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            onClick={handleApproveAll}
            disabled={verifying}
          >
            {verifying ? 'Verifying…' : `Verify ${pendingVerifyDays} Session${pendingVerifyDays > 1 ? 's' : ''}`}
          </Button>
        ) : null}

        <Button
          size="sm"
          variant={approved ? 'primary' : 'secondary'}
          icon={approved ? <Check size={13} /> : <IndianRupee size={13} />}
          disabled={!allVerified || verifying || summary.totalSessions === 0}
          onClick={handleApprovePayout}
        >
          {approved ? 'Payout Approved!' : `Approve Payout: ${formatCurrency(payout)}`}
        </Button>

        <span className="font-body text-[11px] text-slate-500 ml-auto">
          ₹{coach.per_session_rate}/session
        </span>
      </div>
    </div>
  )
}

// ─── Summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  summaries: PayrollSummary[]
  month:     string
}

function SummaryCard({ summaries, month }: SummaryCardProps) {
  const [copied, setCopied] = useState(false)
  const totalPayout = summaries.reduce((s, p) => s + p.payout, 0)

  function exportSummary() {
    const lines = [
      `Soccer Pro Elite — Payroll Summary (${month})`,
      '─'.repeat(40),
      ...summaries.map(s =>
        `${s.coach.name.padEnd(20)} ${s.verifiedSessions} sessions  ${formatCurrency(s.payout)}`
      ),
      '─'.repeat(40),
      `TOTAL${' '.repeat(25)}${formatCurrency(totalPayout)}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.12)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-grass uppercase tracking-widest">
          Total Payout — {month}
        </h3>
        <button
          onClick={exportSummary}
          className="flex items-center gap-1.5 font-body text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00FF87' }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Export'}
        </button>
      </div>

      <p className="font-display text-4xl font-bold text-grass mb-4">
        {formatCurrency(totalPayout)}
      </p>

      <div className="space-y-2">
        {summaries.map(s => (
          <div key={s.coach.id} className="flex items-center gap-2">
            <Avatar name={s.coach.name} size="xs" />
            <span className="font-body text-sm text-slate-300 flex-1 truncate">{s.coach.name}</span>
            <span className="font-body text-xs text-slate-400">{s.verifiedSessions} sessions</span>
            <span className="font-display text-sm font-bold text-white">{formatCurrency(s.payout)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PayrollApproval({ coaches, verifyAttendance }: PayrollApprovalProps) {
  const monthOptions = useMemo(() => getMonthOptions(), [])
  const cardsRef     = useRef<HTMLDivElement>(null)

  const [selectedIdx, setSelectedIdx]   = useState(0)
  const [summaries,   setSummaries]     = useState<PayrollSummary[]>([])
  const [loading,     setLoading]       = useState(false)
  const [error,       setError]         = useState<string | null>(null)

  const selected      = monthOptions[selectedIdx]
  const selectedLabel = selected?.label ?? ''

  // Stable primitive derived from coaches — avoids array-ref churn in useCallback deps
  const coachIds = useMemo(() => coaches.map(c => c.id).join(','), [coaches])

  const loadPayroll = useCallback(async () => {
    if (!selected || coaches.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMonthlyPayroll(selected.value, selected.year, coaches)
      setSummaries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payroll')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, coachIds])

  useEffect(() => { loadPayroll() }, [loadPayroll])

  useEffect(() => {
    if (loading || !cardsRef.current) return
    const cards = cardsRef.current.querySelectorAll<HTMLElement>('.payroll-card')
    if (!cards.length) return
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out', clearProps: 'all' },
    )
  }, [loading])

  if (error) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <p className="font-body text-sm text-danger">{error}</p>
        <button onClick={loadPayroll} className="mt-3 font-body text-xs text-grass underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Month selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {monthOptions.map((opt, i) => (
          <button
            key={opt.label}
            onClick={() => setSelectedIdx(i)}
            className={[
              'px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all duration-150',
              selectedIdx === i
                ? 'text-pitch bg-grass shadow-[0_0_16px_rgba(0,255,135,0.25)]'
                : 'text-slate-400 glass glass-hover hover:text-white',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Coach payroll cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-4">
                <Skeleton width={48} height={48} rounded="rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={16} className="w-2/5" />
                  <div className="flex gap-2">
                    <Skeleton width={64} height={16} rounded="rounded-md" />
                    <Skeleton width={80} height={16} rounded="rounded-md" />
                  </div>
                </div>
                <Skeleton width={80} height={24} rounded="rounded-md" />
              </div>
              <div className="flex gap-3">
                <Skeleton height={32} className="flex-1 rounded-xl" />
                <Skeleton height={32} className="flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div ref={cardsRef} className="space-y-4">
          {summaries.map(summary => (
            <div key={summary.coach.id} className="payroll-card">
              <CoachPayrollCard
                summary={summary}
                verifyAttendance={verifyAttendance}
                coachNameMap={Object.fromEntries(coaches.map(c => [c.id, c.name]))}
                onVerified={loadPayroll}
              />
            </div>
          ))}
        </div>
      )}

      {/* Summary card */}
      {!loading && summaries.length > 0 && (
        <SummaryCard summaries={summaries} month={selectedLabel} />
      )}
    </div>
  )
}
