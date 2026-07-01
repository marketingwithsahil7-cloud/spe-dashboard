import { useState, lazy, Suspense } from 'react'
import { format } from 'date-fns'
import { Users, CalendarDays } from 'lucide-react'
import { PageGlow } from '../components/ui/PageGlow'
const AmbientBackground = lazy(() => import('../components/ui/AmbientBackground'))
import { useCoaches } from '../hooks/useCoaches'
import { usePermissions } from '../hooks/usePermissions'
import { CoachList } from '../components/coaches/CoachList'
import { CoachAttendance } from '../components/coaches/CoachAttendance'
import { PayrollApproval } from '../components/coaches/PayrollApproval'
import { Skeleton } from '../components/ui/Skeleton'
import type { CoachWithStats } from '../hooks/useCoaches'

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'coaches' | 'attendance' | 'payroll'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachesPage() {
  const { canApprovePayroll } = usePermissions()

  const {
    coaches,
    isLoading,
    error,
    markCoachAttendance,
    confirmAttendance,
    disputeAttendance,
    verifyAttendance,
    ownerConfirmAttendance,
    refetch,
  } = useCoaches()

  // Assistants only ever see the Attendance tab (their personal stats now
  // live on the dashboard) — head/owner get the full Coaches/Attendance/Payroll set.
  const [activeTab, setActiveTab] = useState<TabId>(canApprovePayroll ? 'coaches' : 'attendance')

  const TABS: { id: TabId; label: string }[] = canApprovePayroll
    ? [
        { id: 'coaches',    label: 'Coaches' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'payroll',    label: 'Payroll' },
      ]
    : [
        { id: 'attendance', label: 'Attendance' },
      ]

  const totalSessions = coaches.reduce((sum, c) => sum + c.sessionsThisMonth, 0)

  // Switch to attendance tab when "View Attendance" is clicked on a coach card
  function handleViewAttendance(_coach: CoachWithStats) {
    setActiveTab('attendance')
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-3">
          <p className="font-body text-sm text-danger">{error}</p>
          <button onClick={refetch} className="font-body text-xs text-grass underline">Retry</button>
        </div>
    )
  }

  return (
    <div className="relative">
      <PageGlow variant="slate" />
      <Suspense fallback={null}><AmbientBackground variant="coaches" /></Suspense>
      <div className="space-y-6">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
              Coaches
            </h1>
            <p className="font-body text-sm text-slate-400 mt-1">
              {format(new Date(), 'MMMM yyyy')}
            </p>
          </div>

          {/* Quick stats */}
          <div
            className="flex items-center gap-5 px-5 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-grass" />
              <div>
                {isLoading
                  ? <Skeleton height={18} className="w-10" />
                  : <p className="font-display text-lg font-bold text-white leading-none">{totalSessions}</p>
                }
                <p className="font-body text-[10px] text-slate-500">sessions</p>
              </div>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex items-center gap-2">
              <Users size={14} className="text-ice" />
              <div>
                {isLoading
                  ? <Skeleton height={18} className="w-6" />
                  : <p className="font-display text-lg font-bold text-white leading-none">{coaches.length}</p>
                }
                <p className="font-body text-[10px] text-slate-500">coaches</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs (only shown when there's a choice to make) ─────────────────── */}
        {TABS.length > 1 && (
          <div className="flex items-center gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all duration-150',
                  activeTab === tab.id
                    ? 'text-pitch bg-grass shadow-[0_0_16px_rgba(0,255,135,0.25)]'
                    : 'text-slate-400 glass glass-hover hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Tab content ───────────────────────────────────────────────────── */}
        {activeTab === 'coaches' && (
          <CoachList coaches={coaches} isLoading={isLoading} onViewAttendance={handleViewAttendance} />
        )}

        {activeTab === 'attendance' && (
          <CoachAttendance
            coaches={coaches}
            markCoachAttendance={markCoachAttendance}
            confirmAttendance={confirmAttendance}
            disputeAttendance={disputeAttendance}
            ownerConfirmAttendance={ownerConfirmAttendance}
          />
        )}

        {activeTab === 'payroll' && (
          <PayrollApproval coaches={coaches} verifyAttendance={verifyAttendance} />
        )}

      </div>
    </div>
  )
}
