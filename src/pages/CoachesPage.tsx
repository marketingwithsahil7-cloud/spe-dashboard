import { useState, lazy, Suspense } from 'react'
import { format } from 'date-fns'
import { Users, Lock, CalendarDays } from 'lucide-react'
import { PageGlow } from '../components/ui/PageGlow'
const AmbientBackground = lazy(() => import('../components/ui/AmbientBackground'))
import { useCoaches } from '../hooks/useCoaches'
import { usePermissions } from '../hooks/usePermissions'
import { useAuthStore } from '../store/authStore'
import { CoachList } from '../components/coaches/CoachList'
import { CoachAttendance } from '../components/coaches/CoachAttendance'
import { PayrollApproval } from '../components/coaches/PayrollApproval'
import { MyCoachPanel } from '../components/coaches/MyCoachPanel'
import { Skeleton } from '../components/ui/Skeleton'
import { cn } from '../lib/utils'
import type { CoachWithStats } from '../hooks/useCoaches'

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'coaches' | 'attendance' | 'payroll'

// ─── Locked payroll placeholder ───────────────────────────────────────────────

function PayrollLocked() {
  return (
    <div className="glass rounded-2xl p-12 text-center flex flex-col items-center gap-4">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Lock size={24} className="text-slate-500" />
      </div>
      <div>
        <p className="font-display text-base text-white uppercase tracking-widest">Head Coach Only</p>
        <p className="font-body text-sm text-slate-500 mt-1">
          Payroll approval requires head coach permissions.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachesPage() {
  const { canApprovePayroll } = usePermissions()
  const { coach: myCoach } = useAuthStore()

  const {
    coaches,
    isLoading,
    error,
    markCoachAttendance,
    confirmAttendance,
    disputeAttendance,
    verifyAttendance,
    refetch,
  } = useCoaches()

  const [activeTab, setActiveTab] = useState<TabId>('coaches')

  // For assistant view — find logged-in coach's stats from the full list
  const myCoachWithStats = coaches.find(c => c.id === myCoach?.id) ?? null

  const TABS: { id: TabId; label: string; headOnly?: boolean }[] = [
    { id: 'coaches',    label: canApprovePayroll ? 'Coaches' : 'My Stats' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'payroll',    label: 'Payroll', headOnly: true },
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

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {TABS.map(tab => {
            const locked = tab.headOnly && !canApprovePayroll
            return (
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
                {locked && (
                  <Lock
                    size={11}
                    className={cn(activeTab === tab.id ? 'text-pitch' : 'text-slate-600')}
                  />
                )}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ───────────────────────────────────────────────────── */}
        {activeTab === 'coaches' && (
          canApprovePayroll
            ? <CoachList coaches={coaches} isLoading={isLoading} onViewAttendance={handleViewAttendance} />
            : <MyCoachPanel coach={myCoachWithStats} isLoading={isLoading} onGoToAttendance={() => setActiveTab('attendance')} />
        )}

        {activeTab === 'attendance' && (
          <CoachAttendance
            coaches={coaches}
            markCoachAttendance={markCoachAttendance}
            confirmAttendance={confirmAttendance}
            disputeAttendance={disputeAttendance}
          />
        )}

        {activeTab === 'payroll' && (
          canApprovePayroll
            ? <PayrollApproval coaches={coaches} verifyAttendance={verifyAttendance} />
            : <PayrollLocked />
        )}

      </div>
    </div>
  )
}
