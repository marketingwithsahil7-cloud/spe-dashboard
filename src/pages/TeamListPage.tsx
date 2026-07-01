import { useMemo } from 'react'
import { Users } from 'lucide-react'
import { useStudents } from '../hooks/useStudents'
import { getAgeCategory } from '../lib/ageCategories'
import { getBatchColor } from '../lib/utils'
import { Skeleton } from '../components/ui/Skeleton'
import type { StudentWithFee } from '../hooks/useStudents'

// ─── Grouping ─────────────────────────────────────────────────────────────────

type Bucket = 'U10' | 'U15' | 'OpenUnknown'

const BUCKET_CONFIG: Record<Bucket, { title: string; subtitle: string; accent: string }> = {
  U10:         { title: 'U10',                 subtitle: 'Under 10',           accent: '#00FF87' },
  U15:         { title: 'U15',                 subtitle: 'Under 15',           accent: '#00D4FF' },
  OpenUnknown: { title: 'Open / Age Unknown',  subtitle: '16+ or DOB not set', accent: '#FFB800' },
}

function groupByAgeCategory(students: StudentWithFee[]): Record<Bucket, StudentWithFee[]> {
  const grouped: Record<Bucket, StudentWithFee[]> = { U10: [], U15: [], OpenUnknown: [] }
  for (const s of students) {
    const cat = getAgeCategory(s.dob)
    if (cat === 'U10') grouped.U10.push(s)
    else if (cat === 'U15') grouped.U15.push(s)
    else grouped.OpenUnknown.push(s) // covers 'Open' (16+) and null (unknown DOB)
  }
  return grouped
}

// ─── Section ──────────────────────────────────────────────────────────────────

function TeamSection({ bucket, students }: { bucket: Bucket; students: StudentWithFee[] }) {
  const { title, subtitle, accent } = BUCKET_CONFIG[bucket]

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">{title}</h2>
          <p className="font-body text-xs text-slate-500">{subtitle}</p>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg font-display text-xs font-bold"
          style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          {students.length} player{students.length !== 1 ? 's' : ''}
        </span>
      </div>

      {students.length === 0 ? (
        <p className="font-body text-sm text-slate-500 py-4 text-center">No players in this category</p>
      ) : (
        <ol className="space-y-0">
          {students.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-3 py-2.5"
              style={i > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : undefined}
            >
              <span className="font-display text-xs text-slate-600 w-6 shrink-0 text-right">{i + 1}.</span>
              <span className="font-body text-sm text-white flex-1 truncate">{s.name}</span>
              <span className={`font-body text-xs font-semibold shrink-0 ${getBatchColor(s.batch)}`}>
                {s.batch}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamListPage() {
  const { students, isLoading, error, refetch, filterByStatus } = useStudents({ lite: true })

  const grouped = useMemo(
    () => groupByAgeCategory(filterByStatus('active')),
    [students, filterByStatus], // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (error) {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-3">
        <p className="font-body text-sm text-danger">{error}</p>
        <button onClick={refetch} className="font-body text-xs text-grass underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Users size={18} className="text-grass" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Team List</h1>
          <p className="font-body text-sm text-slate-400">Active players by age category</p>
        </div>
      </div>

      {/* ── Sections ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-3">
              <Skeleton height={20} className="w-32" />
              {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} height={14} className="w-full" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <TeamSection bucket="U10" students={grouped.U10} />
          <TeamSection bucket="U15" students={grouped.U15} />
          <TeamSection bucket="OpenUnknown" students={grouped.OpenUnknown} />
        </div>
      )}
    </div>
  )
}
