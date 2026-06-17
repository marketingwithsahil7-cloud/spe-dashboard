import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/animations'

interface ToggleProps {
  checked:   boolean
  onChange:  (checked: boolean) => void
  disabled?: boolean
  label?:    string
  id?:       string
}

export function Toggle({ checked, onChange, disabled = false, label, id }: ToggleProps) {
  const trackRef     = useRef<HTMLButtonElement>(null)
  const thumbRef     = useRef<HTMLSpanElement>(null)
  const isFirst      = useRef(true)

  // Sync visual state — no animation on first render
  useEffect(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return

    if (isFirst.current) {
      gsap.set(thumb, { x: checked ? 20 : 0 })
      gsap.set(track, { backgroundColor: checked ? '#00FF87' : '#475569' })
      isFirst.current = false
      return
    }

    // Thumb slides with a spring back.out
    gsap.to(thumb, { x: checked ? 20 : 0, duration: 0.3, ease: 'back.out(1.5)' })
    gsap.to(track, {
      backgroundColor: checked ? '#00FF87' : '#475569',
      duration: 0.25,
      ease: 'power2.inOut',
    })

    // Green glow pulse on activation
    if (checked) {
      gsap.timeline()
        .to(track, { boxShadow: '0 0 14px rgba(0,255,135,0.55)', duration: 0.15 })
        .to(track, { boxShadow: '0 0 0px rgba(0,255,135,0)',     duration: 0.2  })
    }
  }, [checked])

  function handleClick() {
    if (disabled) return

    // Scale 1→1.15→1 spring as specified
    gsap.fromTo(
      trackRef.current,
      { scale: 1 },
      { scale: 1.15, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut',
        onComplete: () => gsap.set(trackRef.current, { scale: 1 }) }
    )

    onChange(!checked)
  }

  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-2.5 select-none"
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <button
        ref={trackRef}
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className="relative inline-flex h-6 w-11 rounded-full shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-grass/50 focus-visible:ring-offset-1 focus-visible:ring-offset-pitch"
        style={{ opacity: disabled ? 0.45 : 1 }}
      >
        <span
          ref={thumbRef}
          aria-hidden="true"
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </button>

      {label && (
        <span className={`text-sm font-body ${disabled ? 'text-slate-600' : 'text-slate-300'}`}>
          {label}
        </span>
      )}
    </label>
  )
}

export type { ToggleProps }
