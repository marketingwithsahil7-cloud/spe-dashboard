import { forwardRef, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant
  size?:      Size
  loading?:   boolean
  icon?:      React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<Variant, { base: string; hover: string }> = {
  primary: {
    base:  'bg-grass text-pitch font-semibold border border-transparent btn-burst',
    hover: 'hover:bg-grassDim',
  },
  secondary: {
    base:  'text-white border font-medium',
    hover: 'hover:text-grass hover:border-grass/30 hover:bg-grass/[0.06] hover:shadow-[0_0_16px_rgba(0,255,135,0.15)]',
  },
  danger: {
    base:  'text-danger border border-danger/30 bg-danger/[0.06] font-medium',
    hover: 'hover:bg-danger/[0.12] hover:border-danger/50 hover:shadow-[0_0_16px_rgba(255,61,87,0.2)]',
  },
  ghost: {
    base:  'text-slate-400 border border-transparent font-medium',
    hover: 'hover:text-white hover:bg-white/[0.05]',
  },
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8  px-3 text-xs  gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm  gap-2   rounded-xl',
  lg: 'h-12 px-5 text-sm  gap-2   rounded-xl',
}

// Hover/tap scale config per variant
const motionConfig = {
  primary:   { hover: 1.03, tap: 0.96 },
  secondary: { hover: 1.02, tap: 0.97 },
  danger:    { hover: 1.02, tap: 0.97 },
  ghost:     { hover: 1.00, tap: 0.97 },
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size    = 'md',
      loading = false,
      icon,
      fullWidth = false,
      disabled,
      children,
      className,
      onPointerDown,
      ...props
    },
    ref
  ) => {
    const { base, hover } = variantStyles[variant]
    const { hover: hoverScale, tap: tapScale } = motionConfig[variant]
    const isDisabled = disabled || loading
    const innerRef = useRef<HTMLButtonElement>(null)

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e)
      const btn = (ref as React.RefObject<HTMLButtonElement>)?.current ?? innerRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const ripple = document.createElement('span')
      const sz = Math.max(rect.width, rect.height) * 2
      ripple.style.cssText = `
        position:absolute;pointer-events:none;border-radius:50%;
        width:${sz}px;height:${sz}px;
        left:${e.clientX - rect.left - sz / 2}px;
        top:${e.clientY - rect.top - sz / 2}px;
        background:rgba(255,255,255,0.15);
        transform:scale(0);animation:rippleExpand 0.5s ease-out forwards;
      `
      btn.style.position = 'relative'
      btn.style.overflow = 'hidden'
      btn.appendChild(ripple)
      setTimeout(() => ripple.remove(), 550)
    }, [ref, onPointerDown])

    return (
      <motion.button
        ref={ref ?? innerRef}
        disabled={isDisabled}
        data-magnetic={variant === 'primary' ? '' : undefined}
        onPointerDown={handlePointerDown}
        whileHover={isDisabled ? {} : { scale: hoverScale }}
        whileTap={isDisabled   ? {} : { scale: tapScale  }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className={cn(
          'inline-flex items-center justify-center font-body transition-colors duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          variant === 'secondary' && 'bg-white/[0.04] border-white/[0.08] backdrop-blur-[24px]',
          base,
          hover,
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
