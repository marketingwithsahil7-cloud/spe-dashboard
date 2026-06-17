import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ─── Store ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id:      string
  type:    ToastType
  message: string
}

interface ToastStore {
  toasts:    ToastItem[]
  add:       (type: ToastType, message: string) => void
  remove:    (id: string) => void
  removeAll: () => void
}

const useToastStore = create<ToastStore>(set => ({
  toasts: [],
  add: (type, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }))
  },
  remove:    id  => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  removeAll: ()  => set({ toasts: [] }),
}))

// ─── Public hook ──────────────────────────────────────────────────────────────

export function useToast() {
  const { add } = useToastStore()

  return {
    success: useCallback((msg: string) => add('success', msg), [add]),
    error:   useCallback((msg: string) => add('error',   msg), [add]),
    warning: useCallback((msg: string) => add('warning', msg), [add]),
    info:    useCallback((msg: string) => add('info',    msg), [add]),
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, {
  icon:    React.ReactNode
  bg:      string
  border:  string
  glow:    string
  text:    string
}> = {
  success: {
    icon:   <CheckCircle2 size={16} />,
    bg:     'rgba(0,255,135,0.08)',
    border: 'rgba(0,255,135,0.25)',
    glow:   '0 0 20px rgba(0,255,135,0.15)',
    text:   '#00FF87',
  },
  error: {
    icon:   <XCircle size={16} />,
    bg:     'rgba(255,61,87,0.1)',
    border: 'rgba(255,61,87,0.3)',
    glow:   '0 0 20px rgba(255,61,87,0.15)',
    text:   '#FF3D57',
  },
  warning: {
    icon:   <AlertTriangle size={16} />,
    bg:     'rgba(255,184,0,0.08)',
    border: 'rgba(255,184,0,0.25)',
    glow:   '0 0 20px rgba(255,184,0,0.12)',
    text:   '#FFB800',
  },
  info: {
    icon:   <Info size={16} />,
    bg:     'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.25)',
    glow:   '0 0 20px rgba(0,212,255,0.12)',
    text:   '#00D4FF',
  },
}

// ─── Single toast item ────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 3000

function ToastItem({ toast }: { toast: ToastItem }) {
  const remove    = useToastStore(s => s.remove)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cfg       = TOAST_CONFIG[toast.type]

  // Auto-dismiss after 3 s
  useEffect(() => {
    timerRef.current = setTimeout(() => remove(toast.id), AUTO_DISMISS_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [toast.id, remove])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 48, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 min-w-[260px] max-w-[380px] relative overflow-hidden"
      style={{
        background:    cfg.bg,
        border:        `1px solid ${cfg.border}`,
        boxShadow:     cfg.glow,
        backdropFilter: 'blur(24px)',
      }}
      onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current) }}
      onMouseLeave={() => { timerRef.current = setTimeout(() => remove(toast.id), AUTO_DISMISS_MS) }}
    >
      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 rounded-full"
        style={{ background: cfg.text }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
      />

      <span style={{ color: cfg.text }} className="shrink-0">{cfg.icon}</span>
      <p className="font-body text-sm text-white flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => remove(toast.id)}
        className="shrink-0 text-slate-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

// ─── Toast container ──────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-2 pointer-events-none"
      style={{ maxWidth: '90vw' }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
