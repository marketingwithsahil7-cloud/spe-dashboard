import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

// ─── GSAP Presets ─────────────────────────────────────────────────────────────

export function pageEnterAnimation(container: HTMLElement) {
  const children = container.querySelectorAll('[data-animate]')
  gsap.fromTo(
    children,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', clearProps: 'all' }
  )
}

export function cardStaggerAnimation(cards: HTMLElement[] | NodeListOf<Element>) {
  gsap.fromTo(
    cards,
    { opacity: 0, y: 30, scale: 0.85 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.7)', clearProps: 'all' }
  )
}

// ─── Framer Motion Variants ───────────────────────────────────────────────────

export const pageVariants = {
  initial: { opacity: 0, x: 30, scale: 0.97 },
  animate: {
    opacity: 1, x: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, x: -30, scale: 0.97, transition: { duration: 0.2 } },
}

export const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

export const drawerVariants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
  exit:    { x: '100%', transition: { duration: 0.2, ease: 'easeIn' as const } },
}

export const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 350 } },
  exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}
