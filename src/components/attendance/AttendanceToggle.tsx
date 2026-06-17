import { useRef, useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { cn } from '../../lib/utils'

interface AttendanceToggleProps {
  present:   boolean
  onChange:  (present: boolean) => Promise<void>
  disabled?: boolean
  className?: string
}

export function AttendanceToggle({ present, onChange, disabled = false, className }: AttendanceToggleProps) {
  const btnRef   = useRef<HTMLButtonElement>(null)
  const [saving, setSaving] = useState(false)

  const handleClick = async () => {
    if (disabled || saving) return

    const next = !present
    const el   = btnRef.current
    if (!el) return

    // Spring scale
    gsap.timeline()
      .to(el, { scale: 1.15, duration: 0.12, ease: 'power2.out' })
      .to(el, { scale: 1,    duration: 0.22, ease: 'back.out(1.5)' })

    // Radial ripple — color matches the action
    const ripple = document.createElement('span')
    ripple.style.cssText = [
      'position:absolute',
      'border-radius:50%',
      'width:140%',
      'aspect-ratio:1/1',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%) scale(0)',
      'pointer-events:none',
      `background:${next ? 'rgba(0,255,135,0.35)' : 'rgba(255,61,87,0.35)'}`,
    ].join(';')
    el.appendChild(ripple)
    gsap.to(ripple, {
      scale: 2.2, opacity: 0, duration: 0.5, ease: 'power2.out',
      onComplete: () => ripple.remove(),
    })

    if (next) {
      // Green glow flash
      gsap.fromTo(
        el,
        { boxShadow: '0 0 0px rgba(0,255,135,0)' },
        { boxShadow: '0 0 28px rgba(0,255,135,0.7)', duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' },
      )
    } else {
      // Shake on absent
      gsap.to(el, {
        keyframes: { x: [-5, 4, -3, 2, 0] },
        duration: 0.35, ease: 'none', clearProps: 'x',
      })
    }

    setSaving(true)
    try {
      await onChange(next)
    } finally {
      setSaving(false)
    }
  }

  const isPresent = present

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled || saving}
      aria-pressed={isPresent}
      aria-label={isPresent ? 'Mark absent' : 'Mark present'}
      className={cn(
        'relative overflow-hidden w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2',
        'font-body text-sm font-semibold transition-colors duration-200',
        'disabled:cursor-not-allowed will-change-transform',
        // Present: solid green
        isPresent && !disabled && 'text-pitch',
        isPresent && !disabled && 'shadow-[0_0_16px_rgba(0,255,135,0.35)]',
        // Absent: glass
        !isPresent && !disabled && 'text-danger',
        // Disabled (closed student)
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
      style={
        disabled
          ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }
          : isPresent
          ? { background: '#00FF87', border: '1px solid rgba(0,255,135,0.5)' }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,61,87,0.3)' }
      }
    >
      {saving ? (
        <Loader2
          size={16}
          className={cn('animate-spin', isPresent ? 'text-pitch' : 'text-slate-400')}
        />
      ) : isPresent ? (
        <Check size={16} strokeWidth={2.5} />
      ) : (
        <X size={16} strokeWidth={2.5} />
      )}

      {!saving && (
        <span className={isPresent ? 'text-pitch' : 'text-danger'}>
          {isPresent ? 'Present' : 'Absent'}
        </span>
      )}
    </button>
  )
}
