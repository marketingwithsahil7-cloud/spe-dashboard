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

// All colors use plain RGB — no emoji, no Unicode symbols outside Latin-1
// so jsPDF's built-in Helvetica renders everything correctly.
const G   = [0, 195, 95]    as const   // brand green (readable on both dark + white)
const NAV = [10, 22, 40]    as const   // header navy
const W   = [255, 255, 255]  as const   // white
const GR  = [148, 163, 184]  as const   // label gray (on dark bg cards)
const SGR = [80, 96, 115]   as const   // sub-text gray (on white bg)
const AMB = [185, 125, 0]   as const   // amber (on dark next-due bar)
const CRD = [18, 18, 30]    as const   // card bg
const LN  = [200, 212, 225]  as const   // divider line on white bg

function fmtMonth(ym: string): string {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM yyyy')
}

function fmtDate(d: string): string {
  if (!d) return '--'
  try { return format(new Date(d), 'd MMM yyyy') } catch { return d }
}

// Use "Rs." prefix — avoids the rupee Unicode glyph (U+20B9) which is
// outside jsPDF's built-in Helvetica character set and renders broken.
function fmtAmt(n: number): string {
  return `Rs. ${n.toLocaleString('en-IN')}`
}

export async function generateInvoice(params: InvoiceParams): Promise<Blob> {
  const {
    paymentId, studentName, parentName, parentPhone,
    batch, ageLabel, amount, paidDate, mode, forCycle,
    nextDueDate, coachName, academyName,
  } = params

  // A5 receipt: 148 × 210 mm
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [148, 210] })
  const PW = 148   // page width
  const ML = 15    // left margin
  const CW = 118   // content width (PW - 2*ML)

  // ── HEADER BAND ──────────────────────────────────────────────────────────────
  const HH = 44
  doc.setFillColor(...NAV)
  doc.rect(0, 0, PW, HH, 'F')
  // Green left accent bar (brand signature)
  doc.setFillColor(...G)
  doc.rect(0, 0, 4.5, HH, 'F')

  // Academy name — top-left
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...W)
  doc.text(academyName.toUpperCase(), ML + 6, 16)

  // "PAYMENT RECEIPT" sub-label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GR)
  doc.text('PAYMENT RECEIPT', ML + 6, 24)

  // Receipt ID — top-right
  const shortId = paymentId.replace(/-/g, '').slice(0, 8).toUpperCase()
  doc.setFontSize(7)
  doc.text(`#${shortId}`, PW - ML, 16, { align: 'right' })

  // Payment date — below receipt ID
  doc.setFontSize(7.5)
  doc.setTextColor(...W)
  doc.text(fmtDate(paidDate), PW - ML, 24, { align: 'right' })

  // PAID badge — bottom-right of header
  // Text-only pill (no checkmark emoji — U+2713 is outside Latin-1)
  const BW = 18, BH = 7
  const bx = PW - ML - BW, by = HH - 12
  doc.setFillColor(...G)
  doc.roundedRect(bx, by, BW, BH, 3.5, 3.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...NAV)
  doc.text('PAID', bx + BW / 2, by + BH / 2 + 1.5, { align: 'center' })

  // ── AMOUNT SECTION ────────────────────────────────────────────────────────────
  // Single text() call with align:'center' — prevents the "superscript 1" bug
  // that occurs when the amount is split across multiple text() positioning calls.
  let y = HH + 14  // = 58

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(34)
  doc.setTextColor(...G)
  doc.text(fmtAmt(amount), PW / 2, y, { align: 'center' })
  y += 8  // 66

  if (forCycle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SGR)
    doc.text(`For ${fmtMonth(forCycle)}`, PW / 2, y, { align: 'center' })
    y += 5  // 71
  }
  y += 6  // 77

  // Horizontal divider
  doc.setDrawColor(...LN)
  doc.setLineWidth(0.3)
  doc.line(ML, y, PW - ML, y)
  y += 9  // 86

  // ── PLAYER CARD ───────────────────────────────────────────────────────────────
  // Height calculation: label row (9mm) + gap (8mm) + 4 data rows * 6.5mm + bottom pad (5mm) = 41mm
  const rows1: [string, string][] = [
    ['Name',   studentName],
    ['Parent', parentName  || '--'],
    ['Mobile', parentPhone || '--'],
    ['Batch',  ageLabel ? `${batch}  |  ${ageLabel}` : batch],
  ]
  const C1H = 41
  doc.setFillColor(...CRD)
  doc.roundedRect(ML, y, CW, C1H, 4, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...G)
  doc.text('PLAYER', ML + 6, y + 9)

  let ry = y + 17  // first data row baseline
  for (const [lbl, val] of rows1) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...GR)
    doc.text(lbl, ML + 6, ry)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...W)
    doc.text(val, ML + 28, ry)
    ry += 6.5
  }
  y += C1H + 5  // 132

  // ── PAYMENT DETAILS CARD ──────────────────────────────────────────────────────
  // Height: label (9) + gap (8) + 3 rows * 6.5 + pad (5) = 41.5 → 34mm (compact)
  const modeLabel = mode
    ? mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase()
    : '--'
  const rows2: [string, string][] = [
    ['Date',  fmtDate(paidDate)],
    ['Mode',  modeLabel],
    ['Month', forCycle ? fmtMonth(forCycle) : '--'],
  ]
  const C2H = 34
  doc.setFillColor(...CRD)
  doc.roundedRect(ML, y, CW, C2H, 4, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...G)
  doc.text('PAYMENT DETAILS', ML + 6, y + 9)

  ry = y + 17
  for (const [lbl, val] of rows2) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...GR)
    doc.text(lbl, ML + 6, ry)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...W)
    doc.text(val, ML + 28, ry)
    ry += 6.5
  }
  y += C2H + 6  // 172

  // ── NEXT DUE DATE BAR ─────────────────────────────────────────────────────────
  if (nextDueDate) {
    doc.setFillColor(12, 26, 18)   // dark green-tinted bg
    doc.roundedRect(ML, y, CW, 12, 3, 3, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GR)
    doc.text('Next Due Date', ML + 6, y + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...AMB)
    doc.text(fmtDate(nextDueDate), ML + CW - 6, y + 8, { align: 'right' })
    y += 17  // 189
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────────
  y += 4  // breathing gap → 193
  doc.setDrawColor(...LN)
  doc.setLineWidth(0.3)
  doc.line(ML, y, PW - ML, y)
  y += 7  // 200

  // No emoji — "Thank you for your payment!" in plain ASCII
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...G)
  doc.text('Thank you for your payment!', PW / 2, y, { align: 'center' })
  y += 6  // 206

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...SGR)
  doc.text(`Recorded by: ${coachName}`, ML, y)
  doc.text(academyName, PW - ML, y, { align: 'right' })

  return doc.output('blob')
}
