import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, AlertCircle } from 'lucide-react'
import { getAge, getAgeCategory } from '../../lib/ageCategories'
import { SuccessOverlay } from '../ui/SuccessOverlay'
import { Drawer } from '../ui/Drawer'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../lib/utils'
import type { StudentWithFee, StudentInput } from '../../hooks/useStudents'
import type { Student, BatchType, StudentStatus } from '../../types/index'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentFormProps {
  isOpen:        boolean
  onClose:       () => void
  student?:      StudentWithFee | null
  onAdd:         (data: StudentInput) => Promise<Student>
  onUpdate:      (id: string, data: Partial<StudentInput>) => Promise<void>
  onUploadPhoto: (file: File, studentId: string) => Promise<string>
}

interface FormState {
  name:             string
  batch:            BatchType | ''
  status:           StudentStatus
  parentName:       string
  parentPhone:      string
  monthlyFee:       string
  feeIsFixed:       boolean
  billingCycleDay:  number
  joinDate:         string
  joinDateUnknown:  boolean
  dob:              string
}

interface FormErrors {
  name?:        string
  batch?:       string
  parentPhone?: string
  monthlyFee?:  string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BATCH_OPTIONS = [
  { value: '5-6 PM', label: '5-6 PM' },
  { value: '6-7 PM', label: '6-7 PM' },
  { value: 'Both',   label: 'Both'   },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'trial',  label: 'Trial'  },
  { value: 'closed', label: 'Closed' },
]

function blankForm(): FormState {
  return {
    name:            '',
    batch:           '',
    status:          'active',
    parentName:      '',
    parentPhone:     '',
    monthlyFee:      '2000',
    feeIsFixed:      true,
    billingCycleDay: 1,
    joinDate:        '',
    joinDateUnknown: false,
    dob:             '',
  }
}

function studentToForm(s: StudentWithFee): FormState {
  return {
    name:            s.name,
    batch:           s.batch,
    status:          s.status,
    parentName:      s.parent_name      ?? '',
    parentPhone:     s.parent_phone
      ? s.parent_phone.replace(/^\+91/, '').replace(/\D/g, '')
      : '',
    monthlyFee:      String(s.monthly_fee),
    feeIsFixed:      s.fee_is_fixed ?? true,
    billingCycleDay: s.billing_cycle_day ?? 1,
    joinDate:        s.join_date ?? '',
    joinDateUnknown: !s.join_date,
    dob:             s.dob ?? '',
  }
}

// ─── Phone auto-format ────────────────────────────────────────────────────────

function formatPhoneInput(raw: string): string {
  // Keep only digits, max 10
  return raw.replace(/\D/g, '').slice(0, 10)
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim())  errors.name  = 'Student name is required'
  if (!form.batch)        errors.batch = 'Please select a batch'
  if (form.parentPhone && form.parentPhone.length !== 10) {
    errors.parentPhone = 'Enter a valid 10-digit mobile number'
  }
  const fee = Number(form.monthlyFee)
  if (isNaN(fee) || fee <= 0) errors.monthlyFee = 'Enter a valid fee amount'
  return errors
}

// ─── Slider component ─────────────────────────────────────────────────────────

function DaySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest">
        Billing Cycle Day
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={31}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00FF87 0%, #00FF87 ${((value - 1) / 30) * 100}%, rgba(255,255,255,0.1) ${((value - 1) / 30) * 100}%, rgba(255,255,255,0.1) 100%)`,
            accentColor: '#00FF87',
          }}
        />
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-semibold text-sm text-grass"
          style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)' }}
        >
          {value}
        </div>
      </div>
      <p className="text-[11px] font-body text-slate-500">
        Fee due on day <span className="text-grass font-semibold">{value}</span> of each month
      </p>
    </div>
  )
}

// ─── Photo picker ─────────────────────────────────────────────────────────────

interface PhotoPickerProps {
  preview:    string | null
  name:       string
  currentUrl: string | null
  onChange:   (file: File, preview: string) => void
}

function PhotoPicker({ preview, name, currentUrl, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (ev.target?.result) onChange(file, ev.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  const displaySrc = preview ?? currentUrl

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full group"
      >
        <Avatar name={name || 'S'} src={displaySrc} size="xl" className="w-20 h-20 text-2xl" />
        {/* Overlay on hover */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <Camera size={20} className="text-white" />
        </div>
      </button>
      <p className="font-body text-[11px] text-slate-500">Click to upload photo</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function StudentForm({ isOpen, onClose, student, onAdd, onUpdate, onUploadPhoto }: StudentFormProps) {
  const isEditing = !!student

  const [form,       setForm]       = useState<FormState>(blankForm)
  const [errors,     setErrors]     = useState<FormErrors>({})
  const [photoFile,  setPhotoFile]  = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSaving,     setIsSaving]     = useState(false)
  const [saveError,    setSaveError]    = useState<string | null>(null)
  const [showSuccess,  setShowSuccess]  = useState(false)

  // Reset overlay/error on every isOpen change — including close.
  // showSuccess MUST clear on close: if the invisible overlay stays in the DOM
  // at z-10000 after its GSAP fade, it blocks all taps until the next page refresh.
  useEffect(() => {
    setSaveError(null)
    setShowSuccess(false)
    if (isOpen) {
      setForm(student ? studentToForm(student) : blankForm())
      setErrors({})
      setPhotoFile(null)
      setPhotoPreview(null)
    }
  }, [isOpen, student])

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }, [])

  const handlePhotoChange = (file: File, preview: string) => {
    setPhotoFile(file)
    setPhotoPreview(preview)
  }

  const handleSave = async () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const payload: StudentInput = {
        name:             form.name.trim(),
        batch:            form.batch as BatchType,
        status:           form.status,
        parent_name:      form.parentName.trim()  || null,
        parent_phone:     form.parentPhone        ? `+91${form.parentPhone}` : null,
        monthly_fee:      Number(form.monthlyFee),
        fee_is_fixed:     form.feeIsFixed,
        billing_cycle_day: form.billingCycleDay,
        join_date:        (form.joinDateUnknown || !form.joinDate) ? null : form.joinDate,
        dob:              form.dob || null,
      }

      if (isEditing && student) {
        // Upload new photo first if one was selected
        if (photoFile) {
          const url = await onUploadPhoto(photoFile, student.id)
          payload.photo_url = url
        }
        await onUpdate(student.id, payload)
      } else {
        // Insert student, then upload photo
        const newStudent = await onAdd(payload)
        if (photoFile) {
          const url = await onUploadPhoto(photoFile, newStudent.id)
          await onUpdate(newStudent.id, { photo_url: url })
        }
      }

      setShowSuccess(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save student')
    } finally {
      setIsSaving(false)
    }
  }

  const title = isEditing
    ? `Edit — ${student?.name ?? ''}`
    : 'Add New Student'

  const drawerFooter = (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        fullWidth
        onClick={onClose}
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        fullWidth
        loading={isSaving}
        onClick={handleSave}
      >
        {isEditing ? 'Save Changes' : 'Add Student'}
      </Button>
    </div>
  )

  return (
    <>
    {showSuccess && <SuccessOverlay message="Student saved!" onDone={onClose} />}
    <Drawer isOpen={isOpen} onClose={onClose} title={title} width="480px" footer={drawerFooter}>
      <div className="flex flex-col gap-6 pb-4">

        {/* ── Photo picker ──────────────────────────────────────────────── */}
        <PhotoPicker
          preview={photoPreview}
          name={form.name}
          currentUrl={student?.photo_url ?? null}
          onChange={handlePhotoChange}
        />

        {/* ── Name ──────────────────────────────────────────────────────── */}
        <Input
          label="Student Name"
          placeholder="e.g. Arjun Sharma"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          error={errors.name}
          autoFocus
        />

        {/* ── Batch + Status (side by side) ────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Batch"
            options={BATCH_OPTIONS}
            placeholder="Select batch"
            value={form.batch}
            onChange={e => set('batch', e.target.value as BatchType | '')}
            error={errors.batch}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={e => set('status', e.target.value as StudentStatus)}
          />
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

        {/* ── Parent Name ───────────────────────────────────────────────── */}
        <Input
          label="Parent Name"
          placeholder="e.g. Rakesh Sharma"
          value={form.parentName}
          onChange={e => set('parentName', e.target.value)}
        />

        {/* ── Parent Phone ──────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest">
            Parent Phone
          </label>
          <div className="relative flex items-center">
            <span
              className="absolute left-0 h-11 w-14 flex items-center justify-center rounded-l-xl font-body text-sm text-slate-400 shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRight: 'none' }}
            >
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={form.parentPhone}
              onChange={e => set('parentPhone', formatPhoneInput(e.target.value))}
              className={cn(
                'w-full h-11 pl-16 pr-4 rounded-xl font-body text-sm text-white placeholder:text-slate-600',
                'outline-none transition-all duration-200',
                errors.parentPhone
                  ? 'focus:shadow-[0_0_0_3px_rgba(255,61,87,0.08)]'
                  : 'focus:shadow-[0_0_0_3px_rgba(0,255,135,0.06)]',
              )}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${errors.parentPhone ? 'rgba(255,61,87,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
              onFocus={e => {
                if (!errors.parentPhone) {
                  e.currentTarget.style.border = '1px solid rgba(0,255,135,0.35)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }
              }}
              onBlur={e => {
                if (!errors.parentPhone) {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
            />
          </div>
          {errors.parentPhone && (
            <p className="text-[11px] font-body text-danger flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-danger shrink-0" />
              {errors.parentPhone}
            </p>
          )}
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

        {/* ── Monthly Fee ───────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest">
            Monthly Fee
          </label>
          <div className="relative flex items-center">
            <span
              className="absolute left-0 h-11 w-11 flex items-center justify-center rounded-l-xl font-body text-sm text-slate-400 shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRight: 'none' }}
            >
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="2000"
              min={0}
              value={form.monthlyFee}
              onChange={e => set('monthlyFee', e.target.value)}
              className={cn(
                'w-full h-11 pl-12 pr-4 rounded-xl font-body text-sm text-white placeholder:text-slate-600',
                'outline-none transition-all duration-200',
                errors.monthlyFee
                  ? 'focus:shadow-[0_0_0_3px_rgba(255,61,87,0.08)]'
                  : 'focus:shadow-[0_0_0_3px_rgba(0,255,135,0.06)]',
              )}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${errors.monthlyFee ? 'rgba(255,61,87,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
              onFocus={e => {
                if (!errors.monthlyFee) {
                  e.currentTarget.style.border = '1px solid rgba(0,255,135,0.35)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }
              }}
              onBlur={e => {
                if (!errors.monthlyFee) {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
            />
          </div>
          {errors.monthlyFee && (
            <p className="text-[11px] font-body text-danger flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-danger shrink-0" />
              {errors.monthlyFee}
            </p>
          )}
        </div>

        {/* ── Fixed Fee Toggle ──────────────────────────────────────────── */}
        <div
          className="flex items-start justify-between gap-4 p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-white">Fixed Monthly Fee</p>
            <p className="font-body text-[11px] text-slate-500 mt-1 leading-relaxed">
              {form.feeIsFixed
                ? 'Fee amount is locked — same every month (e.g. Rs. 2000 every month)'
                : 'Fee amount can vary each month — useful if registration fee differs from regular monthly fee (e.g. Rs. 5000 first month, Rs. 3500 after)'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.feeIsFixed}
            onClick={() => set('feeIsFixed', !form.feeIsFixed)}
            className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-200 mt-0.5 focus:outline-none"
            style={{
              background: form.feeIsFixed ? '#00FF87' : 'rgba(255,255,255,0.12)',
              boxShadow: form.feeIsFixed ? '0 0 12px rgba(0,255,135,0.35)' : 'none',
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: form.feeIsFixed ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {/* ── Billing Cycle Day slider ──────────────────────────────────── */}
        <DaySlider
          value={form.billingCycleDay}
          onChange={v => set('billingCycleDay', v)}
        />

        {/* ── Join Date + DOB (side by side) ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest">
              Join Date
            </label>
            <input
              type="date"
              value={form.joinDate}
              disabled={form.joinDateUnknown}
              onChange={e => set('joinDate', e.target.value)}
              className="w-full h-11 px-4 rounded-xl font-body text-sm text-white outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(0,255,135,0.06)] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                colorScheme: 'dark',
              }}
              onFocus={e => {
                if (!form.joinDateUnknown) {
                  e.currentTarget.style.border = '1px solid rgba(0,255,135,0.35)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
            />
            {/* "Don't know" checkbox */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.joinDateUnknown}
                onChange={e => {
                  set('joinDateUnknown', e.target.checked)
                  if (e.target.checked) set('joinDate', '')
                }}
                className="w-3.5 h-3.5 rounded accent-grass cursor-pointer"
              />
              <span className="font-body text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors leading-tight">
                Don't know exact date
              </span>
            </label>
          </div>

          {/* ── Date of Birth ────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest">
              Date of Birth
            </label>
            <input
              type="date"
              value={form.dob}
              onChange={e => set('dob', e.target.value)}
              className="w-full h-11 px-4 rounded-xl font-body text-sm text-white outline-none transition-all duration-200 focus:shadow-[0_0_0_3px_rgba(0,255,135,0.06)]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                colorScheme: 'dark',
              }}
              onFocus={e => {
                e.currentTarget.style.border = '1px solid rgba(0,255,135,0.35)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
            />
            {form.dob && (() => {
              const age = getAge(form.dob)
              const cat = getAgeCategory(form.dob)
              return age !== null ? (
                <p className="text-[11px] font-body text-grass">
                  Age {age} · <span className="font-semibold">{cat}</span>
                </p>
              ) : null
            })()}
          </div>
        </div>

        {/* ── Save error ────────────────────────────────────────────────── */}
        {saveError && (
          <div
            className="flex items-start gap-3 p-3.5 rounded-xl"
            style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.25)' }}
          >
            <AlertCircle size={15} className="text-danger shrink-0 mt-0.5" />
            <p className="font-body text-sm text-danger">{saveError}</p>
          </div>
        )}
      </div>
    </Drawer>
    </>
  )
}
