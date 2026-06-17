import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Coach } from '../types/index'

/**
 * Call once at the app root. Bootstraps the Supabase auth session,
 * fetches the matching coach profile, and keeps Zustand in sync
 * for the lifetime of the app.
 */
export function useAuth() {
  const { setUser, setCoach, setLoading, setAuthError, logout } = useAuthStore()

  useEffect(() => {
    // Restore session on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchCoach(session.user)
      } else {
        setLoading(false)
      }
    })

    // Keep state in sync across tabs and token refreshes.
    // Skip during login animation — LoginPage.handleSubmit owns the auth setup
    // for that flow to prevent a race that unmounts the animation before it plays.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (useAuthStore.getState().isAnimatingLogin) return
        if (session?.user) {
          setUser(session.user)
          fetchCoach(session.user)
        } else {
          logout()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCoach(user: User) {
    // 1. Try matching by login_email (handles seeded coaches where user_id is NULL)
    const { data: byEmail } = await supabase
      .from('coaches')
      .select('*')
      .eq('login_email', user.email ?? '')
      .maybeSingle()

    if (byEmail) {
      // Back-fill user_id if it was NULL so future lookups by user_id work
      if (!byEmail.user_id) {
        await supabase
          .from('coaches')
          .update({ user_id: user.id })
          .eq('id', byEmail.id)
        byEmail.user_id = user.id
      }

      // Deactivation check
      if (byEmail.is_active === false) {
        console.warn('[useAuth] Coach deactivated:', user.email)
        setAuthError('deactivated')
        await supabase.auth.signOut()
        return
      }

      setCoach(byEmail as Coach)
      setLoading(false)
      return
    }

    // 2. Try matching by user_id (for coaches created after the SQL fix)
    const { data: byUserId } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (byUserId) {
      // Deactivation check
      if (byUserId.is_active === false) {
        console.warn('[useAuth] Coach deactivated:', user.email)
        setAuthError('deactivated')
        await supabase.auth.signOut()
        return
      }

      setCoach(byUserId as Coach)
      setLoading(false)
      return
    }

    // 3. No matching coach record — this account isn't registered in the system.
    //    Sign out and surface an error on the login page.
    console.warn('[useAuth] No coach record for', user.email, '— access denied')
    setAuthError('not_registered')
    await supabase.auth.signOut()
    // onAuthStateChange fires with null session → logout() clears user/coach
    // authError is intentionally NOT cleared by logout() so LoginPage can show it
  }
}

export async function signOut() {
  await supabase.auth.signOut()
  // onAuthStateChange fires logout() automatically
}
