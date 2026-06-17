import type { BatchType, StudentStatus, PaymentMode, FeeStatus } from '../types/index'
import type { Trial } from '../types/index'

export const ACADEMY_ID = '00000000-0000-0000-0000-000000000001'

export const BATCHES: BatchType[] = ['5-6 PM', '6-7 PM', 'Both']

export const STUDENT_STATUS: StudentStatus[] = ['active', 'trial', 'closed']

export const PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'online']

export const FEE_STATUS: FeeStatus[] = ['paid', 'due_soon', 'due_today', 'overdue']

export const ROUTES = {
  LOGIN:      '/login',
  DASHBOARD:  '/dashboard',
  MY_DASHBOARD: '/my-dashboard',
  STUDENTS:   '/students',
  ATTENDANCE: '/attendance',
  FEES:       '/fees',
  TRIALS:     '/trials',
  COACHES:    '/coaches',
  EVENTS:     '/events',
  FINANCIALS: '/financials',
  SETTINGS:   '/settings',
} as const

// ─── Time-based greeting ──────────────────────────────────────────────────────

export function getGreeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
}

// ─── Fee reminder messages (smart English) ────────────────────────────────────

function buildFeeMessage(
  studentName: string,
  amount: number,
  feeStatus: string,
  daysOverdue: number,
  nextDueDate: string,
): string {
  const greeting = getGreeting()

  if (feeStatus === 'due_soon') {
    const dueDateFmt = nextDueDate
      ? new Date(nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
      : 'soon'
    return [
      `${greeting},`,
      '',
      `This is a friendly reminder that ${studentName}'s monthly academy fee of ₹${amount} is due on ${dueDateFmt}.`,
      '',
      `We would appreciate timely payment to ensure uninterrupted training sessions.`,
      '',
      `Warm regards,`,
      `Soccer Pro Elite Football Academy ⚽`,
    ].join('\n')
  }

  if (feeStatus === 'due_today') {
    const dueDateFmt = nextDueDate
      ? new Date(nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
      : 'today'
    return [
      `${greeting},`,
      '',
      `${studentName}'s monthly academy fee of ₹${amount} is due today (${dueDateFmt}).`,
      '',
      `Kindly process the payment at your earliest convenience. You can pay via Cash or UPI.`,
      '',
      `Thank you for your support,`,
      `Soccer Pro Elite Football Academy ⚽`,
    ].join('\n')
  }

  // Overdue scenarios
  const dueDateFmt = nextDueDate
    ? new Date(nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
    : 'the due date'

  if (daysOverdue <= 3) {
    return [
      `${greeting},`,
      '',
      `We noticed that ${studentName}'s academy fee of ₹${amount} is now ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue (was due on ${dueDateFmt}).`,
      '',
      `We kindly request you to clear the pending payment today to avoid any disruption to their training schedule.`,
      '',
      `Thank you,`,
      `Soccer Pro Elite Football Academy ⚽`,
    ].join('\n')
  }

  if (daysOverdue <= 7) {
    return [
      `${greeting},`,
      '',
      `This is an important reminder regarding ${studentName}'s overdue academy fee.`,
      '',
      `Amount: ₹${amount}`,
      `Due Date: ${dueDateFmt}`,
      `Days Overdue: ${daysOverdue} days`,
      '',
      `We request immediate payment to continue ${studentName}'s enrollment in our program. Please contact us if you need to discuss a payment arrangement.`,
      '',
      `Soccer Pro Elite Football Academy ⚽`,
    ].join('\n')
  }

  // 7+ days overdue — final notice
  return [
    `Hello,`,
    '',
    `PAYMENT OVERDUE NOTICE`,
    '',
    `Student: ${studentName}`,
    `Amount Due: ₹${amount}`,
    `Originally Due: ${dueDateFmt}`,
    `Days Overdue: ${daysOverdue} days`,
    '',
    `This is a final reminder. Continued non-payment may result in temporary suspension of training sessions.`,
    '',
    `Please contact Head Coach Sahil immediately to resolve this matter.`,
    '',
    `Soccer Pro Elite Football Academy ⚽`,
  ].join('\n')
}

/**
 * Generates a WhatsApp URL with the appropriate fee reminder message.
 * When feeStatus is provided, generates a smart English message based on the scenario.
 * Without feeStatus, falls back to the original Hindi message.
 */
export function getWhatsAppURL(
  phone:       string,
  parentName:  string,
  studentName: string,
  _month:      string,   // accepted for legacy callers but not used in message body
  amount:      number,
  feeStatus?:  string,
  daysOverdue?: number,
  nextDueDate?: string,
): string {
  const cleaned = phone.replace(/\D/g, '')

  const message = feeStatus && feeStatus !== 'paid'
    ? buildFeeMessage(studentName, amount, feeStatus, daysOverdue ?? 0, nextDueDate ?? '')
    : `Namaste 🙏 ${parentName} ji, ${studentName} ka is mahine ka fee ₹${amount} abhi tak pending hai. Kripya jaldi pay karein. — Soccer Pro Elite Academy`

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

// ─── Trial WhatsApp messages (English psychological copywriting) ───────────────

export function getTrialWhatsAppURL(trial: Trial, daysSince: number): string {
  const phone   = trial.parent_phone ?? ''
  const cleaned = phone.replace(/\D/g, '')
  if (!cleaned) return ''

  const childName = trial.name
  const trialDate = trial.trial_date
    ? new Date(trial.trial_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'your trial session'
  const greeting = getGreeting()

  let message: string

  if (daysSince <= 1) {
    // Warm thank-you message
    message = [
      `${greeting},`,
      '',
      `Thank you for bringing ${childName} to our trial session at Soccer Pro Elite Football Academy on ${trialDate}!`,
      '',
      `We noticed ${childName} showed great enthusiasm on the pitch. Our coaches were impressed with their energy and willingness to learn.`,
      '',
      `We'd love to have ${childName} join our academy family. We currently train 40+ young footballers in a professional environment.`,
      '',
      `Shall we reserve a spot? Our batches fill up quickly.`,
      '',
      `Warm regards,`,
      `Coach Sahil`,
      `Soccer Pro Elite Football Academy ⚽`,
    ].join('\n')
  } else if (daysSince <= 3) {
    // Urgency + value proposition
    message = [
      `${greeting},`,
      '',
      `Following up on ${childName}'s trial session at Soccer Pro Elite Academy on ${trialDate}.`,
      '',
      `Just wanted to let you know that we have limited spots available in our batch.`,
      '',
      `What sets us apart:`,
      `→ Professional coaching staff`,
      `→ Structured training program`,
      `→ Regular tournaments & matches`,
      `→ Small batch sizes for personal attention`,
      '',
      `Would you like to discuss enrollment? I'm happy to answer any questions.`,
      '',
      `Best regards,`,
      `Coach Sahil`,
      `Soccer Pro Elite Football Academy ⚽`,
    ].join('\n')
  } else {
    // Last chance — FOMO
    message = [
      `Hello,`,
      '',
      `This is a final follow-up regarding ${childName}'s trial at Soccer Pro Elite Football Academy (${trialDate}).`,
      '',
      `We wanted to give you one more opportunity to secure ${childName}'s spot before we open it to our waiting list.`,
      '',
      `Training days: Tuesday, Thursday, Saturday`,
      '',
      `If you've decided not to proceed, no worries at all — we wish ${childName} the very best!`,
      '',
      `If interested, please confirm today.`,
      '',
      `Coach Sahil`,
      `Soccer Pro Elite Football Academy ⚽`,
    ].join('\n')
  }

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}
