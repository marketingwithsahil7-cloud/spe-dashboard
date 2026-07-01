import { useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardCheck, CreditCard,
  UserPlus, Shield, Trophy, LogOut, ShieldCheck, Wallet, Settings,
} from 'lucide-react'
import { gsap } from '../../lib/animations'
import { useAuthStore } from '../../store/authStore'
import { signOut } from '../../hooks/useAuth'
import { ROUTES } from '../../lib/constants'
import { usePermissions, type Permissions } from '../../hooks/usePermissions'
import { useAcademySettings } from '../../hooks/useAcademySettings'

const NAV_ITEMS: { label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; path: string; permKey: keyof Permissions }[] = [
  { label: 'Dashboard',  icon: LayoutDashboard, path: ROUTES.DASHBOARD,  permKey: 'canSeeDashboard' },
  { label: 'Students',   icon: Users,           path: ROUTES.STUDENTS,   permKey: 'canSeeStudents' },
  { label: 'Team List',  icon: Users,           path: ROUTES.TEAM_LIST,  permKey: 'canSeeTeamList' },
  { label: 'Attendance', icon: ClipboardCheck,  path: ROUTES.ATTENDANCE, permKey: 'canSeeAttendance' },
  { label: 'Fees',       icon: CreditCard,      path: ROUTES.FEES,       permKey: 'canSeeFees' },
  { label: 'Trials',     icon: UserPlus,        path: ROUTES.TRIALS,     permKey: 'canSeeTrials' },
  { label: 'Coaches',    icon: Shield,          path: ROUTES.COACHES,    permKey: 'canSeeCoaches' },
  { label: 'Financials', icon: Wallet,          path: ROUTES.FINANCIALS, permKey: 'canSeeFinancials' },
  { label: 'Events',     icon: Trophy,          path: ROUTES.EVENTS,     permKey: 'canSeeEvents' },
  { label: 'Settings',   icon: Settings,        path: ROUTES.SETTINGS,   permKey: 'canSeeSettings' },
]

export function Sidebar() {
  const sidebarRef = useRef<HTMLElement>(null)
  const { coach, role } = useAuthStore()
  const navigate = useNavigate()
  const permissions = usePermissions()
  const visibleItems = NAV_ITEMS.filter(item => permissions[item.permKey])
  const { settings } = useAcademySettings()

  // Phase 1, step 1 of page-load timeline
  useEffect(() => {
    gsap.fromTo(
      sidebarRef.current,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
    )
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const initials = coach?.name?.slice(0, 1).toUpperCase() ?? '?'

  return (
    <aside
      ref={sidebarRef}
      className="hidden md:flex flex-col w-[240px] shrink-0 h-screen sticky top-0"
      style={{
        background: '#12121A',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────── */}
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
              boxShadow: '0 0 16px rgba(0,255,135,0.15)',
            }}
          >
            <ShieldCheck size={20} className="text-grass" strokeWidth={1.5} />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-display font-bold text-sm uppercase tracking-widest text-white leading-none truncate">
            {settings?.academy_name ?? 'Soccer Pro'}
          </p>
          <p className="font-body text-[10px] text-slate-500 tracking-wide mt-0.5">
            {settings?.tagline ?? 'Elite Academy'}
          </p>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {visibleItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-[10px] rounded-xl text-sm font-display font-medium uppercase tracking-wider transition-all duration-200 group ${
                isActive
                  ? 'text-grass'
                  : 'text-slate-400 hover:text-white'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'rgba(0,255,135,0.08)',
                    border: '1px solid rgba(0,255,135,0.15)',
                  }
                : {
                    background: 'transparent',
                    border: '1px solid transparent',
                  }
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={
                    isActive
                      ? 'text-grass shrink-0'
                      : 'text-slate-500 group-hover:text-slate-300 shrink-0'
                  }
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

      {/* ── Coach + Sign Out ─────────────────────────────────────── */}
      <div
        className="px-3 py-4 space-y-1 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
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
          data-magnetic
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body text-slate-500 transition-all duration-200"
          style={{ border: '1px solid transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#FF3D57'
            e.currentTarget.style.background = 'rgba(255,61,87,0.07)'
            e.currentTarget.style.borderColor = 'rgba(255,61,87,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = ''
            e.currentTarget.style.background = ''
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <LogOut size={15} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
