import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import { supabase } from './supabase'

// jsPDF doesn't ship the Rupee glyph in Helvetica — use ASCII prefix
const INR = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`

const cap = (s: string | null) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'

const fmtCycle = (c: string | null) => {
  if (!c) return '—'
  const d = new Date(c + '-01')
  return isNaN(d.getTime()) ? c : format(d, 'MMM yyyy')
}

// ─── Types for query results ───────────────────────────────────────────────────

interface PaymentRow {
  student_id: string
  amount: number
  paid_date: string
  for_cycle: string | null
  mode: string | null
  // Supabase untyped client infers foreign-key joins as arrays; handle both shapes
  student: { id: string; name: string } | { id: string; name: string }[] | null
}

function studentName(row: PaymentRow): string {
  if (!row.student) return '—'
  if (Array.isArray(row.student)) return row.student[0]?.name ?? '—'
  return row.student.name
}

interface ExpenseRow {
  title: string
  category: string
  fund_type: string
  amount: number
  expense_date: string
  note: string | null
}

interface StudentRow {
  id: string
  name: string
  monthly_fee: number
  billing_cycle_day: number | null
}

// ─── PDF helpers ───────────────────────────────────────────────────────────────

function sectionTitle(doc: jsPDF, title: string, y: number, ml: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(title, ml, y)
  doc.setLineWidth(0.35)
  doc.line(ml, y + 1.4, ml + doc.getTextWidth(title), y + 1.4)
  return y + 7
}

function statRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  ml: number,
  valueColor?: [number, number, number],
): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(label, ml, y)
  doc.setFont('helvetica', 'bold')
  if (valueColor) doc.setTextColor(...valueColor)
  doc.text(value, ml + 95, y)
  doc.setTextColor(0, 0, 0)
  return y + 6
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function generateMonthlyReport(month: number, year: number): Promise<void> {
  const monthStart = new Date(year, month - 1, 1)
  const start      = format(startOfMonth(monthStart), 'yyyy-MM-dd')
  const end        = format(endOfMonth(monthStart),   'yyyy-MM-dd')
  const monthLabel = format(monthStart, 'MMMM yyyy')

  // ── Parallel data fetch ─────────────────────────────────────────────────────
  const [paymentsRes, expensesRes, studentsRes] = await Promise.all([
    supabase
      .from('payments')
      .select('student_id, amount, paid_date, for_cycle, mode, student:student_id(id, name)')
      .gte('paid_date', start)
      .lte('paid_date', end)
      .order('paid_date', { ascending: false }),
    supabase
      .from('expenses')
      .select('title, category, fund_type, amount, expense_date, note')
      .gte('expense_date', start)
      .lte('expense_date', end)
      .order('expense_date', { ascending: false }),
    supabase
      .from('students')
      .select('id, name, monthly_fee, billing_cycle_day')
      .eq('status', 'active')
      .order('name'),
  ])

  if (paymentsRes.error) throw paymentsRes.error
  if (expensesRes.error) throw expensesRes.error
  if (studentsRes.error) throw studentsRes.error

  const payments = (paymentsRes.data ?? []) as unknown as PaymentRow[]
  const expenses = (expensesRes.data ?? []) as ExpenseRow[]
  const students = (studentsRes.data ?? []) as StudentRow[]

  // ── Computed totals ─────────────────────────────────────────────────────────
  const paidIds     = new Set(payments.map(p => p.student_id))
  const unpaid      = students.filter(s => !paidIds.has(s.id))
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)
  const revExp      = expenses.filter(e => e.fund_type === 'revenue')
  const emgExp      = expenses.filter(e => e.fund_type === 'emergency')
  const totalRevExp = revExp.reduce((s, e) => s + e.amount, 0)
  const totalEmgExp = emgExp.reduce((s, e) => s + e.amount, 0)
  const netProfit   = totalRevenue - totalRevExp

  // ── Build PDF ───────────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210
  const ML = 15
  // eslint-disable-next-line prefer-const
  let y = 15

  const tableDefaults = {
    styles:            { fontSize: 9, cellPadding: 2.8 },
    headStyles:        { fillColor: [20, 20, 20] as [number,number,number], textColor: [255, 255, 255] as [number,number,number], fontStyle: 'bold' as const, fontSize: 9 },
    alternateRowStyles:{ fillColor: [248, 248, 248] as [number,number,number] },
    margin:            { left: ML, right: ML },
  }

  // ── HEADER ──────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('SOCCER PRO ELITE FOOTBALL ACADEMY', PW / 2, y, { align: 'center' })
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text(`Monthly Financial Report — ${monthLabel}`, PW / 2, y, { align: 'center' })
  y += 6

  doc.setFontSize(8)
  doc.setTextColor(110, 110, 110)
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, PW / 2, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y += 5

  doc.setLineWidth(0.6)
  doc.line(ML, y, PW - ML, y)
  y += 7

  // ── SECTION 1 — REVENUE SUMMARY ─────────────────────────────────────────────
  y = sectionTitle(doc, '1. REVENUE SUMMARY', y, ML)
  y = statRow(doc, 'Total Fees Collected:', INR(totalRevenue), y, ML)
  y = statRow(doc, 'Students Paid:', `${paidIds.size} / ${students.length}`, y, ML)
  y += 3

  // ── SECTION 2 — FEE COLLECTION DETAILS ──────────────────────────────────────
  y = sectionTitle(doc, '2. FEE COLLECTION DETAILS', y, ML)

  autoTable(doc, {
    ...tableDefaults,
    startY: y,
    head: [['Sr.', 'Student Name', 'Amount', 'Date', 'Mode', 'Cycle']],
    body: payments.length > 0
      ? payments.map((p, i) => [
          i + 1,
          studentName(p),
          INR(p.amount),
          format(new Date(p.paid_date), 'dd MMM yyyy'),
          cap(p.mode),
          fmtCycle(p.for_cycle),
        ])
      : [['—', 'No payments recorded for this month', '', '', '', '']],
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 30 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: 26 },
    },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8

  // ── SECTION 3 — EXPENSES ────────────────────────────────────────────────────
  y = sectionTitle(doc, '3. EXPENSES', y, ML)

  autoTable(doc, {
    ...tableDefaults,
    startY: y,
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { ...tableDefaults.headStyles, fontSize: 8 },
    head: [['Sr.', 'Title', 'Category', 'Fund', 'Amount', 'Date', 'Note']],
    body: expenses.length > 0
      ? expenses.map((e, i) => [
          i + 1,
          e.title,
          cap(e.category),
          e.fund_type === 'revenue' ? 'Revenue' : 'Emergency',
          INR(e.amount),
          format(new Date(e.expense_date), 'dd MMM yyyy'),
          e.note ?? '—',
        ])
      : [['—', 'No expenses recorded for this month', '', '', '', '', '']],
    columnStyles: {
      0: { cellWidth: 10 },
      4: { cellWidth: 28 },
      5: { cellWidth: 26 },
    },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 80)
  doc.text(
    `Revenue expenses: ${INR(totalRevExp)}   |   Emergency expenses: ${INR(totalEmgExp)}   |   Total expenses: ${INR(totalRevExp + totalEmgExp)}`,
    ML, y,
  )
  doc.setTextColor(0, 0, 0)
  y += 8

  // ── SECTION 4 — PROFIT / LOSS ────────────────────────────────────────────────
  y = sectionTitle(doc, '4. PROFIT / LOSS SUMMARY', y, ML)
  y = statRow(doc, 'Total Revenue (fees collected):', INR(totalRevenue), y, ML)
  y = statRow(doc, 'Total Revenue Expenses:', INR(totalRevExp), y, ML)

  const profitColor: [number, number, number] = netProfit >= 0 ? [0, 130, 60] : [180, 0, 0]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Net Profit:', ML, y)
  doc.setTextColor(...profitColor)
  doc.text(INR(netProfit), ML + 95, y)
  doc.setTextColor(0, 0, 0)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Actual Profit (after cash verification):', ML, y)
  doc.setLineWidth(0.3)
  doc.line(ML + 80, y, ML + 80 + 55, y)
  y += 5
  doc.setFontSize(7.5)
  doc.setTextColor(130, 130, 130)
  doc.text('(Fill manually after cash verification)', ML + 80, y)
  doc.setTextColor(0, 0, 0)
  y += 9

  // ── SECTION 5 — PENDING FEES ────────────────────────────────────────────────
  y = sectionTitle(doc, '5. PENDING FEES', y, ML)
  const today = new Date()

  autoTable(doc, {
    ...tableDefaults,
    startY: y,
    head: [['Sr.', 'Student Name', 'Amount Due', 'Days Overdue']],
    body: unpaid.length > 0
      ? unpaid.map((s, i) => {
          const bd   = s.billing_cycle_day ?? 1
          const due  = new Date(year, month - 1, bd)
          const days = due <= today ? differenceInDays(today, due) : 0
          return [
            i + 1,
            s.name,
            INR(s.monthly_fee),
            days > 0 ? `${days} days` : 'Not yet due',
          ]
        })
      : [['—', 'All active students have paid this month!', '', '']],
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
    },
  })

  // ── FOOTER on every page ─────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    const fy = 288
    doc.setLineWidth(0.3)
    doc.line(ML, fy - 4, PW - ML, fy - 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.text('Prepared by: Coach Sahil  |  Soccer Pro Elite Football Academy', ML, fy)
    doc.text(`Page ${i} of ${pages}`, PW - ML, fy, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  doc.save(`SPE_Report_${format(monthStart, 'MMMM_yyyy')}.pdf`)
}
