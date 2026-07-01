import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, ClipboardCheck, CreditCard, UserPlus, Shield, Trophy, Wallet, Settings,
} from 'lucide-react'
import { ROUTES } from '../../lib/constants'
import { usePermissions, type Permissions } from '../../hooks/usePermissions'

const ALL_NAV_ITEMS: { label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; path: string; permKey: keyof Permissions }[] = [
  { label: 'Home',       icon: LayoutDashboard, path: ROUTES.DASHBOARD,  permKey: 'canSeeDashboard' },
  { label: 'Students',   icon: Users,           path: ROUTES.STUDENTS,   permKey: 'canSeeStudents' },
  { label: 'Team List',  icon: Users,           path: ROUTES.TEAM_LIST,  permKey: 'canSeeTeamList' },
  { label: 'Attendance', icon: ClipboardCheck,  path: ROUTES.ATTENDANCE, permKey: 'canSeeAttendance' },
  { label: 'Fees',       icon: CreditCard,      path: ROUTES.FEES,       permKey: 'canSeeFees' },
  { label: 'Trials',     icon: UserPlus,        path: ROUTES.TRIALS,     permKey: 'canSeeTrials' },
  { label: 'Coaches',    icon: Shield,          path: ROUTES.COACHES,    permKey: 'canSeeCoaches' },
  { label: 'Finance',    icon: Wallet,          path: ROUTES.FINANCIALS, permKey: 'canSeeFinancials' },
  { label: 'Events',     icon: Trophy,          path: ROUTES.EVENTS,     permKey: 'canSeeEvents' },
  { label: 'Settings',   icon: Settings,        path: ROUTES.SETTINGS,   permKey: 'canSeeSettings' },
]

export function BottomNav() {
  const permissions = usePermissions()
  const location = useLocation()
  const navItems = ALL_NAV_ITEMS.filter(item => permissions[item.permKey])

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(18,18,26,0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: '68px',
      }}
    >
      <div className="flex items-stretch h-full">
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path))

          return (
            <NavLink
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              style={{ minHeight: 44, touchAction: 'manipulation' }}
            >
              {/* Slide indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-grass"
                  style={{ boxShadow: '0 0 8px rgba(0,255,135,0.8)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon with spring scale on active */}
              <motion.div
                className="relative"
                animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                whileTap={{ scale: 0.85 }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={isActive ? 'text-grass' : 'text-slate-500'}
                />
                {isActive && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-grass"
                    style={{ boxShadow: '0 0 6px rgba(0,255,135,0.9)' }}
                  />
                )}
              </motion.div>

              <motion.span
                animate={isActive ? { color: '#00FF87' } : { color: '#64748b' }}
                transition={{ duration: 0.15 }}
                className="text-[9px] font-display uppercase tracking-wider leading-none"
              >
                {label}
              </motion.span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
