import { cn } from '../../lib/utils'

type BadgeVariant =
  | 'active' | 'trial' | 'closed'
  | 'paid' | 'due_soon' | 'due_today' | 'overdue'
  | 'pending' | 'not_closed' | 'no_response'
  | 'head' | 'assistant'

interface BadgeProps {
  variant:  BadgeVariant
  label?:   string
  className?: string
}

const CONFIG: Record<BadgeVariant, { label: string; style: React.CSSProperties; className: string }> = {
  active: {
    label: 'Active',
    style: { background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00FF87' },
    className: '',
  },
  trial: {
    label: 'Trial',
    style: { background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' },
    className: '',
  },
  closed: {
    label: 'Closed',
    style: { background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: '#94A3B8' },
    className: '',
  },
  paid: {
    label: 'Paid',
    style: { background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00FF87' },
    className: '',
  },
  due_soon: {
    label: 'Due Soon',
    style: { background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' },
    className: '',
  },
  due_today: {
    label: 'Due Today',
    style: { background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.4)', color: '#FFB800' },
    className: '',
  },
  overdue: {
    label: 'Overdue',
    style: { background: 'rgba(255,61,87,0.12)', border: '1px solid rgba(255,61,87,0.3)', color: '#FF3D57' },
    // Pulse handled by glow-red utility class
    className: 'animate-pulse-red',
  },
  pending: {
    label: 'Pending',
    style: { background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' },
    className: '',
  },
  not_closed: {
    label: 'Not Joined',
    style: { background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: '#94A3B8' },
    className: '',
  },
  no_response: {
    label: 'No Response',
    style: { background: 'rgba(71,85,105,0.2)', border: '1px solid rgba(71,85,105,0.4)', color: '#64748B' },
    className: '',
  },
  head: {
    label: 'Head Coach',
    style: { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' },
    className: '',
  },
  assistant: {
    label: 'Assistant',
    style: { background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: '#94A3B8' },
    className: '',
  },
}

export function Badge({ variant, label, className }: BadgeProps) {
  const { label: defaultLabel, style, className: variantClass } = CONFIG[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-display font-medium uppercase tracking-wider',
        variantClass,
        className
      )}
      style={style}
    >
      {label ?? defaultLabel}
    </span>
  )
}

export type { BadgeVariant, BadgeProps }
