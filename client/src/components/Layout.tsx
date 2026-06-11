import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import OfflineBanner from './OfflineBanner'
import VoiceFab from './VoiceFab'
import { useAppStore } from '../store/useAppStore'

export default function Layout() {
  const { offlineMode } = useAppStore()
  const { pathname } = useLocation()
  const isAI = pathname === '/ai'

  return (
    <div
      className="flex flex-col bg-cream-100"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {offlineMode && <OfflineBanner />}
      <main
        className={isAI ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto'}
        style={isAI ? undefined : { paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Outlet />
      </main>
      <BottomNav />
      {!isAI && <VoiceFab />}
    </div>
  )
}
