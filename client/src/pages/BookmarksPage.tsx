import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function BookmarksPage() {
  const navigate = useNavigate()
  const title = 'BookmarksPage'.replace('Page', '').replace(/([A-Z])/g, ' $1').trim()
  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-maroon-700 font-serif">{title}</h1>
      </div>
      <p className="text-gray-500">Coming soon...</p>
    </div>
  )
}
