import { useRef, useCallback, type RefObject } from 'react'
import { useMediaQuery } from './useMediaQuery'

interface TiltOptions {
  max?: number        // max degrees of rotation (default 5)
  perspective?: number // CSS perspective in px (default 1000)
  scale?: number      // scale on hover (default 1.02)
  speed?: number      // transition speed in ms (default 300)
}

interface TiltHandlers {
  onMouseMove:  (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave: () => void
}

export function useTilt<T extends HTMLElement>(
  options: TiltOptions = {}
): [RefObject<T>, TiltHandlers] {
  const {
    max         = 5,
    perspective = 1000,
    scale       = 1.02,
    speed       = 300,
  } = options

  const ref = useRef<T>(null)
  const { isMobile } = useMediaQuery()

  const applyTransform = useCallback(
    (el: HTMLElement, rotX: number, rotY: number, sc: number) => {
      el.style.transition = `transform ${speed}ms ease`
      el.style.transform  = `perspective(${perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${sc})`
    },
    [perspective, speed]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isMobile || !ref.current) return
      const el   = ref.current
      const rect = el.getBoundingClientRect()
      const cx   = rect.left + rect.width  / 2
      const cy   = rect.top  + rect.height / 2
      const dx   = (e.clientX - cx) / (rect.width  / 2)  // -1 → 1
      const dy   = (e.clientY - cy) / (rect.height / 2)  // -1 → 1
      const rotX = -dy * max
      const rotY =  dx * max
      applyTransform(el, rotX, rotY, scale)
    },
    [isMobile, max, scale, applyTransform]
  )

  const onMouseLeave = useCallback(
    () => {
      if (!ref.current) return
      applyTransform(ref.current, 0, 0, 1)
    },
    [applyTransform]
  )

  return [ref as RefObject<T>, { onMouseMove, onMouseLeave }]
}
