import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { bibleApi } from '../utils/api'

interface Book { id: number; name_english: string; name_tamil: string; chapter_count: number; testament: string }

export default function BookPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)

  useEffect(() => {
    if (!bookId) return
    bibleApi.getBook(parseInt(bookId))
      .then((res) => setBook(res.data))
      .catch(() => {})
  }, [bookId])

  if (!book) return (
    <div className="flex items-center justify-center h-32">
      <div className="h-6 w-6 border-2 border-maroon-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-maroon-700 font-serif">{book.name_english}</h1>
          <p className="text-sm text-gray-500 font-tamil">{book.name_tamil} · {book.chapter_count} chapters</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: book.chapter_count }, (_, i) => i + 1).map((ch) => (
          <Link
            key={ch}
            to={`/read/${book.id}/${ch}`}
            className="aspect-square flex items-center justify-center bg-white border border-cream-300 rounded-xl text-sm font-medium text-maroon-700 hover:bg-maroon-700 hover:text-white hover:border-maroon-700 transition-colors"
          >
            {ch}
          </Link>
        ))}
      </div>
    </div>
  )
}
