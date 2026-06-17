import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface Props {
  pullY: number      // 0..100
  refreshing: boolean
  threshold?: number
}

export function PullToRefreshIndicator({ pullY, refreshing, threshold = 72 }: Props) {
  const progress = Math.min(pullY / threshold, 1)
  const triggered = pullY >= threshold || refreshing

  return (
    <AnimatePresence>
      {(pullY > 4 || refreshing) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: progress, y: pullY > 4 ? 0 : -20 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
          style={{ paddingTop: Math.max(8, pullY * 0.4) }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: triggered
                ? 'rgba(0,255,135,0.15)'
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${triggered ? 'rgba(0,255,135,0.3)' : 'rgba(255,255,255,0.08)'}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <motion.div
              animate={refreshing
                ? { rotate: 360, transition: { repeat: Infinity, duration: 0.7, ease: 'linear' } }
                : { rotate: progress * 180 }
              }
            >
              <RefreshCw
                size={14}
                className={triggered ? 'text-grass' : 'text-slate-500'}
              />
            </motion.div>
            <span className={`font-body text-[10px] tracking-wider uppercase ${triggered ? 'text-grass' : 'text-slate-500'}`}>
              {refreshing ? 'Refreshing…' : triggered ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
