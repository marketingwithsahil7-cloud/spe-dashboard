import jsPDF from 'jspdf'
import { format } from 'date-fns'
import type { SkillRatings, FeeStatus } from '../types/index'

export interface ReportCardParams {
  studentName: string
  batch: string
  ageLabel: string | null
  attendancePresent: number
  attendanceTotal: number
  attendancePercent: number
  skillRatings: SkillRatings
  coachRemarks: string
  feeStatus: FeeStatus
  coachName: string
  month: number
  year: number
  academyName: string
}

const SKILL_LABELS: Record<keyof SkillRatings, string> = {
  ball_control:        'Ball Control',
  passing:             'Passing',
  shooting:            'Shooting',
  speed_agility:       'Speed & Agility',
  discipline_attitude: 'Discipline & Attitude',
  teamwork:            'Teamwork',
}

// Draw 5 small filled/empty rectangles representing a star rating
function drawRatingBar(doc: jsPDF, x: number, y: number, rating: number): void {
  const boxW = 5.5
  const boxH = 3.5
  const gap  = 1
  for (let i = 0; i < 5; i++) {
    const bx = x + i * (boxW + gap)
    if (i < rating) doc.setFillColor(0, 180, 100)
    else            doc.setFillColor(215, 215, 220)
    doc.rect(bx, y, boxW, boxH, 'F')
  }
}

function sectionAccent(doc: jsPDF, x: number, y: number, greenW: number, totalW: number): void {
  doc.setFillColor(0, 200, 100)
  doc.rect(x, y, greenW, 0.8, 'F')
  doc.setFillColor(210, 215, 225)
  doc.rect(x + greenW, y, totalW - greenW, 0.4, 'F')
}

export async function generateReportCard(params: ReportCardParams): Promise<Blob> {
  const {
    studentName, batch, ageLabel,
    attendancePresent, attendanceTotal, attendancePercent,
    skillRatings, coachRemarks, feeStatus,
    coachName, month, year, academyName,
  } = params

  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy')
  const avgRating  = Object.values(skillRatings).reduce((a, b) => a + b, 0) / 6
  const progressLabel =
    avgRating >= 4.5 ? 'Outstanding' :
    avgRating >= 3.5 ? 'Excellent'   :
    avgRating >= 2.5 ? 'Good'        :
    avgRating >= 1.5 ? 'Fair'        :
    'Developing'

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210
  const ML = 18
  const MR = 18
  const CW = PW - ML - MR   // 174 mm
  let y = 0

  // ── HEADER BAR ─────────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 20)
  doc.rect(0, 0, PW, 36, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(academyName.toUpperCase(), PW / 2, 12, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 220, 120)
  doc.text('STUDENT PERFORMANCE REPORT', PW / 2, 20, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(160, 160, 160)
  doc.text(monthLabel, PW / 2, 28, { align: 'center' })

  y = 44

  // ── STUDENT INFO BOX ───────────────────────────────────────────────────────
  const infoH = ageLabel ? 28 : 23
  doc.setFillColor(243, 244, 248)
  doc.rect(ML, y, CW, infoH, 'F')
  doc.setDrawColor(210, 215, 225)
  doc.setLineWidth(0.3)
  doc.rect(ML, y, CW, infoH, 'S')

  // Left accent strip
  doc.setFillColor(0, 200, 100)
  doc.rect(ML, y, 3, infoH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 15, 25)
  doc.text(studentName, ML + 8, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(70, 70, 80)
  doc.text(`Batch: ${batch}`, ML + 8, y + 16)
  if (ageLabel) doc.text(ageLabel, ML + 8, y + 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(130, 130, 140)
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, PW - MR - 3, y + 9,  { align: 'right' })
  doc.text(`Prepared by: ${coachName}`,                       PW - MR - 3, y + 15, { align: 'right' })

  y += infoH + 10

  // ── ATTENDANCE ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 15, 25)
  doc.text('ATTENDANCE', ML, y)
  sectionAccent(doc, ML, y + 1.5, 30, CW)
  y += 7

  const barW = CW - 30
  const barH = 5.5

  doc.setFillColor(220, 220, 225)
  doc.rect(ML, y, barW, barH, 'F')

  const fillW = attendanceTotal > 0 ? Math.max(3, (attendancePercent / 100) * barW) : 0
  if (attendancePercent >= 75)      doc.setFillColor(0, 180, 100)
  else if (attendancePercent >= 50) doc.setFillColor(200, 140, 0)
  else                               doc.setFillColor(200, 40, 50)
  if (fillW > 0) doc.rect(ML, y, fillW, barH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  if (attendancePercent >= 75)      doc.setTextColor(0, 150, 80)
  else if (attendancePercent >= 50) doc.setTextColor(170, 110, 0)
  else                               doc.setTextColor(190, 30, 45)
  doc.text(`${attendancePercent}%`, PW - MR, y + 4.5, { align: 'right' })

  y += 9
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 90)
  doc.text(
    attendanceTotal > 0
      ? `${attendancePresent} of ${attendanceTotal} sessions attended`
      : 'No attendance recorded for this period',
    ML, y,
  )
  y += 12

  // ── SKILL RATINGS ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 15, 25)
  doc.text('SKILL RATINGS', ML, y)
  sectionAccent(doc, ML, y + 1.5, 35, CW)
  y += 7

  // Table header row
  doc.setFillColor(20, 20, 32)
  doc.rect(ML, y, CW, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  doc.text('SKILL',  ML + 3,        y + 4.5)
  doc.text('RATING', ML + 80,       y + 4.5)
  doc.text('SCORE',  PW - MR - 3,   y + 4.5, { align: 'right' })
  y += 7

  const rowH      = 8.5
  const skillKeys = Object.keys(skillRatings) as Array<keyof SkillRatings>
  const tableTopY = y - 7 - 7   // top of the full table (header + rows)

  skillKeys.forEach((key, i) => {
    if (i % 2 === 0) doc.setFillColor(255, 255, 255)
    else             doc.setFillColor(247, 248, 252)
    doc.rect(ML, y, CW, rowH, 'F')

    doc.setDrawColor(225, 225, 230)
    doc.setLineWidth(0.2)
    doc.line(ML, y + rowH, ML + CW, y + rowH)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 45)
    doc.text(SKILL_LABELS[key], ML + 3, y + 5.5)

    drawRatingBar(doc, ML + 80, y + 2.5, skillRatings[key])

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0, 150, 80)
    doc.text(`${skillRatings[key]} / 5`, PW - MR - 3, y + 5.5, { align: 'right' })

    y += rowH
  })

  // Outer table border
  doc.setDrawColor(200, 205, 215)
  doc.setLineWidth(0.3)
  doc.rect(ML, tableTopY, CW, y - tableTopY, 'S')

  y += 9

  // ── FEE STATUS ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 15, 25)
  doc.text('FEE STATUS', ML, y)
  sectionAccent(doc, ML, y + 1.5, 26, CW)
  y += 6

  const feeMap: Record<FeeStatus, { bgR: number; bgG: number; bgB: number; fgR: number; fgG: number; fgB: number; label: string }> = {
    paid:      { bgR: 225, bgG: 255, bgB: 238, fgR: 0,   fgG: 140, fgB: 75,  label: 'PAID' },
    due_soon:  { bgR: 255, bgG: 248, bgB: 210, fgR: 160, fgG: 110, fgB: 0,   label: 'DUE SOON' },
    due_today: { bgR: 255, bgG: 244, bgB: 205, fgR: 160, fgG: 100, fgB: 0,   label: 'DUE TODAY' },
    overdue:   { bgR: 255, bgG: 228, bgB: 232, fgR: 190, fgG: 30,  fgB: 45,  label: 'OVERDUE' },
  }
  const fm = feeMap[feeStatus]
  doc.setFillColor(fm.bgR, fm.bgG, fm.bgB)
  doc.rect(ML, y, 42, 7, 'F')
  doc.setDrawColor(fm.fgR, fm.fgG, fm.fgB)
  doc.setLineWidth(0.5)
  doc.rect(ML, y, 42, 7, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(fm.fgR, fm.fgG, fm.fgB)
  doc.text(fm.label, ML + 21, y + 4.7, { align: 'center' })

  y += 14

  // ── COACH'S REMARKS ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 15, 25)
  doc.text("COACH'S REMARKS", ML, y)
  sectionAccent(doc, ML, y + 1.5, 42, CW)
  y += 6

  const remarksText  = (coachRemarks ?? '').trim() || 'No additional remarks.'
  const splitRemarks = doc.splitTextToSize(remarksText, CW - 14)
  const linesShown   = Math.min(splitRemarks.length, 4)
  const remarkBoxH   = linesShown * 5.5 + 9

  doc.setFillColor(248, 250, 252)
  doc.rect(ML, y, CW, remarkBoxH, 'F')
  doc.setFillColor(0, 200, 100)
  doc.rect(ML, y, 2.5, remarkBoxH, 'F')
  doc.setDrawColor(210, 225, 215)
  doc.setLineWidth(0.3)
  doc.rect(ML + 2.5, y, CW - 2.5, remarkBoxH, 'S')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(50, 55, 65)
  doc.text(splitRemarks.slice(0, linesShown), ML + 7, y + 6.5)

  y += remarkBoxH + 10

  // ── OVERALL PROGRESS ───────────────────────────────────────────────────────
  doc.setFillColor(240, 255, 248)
  doc.rect(ML, y, CW, 10, 'F')
  doc.setDrawColor(0, 200, 100)
  doc.setLineWidth(0.3)
  doc.rect(ML, y, CW, 10, 'S')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(20, 20, 35)
  doc.text('Overall Progress:', ML + 4, y + 6.2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 140, 75)
  doc.text(progressLabel, ML + 38, y + 6.2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 110, 120)
  doc.text(`Avg. Rating: ${avgRating.toFixed(1)} / 5.0`, PW - MR - 3, y + 6.2, { align: 'right' })

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const footerY = 281
  doc.setDrawColor(200, 205, 215)
  doc.setLineWidth(0.3)
  doc.line(ML, footerY - 2, PW - MR, footerY - 2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(20, 20, 35)
  doc.text(academyName, ML, footerY + 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(110, 115, 130)
  doc.text(`Prepared by: ${coachName}`, ML, footerY + 7.5)
  doc.text(format(new Date(), 'dd MMM yyyy, hh:mm a'), PW - MR, footerY + 3,   { align: 'right' })
  doc.text('Confidential — For parent/guardian only',  PW - MR, footerY + 7.5, { align: 'right' })

  return doc.output('blob')
}
