import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Plus, Users, ChevronDown } from 'lucide-react'
import { StudentCard } from './StudentCard'
import { SkeletonCard } from '../ui/Skeleton'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { usePermissions } from '../../hooks/usePermissions'
import { getAgeCategory, AGE_CATEGORIES } from '../../lib/ageCategories'
import type { AgeCategory } from '../../lib/ageCategories'
import type { StudentWithFee } from '../../hooks/useStudents'
import type { BatchType, StudentStatus } from '../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'join_date' | 'fee_status'

const BATCH_TABS: Array<BatchType | 'All'> = ['All', '5-6 PM', '6-7 PM', 'Both']
const AGE_TABS: Array<AgeCategory | 'All'> = ['All', ...AGE_CATEGORIES]
const STATUS_OPTIONS: Array<{ value: StudentStatus | 'All'; label: string }> = [
  { value: 'All',    label: 'All Status' },
  { value: 'active', label: 'Active'     },
  { value: 'trial',  label: 'Trial'      },
  { value: 'closed', label: 'Closed'     },
]
const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'name',       label: 'Name A–Z'   },
  { value: 'join_date',  label: 'Join Date'  },
  { value: 'fee_status', label: 'Fee Status' },
]

const FEE_STATUS_ORDER = { overdue: 0, due_today: 1, due_soon: 2, paid: 3 } as const

interface StudentListProps {
  students:  StudentWithFee[]
  isLoading: boolean
  error:     string | null
  onAdd:     () => void
  onEdit:    (student: StudentWithFee) => void
  onDelete?: (student: StudentWithFee) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortStudents(list: StudentWithFee[], by: SortKey): StudentWithFee[] {
  return [...list].sort((a, b) => {
    if (by === 'name')       return a.name.localeCompare(b.name)
    if (by === 'join_date')  return new Date(b.join_date ?? 0).getTime() - new Date(a.join_date ?? 0).getTime()
    if (by === 'fee_status') return FEE_STATUS_ORDER[a.feeStatus] - FEE_STATUS_ORDER[b.feeStatus]
    return 0
  })
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="col-span-full flex flex-col items-center justify-center py-20 gap-4"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Users size={28} className="text-slate-500" />
      </div>
      <div className="text-center">
        <p className="font-display text-base font-semibold text-white">No students found</p>
        <p className="font-body text-sm text-slate-500 mt-1">
          {hasFilters ? 'Try adjusting your filters or search.' : 'Add your first student to get started.'}
        </p>
      </div>
      {hasFilters && (
        <Button variant="secondary" size="sm" icon={<X size={13} />} onClick={onClear}>
          Clear filters
        </Button>
      )}
    </motion.div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function StudentList({ students, isLoading, error, onAdd, onEdit, onDelete }: StudentListProps) {
  const [query,        setQuery]        = useState('')
  const [debouncedQ,   setDebouncedQ]   = useState('')
  const [batchFilter,  setBatchFilter]  = useState<BatchType | 'All'>('All')
  const [ageFilter,    setAgeFilter]    = useState<AgeCategory | 'All'>('All')
  const { canAddStudent } = usePermissions()
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'All'>('All')
  const [sortBy,       setSortBy]       = useState<SortKey>('name')

  // 300 ms debounce on search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const filtered = useMemo(() => {
    let list = students

    if (debouncedQ.trim()) {
      const q = debouncedQ.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.parent_name  ?? '').toLowerCase().includes(q) ||
        (s.parent_phone ?? '').includes(q),
      )
    }
    if (batchFilter  !== 'All') list = list.filter(s => s.batch  === batchFilter)
    if (statusFilter !== 'All') list = list.filter(s => s.status === statusFilter)
    if (ageFilter    !== 'All') list = list.filter(s => getAgeCategory(s.dob) === ageFilter)

    return sortStudents(list, sortBy)
  }, [students, debouncedQ, batchFilter, statusFilter, ageFilter, sortBy])

  const hasFilters = !!debouncedQ || batchFilter !== 'All' || statusFilter !== 'All' || ageFilter !== 'All'

  // Key changes when any filter changes → remounts cards → re-triggers entrance animation
  const gridKey = `${debouncedQ}|${batchFilter}|${statusFilter}|${ageFilter}|${sortBy}`

  const clearFilters = () => {
    setQuery('')
    setBatchFilter('All')
    setStatusFilter('All')
    setAgeFilter('All')
    setSortBy('name')
  }

  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Row 1: search (full width) — count badge embedded on right */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search size={15} className="text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search students, parents, phones…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={cn(
              'w-full h-11 pl-10 pr-24 rounded-xl font-body text-sm text-white placeholder:text-slate-600',
              'outline-none transition-all duration-200',
              'focus:shadow-[0_0_0_3px_rgba(0,255,135,0.06)]',
            )}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onFocus={e => {
              e.currentTarget.style.border = '1px solid rgba(0,255,135,0.35)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
            onBlur={e => {
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            }}
          />
          {/* Count badge + optional clear button — right side of search */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                className="text-slate-500 hover:text-white transition-colors"
                onClick={() => setQuery('')}
              >
                <X size={14} />
              </button>
            )}
            <div
              className="h-6 px-2 rounded-lg flex items-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <span className="font-display font-semibold text-white text-xs leading-none">
                {isLoading ? '—' : filtered.length}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: batch tabs — horizontally scrollable on mobile */}
        <div className="overflow-x-auto scrollbar-none">
          <div
            className="flex items-center gap-1 p-1 rounded-xl w-max"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {BATCH_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setBatchFilter(tab)}
                className={cn(
                  'h-8 px-3 rounded-lg font-body text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  batchFilter === tab
                    ? 'bg-grass text-pitch font-semibold shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                    : 'text-slate-400 hover:text-white',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2b: age category tabs */}
        <div className="overflow-x-auto scrollbar-none">
          <div
            className="flex items-center gap-1 p-1 rounded-xl w-max"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {AGE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setAgeFilter(tab)}
                className={cn(
                  'h-8 px-3 rounded-lg font-body text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  ageFilter === tab
                    ? 'text-pitch font-semibold shadow-[0_0_12px_rgba(0,212,255,0.25)]'
                    : 'text-slate-400 hover:text-white',
                )}
                style={ageFilter === tab ? { background: '#00D4FF' } : undefined}
              >
                {tab === 'All' ? 'All Ages' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: status filter + sort — each takes 50% on mobile */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StudentStatus | 'All')}
              className="w-full h-10 pl-3 pr-8 rounded-xl font-body text-xs text-slate-300 appearance-none outline-none cursor-pointer transition-colors duration-200 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#12121A' }}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="w-full h-10 pl-3 pr-8 rounded-xl font-body text-xs text-slate-300 appearance-none outline-none cursor-pointer transition-colors duration-200 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#12121A' }}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Error state ─────────────────────────────────────────────────── */}
      {error && (
        <div
          className="glass p-4 text-center"
          style={{ border: '1px solid rgba(255,61,87,0.3)' }}
        >
          <p className="font-body text-sm text-danger">{error}</p>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div key={gridKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            filtered.map((s, i) => (
              <StudentCard
                key={s.id}
                student={s}
                index={i}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}

      {/* ── FAB — add student (head coach only) ──────────────────────────── */}
      {canAddStudent && (
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.93 }}
          data-magnetic
          onClick={onAdd}
          className="fixed bottom-6 right-5 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-grass flex items-center justify-center glow-green shadow-[0_0_32px_rgba(0,255,135,0.45)] transition-shadow"
          aria-label="Add student"
        >
          <Plus size={24} className="text-pitch font-bold" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  )
}
