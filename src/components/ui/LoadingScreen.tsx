import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from '../../lib/animations'

// ─── Animated loading dots ────────────────────────────────────────────────────
function LoadingDots() {
  const [dots, setDots] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d % 3) + 1), 450)
    return () => clearInterval(t)
  }, [])
  return <span className="inline-block w-6 text-left">{'.'.repeat(dots)}</span>
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
export function LoadingScreen() {
  const textRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      const letters = textRef.current?.querySelectorAll<HTMLElement>('.ll') ?? []

      // Logo letters stagger in
      tl.fromTo(letters,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 },
        0
      )
      // Underline expands
      tl.fromTo(lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, ease: 'power2.out', transformOrigin: 'left center' },
        0.45
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <motion.div
      key="loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeInOut' } }}
      className="fixed inset-0 z-[9999] bg-pitch flex flex-col items-center justify-center gap-10 select-none"
      style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,255,135,0.06) 0%, transparent 70%), #0A0A0F',
      }}
    >
      {/* SPE logo */}
      <div className="flex flex-col items-center gap-4">
        <div ref={textRef} className="flex gap-1" aria-label="Soccer Pro Elite">
          {'SPE'.split('').map((c, i) => (
            <span
              key={i}
              className="ll font-display text-6xl font-bold text-grass tracking-[0.15em] opacity-0"
              style={{ textShadow: '0 0 40px rgba(0,255,135,0.4)' }}
            >
              {c}
            </span>
          ))}
        </div>
        <p className="font-body text-[10px] text-slate-500 tracking-[0.4em] uppercase">
          Soccer Pro Elite
        </p>
        {/* Green underline */}
        <div
          ref={lineRef}
          className="h-px w-24 origin-left"
          style={{ background: 'linear-gradient(to right, #00FF87, transparent)' }}
        />
      </div>

      {/* Rolling ball */}
      <div className="rolling-ball-wrap">
        <div className="rolling-ball" />
      </div>

      {/* Loading text */}
      <p className="font-body text-xs text-slate-600 tracking-[0.3em] uppercase flex items-center">
        Loading<LoadingDots />
      </p>
    </motion.div>
  )
}
