/**
 * CustomCursor — desktop only, hidden on touch devices.
 *
 * Usage:
 *   Add data-magnetic to any element to activate the magnetic snap effect.
 *   Example: <button data-magnetic>Click me</button>
 *
 * The cursor follows mouse with lerp 0.15 lag via GSAP ticker.
 * Within 60px of a [data-magnetic] element it grows to 36px and snaps toward center.
 * On hover of <button> or <a> it scales to 1.5×.
 */

import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/animations'

const DOT_SIZE = 8
const MAGNETIC_SIZE = 36
const HOVER_SCALE = 1.5
const MAGNETIC_RADIUS = 60
const LERP = 0.15

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Touch devices: bail immediately, the element stays display:none
    if (window.matchMedia('(pointer: coarse)').matches) return

    const dot = dotRef.current
    if (!dot) return

    dot.style.display = 'block'

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let currentX = mouseX
    let currentY = mouseY

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const onMouseEnterInteractive = () => {
      gsap.to(dot, { scale: HOVER_SCALE, duration: 0.2, ease: 'power2.out' })
    }
    const onMouseLeaveInteractive = () => {
      gsap.to(dot, { scale: 1, duration: 0.2, ease: 'power2.out' })
    }

    // Attach hover listeners to all buttons and links
    const interactives = document.querySelectorAll<HTMLElement>('button, a')
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onMouseEnterInteractive)
      el.addEventListener('mouseleave', onMouseLeaveInteractive)
    })

    // MutationObserver keeps hover listeners live as DOM grows
    const observer = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>('button, a').forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnterInteractive)
        el.removeEventListener('mouseleave', onMouseLeaveInteractive)
        el.addEventListener('mouseenter', onMouseEnterInteractive)
        el.addEventListener('mouseleave', onMouseLeaveInteractive)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const tick = () => {
      // Check magnetic elements each frame
      const magnets = document.querySelectorAll<HTMLElement>('[data-magnetic]')
      let magnetActive = false

      magnets.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.hypot(mouseX - cx, mouseY - cy)

        if (dist < MAGNETIC_RADIUS) {
          magnetActive = true
          // Lerp toward magnetic center
          currentX += (cx - currentX) * 0.25
          currentY += (cy - currentY) * 0.25
          gsap.to(dot, { width: MAGNETIC_SIZE, height: MAGNETIC_SIZE, duration: 0.2, ease: 'power2.out' })
        }
      })

      if (!magnetActive) {
        currentX += (mouseX - currentX) * LERP
        currentY += (mouseY - currentY) * LERP
        gsap.to(dot, { width: DOT_SIZE, height: DOT_SIZE, duration: 0.2, ease: 'power2.out' })
      }

      gsap.set(dot, { x: currentX - DOT_SIZE / 2, y: currentY - DOT_SIZE / 2 })
    }

    gsap.ticker.add(tick)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('mousemove', onMouseMove)
      observer.disconnect()
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnterInteractive)
        el.removeEventListener('mouseleave', onMouseLeaveInteractive)
      })
    }
  }, [])

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: '50%',
        backgroundColor: '#00FF87',
        mixBlendMode: 'difference',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
      }}
    />
  )
}
