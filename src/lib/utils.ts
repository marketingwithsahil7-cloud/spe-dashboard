import { format, differenceInDays } from 'date-fns'
import type { BatchType, StudentStatus, FeeStatus } from '../types/index'

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return format(d, 'd MMM yyyy')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function getDaysOverdue(dueDate: string | Date): number {
  const diff = differenceInDays(new Date(), new Date(dueDate))
  return Math.max(0, diff)
}

export function getBatchColor(batch: BatchType): string {
  switch (batch) {
    case '5-6 PM': return 'text-ice'
    case '6-7 PM': return 'text-grass'
    case 'Both':   return 'text-amber'
  }
}

export function getStatusColor(status: StudentStatus): string {
  switch (status) {
    case 'active': return 'text-grass'
    case 'trial':  return 'text-amber'
    case 'closed': return 'text-slate-400'
  }
}

export function getFeeStatusColor(status: FeeStatus): string {
  switch (status) {
    case 'paid':     return 'text-grass'
    case 'due_soon': return 'text-amber'
    case 'due_today': return 'text-amber'
    case 'overdue':  return 'text-danger'
  }
}

/** Merges class names — lightweight replacement for clsx + tailwind-merge */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
