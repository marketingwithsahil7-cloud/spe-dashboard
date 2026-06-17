import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?:  string
  width?:      string | number
  height?:     string | number
  rounded?:    string
}

export function Skeleton({ className, width, height, rounded = 'rounded-xl' }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', rounded, className)}
      style={{
        width:  width  !== undefined ? (typeof width  === 'number' ? `${width}px`  : width)  : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  )
}

// Pre-composed skeleton shapes for common layouts
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass p-5 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={12} className="w-1/2" />
          <Skeleton height={10} className="w-1/3" />
        </div>
      </div>
      <Skeleton height={10} />
      <Skeleton height={10} className="w-4/5" />
    </div>
  )
}

export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn('glass p-5 space-y-3', className)}>
      <Skeleton height={10} className="w-1/2" />
      <Skeleton height={32} className="w-2/3" />
      <Skeleton height={8}  className="w-1/3" />
    </div>
  )
}
