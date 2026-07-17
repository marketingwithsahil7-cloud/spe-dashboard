import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, User, Building2, Shield, Download, Trash2,
  Upload, Plus, Edit2, Check, X, AlertTriangle, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { usePermissions } from '../hooks/usePermissions'
import { useAcademySettings } from '../hooks/useAcademySettings'
import { useToast } from '../components/ui/Toast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'
import type { Coach, CoachRole } from '../types/index'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: CoachRole | null) {
  if (role === 'owner')     return 'Owner / Head Coach'
  if (role === 'head')      return 'Head Coach'
  if (role === 'assistant') return 'Assistant Coach'
  return 'Coach'
}

function roleBadgeClass(role: CoachRole | null) {
  if (role === 'owner')     return 'text-grass border-grass/30 bg-grass/10'
  if (role === 'head')      return 'text-ice border-ice/30 bg-ice/10'
  return 'text-slate-400 border-white/10 bg-white/5'
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv     = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = String(row[h] ?? '')
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'academy' | 'coaches' | 'danger'

const OWNER_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'academy',  label: 'Academy',          icon: <Building2 size={14} /> },
  { id: 'coaches',  label: 'Coach Management', icon: <Shield size={14} /> },
  { id: 'danger',   label: 'Danger Zone',      icon: <AlertTriangle size={14} /> },
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// ─── Academy Tab ──────────────────────────────────────────────────────────────

function AcademyTab() {
  const { settings, isLoading, updateSettings, uploadLogo } = useAcademySettings()
  const toast = useToast()

  const [name,     setName]     = useState('')
  const [tagline,  setTagline]  = useState('')
  const [days,     setDays]     = useState<string[]>([])
  const [saving,   setSaving]   = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!settings) return
    setName(settings.academy_name)
    setTagline(settings.tagline)
    setDays(settings.training_days ?? [])
  }, [settings])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const toggleDay = (day: string) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (logoFile) await uploadLogo(logoFile)
      await updateSettings({ academy_name: name, tagline, training_days: days })
      toast.success('Academy settings saved')
      setLogoFile(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[80, 60, 120].map((w, i) => (
          <div key={i} className="h-11 rounded-xl skeleton" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }

  const displayLogo = logoPreview ?? settings?.logo_url

  return (
    <div className="space-y-6">

      {/* Logo */}
      <div>
        <p className="font-body text-xs text-slate-400 font-semibold uppercase tracking-widest mb-3">
          Academy Logo
        </p>
        <div className="flex items-center gap-5">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-2xl overflow-hidden group transition-all duration-200"
            style={{ background: 'rgba(0,255,135,0.06)', border: '2px solid rgba(0,255,135,0.2)' }}
          >
            {displayLogo ? (
              <img src={displayLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Shield size={32} className="text-grass/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload size={18} className="text-white" />
            </div>
          </button>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="font-body text-sm text-grass hover:underline"
            >
              {displayLogo ? 'Change logo' : 'Upload logo'}
            </button>
            <p className="font-body text-xs text-slate-500 mt-1">PNG, JPG or WebP · max 2MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
      </div>

      {/* Academy name */}
      <div className="space-y-2">
        <label className="block font-body text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Academy Name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full h-11 px-4 rounded-xl font-body text-sm text-white outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,135,0.35)' }}
          onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <label className="block font-body text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Tagline
        </label>
        <input
          value={tagline}
          onChange={e => setTagline(e.target.value)}
          className="w-full h-11 px-4 rounded-xl font-body text-sm text-white outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,135,0.35)' }}
          onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Training days */}
      <div className="space-y-3">
        <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Training Days
        </p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={cn(
                'h-8 px-3.5 rounded-lg font-body text-xs font-semibold capitalize transition-all duration-150',
                days.includes(day)
                  ? 'bg-grass text-pitch shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                  : 'text-slate-400 hover:text-white',
              )}
              style={!days.includes(day) ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <Button variant="primary" onClick={handleSave} loading={saving}>
        Save Changes
      </Button>
    </div>
  )
}

// ─── Coach row with inline edit ───────────────────────────────────────────────

interface CoachRowProps {
  coach:     Coach
  onToggle:  (id: string, active: boolean) => void
  onEdit:    (id: string, data: { name: string; role: CoachRole; per_session_rate: number; coaching_days: string[] }) => void
  onDelete:  (coach: Coach) => void
}

function CoachRow({ coach, onToggle, onEdit, onDelete }: CoachRowProps) {
  const [editing, setEditing] = useState(false)
  const [name,    setName]    = useState(coach.name)
  const [role,    setRole]    = useState<CoachRole>(coach.role ?? 'assistant')
  const [rate,    setRate]    = useState(coach.per_session_rate)
  const [days,    setDays]    = useState<string[]>(coach.coaching_days ?? [])

  const toggleDay = (day: string) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const save = () => {
    onEdit(coach.id, { name, role, per_session_rate: rate, coaching_days: days })
    setEditing(false)
  }

  const cancel = () => {
    setName(coach.name)
    setRole(coach.role ?? 'assistant')
    setRate(coach.per_session_rate)
    setDays(coach.coaching_days ?? [])
    setEditing(false)
  }

  return (
    <div
      className="glass rounded-2xl p-4"
      style={!coach.is_active ? { opacity: 0.55 } : {}}
    >
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name"
              className="h-9 px-3 rounded-xl font-body text-sm text-white outline-none col-span-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,255,135,0.3)' }}
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value as CoachRole)}
              className="h-9 px-3 rounded-xl font-body text-sm text-white appearance-none outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <option value="owner"     style={{ background: '#12121A' }}>Owner / Head Coach</option>
              <option value="head"      style={{ background: '#12121A' }}>Head Coach</option>
              <option value="assistant" style={{ background: '#12121A' }}>Assistant Coach</option>
            </select>
            <input
              type="number"
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              placeholder="₹ / session"
              className="h-9 px-3 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          </div>
          <div className="space-y-1.5">
            <p className="font-body text-[11px] text-slate-500 uppercase tracking-wider">Coaching Days</p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'h-7 px-2.5 rounded-lg font-body text-[11px] font-semibold capitalize transition-all duration-150',
                    days.includes(day)
                      ? 'bg-grass text-pitch'
                      : 'text-slate-400 hover:text-white',
                  )}
                  style={!days.includes(day) ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } : {}}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" icon={<Check size={13} />} onClick={save}>Save</Button>
            <Button size="sm" variant="secondary" icon={<X size={13} />} onClick={cancel}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-display font-bold text-xs text-pitch"
            style={{ background: coach.is_active ? '#00FF87' : '#475569' }}
          >
            {initials(coach.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-body text-sm font-semibold text-white truncate">{coach.name}</p>
              <span className={cn('text-[10px] font-display font-bold px-2 py-0.5 rounded-md border capitalize', roleBadgeClass(coach.role))}>
                {roleLabel(coach.role)}
              </span>
            </div>
            <p className="font-body text-xs text-slate-500 mt-0.5">
              ₹{coach.per_session_rate}/session
              {coach.login_email && ` · ${coach.login_email}`}
            </p>
            {!!coach.coaching_days?.length && (
              <p className="font-body text-[11px] text-slate-600 mt-0.5 capitalize">
                {coach.coaching_days.map(d => d.slice(0, 3)).join(', ')}
              </p>
            )}
          </div>

          {/* is_active toggle */}
          <button
            onClick={() => onToggle(coach.id, !coach.is_active)}
            className="shrink-0 transition-colors"
            title={coach.is_active ? 'Deactivate' : 'Activate'}
          >
            {coach.is_active
              ? <ToggleRight size={26} className="text-grass" />
              : <ToggleLeft  size={26} className="text-slate-600" />
            }
          </button>

          {/* Edit */}
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <Edit2 size={14} />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(coach)}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-danger transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Coach Management Tab ─────────────────────────────────────────────────────

function CoachesTab() {
  const toast = useToast()
  const [coaches,   setCoaches]   = useState<Coach[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Coach | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Add form state
  const [showAdd,     setShowAdd]     = useState(false)
  const [newName,     setNewName]     = useState('')
  const [newRole,     setNewRole]     = useState<CoachRole>('assistant')
  const [newEmail,    setNewEmail]    = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRate,      setNewRate]      = useState(300)
  const [newDays,      setNewDays]      = useState<string[]>([])
  const [adding,       setAdding]       = useState(false)
  const [addError,     setAddError]     = useState<string | null>(null)

  const toggleNewDay = (day: string) => {
    setNewDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const load = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .order('role')
      .order('name')
    if (!error) setCoaches((data ?? []) as Coach[])
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from('coaches').update({ is_active: active }).eq('id', id)
    if (error) { toast.error('Failed to update'); return }
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, is_active: active } : c))
    const coach = coaches.find(c => c.id === id)
    toast.success(`${coach?.name ?? 'Coach'} ${active ? 'activated' : 'deactivated'}`)
  }

  const handleEdit = async (id: string, data: { name: string; role: CoachRole; per_session_rate: number; coaching_days: string[] }) => {
    const { error } = await supabase.from('coaches').update(data).eq('id', id)
    if (error) { toast.error('Failed to update'); return }
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    toast.success('Coach updated')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('coaches').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (error) { toast.error('Failed to delete'); return }
    setCoaches(prev => prev.filter(c => c.id !== deleteTarget.id))
    toast.success(`${deleteTarget.name} removed`)
    setDeleteTarget(null)
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setAddError('Name, email, and password are all required to create a login')
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-coach', {
        body: {
          name:              newName.trim(),
          email:             newEmail.trim(),
          password:          newPassword,
          role:              newRole,
          per_session_rate:  newRate,
          coaching_days:     newDays,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setCoaches(prev => [...prev, data.coach as Coach])
      toast.success(`${newName} added — they can now log in with ${newEmail.trim()}`)
      setShowAdd(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('assistant')
      setNewRate(300)
      setNewDays([])
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add coach')
    } finally {
      setAdding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Coach list */}
      <div className="space-y-2">
        {coaches.map(coach => (
          <CoachRow
            key={coach.id}
            coach={coach}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      {/* Add coach form */}
      {showAdd ? (
        <div
          className="glass rounded-2xl p-4 space-y-3"
          style={{ border: '1px solid rgba(0,255,135,0.2)' }}
        >
          <p className="font-body text-xs font-semibold text-grass uppercase tracking-wider">New Coach</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Full name"
              className="h-9 px-3 rounded-xl font-body text-sm text-white outline-none col-span-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
            <input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Login email"
              type="email"
              className="h-9 px-3 rounded-xl font-body text-sm text-white outline-none col-span-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
            <input
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Login password (min 6 chars)"
              type="password"
              className="h-9 px-3 rounded-xl font-body text-sm text-white outline-none col-span-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as CoachRole)}
              className="h-9 px-3 rounded-xl font-body text-sm text-white appearance-none outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <option value="assistant" style={{ background: '#12121A' }}>Assistant Coach</option>
              <option value="head"      style={{ background: '#12121A' }}>Head Coach</option>
            </select>
            <input
              type="number"
              value={newRate}
              onChange={e => setNewRate(Number(e.target.value))}
              placeholder="₹/session"
              className="h-9 px-3 rounded-xl font-body text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
          </div>
          <div className="space-y-1.5">
            <p className="font-body text-[11px] text-slate-500 uppercase tracking-wider">Coaching Days</p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleNewDay(day)}
                  className={cn(
                    'h-7 px-2.5 rounded-lg font-body text-[11px] font-semibold capitalize transition-all duration-150',
                    newDays.includes(day)
                      ? 'bg-grass text-pitch'
                      : 'text-slate-400 hover:text-white',
                  )}
                  style={!newDays.includes(day) ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } : {}}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <p className="font-body text-[11px] text-slate-500">
            Creates a real login — the coach can sign in immediately with this email and password.
          </p>
          {addError && (
            <p className="font-body text-xs text-danger">{addError}</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="primary" icon={<Check size={13} />} loading={adding} onClick={handleAdd}>
              Add Coach
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setShowAdd(false); setAddError(null) }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          icon={<Plus size={14} />}
          onClick={() => setShowAdd(true)}
          className="w-full justify-center"
        >
          Add Coach
        </Button>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.name ?? ''}?`}
        description="This permanently removes the coach from the system. Their auth account must be deleted separately in Supabase."
        confirmLabel="Delete Coach"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Danger Zone Tab ──────────────────────────────────────────────────────────

function DangerTab() {
  const toast = useToast()
  const [exporting, setExporting] = useState<string | null>(null)

  const doExport = async (table: string, filename: string) => {
    setExporting(table)
    try {
      const { data, error } = await supabase.from(table).select('*')
      if (error) throw error
      downloadCSV(filename, (data ?? []) as Record<string, unknown>[])
      toast.success(`${filename} downloaded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const exports = [
    { table: 'students',   file: 'spe-students.csv',   label: 'Export Students CSV' },
    { table: 'payments',   file: 'spe-payments.csv',   label: 'Export Payments CSV' },
    { table: 'attendance', file: 'spe-attendance.csv', label: 'Export Attendance CSV' },
  ]

  return (
    <div
      className="glass rounded-2xl p-5 space-y-4"
      style={{ border: '1px solid rgba(255,61,87,0.25)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={15} className="text-danger" />
        <p className="font-display text-sm font-semibold text-danger uppercase tracking-wider">
          Danger Zone
        </p>
      </div>
      <p className="font-body text-xs text-slate-400">
        Export all academy data as CSV. Files include all records from the database.
      </p>

      <div className="space-y-2">
        {exports.map(({ table, file, label }) => (
          <button
            key={table}
            onClick={() => doExport(table, file)}
            disabled={!!exporting}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-slate-300 transition-all duration-200 hover:text-white disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Download size={15} className="text-slate-500 shrink-0" />
            {exporting === table ? 'Exporting…' : label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Profile Card (all coaches) ───────────────────────────────────────────────

function ProfileCard() {
  const { coach, role } = useAuthStore()
  if (!coach) return null

  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-display font-bold text-base text-pitch"
        style={{ background: '#00FF87' }}
      >
        {initials(coach.name)}
      </div>
      <div>
        <p className="font-body text-base font-semibold text-white">{coach.name}</p>
        <p className="font-body text-xs text-slate-400 mt-0.5">{roleLabel(role)}</p>
        {coach.login_email && (
          <p className="font-body text-xs text-slate-500 mt-0.5">{coach.login_email}</p>
        )}
      </div>
      <div className="ml-auto">
        <span className={cn('text-[11px] font-display font-bold px-2.5 py-1 rounded-lg border', roleBadgeClass(role))}>
          {roleLabel(role)}
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings } = useAcademySettings()
  const { canManageSettings } = usePermissions()
  const [activeTab, setActiveTab] = useState<Tab>('academy')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)' }}
        >
          <Settings size={18} className="text-grass" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-white leading-tight">
            Settings
          </h1>
          <p className="font-body text-xs text-slate-500 mt-0.5">
            {canManageSettings ? 'Academy configuration and admin controls' : 'Your profile and academy info'}
          </p>
        </div>
      </div>

      {/* Profile (all coaches) */}
      <div>
        <p className="font-body text-[11px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <User size={11} /> Your Profile
        </p>
        <ProfileCard />
      </div>

      {/* Academy info (read-only for non-owner) */}
      {!canManageSettings && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="font-body text-[11px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Building2 size={11} /> Academy
          </p>
          <div>
            <p className="font-body text-base font-semibold text-white">
              {settings?.academy_name ?? 'Soccer Pro Elite'}
            </p>
            <p className="font-body text-xs text-slate-400 mt-0.5">
              {settings?.tagline ?? 'Elite Academy'}
            </p>
          </div>
          <p className="font-body text-[11px] text-slate-600 pt-2 border-t border-white/5">
            SPE Dashboard · v1.0 · Built by Sahil
          </p>
        </div>
      )}

      {/* Owner admin panel */}
      {canManageSettings && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {OWNER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg font-body text-xs font-semibold transition-all duration-150',
                  activeTab === tab.id
                    ? tab.id === 'danger'
                      ? 'bg-danger/20 text-danger border border-danger/30'
                      : 'bg-grass text-pitch shadow-[0_0_12px_rgba(0,255,135,0.25)]'
                    : 'text-slate-400 hover:text-white',
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="glass rounded-2xl p-5">
            {activeTab === 'academy'  && <AcademyTab />}
            {activeTab === 'coaches'  && <CoachesTab />}
            {activeTab === 'danger'   && <DangerTab />}
          </div>
        </div>
      )}
    </motion.div>
  )
}
