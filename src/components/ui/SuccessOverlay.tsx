import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from '../../lib/animations'

interface SuccessOverlayProps {
  message?: string
  onDone:   () => void
}

const PARTICLE_COUNT = 20

export function SuccessOverlay({ message = 'Saved!', onDone }: SuccessOverlayProps) {
  const circleRef    = useRef<HTMLDivElement>(null)
  const checkRef     = useRef<SVGSVGElement>(null)
  const textRef      = useRef<HTMLParagraphElement>(null)
  const rootRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Build burst particles
      if (rootRef.current) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const p = document.createElement('div')
          const size = 4 + Math.random() * 7
          const angle = (i / PARTICLE_COUNT) * 360
          const dist  = 90 + Math.random() * 60
          const color = i % 3 === 0 ? '#00FF87' : i % 3 === 1 ? '#00D4FF' : '#FFB800'
          p.style.cssText = `
            position:fixed;top:50%;left:50%;
            width:${size}px;height:${size}px;
            border-radius:${Math.random() > 0.4 ? '50%' : '3px'};
            background:${color};
            pointer-events:none;z-index:10001;
            transform:translate(-50%,-50%);
          `
          document.body.appendChild(p)

          gsap.fromTo(p,
            { x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 },
            {
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist,
              scale: 1,
              opacity: 0,
              rotate: Math.random() * 360,
              duration: 0.65 + Math.random() * 0.35,
              delay: 0.2,
              ease: 'power2.out',
              onComplete: () => p.remove(),
            }
          )
        }
      }

      const tl = gsap.timeline({ onComplete: onDone })

      // Circle scales in with spring
      tl.fromTo(circleRef.current,
        { scale: 0, opacity: 0, rotate: -30 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.2)' },
        0
      )
      // Check stroke draws in
      if (checkRef.current) {
        const path = checkRef.current.querySelector('path')
        if (path) {
          const len = (path as SVGPathElement).getTotalLength?.() ?? 100
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
          tl.to(path, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, 0.2)
        }
      }
      // Text slides in
      tl.fromTo(textRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
        0.4
      )
      // Hold → fade out
      tl.to(rootRef.current,
        { opacity: 0, scale: 0.96, duration: 0.4, ease: 'power2.in' },
        1.2
      )
    })

    return () => ctx.revert()
  }, [onDone])

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 flex items-center justify-center z-[10000]"
      style={{ background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <div className="relative flex flex-col items-center gap-5">
        {/* Glow circle */}
        <div
          ref={circleRef}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 112, height: 112,
            background: 'rgba(0,255,135,0.1)',
            border: '2px solid rgba(0,255,135,0.5)',
            boxShadow: '0 0 50px rgba(0,255,135,0.35), 0 0 100px rgba(0,255,135,0.12)',
          }}
        >
          <svg
            ref={checkRef}
            viewBox="0 0 56 56"
            width={60}
            height={60}
            fill="none"
          >
            <path
              d="M12 30 L23 41 L44 18"
              stroke="#00FF87"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p
          ref={textRef}
          className="font-display text-3xl font-bold text-grass opacity-0"
          style={{ textShadow: '0 0 24px rgba(0,255,135,0.5)' }}
        >
          {message}
        </p>
      </div>
    </div>,
    document.body
  )
}
