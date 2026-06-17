import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string
  error?:   string
  hint?:    string
  options:  SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-11 rounded-xl text-sm font-body text-white appearance-none',
              'pl-4 pr-10 outline-none transition-all duration-200 cursor-pointer',
              error
                ? 'border-danger/40 bg-danger/[0.04] focus:border-danger/60'
                : 'focus:border-grass/35 focus:shadow-[0_0_0_3px_rgba(0,255,135,0.06)]',
              '[&>option]:bg-surface [&>option]:text-white',
              className
            )}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${error ? 'rgba(255,61,87,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={14}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
        </div>

        {error && (
          <p className="text-[11px] font-body text-danger flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-danger shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-[11px] font-body text-slate-500">{hint}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
export type { SelectOption, SelectProps }
