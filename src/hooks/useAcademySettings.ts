import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AcademySettings } from '../types/index'

interface UseAcademySettingsReturn {
  settings:   AcademySettings | null
  isLoading:  boolean
  error:      string | null
  updateSettings: (patch: Partial<Pick<AcademySettings, 'academy_name' | 'tagline' | 'logo_url' | 'training_days'>>) => Promise<void>
  uploadLogo: (file: File) => Promise<string | null>
  refetch:    () => void
}

export function useAcademySettings(): UseAcademySettingsReturn {
  const [settings,  setSettings]  = useState<AcademySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [tick,      setTick]      = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    supabase
      .from('academy_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else     setSettings(data as AcademySettings | null)
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [tick])

  const updateSettings = useCallback(async (
    patch: Partial<Pick<AcademySettings, 'academy_name' | 'tagline' | 'logo_url' | 'training_days'>>
  ) => {
    if (!settings) return
    const { error: err } = await supabase
      .from('academy_settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', settings.id)
    if (err) throw new Error(err.message)
    setSettings(prev => prev ? { ...prev, ...patch } : prev)
  }, [settings])

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    const ext  = file.name.split('.').pop() ?? 'png'
    const path = `logos/main-logo.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('academy-assets')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadErr) throw new Error(uploadErr.message)

    const { data } = supabase.storage.from('academy-assets').getPublicUrl(path)
    // Bust cache with timestamp query param
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`

    await updateSettings({ logo_url: publicUrl })
    return publicUrl
  }, [updateSettings])

  return { settings, isLoading, error, updateSettings, uploadLogo, refetch }
}
