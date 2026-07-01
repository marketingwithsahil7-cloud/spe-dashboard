import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface MonthSelectorProps {
  value:    string  // 'yyyy-MM'
  onChange: (month: string) => void
  // Optional earliest selectable month ('yyyy-MM') — disables the left arrow
  // once reached. Omit for unbounded past (Fees page's default behavior).
  min?:     string
}

// Left/right month nav for the Fees page — mirrors AttendanceHistory's month nav
// styling. Right arrow disables once `value` reaches the current calendar month;
// coaches can view/record fees for the past, never the future.
export function MonthSelector({ value, onChange, min }: MonthSelectorProps) {
  const currentCycle = format(new Date(), 'yyyy-MM')
  const isCurrentMonth = value === currentCycle
  const isAtMin = min !== undefined && value <= min

  const goPrev = () => {
    if (isAtMin) return
    const d = subMonths(new Date(value + '-01T12:00:00'), 1)
    onChange(format(d, 'yyyy-MM'))
  }
  const goNext = () => {
    if (isCurrentMonth) return
    const d = addMonths(new Date(value + '-01T12:00:00'), 1)
    onChange(format(d, 'yyyy-MM'))
  }

  return (
    <div className="glass rounded-2xl px-3 py-2.5 flex items-center gap-2 w-fit">
      <button
        onClick={goPrev}
        disabled={isAtMin}
        className="w-8 h-8 rounded-lg glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-2 px-2 min-w-[150px] justify-center">
        <Calendar size={13} className="text-grass shrink-0" />
        <p className="font-display text-sm text-white tracking-wide whitespace-nowrap">
          {format(new Date(value + '-01T12:00:00'), 'MMMM yyyy')}
        </p>
      </div>

      <button
        onClick={goNext}
        disabled={isCurrentMonth}
        className="w-8 h-8 rounded-lg glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={() => onChange(currentCycle)}
          className="ml-1 font-body text-[11px] font-semibold text-grass/80 hover:text-grass px-2 py-1 rounded-lg transition-colors"
        >
          Today
        </button>
      )}
    </div>
  )
}
