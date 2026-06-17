import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 72  // px pull needed to trigger
const MAX_PULL  = 100 // max visual stretch

export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const [pullY, setPullY]       = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  useEffect(() => {
    const el = document.documentElement

    const onTouchStart = (e: TouchEvent) => {
      // Only trigger when scrolled to very top
      if (el.scrollTop > 4) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) { pulling.current = false; return }
      // Rubber-band: slow down as it stretches
      const clamped = Math.min(dy * 0.45, MAX_PULL)
      setPullY(clamped)
      if (dy > 8) e.preventDefault()
    }

    const onTouchEnd = async () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullY >= THRESHOLD) {
        setRefreshing(true)
        try { await onRefresh() } finally {
          setRefreshing(false)
        }
      }
      setPullY(0)
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onRefresh, pullY])

  return { pullY, refreshing }
}
