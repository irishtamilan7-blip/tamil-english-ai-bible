import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { clsx } from 'clsx'
import { bibleApi } from '../utils/api'
import { useAppStore } from '../store/useAppStore'

interface Book {
  id: number
  name_english: string
  name_tamil: string
  chapter_count: number
  testament: string
}

export default function BookPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const setSheetOpen = useAppStore((s) => s.setSheetOpen)
  const [book, setBook] = useState<Book | null>(null)

  useEffect(() => {
    if (!bookId) return
    bibleApi.getBook(parseInt(bookId))
      .then((res) => setBook(res.data))
      .catch(() => {})
  }, [bookId])

  function handleChapterTap(ch: number) {
    setSheetOpen(false)
    navigate(`/read/${bookId}/${ch}`)
  }

  if (!book) return (
    <div className="max-w-2xl mx-auto px-4 py-5 animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-cream-200 rounded-xl" />
        <div className="space-y-1.5">
          <div className="h-5 w-28 bg-cream-200 rounded" />
          <div className="h-3 w-20 bg-cream-100 rounded" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="w-12 h-12 bg-cream-200 rounded-xl" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-maroon-700 font-serif">{book.name_english}</h1>
          <p className="text-sm text-gray-500 font-tamil">
            {book.name_tamil} · {book.chapter_count} chapters
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">Tap a chapter to open it</p>

      {/* Chapter grid */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: book.chapter_count }, (_, i) => i + 1).map((ch) => (
          <button
            key={ch}
            onClick={() => handleChapterTap(ch)}
            className={clsx(
              'w-12 h-12 flex items-center justify-center rounded-xl text-sm font-medium transition-colors',
              'bg-white border border-cream-300 text-maroon-700 active:bg-maroon-700 active:text-white'
            )}
          >
            {ch}
          </button>
        ))}
      </div>
    </div>
  )
}
