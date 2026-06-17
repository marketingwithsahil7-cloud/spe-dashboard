import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  open:          boolean
  title:         string
  description?:  string
  confirmLabel?: string
  cancelLabel?:  string
  variant?:      'danger' | 'default'
  loading?:      boolean
  onConfirm:     () => void
  onCancel:      () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'default',
  loading      = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger'

  // Close on Escape
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) onCancel()
  }, [loading, onCancel])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[900] bg-black/60"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={() => { if (!loading) onCancel() }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={{    opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="fixed inset-0 z-[901] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
              style={{
                background:    'rgba(18,18,26,0.98)',
                backdropFilter: 'blur(32px)',
                border:        isDanger
                               ? '1px solid rgba(255,61,87,0.2)'
                               : '1px solid rgba(255,255,255,0.1)',
                boxShadow:     isDanger
                               ? '0 24px 64px rgba(0,0,0,0.6), 0 0 32px rgba(255,61,87,0.1)'
                               : '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              {/* Icon + close */}
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center',
                    isDanger ? 'bg-danger/10' : 'bg-white/[0.06]',
                  )}
                >
                  {isDanger
                    ? <Trash2 size={18} className="text-danger" />
                    : <AlertTriangle size={18} className="text-amber" />}
                </div>
                <button
                  onClick={() => { if (!loading) onCancel() }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <h3 className="font-display text-lg text-white font-bold leading-tight">{title}</h3>
                {description && (
                  <p className="font-body text-sm text-slate-400 leading-relaxed">{description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={onCancel}
                  disabled={loading}
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={isDanger ? 'danger' : 'primary'}
                  size="md"
                  fullWidth
                  loading={loading}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
