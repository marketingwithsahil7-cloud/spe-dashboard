import jsPDF from 'jspdf'
import { format } from 'date-fns'

export interface InvoiceParams {
  paymentId:    string
  studentName:  string
  parentName:   string | null
  parentPhone:  string | null
  batch:        string
  ageLabel:     string | null
  amount:       number
  paidDate:     string   // 'yyyy-MM-dd'
  mode:         string | null
  forCycle:     string | null  // 'yyyy-MM'
  nextDueDate:  string   // 'yyyy-MM-dd' (empty string if none)
  coachName:    string
  academyName:  string
}

const GREEN  = [0, 255, 135] as const
const DARK   = [10, 10, 20] as const
const WHITE  = [255, 255, 255] as const
const GRAY   = [148, 163, 184] as const
const AMBER  = [255, 184, 0] as const

function formatMonth(ym: string): string {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM yyyy')
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'd MMM yyyy') } catch { return dateStr }
}

function formatAmount(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`
}

function roundRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'F') {
  doc.roundedRect(x, y, w, h, r, r, style)
}

export async function generateInvoice(params: InvoiceParams): Promise<Blob> {
  const {
    paymentId, studentName, parentName, parentPhone,
    batch, ageLabel, amount, paidDate, mode, forCycle,
    nextDueDate, coachName, academyName,
  } = params

  // Receipt-style: 148mm × 200mm (A5 height cropped a bit)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [148, 210] })
  const PW = 148
  const ML = 14
  const CW = PW - ML * 2  // 120mm content width

  // ── HEADER ───────────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, PW, 42, 'F')

  // Green left accent bar
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, 3.5, 42, 'F')

  // Academy name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...WHITE)
  doc.text(academyName.toUpperCase(), ML + 4, 14)

  // "PAYMENT RECEIPT" label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.text('PAYMENT RECEIPT', ML + 4, 21)

  // Date top-right
  doc.setFontSize(7)
  doc.text(formatDateDisplay(paidDate), PW - ML, 14, { align: 'right' })

  // Receipt number
  const shortId = paymentId.replace(/-/g, '').slice(0, 8).toUpperCase()
  doc.setTextColor(...GRAY)
  doc.text(`#${shortId}`, PW - ML, 21, { align: 'right' })

  // PAID badge (green pill)
  doc.setFillColor(...GREEN)
  roundRect(doc, PW - ML - 22, 26, 22, 7, 3.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...DARK)
  doc.text('✓ PAID', PW - ML - 11, 31.2, { align: 'center' })

  // ── GREEN ACCENT LINE ─────────────────────────────────────────────────────────
  doc.setFillColor(...GREEN)
  doc.rect(0, 42, PW, 1.5, 'F')

  let y = 52

  // ── AMOUNT (HERO) ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(32)
  doc.setTextColor(...GREEN)
  doc.text(formatAmount(amount), PW / 2, y, { align: 'center' })
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  const cycleLabel = forCycle ? `For ${formatMonth(forCycle)}` : 'Monthly Fee'
  doc.text(cycleLabel, PW / 2, y, { align: 'center' })
  y += 10

  // ── DIVIDER ───────────────────────────────────────────────────────────────────
  doc.setDrawColor(255, 255, 255, 0.1)
  doc.setLineWidth(0.3)
  doc.line(ML, y, PW - ML, y)
  y += 8

  // ── STUDENT DETAILS BOX ───────────────────────────────────────────────────────
  doc.setFillColor(18, 18, 26)
  roundRect(doc, ML, y, CW, 42, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...GREEN)
  doc.text('PLAYER', ML + 5, y + 7)

  const detailRows: [string, string][] = [
    ['Name',   studentName],
    ['Parent', parentName  || '—'],
    ['Mobile', parentPhone || '—'],
    ['Batch',  ageLabel ? `${batch} · ${ageLabel}` : batch],
  ]

  doc.setFont('helvetica', 'normal')
  let dy = y + 13
  for (const [label, value] of detailRows) {
    doc.setTextColor(...GRAY)
    doc.setFontSize(6.5)
    doc.text(label, ML + 5, dy)
    doc.setTextColor(...WHITE)
    doc.setFontSize(7.5)
    doc.text(value, ML + 28, dy)
    dy += 7
  }
  y += 48

  // ── PAYMENT DETAILS BOX ───────────────────────────────────────────────────────
  doc.setFillColor(18, 18, 26)
  roundRect(doc, ML, y, CW, 36, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...GREEN)
  doc.text('PAYMENT DETAILS', ML + 5, y + 7)

  const modeLabel = mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : '—'
  const payRows: [string, string][] = [
    ['Date',  formatDateDisplay(paidDate)],
    ['Mode',  modeLabel],
    ['Month', forCycle ? formatMonth(forCycle) : '—'],
  ]

  doc.setFont('helvetica', 'normal')
  dy = y + 13
  for (const [label, value] of payRows) {
    doc.setTextColor(...GRAY)
    doc.setFontSize(6.5)
    doc.text(label, ML + 5, dy)
    doc.setTextColor(...WHITE)
    doc.setFontSize(7.5)
    doc.text(value, ML + 28, dy)
    dy += 7
  }
  y += 42

  // ── NEXT DUE DATE ─────────────────────────────────────────────────────────────
  if (nextDueDate) {
    doc.setFillColor(0, 255, 135, 0.08)
    doc.setFillColor(12, 28, 22)
    roundRect(doc, ML, y, CW, 12, 3, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text('Next Due Date', ML + 5, y + 7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...AMBER)
    doc.text(formatDateDisplay(nextDueDate), PW - ML - 5, y + 7.5, { align: 'right' })
    y += 17
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────────
  const footerY = 195
  doc.setDrawColor(50, 55, 65)
  doc.setLineWidth(0.3)
  doc.line(ML, footerY - 6, PW - ML, footerY - 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...GREEN)
  doc.text('Thank you for your payment! ⚽', PW / 2, footerY, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...GRAY)
  doc.text(`Recorded by: ${coachName}`, ML, footerY + 6)
  doc.text(academyName, PW - ML, footerY + 6, { align: 'right' })

  return doc.output('blob')
}
