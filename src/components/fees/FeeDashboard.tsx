import { useRef, useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  AlertTriangle, Clock, CheckCircle2, Users,
  IndianRupee, TrendingUp, Search,
} from 'lucide-react'
import { gsap } from '../../lib/animations'
import { useStudents } from '../../hooks/useStudents'
import { usePayments } from '../../hooks/usePayments'
import { FeeCard } from './FeeCard'
import { PaymentForm } from './PaymentForm'
import { PaymentList, PaymentListSkeleton, PaymentEmptyState } from './PaymentHistory'
import { Skeleton } from '../ui/Skeleton'
import { cn, formatCurrency } from '../../lib/utils'
import type { StudentWithFee } from '../../hooks/useStudents'
import type { FeeStatus } from '../../types/index'

// ─── Fee status groups ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FeeStatus, {
  label: string
  icon: React.ReactNode
  color: string
  accent: string
  emptyMsg: string
}> = {
  overdue: {
    label:    'Overdue',
    icon:     <AlertTriangle size={14} />,
    color:    'text-danger',
    accent:   'rgba(255,61,87,0.2)',
    emptyMsg: 'No overdue fees',
  },
  due_today: {
    label:    'Due Today',
    icon:     <Clock size={14} />,
    color:    'text-amber',
    accent:   'rgba(255,184,0,0.15)',
    emptyMsg: 'None due today',
  },
  due_soon: {
    label:    'Due Soon',
    icon:     <Clock size={14} />,
    color:    'text-amber',
    accent:   'rgba(255,184,0,0.10)',
    emptyMsg: 'None due in 3 days',
  },
  paid: {
    label:    'Paid',
    icon:     <CheckCircle2 size={14} />,
    color:    'text-grass',
    accent:   'rgba(0,255,135,0.08)',
    emptyMsg: 'No one has paid yet',
  },
}

type TabView = 'action' | 'paid' | 'history'

// ─── Stat card ────────────────────────────────────────────────────────────────

function FeeStat({ icon, label, value, sub, colorClass }: {
  icon:       React.ReactNode
  label:      string
  value:      string
  sub?:       string
  colorClass: string
}) {
  return (
    <div data-stat className="glass rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
             style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className={colorClass}>{icon}</span>
        </div>
        <span className="font-body text-xs text-slate-400">{label}</span>
      </div>
      <p className={cn('font-display text-2xl leading-none', colorClass)}>{value}</p>
      {sub && <p className="font-body text-[11px] text-slate-500">{sub}</p>}
    </div>
  )
}

// ─── Student group section ────────────────────────────────────────────────────

function StatusSection({
  status, students, onRecordPay,
}: {
  status:      FeeStatus
  students:    StudentWithFee[]
  onRecordPay: (s: StudentWithFee) => void
}) {
  const cfg = STATUS_CONFIG[status]
  if (!students.length) return null

  return (
    <div data-section>
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-widest', cfg.color)}>
          {cfg.icon}
          {cfg.label}
        </span>
        <span
          className="font-display text-[11px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: cfg.accent, color: 'rgba(255,255,255,0.7)' }}
        >
          {students.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" data-feecard-grid>
        {students.map(s => (
          <FeeCard
            key={s.id}
            student={s}
            onRecordPay={onRecordPay}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function FeeDashboard() {
  const statsRef    = useRef<HTMLDivElement>(null)
  const contentRef  = useRef<HTMLDivElement>(null)

  const { students, isLoading: studentsLoading, error: studentsError, refetch: refetchStudents } = useStudents()
  const { payments, isLoading: paymentsLoading, error: paymentsError, addPayment } = usePayments()

  const [activeTab,      setActiveTab]      = useState<TabView>('action')
  const [searchQuery,    setSearchQuery]    = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentWithFee | null>(null)
  const [formOpen,       setFormOpen]       = useState(false)

  const isLoading = studentsLoading || paymentsLoading
  const error     = studentsError   || paymentsError

  // GSAP stat entrance
  useEffect(() => {
    if (!isLoading && statsRef.current) {
      gsap.fromTo(
        statsRef.current.querySelectorAll('[data-stat]'),
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' },
      )
    }
  }, [isLoading])

  // GSAP card entrance on tab change — stagger individual fee cards
  useEffect(() => {
    if (!isLoading && contentRef.current) {
      const targets = contentRef.current.querySelectorAll('[data-feecard-grid] > *, [data-card-row]')
      gsap.fromTo(
        targets,
        { opacity: 0, y: 24, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.7)', clearProps: 'all' },
      )
    }
  }, [isLoading, activeTab])

  // Computed stats
  const activeStudents = useMemo(() =>
    students.filter(s => s.status === 'active'), [students])

  const overdueStudents  = useMemo(() => activeStudents.filter(s => s.feeStatus === 'overdue').sort((a, b) => b.daysOverdue - a.daysOverdue), [activeStudents])
  const dueTodayStudents = useMemo(() => activeStudents.filter(s => s.feeStatus === 'due_today'), [activeStudents])
  const dueSoonStudents  = useMemo(() => activeStudents.filter(s => s.feeStatus === 'due_soon'),  [activeStudents])
  const paidStudents     = useMemo(() => activeStudents.filter(s => s.feeStatus === 'paid'),      [activeStudents])

  const pendingCount    = overdueStudents.length + dueTodayStudents.length
  const pendingAmount   = [...overdueStudents, ...dueTodayStudents].reduce((s, st) => s + st.monthly_fee, 0)
  const collectedAmount = payments.reduce((s, p) => s + p.amount, 0)

  // Build student name map for payment history
  const studentNameMap = useMemo(() =>
    Object.fromEntries(students.map(s => [s.id, s.name])), [students])

  // Search filter for "All" views
  const filterStudents = (list: StudentWithFee[]) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.parent_name ?? '').toLowerCase().includes(q)
    )
  }

  const handleRecordPay = (student: StudentWithFee) => {
    setSelectedStudent(student)
    setFormOpen(true)
  }

  const handleSavePayment = async (data: Parameters<typeof addPayment>[0]) => {
    await addPayment(data)
    refetchStudents()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <p className="font-body text-sm text-danger">{error}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">

        {/* ── Summary stats ───────────────────────────────────────────────────── */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 space-y-3">
                <Skeleton height={10} className="w-2/3" />
                <Skeleton height={28} className="w-1/2" />
                <Skeleton height={9}  className="w-1/3" />
              </div>
            ))
          ) : (
            <>
              <FeeStat
                icon={<AlertTriangle size={14} />}
                label="Pending / Overdue"
                value={String(pendingCount)}
                sub={pendingCount === 1 ? 'student' : 'students'}
                colorClass={pendingCount > 0 ? 'text-danger' : 'text-grass'}
              />
              <FeeStat
                icon={<IndianRupee size={14} />}
                label="Pending Amount"
                value={formatCurrency(pendingAmount)}
                sub="this month"
                colorClass={pendingAmount > 0 ? 'text-amber' : 'text-grass'}
              />
              <FeeStat
                icon={<TrendingUp size={14} />}
                label="Collected"
                value={formatCurrency(collectedAmount)}
                sub={format(new Date(), 'MMMM yyyy')}
                colorClass="text-grass"
              />
              <FeeStat
                icon={<Users size={14} />}
                label="Paid"
                value={`${paidStudents.length}/${activeStudents.length}`}
                sub="active students"
                colorClass={paidStudents.length === activeStudents.length ? 'text-grass' : 'text-white'}
              />
            </>
          )}
        </div>

        {/* ── Tabs + search ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {([
              { id: 'action',  label: 'Action Required', count: pendingCount + dueSoonStudents.length },
              { id: 'paid',    label: 'Paid',             count: paidStudents.length },
              { id: 'history', label: 'This Month',       count: payments.length },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-body text-sm font-semibold transition-all duration-150',
                  activeTab === tab.id
                    ? 'text-pitch bg-grass shadow-[0_0_16px_rgba(0,255,135,0.25)]'
                    : 'text-slate-400 glass glass-hover hover:text-white',
                ].join(' ')}
              >
                {tab.label}
                {!isLoading && tab.count > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none',
                    activeTab === tab.id
                      ? 'bg-pitch/20 text-pitch'
                      : 'bg-white/10 text-slate-400',
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search — visible on student tabs */}
          {activeTab !== 'history' && (
            <div className="relative ml-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search student…"
                className="pl-8 pr-4 py-2 rounded-xl font-body text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-grass/30 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', width: 200 }}
              />
            </div>
          )}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────────── */}
        <div ref={contentRef} className="space-y-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : activeTab === 'action' ? (
            // Overdue + Due Today + Due Soon grouped sections
            overdueStudents.length + dueTodayStudents.length + dueSoonStudents.length === 0 ? (
              <AllPaidState />
            ) : (
              <>
                <StatusSection status="overdue"    students={filterStudents(overdueStudents)}  onRecordPay={handleRecordPay} />
                <StatusSection status="due_today"  students={filterStudents(dueTodayStudents)} onRecordPay={handleRecordPay} />
                <StatusSection status="due_soon"   students={filterStudents(dueSoonStudents)}  onRecordPay={handleRecordPay} />
              </>
            )
          ) : activeTab === 'paid' ? (
            // Paid students
            paidStudents.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <p className="font-body text-sm text-slate-500">No students have paid yet this month</p>
              </div>
            ) : (
              <div data-section>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" data-feecard-grid>
                  {filterStudents(paidStudents).map(s => (
                    <FeeCard
                      key={s.id}
                      student={s}
                      onRecordPay={handleRecordPay}
                    />
                  ))}
                </div>
              </div>
            )
          ) : (
            // Payment history
            <div data-card-row className="glass rounded-2xl p-5">
              <h3 className="font-display text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Payments — {format(new Date(), 'MMMM yyyy')}
              </h3>
              {paymentsLoading ? (
                <PaymentListSkeleton />
              ) : payments.length === 0 ? (
                <PaymentEmptyState />
              ) : (
                <PaymentList payments={payments} studentNames={studentNameMap} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment form drawer ──────────────────────────────────────────────── */}
      <PaymentForm
        student={selectedStudent}
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setSelectedStudent(null) }}
        onSave={handleSavePayment}
      />
    </>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Skeleton height={10} className="w-20" />
        <Skeleton width={24} height={20} rounded="rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton width={32} height={32} rounded="rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton height={12} className="w-2/5" />
                <Skeleton height={10} className="w-1/4" />
              </div>
              <Skeleton width={64} height={20} rounded="rounded-md" />
            </div>
            <Skeleton height={10} className="w-1/3" />
            <div className="flex gap-2">
              <Skeleton height={32} className="flex-1 rounded-xl" />
              <Skeleton height={32} className="flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── All-paid celebration state ───────────────────────────────────────────────

function AllPaidState() {
  return (
    <div className="glass rounded-2xl p-12 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full flex items-center justify-center"
           style={{ background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.25)' }}>
        <CheckCircle2 size={28} className="text-grass" />
      </div>
      <p className="font-display text-xl text-grass uppercase tracking-widest">All caught up!</p>
      <p className="font-body text-sm text-slate-400">No pending or overdue fees this month.</p>
    </div>
  )
}
