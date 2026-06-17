import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Label,
} from 'recharts'
import { Skeleton } from '../ui/Skeleton'
import type { MonthlyRevenueTrend, BatchCount } from '../../hooks/useDashboard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartsProps {
  monthlyTrend: MonthlyRevenueTrend[]
  batchBreakdown: BatchCount[]
  totalStudents: number
  isLoading: boolean
}

// ─── Custom tooltip (glass card) ──────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface TooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function RevenueTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-4 py-3 rounded-xl font-body text-sm"
      style={{
        background: 'rgba(18,18,26,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map(entry => (
        <p key={entry.name} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

// ─── Donut centre label ───────────────────────────────────────────────────────

interface CenterLabelProps {
  viewBox?: { cx: number; cy: number }
  total: number
}

function CenterLabel({ viewBox, total }: CenterLabelProps) {
  const cx = viewBox?.cx ?? 0
  const cy = viewBox?.cy ?? 0
  return (
    <g>
      <text
        x={cx} y={cy - 8}
        textAnchor="middle"
        fill="#FFFFFF"
        style={{ fontSize: 26, fontFamily: 'Oswald', fontWeight: 600 }}
      >
        {total}
      </text>
      <text
        x={cx} y={cy + 12}
        textAnchor="middle"
        fill="#94A3B8"
        style={{ fontSize: 11, fontFamily: 'Inter' }}
      >
        students
      </text>
    </g>
  )
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function ChartsSkeleton() {
  return (
    <div className="glass p-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex flex-col gap-4">
        <Skeleton height={14} className="w-40" />
        <Skeleton height={180} className="rounded-xl" />
      </div>
      <div className="md:w-56 flex flex-col items-center gap-4">
        <Skeleton height={14} className="w-32" />
        <Skeleton height={160} width={160} rounded="rounded-full" />
        <Skeleton height={10} className="w-3/4" />
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

const Y_TICK  = { fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter' }
const X_TICK  = { fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter' }
const AXIS_LINE = { stroke: 'rgba(255,255,255,0.08)' }

function formatY(value: number): string {
  if (value === 0) return '₹0'
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
  return `₹${value}`
}

export function Charts({ monthlyTrend, batchBreakdown, totalStudents, isLoading }: ChartsProps) {
  if (isLoading) return <ChartsSkeleton />

  return (
    <div className="glass p-6">
      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Left: Revenue bar chart (60%) ─────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <h3 className="font-display text-base font-semibold text-white uppercase tracking-wide">
            Revenue Overview
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrend} barGap={4} barCategoryGap="35%">
              <XAxis
                dataKey="month"
                tick={X_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatY}
                tick={Y_TICK}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={<RevenueTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
              />
              <Bar
                dataKey="collected"
                name="Collected"
                fill="#00FF87"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationBegin={0}
              />
              <Bar
                dataKey="pending"
                name="Pending"
                fill="#FFB800"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationBegin={150}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Manual legend */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-grass" />
              <span className="font-body text-xs text-slate-400">Collected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber" />
              <span className="font-body text-xs text-slate-400">Pending</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-white/[0.06] self-stretch" />
        <div className="block md:hidden h-px bg-white/[0.06]" />

        {/* ── Right: Batch donut chart (40%) ────────────────────────────── */}
        <div className="md:w-56 flex flex-col items-center gap-3 shrink-0">
          <h3 className="font-display text-base font-semibold text-white uppercase tracking-wide self-start md:self-center">
            Batch Split
          </h3>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={batchBreakdown}
                dataKey="count"
                nameKey="batch"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={3}
                animationDuration={800}
                animationBegin={200}
              >
                {batchBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
                <Label
                  content={(props) => (
                    <CenterLabel
                      viewBox={props.viewBox as { cx: number; cy: number }}
                      total={totalStudents}
                    />
                  )}
                  position="center"
                />
              </Pie>
              <Tooltip
                formatter={(value: unknown, name: unknown) => [`${value} students`, String(name)]}
                contentStyle={{
                  background: 'rgba(18,18,26,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  fontFamily: 'Inter',
                  fontSize: 12,
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Batch legend */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            {batchBreakdown.map(entry => (
              <div key={entry.batch} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                <span className="font-body text-xs text-slate-400">{entry.batch}</span>
                <span className="font-display text-xs font-semibold text-white">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
