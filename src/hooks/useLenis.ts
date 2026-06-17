import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from '../lib/animations'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Low-end devices get native scroll — smoother than janky Lenis
    if (navigator.hardwareConcurrency < 4) return

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      // Let native scroll handle wheel events inside drawers/modals
      prevent: (el: Element) => !!el.closest('[data-drawer-scroll]'),
    })

    lenisRef.current = lenis

    // Drive Lenis off GSAP's ticker so ScrollTrigger stays in sync
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    lenis.on('scroll', ScrollTrigger.update)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return lenisRef
}
