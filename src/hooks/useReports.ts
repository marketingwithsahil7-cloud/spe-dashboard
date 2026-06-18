import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useAcademySettings } from './useAcademySettings'
import { getAge, getAgeCategory } from '../lib/ageCategories'
import type { StudentReport, SkillRatings } from '../types/index'
import type { StudentWithFee } from './useStudents'

export interface GenerateReportParams {
  student: StudentWithFee
  attendancePresent: number
  attendanceTotal: number
  attendancePercent: number
  skillRatings: SkillRatings
  coachRemarks: string
  month: number
  year: number
}

export interface UseReportsReturn {
  reports:         StudentReport[]
  isLoading:       boolean
  error:           string | null
  generateAndSave: (params: GenerateReportParams) => Promise<{ pdfUrl: string; whatsappUrl: string }>
  refetch:         () => void
}

export function useReports(studentId: string): UseReportsReturn {
  const [reports,   setReports]   = useState<StudentReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const { coach, user }  = useAuthStore()
  const { settings }     = useAcademySettings()

  const load = useCallback(async () => {
    if (!studentId) { setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('student_reports')
        .select('*')
        .eq('student_id', studentId)
        .order('year',  { ascending: false })
        .order('month', { ascending: false })
      if (err) throw err
      setReports((data ?? []) as StudentReport[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }, [studentId])

  useEffect(() => { load() }, [load])

  const generateAndSave = useCallback(async (params: GenerateReportParams): Promise<{ pdfUrl: string; whatsappUrl: string }> => {
    const {
      student, attendancePresent, attendanceTotal, attendancePercent,
      skillRatings, coachRemarks, month, year,
    } = params

    const monthLabel    = format(new Date(year, month - 1, 1), 'MMMM yyyy')
    const avgRating     = Object.values(skillRatings).reduce((a, b) => a + b, 0) / 6
    const progressLabel = avgRating >= 4 ? 'Excellent' : avgRating >= 2.5 ? 'Good' : 'Improving'

    // Build age label
    const age = getAge(student.dob)
    const cat = getAgeCategory(student.dob)
    const ageLabel = age !== null && cat ? `Age ${age} · ${cat}` : null

    // Dynamic import keeps jsPDF out of the initial bundle
    const { generateReportCard } = await import('../lib/generateReportCard')

    const blob = await generateReportCard({
      studentName:        student.name,
      batch:              student.batch,
      ageLabel,
      attendancePresent,
      attendanceTotal,
      attendancePercent,
      skillRatings,
      coachRemarks,
      feeStatus:          student.feeStatus,
      coachName:          coach?.name ?? 'Coach',
      month,
      year,
      academyName:        settings?.academy_name ?? 'Soccer Pro Elite Football Academy',
    })

    // Upload PDF
    const path = `${student.id}/${year}-${String(month).padStart(2, '0')}.pdf`
    const { error: upErr } = await supabase.storage
      .from('student-reports')
      .upload(path, blob, { contentType: 'application/pdf', upsert: true })
    if (upErr) throw upErr

    const { data: urlData } = supabase.storage
      .from('student-reports')
      .getPublicUrl(path)
    const pdfUrl = urlData.publicUrl

    // Upsert report record (unique on student_id + month + year)
    const { error: dbErr } = await supabase
      .from('student_reports')
      .upsert(
        {
          student_id:    student.id,
          month,
          year,
          skill_ratings: skillRatings,
          coach_remarks: coachRemarks || null,
          pdf_url:       pdfUrl,
          created_by:    user?.id ?? '',
        },
        { onConflict: 'student_id,month,year' },
      )
    if (dbErr) throw dbErr

    await load()

    // Build WhatsApp URL
    const phone = student.parent_phone?.replace(/\D/g, '') ?? ''
    const waMessage = [
      `Hello ${student.parent_name ? student.parent_name + ',' : ''}`,
      '',
      `📋 ${student.name}'s Performance Report for ${monthLabel} is ready!`,
      '',
      `⚽ Attendance: ${attendancePresent}/${attendanceTotal} sessions`,
      `⭐ Overall Progress: ${progressLabel}`,
      '',
      `View full report here:`,
      pdfUrl,
      '',
      `— Soccer Pro Elite Football Academy`,
    ].join('\n')

    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`
      : ''

    return { pdfUrl, whatsappUrl }
  }, [coach, user, settings, load])

  return { reports, isLoading, error, generateAndSave, refetch: load }
}
