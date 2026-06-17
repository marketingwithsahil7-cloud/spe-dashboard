import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { MapPin } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import type { Event, EventType } from '../../types/index'
import type { EventWithAvailability } from '../../hooks/useEvents'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventFormProps {
  isOpen:      boolean
  onClose:     () => void
  onSave:      (data: Omit<Event, 'id' | 'created_at'>) => Promise<void>
  onUpdate:    (id: string, data: Partial<Omit<Event, 'id' | 'created_at'>>) => Promise<void>
  editEvent?:  EventWithAvailability | null
}

interface FormState {
  title:        string
  type:         EventType | ''
  date:         string
  location:     string
  details:      string
  age_category: string
}

const BLANK: FormState = { title: '', type: '', date: '', location: '', details: '', age_category: '' }

const TYPE_OPTIONS = [
  { value: 'tournament', label: '🏆 Tournament' },
  { value: 'friendly',   label: '⚽ Friendly'   },
]

const AGE_CATEGORY_OPTIONS = [
  { value: '',     label: 'All Ages'  },
  { value: 'U10',  label: 'U10 Only' },
  { value: 'U15',  label: 'U15 Only' },
  { value: 'Open', label: 'Open'     },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function EventForm({ isOpen, onClose, onSave, onUpdate, editEvent }: EventFormProps) {
  const [form,    setForm]    = useState<FormState>(BLANK)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isEdit = !!editEvent

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editEvent) {
      setForm({
        title:        editEvent.title,
        type:         editEvent.type ?? '',
        date:         editEvent.date ?? '',
        location:     editEvent.location ?? '',
        details:      editEvent.details ?? '',
        age_category: editEvent.age_category ?? '',
      })
    } else if (isOpen) {
      setForm({ ...BLANK, date: format(new Date(), 'yyyy-MM-dd') })
    }
    setError(null)
    setSuccess(false)
  }, [isOpen, editEvent])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError('Event title is required')
      return
    }
    if (!form.type) {
      setError('Please select an event type')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: Omit<Event, 'id' | 'created_at'> = {
        title:        form.title.trim(),
        type:         form.type || null,
        date:         form.date || null,
        location:     form.location.trim() || null,
        details:      form.details.trim() || null,
        age_category: form.age_category || null,
      }
      if (isEdit && editEvent) {
        await onUpdate(editEvent.id, payload)
      } else {
        await onSave(payload)
      }
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  // Textarea style matching Input component
  const textareaStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  const drawerFooter = (
    <div className="flex items-center gap-3">
      <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        variant="primary"
        className="flex-1"
        loading={saving}
        disabled={saving || !form.title.trim() || success}
        onClick={handleSave}
      >
        {success ? '✓ Saved!' : isEdit ? 'Save Changes' : 'Create Event'}
      </Button>
    </div>
  )

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Event' : 'New Event'}
      width="440px"
      footer={drawerFooter}
    >
      <div className="space-y-5">

        {/* Title */}
        <Input
          label="Event Title"
          placeholder="e.g. District Under-17 Tournament"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          error={!form.title.trim() && error ? error : undefined}
        />

        {/* Type + Age Category */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            placeholder="Select type…"
            value={form.type}
            onChange={e => { set('type', e.target.value as EventType | ''); setError(null) }}
            error={!form.type && error === 'Please select an event type' ? error : undefined}
          />
          <Select
            label="Age Category"
            options={AGE_CATEGORY_OPTIONS}
            value={form.age_category}
            onChange={e => set('age_category', e.target.value)}
          />
        </div>

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
        />

        {/* Location */}
        <Input
          label="Location"
          placeholder="e.g. SPE Ground, Sector 14"
          icon={<MapPin size={14} />}
          value={form.location}
          onChange={e => set('location', e.target.value)}
        />

        {/* Details */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest">
            Details
          </label>
          <textarea
            rows={4}
            placeholder="Match details, notes, instructions…"
            value={form.details}
            onChange={e => set('details', e.target.value)}
            className="w-full rounded-xl text-sm font-body text-white placeholder:text-slate-600 outline-none transition-all duration-200 px-4 py-3 resize-none focus:border-grass/35 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(0,255,135,0.06)]"
            style={textareaStyle}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="flex items-center gap-1.5 font-body text-xs text-danger">
            <span className="w-1 h-1 rounded-full bg-danger shrink-0" />
            {error}
          </p>
        )}

      </div>
    </Drawer>
  )
}
