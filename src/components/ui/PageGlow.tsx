// Subtle CSS-only radial glow, zero JS/canvas cost
const GLOWS = {
  green:  'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(0,255,135,0.05) 0%, transparent 70%)',
  amber:  'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(255,184,0,0.04)  0%, transparent 70%)',
  ice:    'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(0,212,255,0.04)  0%, transparent 70%)',
  slate:  'radial-gradient(ellipse 60% 50% at 50%  0%, rgba(100,116,139,0.05) 0%, transparent 70%)',
  gold:   'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(255,184,0,0.05)  0%, transparent 70%)',
  purple: 'radial-gradient(ellipse 60% 50% at 0%   0%, rgba(139,92,246,0.04) 0%, transparent 70%)',
} as const

export type GlowVariant = keyof typeof GLOWS

interface PageGlowProps {
  variant: GlowVariant
}

export function PageGlow({ variant }: PageGlowProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: GLOWS[variant] }}
    />
  )
}
