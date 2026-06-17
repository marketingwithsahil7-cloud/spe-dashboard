import { useState } from 'react'
import { format } from 'date-fns'
import { StickyNote, Trash2, Loader2, Send } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { FinancialNoteWithAuthor } from '../../hooks/useFinancials'

// ─── Props ────────────────────────────────────────────────────────────────────

interface FinancialNotesProps {
  notes:      FinancialNoteWithAuthor[]
  isLoading:  boolean
  onAdd:      (content: string) => Promise<void>
  onDelete:   (id: string) => Promise<void>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FinancialNotes({ notes, isLoading, onAdd, onDelete }: FinancialNotesProps) {
  const [draft,        setDraft]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [confirmId,    setConfirmId]    = useState<string | null>(null)
  const [saveError,    setSaveError]    = useState<string | null>(null)

  const handleAdd = async () => {
    if (!draft.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      await onAdd(draft.trim())
      setDraft('')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await onDelete(id) } catch { /* parent handles */ }
    finally { setDeletingId(null); setConfirmId(null) }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAdd()
    }
  }

  const inputCls = cn(
    'w-full px-4 py-3 rounded-xl font-body text-sm text-white resize-none',
    'bg-white/[0.04] border border-white/[0.08]',
    'focus:outline-none focus:ring-2 focus:ring-grass/40 focus:border-grass/40',
    'transition-colors placeholder:text-slate-600',
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-2xl skeleton" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Add note ──────────────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <StickyNote size={15} className="text-grass" />
          <span className="font-display text-sm font-semibold text-white uppercase tracking-wider">Add Note</span>
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a financial observation, reminder, or note… (Ctrl+Enter to save)"
          rows={3}
          className={inputCls}
        />
        {saveError && (
          <p className="font-body text-xs text-danger">{saveError}</p>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={saving || !draft.trim()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all duration-150',
              draft.trim() && !saving
                ? 'text-pitch bg-grass hover:bg-grassDim shadow-[0_0_12px_rgba(0,255,135,0.2)]'
                : 'text-slate-600 cursor-not-allowed',
            )}
            style={!draft.trim() || saving ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } : undefined}
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : <><Send size={14} /> Save Note</>
            }
          </button>
        </div>
      </div>

      {/* ── Notes list ────────────────────────────────────────────────────── */}
      {notes.length === 0 ? (
        <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <StickyNote size={32} className="text-slate-600" />
          <p className="font-display text-base text-slate-400 uppercase tracking-wider">No notes yet</p>
          <p className="font-body text-sm text-slate-500">Use this as a financial diary — observations, reminders, anything worth recording.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="glass rounded-xl px-4 py-4"
              style={{ borderLeft: '3px solid rgba(0,255,135,0.25)' }}
            >
              <div className="flex items-start gap-3">
                {/* Content */}
                <p className="flex-1 font-body text-sm text-white leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>

                {/* Delete */}
                <div className="shrink-0">
                  {confirmId === note.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={deletingId === note.id}
                        className="px-2 py-1 rounded-lg font-body text-[11px] font-semibold text-white bg-danger/80 hover:bg-danger transition-colors"
                      >
                        {deletingId === note.id ? '…' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-2 py-1 rounded-lg font-body text-[11px] text-slate-400 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(note.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-danger transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {note.author?.name && (
                  <span className="font-body text-[11px] text-grass font-medium">{note.author.name}</span>
                )}
                <span className="font-body text-[11px] text-slate-500">
                  {format(new Date(note.created_at), 'd MMM yyyy, h:mm a')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
