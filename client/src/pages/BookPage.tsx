import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, X } from 'lucide-react'
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

const bookCache: Record<string, Book> = {}

export default function BookPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const setSheetOpen = useAppStore((s) => s.setSheetOpen)
  const cached = bookId ? bookCache[bookId] : null
  const [book, setBook] = useState<Book | null>(cached ?? null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verseCount, setVerseCount] = useState<number>(30)

  useEffect(() => {
    if (!bookId || cached) return
    bibleApi.getBook(parseInt(bookId))
      .then((res) => { bookCache[bookId] = res.data; setBook(res.data) })
      .catch(() => {})
  }, [bookId, cached])

  useEffect(() => {
    if (!selectedChapter || !bookId) return
    // Show sheet instantly with default count, fetch real count in background
    bibleApi.getChapter(parseInt(bookId), selectedChapter)
      .then((res) => setVerseCount(res.data.verses?.length ?? res.data.total_verses ?? 30))
      .catch(() => {})
  }, [selectedChapter, bookId])

  useEffect(() => {
    setSheetOpen(!!selectedChapter)
    return () => setSheetOpen(false)
  }, [selectedChapter, setSheetOpen])

  function handleChapterTap(ch: number) {
    setVerseCount(30)
    setSelectedChapter(ch)
  }

  function goToVerse(verse: number) {
    if (!selectedChapter) return
    setSheetOpen(false)
    navigate(`/read/${bookId}/${selectedChapter}?verse=${verse}`)
  }

  function closeSheet() {
    setSelectedChapter(null)
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

      <p className="text-xs text-gray-400 mb-3">Tap a chapter to select a verse</p>

      {/* Chapter grid */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: book.chapter_count }, (_, i) => i + 1).map((ch) => (
          <button
            key={ch}
            onClick={() => handleChapterTap(ch)}
            className={clsx(
              'w-12 h-12 flex items-center justify-center rounded-xl text-sm font-medium transition-colors',
              selectedChapter === ch
                ? 'bg-maroon-700 text-white'
                : 'bg-white border border-cream-300 text-maroon-700 hover:bg-maroon-700 hover:text-white'
            )}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Bottom sheet verse picker */}
      {selectedChapter && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeSheet} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
            style={{ height: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-cream-300" style={{ flexShrink: 0 }}>
              <div>
                <p className="font-semibold text-maroon-700 text-base">
                  {book.name_english} — Chapter {selectedChapter}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {verseCount} verses · <button
                    onClick={() => { setSheetOpen(false); navigate(`/read/${bookId}/${selectedChapter}`) }}
                    className="text-maroon-700 underline min-h-0 min-w-0 text-xs"
                  >
                    Open from verse 1
                  </button>
                </p>
              </div>
              <button onClick={closeSheet} className="p-2 text-gray-400 hover:text-gray-600 min-h-0 min-w-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Verse grid */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
              <p className="text-xs text-gray-400 mb-3 text-center">Tap a verse number to go directly to it</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: '10px' }}>
                {Array.from({ length: verseCount }, (_, i) => i + 1).map((v) => (
                  <button
                    key={v}
                    onClick={() => goToVerse(v)}
                    className="h-14 flex items-center justify-center rounded-xl text-sm font-bold bg-cream-100 text-maroon-700 active:bg-maroon-700 active:text-white transition-all"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
