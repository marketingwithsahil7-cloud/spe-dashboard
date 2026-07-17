import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { User, Pencil, MessageCircle, Phone, Calendar, IndianRupee, ExternalLink, Trash2 } from 'lucide-react'
import { gsap } from '../../lib/animations'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn, formatCurrency, formatDate, formatPhone } from '../../lib/utils'
import { getWhatsAppURL, ROUTES } from '../../lib/constants'
import { usePermissions } from '../../hooks/usePermissions'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { getAgeCategory } from '../../lib/ageCategories'
import type { StudentWithFee } from '../../hooks/useStudents'
import type { FeeStatus } from '../../types/index'

// ─── Fee status dot ───────────────────────────────────────────────────────────

const FEE_DOT: Record<FeeStatus, { color: string; label: string; pulse: boolean }> = {
  paid:     { color: '#00FF87', label: 'Paid',      pulse: false },
  due_soon: { color: '#FFB800', label: 'Due Soon',  pulse: false },
  due_today:{ color: '#FFB800', label: 'Due Today', pulse: true  },
  overdue:  { color: '#FF3D57', label: 'Overdue',   pulse: true  },
}

function FeeStatusDot({ status }: { status: FeeStatus }) {
  const { color, label, pulse } = FEE_DOT[status]
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn('w-2 h-2 rounded-full shrink-0', pulse && 'animate-pulse')}
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="font-body text-[11px]" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

// ─── Batch badge (inline — avoids misusing semantic badge variants) ───────────

function BatchBadge({ batch }: { batch: string }) {
  const styles: Record<string, React.CSSProperties> = {
    '5-6 PM': { background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)', color: '#00FF87' },
    '6-7 PM': { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' },
    'Both':   { background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' },
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-display font-medium uppercase tracking-wider"
      style={styles[batch] ?? styles['Both']}
    >
      {batch}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface StudentCardProps {
  student:   StudentWithFee
  onEdit:    (student: StudentWithFee) => void
  onDelete?: (student: StudentWithFee) => void
  index?:    number
}

export function StudentCard({ student, onEdit, onDelete, index = 0 }: StudentCardProps) {
  const navigate = useNavigate()
  const cardRef  = useRef<HTMLDivElement>(null)
  const { canEditStudent, canDeleteStudent } = usePermissions()
  const { isMobile } = useMediaQuery()

  // Swipe-to-reveal state (mobile only)
  const dragX = useMotionValue(0)
  const actionOpacity = useTransform(dragX, [-100, -48], [1, 0])
  const actionX       = useTransform(dragX, [-100, 0], [0, 80])

  const waURL = student.parent_phone
    ? getWhatsAppURL(
        student.parent_phone,
        student.parent_name ?? student.name,
        student.name,
        new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        student.monthly_fee,
      )
    : null

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if a button inside was clicked
    if ((e.target as HTMLElement).closest('button')) return
    navigate(`${ROUTES.STUDENTS}/${student.id}`)
  }

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { scale: 1.02, duration: 0.2, ease: 'power2.out' })
  }
  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { scale: 1, duration: 0.25, ease: 'power2.out' })
  }

  // Green glow flash on click — on-brand feedback
  const handleClick = (e: React.MouseEvent) => {
    gsap.fromTo(
      cardRef.current,
      { boxShadow: '0 0 0px rgba(0,255,135,0)' },
      { boxShadow: '0 0 28px rgba(0,255,135,0.35)', duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' },
    )
    handleCardClick(e)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20, delay: Math.min(index, 12) * 0.06 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Swipe-reveal action panel (mobile only) */}
      {isMobile && (
        <motion.div
          style={{ opacity: actionOpacity, x: actionX, background: 'rgba(0,255,135,0.08)', borderLeft: '1px solid rgba(0,255,135,0.15)' }}
          className="absolute inset-y-0 right-0 w-24 flex flex-col items-center justify-center gap-2 z-0"
        >
          {canEditStudent && (
            <button
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-grass"
              onClick={(e) => { e.stopPropagation(); animate(dragX, 0, { type: 'spring', stiffness: 500, damping: 40 }); onEdit(student) }}
            >
              <Pencil size={18} />
              <span className="text-[9px] font-display tracking-wider uppercase">Edit</span>
            </button>
          )}
          {waURL && (
            <button
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-ice"
              onClick={(e) => { e.stopPropagation(); animate(dragX, 0, { type: 'spring', stiffness: 500, damping: 40 }); window.open(waURL, '_blank') }}
            >
              <ExternalLink size={18} />
              <span className="text-[9px] font-display tracking-wider uppercase">WA</span>
            </button>
          )}
        </motion.div>
      )}

      {/* Main card — draggable on mobile */}
      <motion.div
        style={isMobile ? { x: dragX } : undefined}
        drag={isMobile ? 'x' : false}
        dragConstraints={{ left: -96, right: 0 }}
        dragElastic={0.1}
        onDragEnd={() => {
          const x = dragX.get()
          // Snap to open (-80) or closed (0)
          animate(dragX, x < -48 ? -80 : 0, { type: 'spring', stiffness: 500, damping: 40 })
        }}
      >
      <div
        ref={cardRef}
        className={cn(
          'glass flex flex-col gap-4 p-5 cursor-pointer will-change-transform',
          student.status === 'closed' && 'opacity-60',
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* ── Top: avatar + identity ─────────────────────────────────────── */}
        <div className="flex items-start gap-3.5">
          <Avatar
            name={student.name}
            src={student.photo_url}
            size="xl"
          />

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-display text-base font-semibold text-white leading-tight truncate">
              {student.name}
            </h3>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <BatchBadge batch={student.batch} />
              <Badge variant={student.status} />
              {student.dob && (() => {
                const cat = getAgeCategory(student.dob)
                return cat ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-display font-medium uppercase tracking-wider"
                    style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}
                  >
                    {cat}
                  </span>
                ) : null
              })()}
            </div>

            {/* Fee status dot */}
            <div className="mt-2">
              <FeeStatusDot status={student.feeStatus} />
            </div>
          </div>
        </div>

        {/* ── Middle: parent + fee details ──────────────────────────────── */}
        <div
          className="flex flex-col gap-1.5 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {student.parent_name && (
            <div className="flex items-center gap-2">
              <User size={11} className="text-slate-500 shrink-0" />
              <span className="font-body text-xs text-slate-400 truncate">{student.parent_name}</span>
            </div>
          )}
          {student.parent_phone && (
            <div className="flex items-center gap-2">
              <Phone size={11} className="text-slate-500 shrink-0" />
              <span className="font-body text-xs text-slate-400">{formatPhone(student.parent_phone)}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-2">
              <IndianRupee size={11} className="text-slate-500 shrink-0" />
              <span className="font-display text-xs font-semibold text-white">
                {formatCurrency(student.monthly_fee)}<span className="font-body font-normal text-slate-500">/mo</span>
              </span>
              {!student.fee_is_fixed && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-display font-medium uppercase tracking-wider"
                  style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}
                >
                  Flexible
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-slate-500 shrink-0" />
              <span className="font-body text-[11px] text-slate-500">{formatDate(student.join_date)}</span>
            </div>
          </div>
        </div>

        {/* ── Bottom: action buttons ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Button
            size="sm"
            variant="primary"
            className="flex-1 text-xs"
            onClick={(e) => { e.stopPropagation(); navigate(`${ROUTES.STUDENTS}/${student.id}`) }}
          >
            View Profile
          </Button>
          {canEditStudent && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Pencil size={12} />}
              className="text-xs"
              onClick={(e) => { e.stopPropagation(); onEdit(student) }}
            >
              Edit
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon={<MessageCircle size={12} />}
            disabled={!waURL}
            onClick={(e) => { e.stopPropagation(); if (waURL) window.open(waURL, '_blank') }}
          />
          {canDeleteStudent && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={12} className="text-danger" />}
              onClick={(e) => { e.stopPropagation(); onDelete(student) }}
            />
          )}
        </div>
      </div>
      </motion.div>
    </motion.div>
  )
}
