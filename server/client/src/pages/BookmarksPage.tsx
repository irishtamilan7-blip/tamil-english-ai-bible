import { Link } from 'react-router-dom'
import { Bookmark, Trash2 } from 'lucide-react'
import { useBookmarkStore } from '../store/useBookmarkStore'

export default function BookmarksPage() {
  const { bookmarks, remove } = useBookmarkStore()

  // Group by book name
  const grouped = bookmarks.reduce<Record<string, typeof bookmarks>>((acc, b) => {
    const key = b.bookName
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-bold text-maroon-700 font-serif mb-5 flex items-center gap-2">
        <Bookmark className="h-5 w-5" /> Bookmarks
      </h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bookmark className="h-12 w-12 mx-auto text-cream-300" />
          <p className="text-gray-500 font-medium">No bookmarks yet</p>
          <p className="text-sm text-gray-400">Tap a verse while reading, then tap Bookmark</p>
          <Link to="/read" className="inline-block mt-2 px-4 py-2 bg-maroon-700 text-white rounded-xl text-sm font-medium">
            Start Reading
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([bookName, items]) => (
            <div key={bookName}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{bookName}</h2>
              <div className="space-y-2">
                {items.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white border border-cream-300 rounded-xl overflow-hidden"
                    style={{ borderLeftColor: b.color, borderLeftWidth: 4 }}
                  >
                    <Link
                      to={`/read/${b.bookId}/${b.chapterNo}?verse=${b.verseNo}`}
                      className="block px-4 py-3"
                    >
                      <p className="text-xs font-semibold text-maroon-700 mb-1">
                        {b.bookName} {b.chapterNo}:{b.verseNo}
                        {b.label && <span className="ml-2 text-gray-400 font-normal">{b.label}</span>}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 font-serif">{b.verseText}</p>
                    </Link>
                    <div className="flex items-center justify-between px-4 pb-3">
                      <p className="text-xs text-gray-400">
                        {new Date(b.createdAt).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <button
                        onClick={() => remove(b.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
