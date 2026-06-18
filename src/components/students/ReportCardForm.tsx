import { useState, useEffect, useCallback } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { Star, MessageCircle, ExternalLink, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import type { SkillRatings } from '../../types/index'
import type { StudentWithFee } from '../../hooks/useStudents'
import type { GenerateReportParams } from '../../hooks/useReports'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_RATINGS: SkillRatings = {
  ball_control: 0, passing: 0, shooting: 0,
  speed_agility: 0, discipline_attitude: 0, teamwork: 0,
}

const SKILL_LABELS: Record<keyof SkillRatings, string> = {
  ball_control:        'Ball Control',
  passing:             'Passing',
  shooting:            'Shooting',
  speed_agility:       'Speed & Agility',
  discipline_attitude: 'Discipline & Attitude',
  teamwork:            'Teamwork',
}

// ─── Star rating UI ───────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number
  onChange: (v: number) => void
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={20}
            style={{
              fill:       n <= active ? '#00D4FF' : 'none',
              stroke:     n <= active ? '#00D4FF' : '#475569',
              transition: 'fill 0.12s, stroke 0.12s',
            }}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="font-display text-xs font-semibold text-ice ml-1">{value}/5</span>
      )}
    </div>
  )
}

// ─── Attendance stats card ────────────────────────────────────────────────────

interface AttStats { present: number; total: number; percent: number }

function AttendancePill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <span className={cn('font-display text-lg font-bold', color)}>{value}</span>
      <span className="font-body text-[10px] text-slate-500 text-center leading-tight">{label}</span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:      boolean
  onClose:     () => void
  student:     StudentWithFee
  onGenerate:  (params: GenerateReportParams) => Promise<{ pdfUrl: string; whatsappUrl: string }>
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportCardForm({ isOpen, onClose, student, onGenerate }: Props) {
  const toast = useToast()

  const today = new Date()
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, i)
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy'), month: d.getMonth() + 1, year: d.getFullYear(), date: d }
  })

  const [selectedKey,  setSelectedKey]  = useState(monthOptions[0].value)
  const [ratings,      setRatings]      = useState<SkillRatings>(DEFAULT_RATINGS)
  const [remarks,      setRemarks]      = useState('')
  const [attStats,     setAttStats]     = useState<AttStats>({ present: 0, total: 0, percent: 0 })
  const [attLoading,   setAttLoading]   = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result,       setResult]       = useState<{ pdfUrl: string; whatsappUrl: string } | null>(null)

  const selectedOpt = monthOptions.find(o => o.value === selectedKey) ?? monthOptions[0]

  const fetchAttendance = useCallback(async () => {
    setAttLoading(true)
    const start = format(startOfMonth(selectedOpt.date), 'yyyy-MM-dd')
    const end   = format(endOfMonth(selectedOpt.date),   'yyyy-MM-dd')
    const { data } = await supabase
      .from('attendance')
      .select('present')
      .eq('student_id', student.id)
      .gte('date', start)
      .lte('date', end)
    const records = (data ?? []) as { present: boolean }[]
    const present = records.filter(r => r.present).length
    const total   = records.length
    setAttStats({ present, total, percent: total > 0 ? Math.round((present / total) * 100) : 0 })
    setAttLoading(false)
  }, [student.id, selectedOpt.date])

  useEffect(() => { if (isOpen) fetchAttendance() }, [isOpen, fetchAttendance])

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setRatings(DEFAULT_RATINGS)
      setRemarks('')
      setResult(null)
      setSelectedKey(monthOptions[0].value)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const allRated  = Object.values(ratings).every(v => v > 0)
  const setSkill  = (key: keyof SkillRatings, val: number) =>
    setRatings(prev => ({ ...prev, [key]: val }))

  const handleGenerate = async () => {
    if (!allRated) { toast.warning('Please rate all 6 skills before generating'); return }
    setIsGenerating(true)
    try {
      const res = await onGenerate({
        student,
        attendancePresent: attStats.present,
        attendanceTotal:   attStats.total,
        attendancePercent: attStats.percent,
        skillRatings:      ratings,
        coachRemarks:      remarks,
        month:             selectedOpt.month,
        year:              selectedOpt.year,
      })
      setResult(res)
      toast.success('Report generated and saved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const feeColor = student.feeStatus === 'paid' ? 'text-grass' : 'text-amber'
  const feeLabel = student.feeStatus === 'paid' ? 'PAID'
    : student.feeStatus.replace('_', ' ').toUpperCase()

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Report Card"
      footer={
        result ? (
          <div className="flex flex-col gap-2">
            {result.whatsappUrl && (
              <Button
                variant="primary"
                icon={<MessageCircle size={15} />}
                onClick={() => window.open(result.whatsappUrl, '_blank')}
                className="w-full"
              >
                Send via WhatsApp
              </Button>
            )}
            <Button
              variant="secondary"
              icon={<ExternalLink size={15} />}
              onClick={() => window.open(result.pdfUrl, '_blank')}
              className="w-full"
            >
              View PDF
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating || !allRated}
              className="flex-1"
              icon={isGenerating
                ? <Loader2 size={14} className="animate-spin" />
                : <FileText size={14} />}
            >
              {isGenerating ? 'Generating...' : 'Generate & Share'}
            </Button>
          </div>
        )
      }
    >
      {result ? (
        // ── Success state ───────────────────────────────────────────────────
        <div className="flex flex-col items-center gap-5 py-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,255,135,0.12)', border: '2px solid rgba(0,255,135,0.3)' }}
          >
            <CheckCircle2 size={30} className="text-grass" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white">Report Ready!</p>
            <p className="font-body text-sm text-slate-400 mt-1">
              {student.name}'s report for {selectedOpt.label} has been generated and saved.
            </p>
          </div>
          <div
            className="w-full p-3 rounded-xl font-body text-[11px] text-slate-500 break-all text-left"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {result.pdfUrl}
          </div>
        </div>
      ) : (
        // ── Form state ──────────────────────────────────────────────────────
        <div className="flex flex-col gap-5">

          {/* Month/Year selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Report Month</label>
            <div className="relative">
              <select
                value={selectedKey}
                onChange={e => { setSelectedKey(e.target.value); setResult(null) }}
                className="w-full h-10 pl-3 pr-8 rounded-xl font-body text-sm text-white appearance-none outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {monthOptions.map(o => (
                  <option key={o.value} value={o.value} style={{ background: '#12121A' }}>{o.label}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▾</span>
            </div>
          </div>

          {/* Auto-pulled data */}
          <div className="flex flex-col gap-2">
            <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto-Pulled Data</p>
            <div className="grid grid-cols-3 gap-2">
              {attLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl skeleton" />
                ))
              ) : (
                <>
                  <AttendancePill
                    label="Attendance"
                    value={`${attStats.percent}%`}
                    color={attStats.percent >= 75 ? 'text-grass' : 'text-amber'}
                  />
                  <AttendancePill
                    label="Sessions"
                    value={`${attStats.present}/${attStats.total}`}
                    color="text-white"
                  />
                  <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <span className={cn('font-display text-xs font-bold px-2 py-0.5 rounded-md', feeColor,
                      student.feeStatus === 'paid' ? 'bg-grass/10' : 'bg-amber/10')}>
                      {feeLabel}
                    </span>
                    <span className="font-body text-[10px] text-slate-500 text-center leading-tight mt-0.5">Fee Status</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Skill ratings */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">Skill Ratings</p>
              <p className="font-body text-[11px] text-slate-600">1 = needs work · 5 = excellent</p>
            </div>
            <div
              className="overflow-hidden rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {(Object.keys(DEFAULT_RATINGS) as Array<keyof SkillRatings>).map((key, i, arr) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <span className="font-body text-sm text-white w-36 shrink-0">{SKILL_LABELS[key]}</span>
                  <StarRating value={ratings[key]} onChange={v => setSkill(key, v)} />
                </div>
              ))}
            </div>
            {!allRated && (
              <p className="font-body text-xs text-amber mt-0.5">Rate all 6 skills to enable generation</p>
            )}
          </div>

          {/* Coach remarks */}
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Coach's Remarks <span className="text-slate-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={4}
              placeholder={`e.g. ${student.name.split(' ')[0]} has shown great improvement in ball control this month. Work ethic and coachability are outstanding...`}
              className="w-full rounded-xl font-body text-sm text-white resize-none outline-none p-3 placeholder-slate-600 leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

        </div>
      )}
    </Drawer>
  )
}
