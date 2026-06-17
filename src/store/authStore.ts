import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Coach, CoachRole } from '../types/index'

interface AuthState {
  user: User | null
  coach: Coach | null
  role: CoachRole | null
  isLoading: boolean
  // Persists across logout so LoginPage can display it after sign-out redirect
  authError: string | null
  // True while the post-login penalty kick animation is playing — suppresses
  // onAuthStateChange auto-redirect so the animation can finish first
  isAnimatingLogin: boolean

  // Computed role helpers
  isOwner:       () => boolean
  isHeadOrOwner: () => boolean
  isHeadCoach:   () => boolean   // kept for legacy callers — equivalent to isHeadOrOwner
  isAssistant:   () => boolean

  // Actions
  setUser: (user: User | null) => void
  setCoach: (coach: Coach | null) => void
  setRole: (role: CoachRole | null) => void
  setLoading: (loading: boolean) => void
  setAuthError: (authError: string | null) => void
  setIsAnimatingLogin: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  coach: null,
  role: null,
  isLoading: true,
  authError: null,
  isAnimatingLogin: false,

  isOwner:       () => get().role === 'owner',
  isHeadOrOwner: () => get().role === 'owner' || get().role === 'head',
  isHeadCoach:   () => get().role === 'owner' || get().role === 'head',
  isAssistant:   () => get().role === 'assistant',

  // Clear authError when a new sign-in attempt starts
  setUser: (user) => set({ user, authError: null }),
  setCoach: (coach) => set({ coach, role: coach?.role ?? null }),
  setRole: (role) => set({ role }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthError: (authError) => set({ authError }),
  setIsAnimatingLogin: (v) => set({ isAnimatingLogin: v }),

  // Intentionally does NOT clear authError — LoginPage reads it after redirect
  logout: () => set({ user: null, coach: null, role: null, isLoading: false }),
}))
