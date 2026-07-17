import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { signOut } from '../../hooks/useAuth'
import { gsap } from '../../lib/animations'
import { ROUTES } from '../../lib/constants'
import { MobileDrawer } from './MobileDrawer'

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]:  'Dashboard',
  [ROUTES.STUDENTS]:   'Students',
  [ROUTES.ATTENDANCE]: 'Attendance',
  [ROUTES.FEES]:       'Fees',
  [ROUTES.TRIALS]:     'Trials',
  [ROUTES.COACHES]:    'Coaches',
  [ROUTES.EVENTS]:     'Events',
  [ROUTES.FINANCIALS]: 'Financials',
  [ROUTES.SETTINGS]:   'Settings',
}

export function TopBar() {
  const { pathname } = useLocation()
  const { coach, role } = useAuthStore()
  const navigate    = useNavigate()
  const barRef      = useRef<HTMLDivElement>(null)

  const [showMenu, setShowMenu]       = useState(false)
  const [signingOut, setSigningOut]   = useState(false)
  const [drawerOpen, setDrawerOpen]   = useState(false)

  // Phase 2 of page-load timeline
  useEffect(() => {
    gsap.fromTo(
      barRef.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', delay: 0.3 }
    )
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    setShowMenu(false)
    await signOut()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const title    = PAGE_TITLES[pathname] ?? 'Dashboard'
  const initials = coach?.name?.slice(0, 1).toUpperCase() ?? '?'
  const today    = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const roleLabel =
    role === 'owner' ? 'Owner / Head Coach'
    : role === 'head' ? 'Head Coach'
    : 'Assistant Coach'

  return (
    <>
      <div
        ref={barRef}
        className="h-16 flex items-center justify-between px-5 md:px-6 shrink-0"
        style={{
          background: 'rgba(18,18,26,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only, desktop already has the persistent Sidebar */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Menu size={18} />
          </button>
          <h1 className="font-display text-lg font-semibold uppercase tracking-widest text-white">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Name + date (hidden on small phones) */}
          <div className="text-right hidden sm:block">
            <p className="text-white text-xs font-body font-medium leading-none">
              {coach?.name ?? 'Coach'}
            </p>
            <p className="text-slate-500 text-[10px] font-body mt-0.5">{today}</p>
          </div>

          {/* Avatar button */}
          <button
            onClick={() => setShowMenu(v => !v)}
            aria-label="Account menu"
            aria-expanded={showMenu}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-grass font-display font-bold text-sm text-pitch shrink-0 select-none"
            style={{
              boxShadow: showMenu
                ? '0 0 20px rgba(0,255,135,0.45)'
                : '0 0 12px rgba(0,255,135,0.2)',
              touchAction: 'manipulation',
              transition: 'box-shadow 0.2s',
            }}
          >
            {signingOut ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-pitch border-t-transparent animate-spin" />
            ) : (
              initials
            )}
          </button>
        </div>
      </div>

      {/* ── Popover Portal — escapes ALL stacking contexts ────────────────── */}

      {/* Backdrop: transparent full-screen, catches outside clicks */}
      {showMenu && createPortal(
        <div
          className="fixed inset-0"
          style={{ zIndex: 99998 }}
          onClick={() => setShowMenu(false)}
        />,
        document.body,
      )}

      {/* Popover: AnimatePresence for enter/exit animation */}
      {createPortal(
        <AnimatePresence>
          {showMenu && (
            <motion.div
              key="topbar-popover"
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className="fixed w-52 rounded-2xl overflow-hidden"
              style={{
                top: 68,
                right: 16,
                zIndex: 99999,
                background: 'rgba(18,18,26,0.98)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,135,0.06)',
              }}
            >
              {/* Coach info */}
              <div
                className="px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-white text-sm font-body font-semibold leading-none truncate">
                  {coach?.name ?? 'Coach'}
                </p>
                <p className="text-slate-500 text-[11px] font-body mt-1">
                  {roleLabel}
                </p>
              </div>

              {/* Settings */}
              <NavLink
                to={ROUTES.SETTINGS}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-body text-slate-300 transition-colors"
                style={({ isActive }) => ({
                  color: isActive ? '#00FF87' : undefined,
                  background: 'transparent',
                })}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <Settings size={15} className="text-slate-500 shrink-0" />
                Settings
              </NavLink>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-danger transition-colors disabled:opacity-50"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,61,87,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <LogOut size={15} className="shrink-0" />
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
