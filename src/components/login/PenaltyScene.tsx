import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { gsap } from '../../lib/animations'

// ─── Handle ───────────────────────────────────────────────────────────────────

export interface PenaltySceneHandle {
  triggerGoal: () => void
}

// ─── Static layout data ───────────────────────────────────────────────────────

const CONFETTI = [
  { color: '#00FF87', round: true  },
  { color: '#FFB800', round: false },
  { color: '#ffffff', round: true  },
  { color: '#00D4FF', round: false },
  { color: '#00FF87', round: false },
  { color: '#FFB800', round: true  },
  { color: '#FF3D57', round: false },
  { color: '#ffffff', round: true  },
]

const PARTICLES = [
  { left: '10%', top: '22%', size: 4, color: '#00FF87',  opacity: 0.35 },
  { left: '84%', top: '16%', size: 3, color: '#ffffff',  opacity: 0.25 },
  { left: '18%', top: '68%', size: 5, color: '#00FF87',  opacity: 0.30 },
  { left: '76%', top: '62%', size: 3, color: '#00D4FF',  opacity: 0.30 },
  { left: '5%',  top: '44%', size: 4, color: '#ffffff',  opacity: 0.20 },
  { left: '91%', top: '38%', size: 5, color: '#00FF87',  opacity: 0.35 },
  { left: '44%', top: '8%',  size: 3, color: '#FFB800',  opacity: 0.25 },
  { left: '56%', top: '82%', size: 4, color: '#ffffff',  opacity: 0.20 },
]

// ─── Component ────────────────────────────────────────────────────────────────

const PenaltyScene = forwardRef<PenaltySceneHandle, { onComplete: () => void }>(
  function PenaltyScene({ onComplete }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const ballRef      = useRef<HTMLDivElement>(null)
    const goalRef      = useRef<HTMLDivElement>(null)
    const goalTextRef  = useRef<HTMLDivElement>(null)
    const flashRef     = useRef<HTMLDivElement>(null)
    const confettiRefs = useRef<(HTMLDivElement | null)[]>([])
    const particleRefs = useRef<(HTMLDivElement | null)[]>([])
    const idleTweens   = useRef<gsap.core.Tween[]>([])
    const fired        = useRef(false)

    // Idle animations — ball bob + particle drift
    useEffect(() => {
      const bob = gsap.to(ballRef.current, {
        y: -8, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1,
      })
      idleTweens.current.push(bob)

      particleRefs.current.forEach((el, i) => {
        if (!el) return
        const t = gsap.to(el, {
          y: -(12 + i * 2),
          opacity: 0.12,
          duration: 1.4 + i * 0.18,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.22,
        })
        idleTweens.current.push(t)
      })

      return () => { idleTweens.current.forEach(t => t.kill()) }
    }, [])

    const runKickAnimation = useCallback(() => {
      if (fired.current) return
      fired.current = true

      idleTweens.current.forEach(t => t.kill())
      idleTweens.current = []

      const tl = gsap.timeline()

      // Windup pulse
      tl.to(ballRef.current, { scale: 1.3, duration: 0.08, ease: 'back.out(2)' }, 0)
      tl.to(ballRef.current, { scale: 1,   duration: 0.07 }, 0.08)

      // Ball flies into goal — moves up, slight curve, shrinks for perspective
      tl.to(ballRef.current, {
        y: -195, x: 10, scale: 0.45,
        duration: 0.50, ease: 'power3.in',
      }, 0.10)

      // Ball fades out as it enters the net
      tl.to(ballRef.current, { opacity: 0, duration: 0.12 }, 0.48)

      // Goal post green flash
      tl.to(goalRef.current, {
        boxShadow: '0 0 48px rgba(0,255,135,0.95), inset 0 0 32px rgba(0,255,135,0.25)',
        borderColor: 'rgba(0,255,135,0.95)',
        duration: 0.12, yoyo: true, repeat: 1,
      }, 0.40)

      // Full-screen flash
      tl.fromTo(flashRef.current,
        { opacity: 0 },
        { opacity: 0.35, duration: 0.10, yoyo: true, repeat: 1 },
        0.50,
      )

      // GOAL! text elastic entrance
      tl.fromTo(goalTextRef.current,
        { y: 40, opacity: 0, scale: 0.3 },
        { y: 0, opacity: 1, scale: 1, duration: 0.50, ease: 'elastic.out(1, 0.4)' },
        0.55,
      )

      // Confetti burst from center
      confettiRefs.current.forEach((el, i) => {
        if (!el) return
        const angle    = (i / CONFETTI.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.7
        const distance = 75 + Math.random() * 105
        tl.fromTo(el,
          { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
          {
            x:        Math.cos(angle) * distance,
            y:        Math.sin(angle) * distance - 85,
            opacity:  0,
            scale:    0,
            rotation: Math.random() * 540 - 270,
            duration: 0.85,
            ease:     'power2.out',
          },
          0.65 + i * 0.012,
        )
      })

      // Scene fade out
      tl.to(containerRef.current, { opacity: 0, duration: 0.30, ease: 'power2.in' }, 1.30)

      // Navigate
      tl.call(() => onComplete(), [], 1.60)
    }, [onComplete])

    useImperativeHandle(ref, () => ({
      triggerGoal: runKickAnimation,
    }), [runKickAnimation])

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none"
        style={{ background: '#0A0A0F' }}
      >
        {/* Radial green glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 60%, rgba(0,255,135,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Ambient particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            ref={el => { particleRefs.current[i] = el }}
            aria-hidden="true"
            style={{
              position:     'absolute',
              left:         p.left,
              top:          p.top,
              width:        p.size,
              height:       p.size,
              borderRadius: '50%',
              background:   p.color,
              opacity:      p.opacity,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Green screen-flash overlay */}
        <div
          ref={flashRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: '#00FF87', opacity: 0, zIndex: 20 }}
        />

        {/* ── Goal post ── */}
        <div
          ref={goalRef}
          style={{
            width:        140,
            height:       100,
            border:       '4px solid rgba(255,255,255,0.9)',
            borderBottom: 'none',
            borderRadius: '4px 4px 0 0',
            flexShrink:   0,
            position:     'relative',
            zIndex:       1,
            boxShadow:    '0 0 20px rgba(255,255,255,0.1), inset 0 0 20px rgba(0,0,0,0.5)',
            // Net grid pattern
            background: `
              repeating-linear-gradient(
                0deg,
                transparent, transparent 10px,
                rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 11px
              ),
              repeating-linear-gradient(
                90deg,
                transparent, transparent 10px,
                rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 11px
              )
            `,
          }}
        />

        {/* Penalty spot */}
        <div
          aria-hidden="true"
          style={{
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   'rgba(255,255,255,0.6)',
            marginTop:    24,
            flexShrink:   0,
            position:     'relative',
            zIndex:       1,
          }}
        />

        {/* Soccer ball */}
        <div
          ref={ballRef}
          style={{
            fontSize:  52,
            lineHeight: 1,
            marginTop:  12,
            flexShrink: 0,
            position:   'relative',
            zIndex:     2,
            filter:     'drop-shadow(0 4px 16px rgba(0,255,135,0.45))',
          }}
        >
          ⚽
        </div>

        {/* GOAL! overlay text */}
        <div
          ref={goalTextRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: 0, zIndex: 30 }}
        >
          <span
            className="font-display font-black"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              background: 'linear-gradient(135deg, #00FF87 0%, #00D4FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
              filter: 'drop-shadow(0 0 32px rgba(0,255,135,0.7))',
            }}
          >
            GOAL! ⚽
          </span>
        </div>

        {/* Confetti burst container */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none overflow-hidden"
          style={{ inset: 0, zIndex: 31 }}
        >
          {CONFETTI.map((c, i) => (
            <div
              key={i}
              ref={el => { confettiRefs.current[i] = el }}
              style={{
                position:     'absolute',
                left:         '50%',
                top:          '45%',
                width:        6 + (i % 3) * 2,
                height:       6 + (i % 3) * 2,
                background:   c.color,
                borderRadius: c.round ? '50%' : '2px',
                opacity:      0,
                transform:    'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
      </div>
    )
  },
)

export default PenaltyScene
