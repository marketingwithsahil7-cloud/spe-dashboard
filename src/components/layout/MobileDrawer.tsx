import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { signOut } from '../../hooks/useAuth'
import { ROUTES } from '../../lib/constants'
import { usePermissions } from '../../hooks/usePermissions'
import { useAcademySettings } from '../../hooks/useAcademySettings'
import { NAV_ITEMS } from './navItems'

interface MobileDrawerProps {
  isOpen:  boolean
  onClose: () => void
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { coach, role } = useAuthStore()
  const navigate = useNavigate()
  const permissions = usePermissions()
  const visibleItems = NAV_ITEMS.filter(item => permissions[item.permKey])
  const { settings } = useAcademySettings()

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKey])

  async function handleSignOut() {
    onClose()
    await signOut()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const initials = coach?.name?.slice(0, 1).toUpperCase() ?? '?'

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[900] bg-black/60 md:hidden"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Sliding panel — fixed sibling of backdrop, not a child, so
              Framer's will-change transform on the backdrop can't break
              position:fixed here (see Gotchas). */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="fixed inset-y-0 left-0 z-[901] w-[280px] max-w-[82vw] flex flex-col md:hidden"
            style={{
              background: '#12121A',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 h-16 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Academy logo"
                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                  style={{ border: '1px solid rgba(0,255,135,0.2)' }}
                />
              ) : (
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                  style={{
                    background: 'rgba(0,255,135,0.1)',
                    border: '1px solid rgba(0,255,135,0.2)',
                  }}
                >
                  <ShieldCheck size={20} className="text-grass" strokeWidth={1.5} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-sm uppercase tracking-widest text-white leading-none truncate">
                  {settings?.academy_name ?? 'Soccer Pro'}
                </p>
                <p className="font-body text-[10px] text-slate-500 tracking-wide mt-0.5">
                  {settings?.tagline ?? 'Elite Academy'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-colors shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav */}
            <nav
              data-drawer-scroll="true"
              className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
              style={{ minHeight: 0 }}
            >
              {visibleItems.map(({ label, icon: Icon, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-display font-medium uppercase tracking-wider transition-all duration-200 ${
                      isActive ? 'text-grass' : 'text-slate-400'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.15)' }
                      : { background: 'transparent', border: '1px solid transparent' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2 : 1.5}
                        className={isActive ? 'text-grass shrink-0' : 'text-slate-500 shrink-0'}
                      />
                      <span className="flex-1">{label}</span>
                      {isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-grass shrink-0"
                          style={{ boxShadow: '0 0 8px rgba(0,255,135,0.9)' }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Coach + Sign Out */}
            <div
              className="px-3 py-4 space-y-1 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-grass font-display font-bold text-xs text-pitch">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-body font-semibold truncate leading-none">
                    {coach?.name ?? 'Coach'}
                  </p>
                  <p className="text-slate-500 text-[10px] font-body mt-0.5 capitalize">
                    {role === 'owner' ? 'Owner / Head Coach' : role === 'head' ? 'Head Coach' : 'Assistant Coach'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-slate-500 transition-all duration-200"
                style={{ border: '1px solid transparent' }}
              >
                <LogOut size={15} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
