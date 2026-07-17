import {
  LayoutDashboard, Users, ClipboardCheck, CreditCard,
  UserPlus, Shield, Trophy, Wallet, Settings,
} from 'lucide-react'
import { ROUTES } from '../../lib/constants'
import type { Permissions } from '../../hooks/usePermissions'

export interface NavItem {
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  path: string
  permKey: keyof Permissions
}

export const NAV_ITEMS: NavItem[] = [
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
