import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { bibleApi } from '../utils/api'

interface Book {
  id: number
  name_english: string
  name_tamil: string
  chapter_count: number
  testament: string
}

export default function TestamentPage() {
  const { type } = useParams<{ type: 'old' | 'new' }>()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bibleApi.getBooks('english')
      .then((res) => {
        setBooks(res.data.books.filter((b: Book) => b.testament === type))
      })
      .finally(() => setLoading(false))
  }, [type])

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-5">
        <Link to="/" className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-maroon-700 font-serif">
            {type === 'old' ? 'Old Testament' : 'New Testament'}
          </h1>
          <p className="text-sm text-gray-500 font-tamil">
            {type === 'old' ? 'பழைய ஏற்பாடு' : 'புதிய ஏற்பாடு'} · {books.length} books
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array(type === 'old' ? 39 : 27).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-cream-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {books.map((book) => (
            <Link
              key={book.id}
              to={`/book/${book.id}`}
              className="bg-white border border-cream-300 rounded-xl p-3 text-center hover:border-maroon-300 hover:bg-maroon-50/30 transition-colors"
            >
              <p className="font-medium text-maroon-700 text-sm leading-tight">{book.name_english}</p>
              <p className="text-xs text-gray-500 font-tamil mt-0.5 leading-snug">{book.name_tamil}</p>
              <p className="text-xs text-gray-400 mt-1">{book.chapter_count} ch</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
