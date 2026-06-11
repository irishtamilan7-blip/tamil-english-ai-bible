import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Search, X, Clock } from 'lucide-react'
import { bibleApi } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import chapterCache from '../utils/chapterCache'

import { parseVerseRef } from '../utils/bibleRef'

interface Result {
  lang: string
  book_id: number
  book_name_english: string
  book_name_tamil: string
  chapter_no: number
  verse_no: number
  text: string
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<Result[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const { language, bibleVersion, searchHistory, addSearchHistory, removeSearchHistory, clearSearchHistory } = useAppStore()
  const lang = language === 'bilingual' ? 'english' : language

  function prefetchChapter(bookId: number, chapterNo: number) {
    const key = `${bookId}-${chapterNo}-${lang}-${language === 'bilingual'}-${bibleVersion}`
    if (chapterCache[key]) return
    bibleApi.getChapter(bookId, chapterNo, lang, language === 'bilingual', bibleVersion)
      .then((res) => { chapterCache[key] = res.data })
      .catch(() => {})
  }

  async function doSearch(q: string, p = 1) {
    if (q.trim().length < 2) return
    setLoading(true)
    if (p === 1) { setResults([]); setTotal(0) }
    // Search English always — Tamil Bible text is in Tamil script so English keywords
    // like "love" return 0 in Tamil mode. Language only controls how results are displayed.
    try {
      const res = await bibleApi.search(q, 'english', 'all', p)
      const newResults: Result[] = res.data.results
      if (p === 1) setResults(newResults)
      else setResults((prev) => [...prev, ...newResults])
      setTotal(res.data.total)
      setPage(p)
      addSearchHistory(q)
      // Prefetch chapters for top results so tapping them is instant
      newResults.slice(0, 6).forEach((r) => prefetchChapter(r.book_id, r.chapter_no))
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fire search whenever URL ?q= changes (voice-search navigation, page load, history)
  const urlQ = searchParams.get('q') || ''
  useEffect(() => {
    if (urlQ) { setQuery(urlQ); doSearch(urlQ) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    // Check if query is a verse reference like "John 3:16"
    const ref = parseVerseRef(query.trim())
    if (ref) {
      const url = ref.verse
        ? `/read/${ref.bookId}/${ref.chapter}?verse=${ref.verse}`
        : `/read/${ref.bookId}/${ref.chapter}`
      navigate(url)
      return
    }
    if (urlQ === query.trim()) { doSearch(query.trim(), 1); return }
    setSearchParams({ q: query.trim() })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Search bar */}
      <form onSubmit={submit} className="flex gap-2 mb-5">
        <div className="flex-1 min-w-0 flex items-center gap-2 bg-white border-2 border-cream-300 focus-within:border-maroon-700 rounded-xl px-3 transition-colors">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder='Search — "John 3:16" or "love" or "Moses"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 py-2.5 text-sm bg-transparent outline-none placeholder:text-gray-400"
            autoFocus
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setTotal(0); setSearchParams({}) }} className="shrink-0">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="shrink-0 px-4 py-2.5 bg-maroon-700 text-white rounded-xl text-sm font-medium hover:bg-maroon-800"
        >
          Search
        </button>
      </form>

      {/* Search history */}
      {!results.length && searchHistory.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent
            </h3>
            <button onClick={clearSearchHistory} className="text-xs text-red-500 hover:text-red-700">Clear all</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((h) => (
              <div key={h} className="flex items-center gap-1 bg-white border border-cream-300 rounded-full px-3 py-1.5">
                <button
                  onClick={() => { setQuery(h); doSearch(h) }}
                  className="text-sm text-gray-700"
                >
                  {h}
                </button>
                <button onClick={() => removeSearchHistory(h)}>
                  <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results count — shown after any search attempt */}
      {!loading && searchParams.get('q') && (
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            total > 0
              ? 'bg-maroon-700 text-white'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {total} result{total !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-gray-500">
            for <span className="font-medium text-gray-700">"{searchParams.get('q')}"</span>
          </span>
          {total > results.length && (
            <span className="text-xs text-gray-400 ml-auto">showing {results.length} of {total}</span>
          )}
        </div>
      )}

      {/* No results for a query */}
      {!loading && !results.length && searchParams.get('q') && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No verses found for "{searchParams.get('q')}"</p>
          <p className="text-xs mt-1">Try a different word or a shorter phrase</p>
        </div>
      )}

      {/* Empty state hint */}
      {!loading && !results.length && !searchHistory.length && !searchParams.get('q') && (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <Search className="h-10 w-10 mx-auto opacity-40" />
          <p className="text-sm">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['John 3:16', 'love', 'Moses', 'faith', 'Psalms 23'].map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); doSearch(s) }}
                className="px-3 py-1.5 bg-cream-100 border border-cream-300 rounded-full text-sm text-gray-600 hover:border-maroon-300"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-2 border-maroon-700 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((r, i) => (
          <Link
            key={`${r.book_id}-${r.chapter_no}-${r.verse_no}-${i}`}
            to={`/read/${r.book_id}/${r.chapter_no}?verse=${r.verse_no}`}
            onTouchStart={() => prefetchChapter(r.book_id, r.chapter_no)}
            className="block bg-white border border-cream-300 rounded-xl p-4 hover:border-maroon-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-maroon-700 bg-maroon-50 px-2 py-0.5 rounded-full">
                {r.book_name_english} {r.chapter_no}:{r.verse_no}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{r.text}</p>
          </Link>
        ))}
      </div>

      {/* Load more */}
      {results.length < total && (
        <button
          onClick={() => doSearch(query, page + 1)}
          className="w-full mt-4 py-3 border border-maroon-300 text-maroon-700 rounded-xl text-sm font-medium hover:bg-maroon-50"
        >
          Load more ({total - results.length} remaining)
        </button>
      )}
    </div>
  )
}
