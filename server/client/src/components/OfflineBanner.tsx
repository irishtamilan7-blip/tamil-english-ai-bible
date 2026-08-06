import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You're offline. Core features available.</span>
    </div>
  )
}
