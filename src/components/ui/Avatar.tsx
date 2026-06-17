import { useState } from 'react'
import { getInitials } from '../../lib/utils'
import { cn } from '../../lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name:      string
  src?:      string | null
  size?:     AvatarSize
  className?: string
}

const sizeStyles: Record<AvatarSize, { wrapper: string; text: string }> = {
  xs: { wrapper: 'w-6  h-6  text-[10px]', text: '' },
  sm: { wrapper: 'w-8  h-8  text-xs',     text: '' },
  md: { wrapper: 'w-10 h-10 text-sm',     text: '' },
  lg: { wrapper: 'w-12 h-12 text-base',   text: '' },
  xl: { wrapper: 'w-16 h-16 text-xl',     text: '' },
}

// Deterministic color per initial so the same person always gets the same accent
const ACCENT_COLORS = [
  'rgba(0,255,135,0.85)',
  'rgba(0,212,255,0.85)',
  'rgba(255,184,0,0.85)',
  'rgba(255,61,87,0.85)',
]

function getAccentColor(name: string): string {
  const idx = (name.charCodeAt(0) ?? 0) % ACCENT_COLORS.length
  return ACCENT_COLORS[idx]
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const { wrapper } = sizeStyles[size]
  const showInitials = !src || imgError
  const accent = getAccentColor(name)

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 overflow-hidden font-display font-bold select-none',
        wrapper,
        className
      )}
      style={showInitials
        ? { background: `${accent.replace('0.85', '0.15')}`, border: `1px solid ${accent}`, color: accent }
        : undefined
      }
    >
      {showInitials ? (
        getInitials(name)
      ) : (
        <img
          src={src!}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  )
}

export type { AvatarSize, AvatarProps }
