import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:     string
  error?:     string
  hint?:      string
  icon?:      React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 rounded-xl text-sm font-body text-white placeholder:text-slate-600',
              'outline-none transition-all duration-200',
              icon    ? 'pl-10 pr-4' : 'px-4',
              rightIcon ? 'pr-10'   : '',
              error
                ? 'border-danger/40 bg-danger/[0.04] focus:border-danger/60 focus:shadow-[0_0_0_3px_rgba(255,61,87,0.08)]'
                : 'focus:border-grass/35 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(0,255,135,0.06)]',
              className
            )}
            style={{
              background: error ? undefined : 'rgba(255,255,255,0.04)',
              border: `1px solid ${error ? 'rgba(255,61,87,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              {rightIcon}
            </span>
          )}
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

Input.displayName = 'Input'

export { Input }
export type { InputProps }
