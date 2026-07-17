import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { pageVariants } from '../../lib/animations'

// Wraps Outlet with AnimatePresence keyed on pathname so exit plays before entry
function PageTransitionWrapper() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%' }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-pitch">
      <Sidebar />

      {/* Content column — scrolls with the window so Lenis works naturally */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 px-4 md:px-6 pt-6 pb-6 md:pb-10">
          <PageTransitionWrapper />
        </main>
      </div>
    </div>
  )
}
