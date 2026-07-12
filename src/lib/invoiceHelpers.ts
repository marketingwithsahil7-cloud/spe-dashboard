import { format } from 'date-fns'
import { supabase } from './supabase'
import { getAgeCategory } from './ageCategories'
import type { Payment } from '../types/index'

// Minimal shape needed to (re)generate an invoice — a subset of StudentWithFee
// so this works from both the payment-form success flow and payment history
// (which only has fee-relevant lite columns loaded).
export interface InvoiceStudentInfo {
  name: string
  parent_name: string | null
  parent_phone: string | null
  batch: string
  dob: string | null
  billing_cycle_day: number | null
}

export interface InvoiceResult {
  pdfUrl: string
  whatsappUrl: string
  pdfBlob: Blob
}

// Builds (or rebuilds) the invoice PDF for a payment and uploads it to the
// `payment-invoices` bucket at `{paymentId}.pdf` (upsert — safe to call again
// later to view/regenerate an older invoice from payment history).
export async function buildInvoice(
  payment: Payment,
  student: InvoiceStudentInfo,
  coachName: string,
): Promise<InvoiceResult> {
  const { data: settings } = await supabase
    .from('academy_settings')
    .select('academy_name')
    .single()
  const academyName = settings?.academy_name ?? 'Soccer Pro Elite Football Academy'

  const ageLabel = student.dob ? getAgeCategory(student.dob) : null

  // Next due date: compute from billing_cycle_day for NEXT month (since this month is now paid)
  const today = new Date()
  const day   = student.billing_cycle_day ?? 1
  const nm    = today.getMonth() === 11 ? 0 : today.getMonth() + 1
  const ny    = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear()
  const nextDue = format(new Date(ny, nm, day), 'yyyy-MM-dd')

  // Dynamically import to keep jsPDF out of initial bundle
  const { generateInvoice } = await import('./generateInvoice')

  const blob = await generateInvoice({
    paymentId:   payment.id,
    studentName: student.name,
    parentName:  student.parent_name,
    parentPhone: student.parent_phone,
    batch:       student.batch,
    ageLabel:    ageLabel ?? null,
    amount:      payment.amount,
    paidDate:    payment.paid_date,
    mode:        payment.mode,
    forCycle:    payment.for_cycle,
    nextDueDate: nextDue,
    coachName,
    academyName,
  })

  // Upload to Supabase storage
  const path = `${payment.id}.pdf`
  await supabase.storage
    .from('payment-invoices')
    .upload(path, blob, { contentType: 'application/pdf', upsert: true })

  const { data: urlData } = supabase.storage
    .from('payment-invoices')
    .getPublicUrl(path)

  const pdfUrl = urlData.publicUrl

  const forMonth = payment.for_cycle
    ? format(new Date(payment.for_cycle + '-01'), 'MMMM yyyy')
    : 'this month'

  const phone = student.parent_phone?.replace(/\D/g, '') ?? ''
  const waPhone = phone.startsWith('91') ? phone : `91${phone}`

  const msg = [
    `Hello ${student.parent_name ?? student.name},`,
    ``,
    `✅ Payment received for ${student.name}`,
    `Amount: ₹${payment.amount.toLocaleString('en-IN')} | ${forMonth}`,
    ``,
    `View your receipt here:`,
    pdfUrl,
    ``,
    `Thank you!`,
    `— ${academyName} ⚽`,
  ].join('\n')

  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`

  return { pdfUrl, whatsappUrl, pdfBlob: blob }
}
