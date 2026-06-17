import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

type Glow = 'green' | 'amber' | 'red' | false

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?:  Glow
}

const glowStyles: Record<Exclude<Glow, false>, string> = {
  green: 'shadow-[0_0_20px_rgba(0,255,135,0.3),0_0_60px_rgba(0,255,135,0.1)]',
  amber: 'shadow-[0_0_20px_rgba(255,184,0,0.3),0_0_60px_rgba(255,184,0,0.1)]',
  red:   'shadow-[0_0_20px_rgba(255,61,87,0.4)]',
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, glow = false, className, children, onMouseMove, onMouseLeave, style, ...props }, ref) => {

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (window.matchMedia('(hover: none)').matches) { onMouseMove?.(e); return }
      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      const lx = (e.clientX - rect.left) / rect.width * 100
      const ly = (e.clientY - rect.top) / rect.height * 100
      el.style.transform = `perspective(1000px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) scale(1.02)`
      el.style.backgroundImage = `radial-gradient(circle at ${lx}% ${ly}%, rgba(0,255,135,0.07) 0%, transparent 55%)`
      onMouseMove?.(e)
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = ''
      e.currentTarget.style.backgroundImage = ''
      onMouseLeave?.(e)
    }

    return (
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ willChange: 'transform', transition: 'transform 0.1s ease', ...style }}
        className={cn(
          'glass',
          hover && 'transition-all duration-200 cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.12]',
          glow && glowStyles[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }
export type { CardProps }
