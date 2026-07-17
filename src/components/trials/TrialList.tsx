import { useRef, useEffect, useState, useMemo } from 'react'
import { Users, Clock, CheckCircle2, MessageSquareX, Plus, Search } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { useTrials } from '../../hooks/useTrials'
import { TrialCard } from './TrialCard'
import { TrialForm } from './TrialForm'
import { TrialResolve } from './TrialResolve'
import { Skeleton } from '../ui/Skeleton'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useToast } from '../ui/Toast'
import { cn } from '../../lib/utils'
import type { Trial } from '../../types/index'

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabView = 'pending' | 'no_response' | 'closed' | 'not_closed' | 'all'

const TABS: { id: TabView; label: string }[] = [
  { id: 'pending',     label: 'Pending'     },
  { id: 'no_response', label: 'No Response' },
  { id: 'closed',      label: 'Joined'      },
  { id: 'not_closed',  label: 'Not Joined'  },
  { id: 'all',         label: 'All'         },
]

// ─── Stat card ────────────────────────────────────────────────────────────────

function TrialStat({ icon, label, value, colorClass }: {
  icon:       React.ReactNode
  label:      string
  value:      number
  colorClass: string
}) {
  return (
    <div data-stat className="glass rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className={colorClass}>{icon}</span>
        </div>
        <span className="font-body text-xs text-slate-400">{label}</span>
      </div>
      <p className={cn('font-display text-3xl leading-none', colorClass)}>{value}</p>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton width={40} height={40} rounded="rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton height={12} className="w-2/5" />
              <Skeleton height={10} className="w-1/3" />
            </div>
            <Skeleton width={60} height={20} rounded="rounded-md" />
          </div>
          <Skeleton height={10} className="w-1/2" />
          <div className="flex gap-2">
            <Skeleton height={32} className="flex-1 rounded-xl" />
            <Skeleton height={32} className="flex-1 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EMPTY_MSGS: Record<TabView, { emoji: string; text: string }> = {
  pending:     { emoji: '✅', text: 'No pending trials — all followed up!' },
  no_response: { emoji: '📞', text: 'No trials without a response' },
  closed:      { emoji: '🏆', text: 'No joined trials yet' },
  not_closed:  { emoji: '👋', text: 'No trials marked as not joined' },
  all:         { emoji: '🎯', text: 'No trials recorded yet. Add your first trial!' },
}

function EmptyState({ tab }: { tab: TabView }) {
  const { emoji, text } = EMPTY_MSGS[tab]
  return (
    <div className="glass rounded-2xl p-12 text-center flex flex-col items-center gap-3">
      <span className="text-4xl">{emoji}</span>
      <p className="font-body text-sm text-slate-400">{text}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrialList() {
  const statsRef = useRef<HTMLDivElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  const { trials, isLoading, error, addTrial, resolveTrial, convertToStudent, deleteTrial, refetch } = useTrials()
  const toast = useToast()

  const [activeTab,     setActiveTab]     = useState<TabView>('pending')
  const [searchQuery,   setSearchQuery]   = useState('')
  const [formOpen,      setFormOpen]      = useState(false)
  const [resolveTarget, setResolveTarget] = useState<Trial | null>(null)
  const [resolveOpen,   setResolveOpen]   = useState(false)
  const [deleteTarget,  setDeleteTarget]  = useState<Trial | null>(null)
  const [deleting,      setDeleting]      = useState(false)

  // Per-status counts
  const tabCounts = useMemo((): Record<TabView, number> => ({
    all:         trials.length,
    pending:     trials.filter(t => t.status === 'pending').length,
    no_response: trials.filter(t => t.status === 'no_response').length,
    closed:      trials.filter(t => t.status === 'closed').length,
    not_closed:  trials.filter(t => t.status === 'not_closed').length,
  }), [trials])

  // Filtered list for current tab + search
  const visibleTrials = useMemo(() => {
    const list = activeTab === 'all'
      ? trials
      : trials.filter(t => t.status === activeTab)

    const q = searchQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.parent_name  ?? '').toLowerCase().includes(q) ||
      (t.parent_phone ?? '').includes(q),
    )
  }, [trials, activeTab, searchQuery])

  // GSAP stat entrance on load
  useEffect(() => {
    if (!isLoading && statsRef.current) {
      gsap.fromTo(
        statsRef.current.querySelectorAll('[data-stat]'),
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: 'back.out(1.2)', clearProps: 'all' },
      )
    }
  }, [isLoading])

  // GSAP card stagger on tab change or list update
  useEffect(() => {
    if (isLoading || !listRef.current) return
    const cards = listRef.current.querySelectorAll<HTMLElement>('.trial-card')
    if (cards.length === 0) return
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.7)', clearProps: 'all' },
    )
  }, [isLoading, activeTab, visibleTrials.length])

  const handleResolve = (trial: Trial) => {
    setResolveTarget(trial)
    setResolveOpen(true)
  }

  const handleResolveClose = () => {
    setResolveOpen(false)
    setResolveTarget(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTrial(deleteTarget.id)
      toast.success(`${deleteTarget.name}'s trial entry deleted`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete trial')
    } finally {
      setDeleting(false)
    }
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-3">
        <p className="font-body text-sm text-danger">{error}</p>
        <button onClick={refetch} className="font-body text-xs text-grass underline">
          Retry
        </button>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6">

        {/* ── Summary stats ─────────────────────────────────────────────────── */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 space-y-3">
                <Skeleton height={10} className="w-2/3" />
                <Skeleton height={28} className="w-1/3" />
              </div>
            ))
          ) : (
            <>
              <TrialStat
                icon={<Users size={14} />}
                label="Total Trials"
                value={tabCounts.all}
                colorClass="text-white"
              />
              <TrialStat
                icon={<Clock size={14} />}
                label="Pending"
                value={tabCounts.pending}
                colorClass={tabCounts.pending > 0 ? 'text-amber' : 'text-grass'}
              />
              <TrialStat
                icon={<CheckCircle2 size={14} />}
                label="Joined"
                value={tabCounts.closed}
                colorClass="text-grass"
              />
              <TrialStat
                icon={<MessageSquareX size={14} />}
                label="No Response"
                value={tabCounts.no_response}
                colorClass={tabCounts.no_response > 0 ? 'text-slate-400' : 'text-grass'}
              />
            </>
          )}
        </div>

        {/* ── Tabs + search ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Row 2: filter tabs — horizontally scrollable on mobile */}
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 w-max">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-body text-sm font-semibold transition-all duration-150 whitespace-nowrap',
                    activeTab === tab.id
                      ? 'text-pitch bg-grass shadow-[0_0_16px_rgba(0,255,135,0.25)]'
                      : 'text-slate-400 glass glass-hover hover:text-white',
                  ].join(' ')}
                >
                  {tab.label}
                  {!isLoading && tabCounts[tab.id] > 0 && (
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none',
                      activeTab === tab.id
                        ? 'bg-pitch/20 text-pitch'
                        : 'bg-white/10 text-slate-400',
                    )}>
                      {tabCounts[tab.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: search — full width */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search trials…"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl font-body text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-grass/30 transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border:     '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>
        </div>

        {/* ── Card grid ─────────────────────────────────────────────────────── */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : visibleTrials.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div
            ref={listRef}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {visibleTrials.map(trial => (
              <TrialCard
                key={trial.id}
                trial={trial}
                onResolve={handleResolve}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB — Add Trial (all coaches) ────────────────────────────────────── */}
      <button
        onClick={() => setFormOpen(true)}
        data-magnetic
        className="fixed bottom-6 right-5 md:bottom-8 md:right-8 z-30 w-14 h-14 rounded-full flex items-center justify-center shadow-lg glow-green transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #00FF87 0%, #00D4FF 100%)' }}
        aria-label="Add trial"
      >
        <Plus size={22} className="text-pitch" strokeWidth={2.5} />
      </button>

      {/* ── Drawers ───────────────────────────────────────────────────────────── */}
      <TrialForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={async (data) => { await addTrial(data) }}
      />

      <TrialResolve
        trial={resolveTarget}
        isOpen={resolveOpen}
        onClose={handleResolveClose}
        onResolve={resolveTrial}
        onConvert={convertToStudent}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this trial entry?"
        description="Are you sure you want to delete this trial entry? This cannot be undone."
        confirmLabel="Delete Trial"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
