import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import OfflineBanner from './OfflineBanner'
import VoiceFab from './VoiceFab'
import { useAppStore } from '../store/useAppStore'

export default function Layout() {
  const { offlineMode } = useAppStore()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-cream-100">
      {offlineMode && <OfflineBanner />}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
      <VoiceFab />
    </div>
  )
}
