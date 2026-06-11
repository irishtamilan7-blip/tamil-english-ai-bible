import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useHighlightStore } from '../store/useHighlightStore'

const COLOR_NAMES: Record<string, string> = {
  '#FEF08A': 'Yellow',
  '#86EFAC': 'Green',
  '#93C5FD': 'Blue',
  '#F9A8D4': 'Pink',
  '#FDC57B': 'Orange',
}

export default function HighlightsPage() {
  const navigate   = useNavigate()
  const { highlights, remove } = useHighlightStore()

  const sorted = [...highlights].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-maroon-700 font-serif">Highlights</h1>
        <span className="ml-auto text-xs text-gray-400">{sorted.length} verse{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🖊️</div>
          <p className="font-medium text-gray-600 mb-1">No highlights yet</p>
          <p className="text-sm text-gray-400">Tap a verse while reading, then choose Highlight to colour it</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((h) => (
            <div
              key={h.id}
              className="rounded-2xl border border-cream-200 overflow-hidden"
              style={{ borderLeftWidth: 4, borderLeftColor: h.color }}
            >
              <button
                className="w-full text-left px-4 py-3"
                onClick={() => navigate(`/read/${h.bookId}/${h.chapterNo}?verse=${h.verseNo}`)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: h.color }}
                  />
                  <span className="text-xs font-semibold text-maroon-700">
                    {h.bookName} {h.chapterNo}:{h.verseNo}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-400">
                    {COLOR_NAMES[h.color] ?? 'Highlighted'}
                  </span>
                </div>
                <p
                  className="text-sm text-gray-700 leading-relaxed line-clamp-3"
                  style={{ backgroundColor: h.color + '44', borderRadius: 6, padding: '4px 8px' }}
                >
                  {h.verseText}
                </p>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </button>
              <div className="border-t border-cream-100 px-4 py-2 flex justify-end">
                <button
                  onClick={() => remove(h.bookId, h.chapterNo, h.verseNo)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
