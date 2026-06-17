import { useState, useEffect } from 'react'

interface MediaQueryState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

function getState(width: number): MediaQueryState {
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width <= 1024,
    isDesktop: width > 1024,
  }
}

export function useMediaQuery(): MediaQueryState {
  const [state, setState] = useState<MediaQueryState>(() =>
    getState(window.innerWidth)
  )

  useEffect(() => {
    const handler = () => setState(getState(window.innerWidth))
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return state
}
