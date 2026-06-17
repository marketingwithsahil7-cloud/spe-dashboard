import { useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInDays } from 'date-fns'
import { gsap } from '../../lib/animations'
import { ROUTES } from '../../lib/constants'
import type { Trial } from '../../types/index'

interface TrialAlertBarProps {
  pendingTrials: Trial[]
}

function daysSinceTrial(trialDate: string): string {
  const days = differenceInDays(new Date(), new Date(trialDate))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

// One full set of trial chips — rendered twice for seamless loop
function MarqueeContent({ trials }: { trials: Trial[] }) {
  return (
    <>
      {trials.map((trial, i) => (
        <span key={i} className="inline-flex items-center gap-0 font-body text-sm font-semibold text-pitch">
          <span className="px-5">{trial.name}</span>
          <span className="opacity-50">·</span>
          <span className="px-5 opacity-70">{daysSinceTrial(trial.trial_date)}</span>
          <span className="opacity-30 px-3">◆</span>
        </span>
      ))}
    </>
  )
}

export function TrialAlertBar({ pendingTrials }: TrialAlertBarProps) {
  const navigate  = useNavigate()
  const barRef    = useRef<HTMLDivElement>(null)
  const trackRef  = useRef<HTMLDivElement>(null)
  const tweenRef  = useRef<gsap.core.Tween | null>(null)

  // Entrance slide-down + periodic pulse
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    gsap.fromTo(
      bar,
      { y: -56, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.2 },
    )

    const pulse = gsap.to(bar, {
      scale: 1.005,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 3,
    })

    return () => { pulse.kill() }
  }, [])

  // Marquee — measure after layout so scrollWidth is accurate
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track || pendingTrials.length === 0) return

    // Kill previous tween on re-run
    tweenRef.current?.kill()
    gsap.set(track, { x: 0 })

    // scrollWidth covers both copies; half = one copy width
    const halfWidth = track.scrollWidth / 2
    if (halfWidth === 0) return

    const duration = halfWidth / 60  // 60px per second

    tweenRef.current = gsap.fromTo(
      track,
      { x: 0 },
      { x: -halfWidth, duration, ease: 'linear', repeat: -1 },
    )

    return () => { tweenRef.current?.kill() }
  }, [pendingTrials])

  if (pendingTrials.length === 0) return null

  return (
    <div
      ref={barRef}
      className="w-full flex items-stretch h-11 rounded-xl overflow-hidden will-change-transform"
      style={{ background: 'linear-gradient(90deg, #00FF87 0%, #00D4FF 100%)' }}
    >
      {/* Fixed left label */}
      <div className="shrink-0 flex items-center gap-2 px-4 border-r border-black/15 select-none">
        <span className="text-base leading-none">🎯</span>
        <span className="font-display font-bold text-xs text-pitch uppercase tracking-widest whitespace-nowrap">
          Pending Trials
        </span>
        <span
          className="font-display font-bold text-[10px] leading-none px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(0,0,0,0.15)', color: '#0A0A0F' }}
        >
          {pendingTrials.length}
        </span>
      </div>

      {/* Scrolling marquee */}
      <div
        className="flex-1 overflow-hidden flex items-center"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
        onMouseEnter={() => tweenRef.current?.pause()}
        onMouseLeave={() => tweenRef.current?.resume()}
      >
        <div ref={trackRef} className="flex items-center whitespace-nowrap will-change-transform">
          {/* Two identical copies for seamless loop */}
          <MarqueeContent trials={pendingTrials} />
          <MarqueeContent trials={pendingTrials} />
        </div>
      </div>

      {/* Fixed right CTA */}
      <button
        onClick={() => navigate(ROUTES.TRIALS)}
        className="shrink-0 flex items-center gap-1.5 px-4 border-l border-black/15 font-body text-xs font-bold text-pitch whitespace-nowrap transition-colors hover:bg-black/10 active:bg-black/20"
      >
        Tap to review
        <span className="text-base leading-none">→</span>
      </button>
    </div>
  )
}
