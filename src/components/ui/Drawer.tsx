import { useEffect, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { drawerVariants } from '../../lib/animations'

interface DrawerProps {
  isOpen:     boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
  footer?:    React.ReactNode
  width?:     string
  className?: string
}

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  // pointer-events:none on exit so the animating backdrop doesn't eat BottomNav taps
  exit:    { opacity: 0, pointerEvents: 'none' as const, transition: { duration: 0.2 } },
}

export function Drawer({ isOpen, onClose, title, children, footer, width = '420px', className }: DrawerProps) {
  // Lock body scroll while open; pause Lenis so it doesn't fight with the body-lock
  useEffect(() => {
    if (!isOpen) return
    const lenis = (window as unknown as Record<string, unknown>).__lenis as { stop: () => void; start: () => void } | undefined
    const scrollY = window.scrollY
    lenis?.stop()
    document.body.style.position = 'fixed'
    document.body.style.top      = `-${scrollY}px`
    document.body.style.width    = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top      = ''
      document.body.style.width    = ''
      window.scrollTo(0, scrollY)
      lenis?.start()
    }
  }, [isOpen])

  // Safety net: if the component unmounts while the drawer is still open
  // (e.g. the user navigates away), always clear the body lock and restart Lenis.
  useEffect(() => {
    return () => {
      document.body.style.position = ''
      document.body.style.top      = ''
      document.body.style.width    = ''
      const lenis = (window as unknown as Record<string, unknown>).__lenis as { start: () => void } | undefined
      lenis?.start()
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            } as CSSProperties}
          />

          {/* Panel — position:fixed anchors it to the viewport directly,
              bypassing any containing-block side-effects from the backdrop's
              Framer Motion transform/will-change. */}
          <motion.div
            key="drawer-panel"
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={e => e.stopPropagation()}
            className={className}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width,
              maxWidth: '100vw',
              height: '100vh',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              background: '#12121A',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
            } as CSSProperties}
          >
            {/* Fixed Header */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {title && (
                <h2 style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  margin: 0,
                }}>
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                aria-label="Close drawer"
                style={{
                  marginLeft: 'auto',
                  padding: '6px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content — minHeight:0 is the critical fix:
                without it flex children default to min-height:auto,
                which prevents shrinking and breaks overflow scroll. */}
            <div
              data-drawer-scroll="true"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                scrollbarWidth: 'thin',
                padding: '20px 24px',
              } as CSSProperties}
            >
              {children}
            </div>

            {/* Fixed Footer */}
            {footer && (
              <div
                style={{
                  flexShrink: 0,
                  padding: '16px 24px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

export type { DrawerProps }
