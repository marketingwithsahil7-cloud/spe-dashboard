import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { ROUTES } from '../lib/constants'
import { gsap } from '../lib/animations'
import PenaltyScene, { type PenaltySceneHandle } from '../components/login/PenaltyScene'

export default function LoginPage() {
  const { user, isLoading, authError, setAuthError } = useAuthStore()
  const navigate = useNavigate()

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [isAnimating, setIsAnimating]   = useState(false)

  // Ref gate: set synchronously before any React state update so that Zustand-triggered
  // re-renders can't fire <Navigate> between "auth success" and "setIsAnimating(true)".
  const animationGate = useRef(false)

  const penaltyRef = useRef<PenaltySceneHandle>(null)
  const cardRef    = useRef<HTMLDivElement>(null)
  const brandRef   = useRef<HTMLDivElement>(null)
  const formRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(cardRef.current,
      { opacity: 0, y: 40, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55 },
    )
    .fromTo(brandRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.35 },
      '-=0.25',
    )
    .fromTo(
      formRef.current ? Array.from(formRef.current.children) : [],
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, clearProps: 'all' },
      '-=0.15',
    )
    return () => { tl.kill() }
  }, [])

  // Called by PenaltyScene.onComplete after the 1.6s animation ends.
  const navigateAfterLogin = useCallback(() => {
    useAuthStore.getState().setIsAnimatingLogin(false)
    const role = useAuthStore.getState().role
    navigate(role === 'assistant' ? ROUTES.ATTENDANCE : ROUTES.DASHBOARD, { replace: true })
  }, [navigate])

  // Trigger the imperative animation on PenaltyScene, fall back to direct nav if ref isn't ready.
  const triggerAndNavigate = useCallback(() => {
    setTimeout(() => {
      if (penaltyRef.current) {
        penaltyRef.current.triggerGoal()
      } else {
        navigateAfterLogin()
      }
    }, 200)
  }, [navigateAfterLogin])

  // Redirect already-logged-in users who arrive at /login directly.
  // useEffect (not render-phase) so PenaltyScene is always mounted and penaltyRef
  // is always set before triggerGoal is called.
  useEffect(() => {
    if (!isLoading && user && !animationGate.current) {
      const role = useAuthStore.getState().role
      navigate(role === 'assistant' ? ROUTES.ATTENDANCE : ROUTES.DASHBOARD, { replace: true })
    }
  }, [isLoading, user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting || isAnimating) return
    setError(null)
    setAuthError(null)
    setIsSubmitting(true)

    // Gate set BEFORE the first await so onAuthStateChange can never fire
    // between "auth resolves" and "gate is true", which caused the render-phase
    // Navigate to fire and unmount PenaltyScene before triggerGoal could run.
    animationGate.current = true

    try {
      // Step 1: Authenticate with Supabase
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: email.trim(), password })

      if (signInError) {
        animationGate.current = false
        throw signInError
      }

      useAuthStore.getState().setIsAnimatingLogin(true)

      // Step 2: Fetch coach profile directly (bypasses onAuthStateChange race)
      const { data: coachByEmail } = await supabase
        .from('coaches')
        .select('*')
        .eq('login_email', authData.user.email ?? '')
        .maybeSingle()

      const { data: coachByUserId } = !coachByEmail
        ? await supabase
            .from('coaches')
            .select('*')
            .eq('user_id', authData.user.id)
            .maybeSingle()
        : { data: null }

      const coach = coachByEmail ?? coachByUserId

      // Step 3: Deactivation check
      if (coach && coach.is_active === false) {
        animationGate.current = false
        useAuthStore.getState().setIsAnimatingLogin(false)
        await supabase.auth.signOut()
        setError('Your access has been revoked. Contact Coach Sahil.')
        setIsSubmitting(false)
        gsap.fromTo(cardRef.current,
          { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
        return
      }

      // Step 4: No coach record
      if (!coach) {
        animationGate.current = false
        useAuthStore.getState().setIsAnimatingLogin(false)
        await supabase.auth.signOut()
        setAuthError('not_registered')
        setIsSubmitting(false)
        return
      }

      // Step 5: Populate auth store manually (prevents onAuthStateChange racing ahead)
      const store = useAuthStore.getState()
      store.setUser(authData.user)
      store.setCoach(coach)

      // Step 6: Trigger animation imperatively via ref — bypasses React prop timing
      setIsSubmitting(false)
      setIsAnimating(true)  // disables form UI only
      triggerAndNavigate()

    } catch (err: unknown) {
      animationGate.current = false
      useAuthStore.getState().setIsAnimatingLogin(false)
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.'
      console.error('[SPE Login] Error:', msg)
      setError(msg.includes('Invalid') ? 'Invalid email or password.' : msg)
      setIsSubmitting(false)
      gsap.fromTo(cardRef.current,
        { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-pitch overflow-hidden relative">

      {/* ── Ambient glow ──────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,255,135,0.09) 0%, transparent 70%)',
        }}
      />

      {/* ── Subtle grid ───────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Scene — full width, fixed height ──────────────────────────────── */}
      <div
        className="w-full relative shrink-0 z-10"
        style={{ height: '38vh', minHeight: 220 }}
      >
        <PenaltyScene ref={penaltyRef} onComplete={navigateAfterLogin} />

        {/* Desktop-only brand overlay — bottom-left, hidden on mobile */}
        <div
          className="hidden md:block absolute bottom-5 left-6 z-20 pointer-events-none"
        >
          <h2
            className="font-display font-black leading-tight"
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              textShadow: '0 0 40px rgba(0,255,135,0.3)',
            }}
          >
            <span className="block text-white uppercase tracking-widest">SOCCER PRO</span>
            <span className="block text-grass uppercase tracking-widest">ELITE</span>
          </h2>
          <p className="font-body text-slate-400 mt-1.5 tracking-[0.2em] text-[11px] uppercase">
            Elite Football Academy
          </p>
          <div
            className="mt-2.5 h-px w-10"
            style={{ background: 'linear-gradient(to right, rgba(0,255,135,0.55), transparent)' }}
          />
        </div>

        {/* Bottom-edge gradient blending into form */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, transparent, #0A0A0F)' }}
        />
      </div>

      {/* ── Login Form ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start md:items-center justify-center px-4 pt-4 pb-8 relative z-10">
        <div ref={cardRef} className="relative w-full max-w-[420px]" style={{ opacity: 0 }}>
          <div className="glass p-7 md:p-10">

            {/* ── Brand ─────────────────────────────────────────────────── */}
            <div ref={brandRef} className="text-center mb-7" style={{ opacity: 0 }}>
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{
                  background: 'rgba(0,255,135,0.08)',
                  border: '1px solid rgba(0,255,135,0.2)',
                  boxShadow: '0 0 24px rgba(0,255,135,0.2), 0 0 60px rgba(0,255,135,0.07)',
                }}
              >
                <ShieldCheck size={28} className="text-grass" strokeWidth={1.5} />
              </div>
              <h1 className="font-display text-xl font-bold uppercase tracking-widest text-white leading-tight">
                Soccer Pro Elite
              </h1>
              <p className="text-slate-500 text-sm font-body mt-1 tracking-wide">
                Academy Management System
              </p>
            </div>

            {/* ── Form ──────────────────────────────────────────────────── */}
            <div ref={formRef}>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); setAuthError(null) }}
                    required
                    disabled={isAnimating}
                    autoComplete="email"
                    placeholder="coach@spe.academy"
                    className="w-full h-12 rounded-xl px-4 text-sm font-body text-white placeholder:text-slate-600 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(0,255,135,0.35)'
                      e.currentTarget.style.background   = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(0,255,135,0.06)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.boxShadow    = 'none'
                    }}
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-body font-semibold text-slate-400 uppercase tracking-widest"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null); setAuthError(null) }}
                      required
                      disabled={isAnimating}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full h-12 rounded-xl px-4 pr-12 text-sm font-body text-white placeholder:text-slate-600 outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(0,255,135,0.35)'
                        e.currentTarget.style.background   = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(0,255,135,0.06)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.boxShadow    = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Account not registered */}
                {authError === 'not_registered' && (
                  <div
                    className="flex items-start gap-3 rounded-xl px-4 py-3 font-body"
                    style={{
                      background: 'rgba(255,184,0,0.08)',
                      border: '1px solid rgba(255,184,0,0.25)',
                    }}
                  >
                    <ShieldX size={15} className="text-amber shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber font-semibold leading-snug">
                        Account not registered
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        This email isn't linked to a coach profile. Contact Sahil to get access.
                      </p>
                    </div>
                  </div>
                )}

                {/* Access revoked */}
                {authError === 'deactivated' && (
                  <div
                    className="flex items-start gap-3 rounded-xl px-4 py-3 font-body"
                    style={{
                      background: 'rgba(255,61,87,0.08)',
                      border: '1px solid rgba(255,61,87,0.3)',
                    }}
                  >
                    <AlertTriangle size={15} className="text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-danger font-semibold leading-snug">
                        Access revoked
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Your access has been revoked. Please contact Coach Sahil.
                      </p>
                    </div>
                  </div>
                )}

                {/* Wrong credentials / other errors */}
                {error && (
                  <div
                    className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-body text-danger"
                    style={{
                      background: 'rgba(255,61,87,0.08)',
                      border: '1px solid rgba(255,61,87,0.2)',
                    }}
                  >
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-danger" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || isAnimating || !email || !password}
                  className="w-full h-12 rounded-xl font-display font-semibold text-sm tracking-widest uppercase text-pitch bg-grass transition-all duration-200 flex items-center justify-center gap-2 mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: isSubmitting ? 'none' : '0 0 24px rgba(0,255,135,0.25)',
                  }}
                  onMouseEnter={e => {
                    if (!isSubmitting && !isAnimating) {
                      e.currentTarget.style.boxShadow = '0 0 36px rgba(0,255,135,0.45)'
                      e.currentTarget.style.background = '#00CC6A'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,135,0.25)'
                    e.currentTarget.style.background = '#00FF87'
                  }}
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" />Signing in…</>
                  ) : isAnimating ? (
                    <><Loader2 size={16} className="animate-spin" />Loading…</>
                  ) : (
                    'Sign In'
                  )}
                </button>

              </form>

              <p className="text-center text-[11px] text-slate-600 font-body mt-6 leading-relaxed">
                Coach access only &nbsp;·&nbsp; Contact your head coach for credentials
              </p>
            </div>

          </div>

          {/* Card bottom glow */}
          <div
            aria-hidden="true"
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 pointer-events-none"
            style={{
              background: 'rgba(0,255,135,0.12)',
              filter: 'blur(24px)',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>
    </div>
  )
}
