import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Search, Mic } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { bibleApi } from '../utils/api'

// Daily verse: deterministic by day-of-year
const DAILY_VERSES = [
  { bookId: 43, chapter: 3, verse: 16, ref: 'John 3:16' },
  { bookId: 19, chapter: 23, verse: 1, ref: 'Psalm 23:1' },
  { bookId: 49, chapter: 2, verse: 8, ref: 'Ephesians 2:8' },
  { bookId: 45, chapter: 8, verse: 28, ref: 'Romans 8:28' },
  { bookId: 20, chapter: 3, verse: 5, ref: 'Proverbs 3:5' },
  { bookId: 50, chapter: 4, verse: 13, ref: 'Philippians 4:13' },
  { bookId: 23, chapter: 40, verse: 31, ref: 'Isaiah 40:31' },
  { bookId: 19, chapter: 119, verse: 105, ref: 'Psalm 119:105' },
  { bookId: 24, chapter: 29, verse: 11, ref: 'Jeremiah 29:11' },
  { bookId: 42, chapter: 1, verse: 37, ref: 'Luke 1:37' },
]

interface DailyVerse {
  ref: string
  text: string
  bookId: number
  chapter: number
  verse: number
}

export default function HomePage() {
  const { lastRead, searchHistory, language } = useAppStore()
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null)

  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const pick = DAILY_VERSES[dayOfYear % DAILY_VERSES.length]
    const lang = language === 'bilingual' ? 'english' : language

    bibleApi.getChapter(pick.bookId, pick.chapter, lang)
      .then((res) => {
        const verses = res.data.verses
        const v = verses.find((vv: { verse_no: number; text: string }) => vv.verse_no === pick.verse)
        if (v) setDailyVerse({ ref: pick.ref, text: v.text, bookId: pick.bookId, chapter: pick.chapter, verse: pick.verse })
      })
      .catch(() => {})
  }, [language])

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-maroon-700 font-serif">BibleVoice</h1>
        <p className="text-sm text-gray-500 font-tamil">விவிலியம் — Hear the Word</p>
      </div>

      {/* Daily Verse */}
      <div className="bg-maroon-700 rounded-2xl p-5 text-white">
        <p className="text-xs font-medium text-gold-400 uppercase tracking-wide mb-2">
          Today's Verse · {new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
        </p>
        {dailyVerse ? (
          <>
            <p className="text-base leading-relaxed font-serif mb-3 opacity-95">
              "{dailyVerse.text}"
            </p>
            <Link
              to={`/read/${dailyVerse.bookId}/${dailyVerse.chapter}?verse=${dailyVerse.verse}`}
              className="text-sm text-gold-400 font-medium hover:text-gold-300"
            >
              — {dailyVerse.ref} →
            </Link>
          </>
        ) : (
          <div className="h-16 animate-pulse bg-maroon-600 rounded-lg" />
        )}
      </div>

      {/* Voice hint */}
      <div className="flex items-center gap-3 bg-cream-200 rounded-xl p-4 border border-cream-300">
        <div className="w-10 h-10 bg-maroon-700 rounded-full flex items-center justify-center shrink-0">
          <Mic className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-maroon-700">Voice Search</p>
          <p className="text-xs text-gray-500">Hold the mic button and say a verse (e.g. "John 3 16")</p>
        </div>
      </div>

      {/* Continue Reading */}
      {lastRead && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Clock className="h-4 w-4" /> Continue Reading
          </h2>
          <Link
            to={`/read/${lastRead.bookId}/${lastRead.chapterNo}`}
            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-cream-300 hover:border-maroon-300 transition-colors"
          >
            <div className="w-10 h-10 bg-cream-200 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-maroon-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{lastRead.bookName}</p>
              <p className="text-sm text-gray-500">Chapter {lastRead.chapterNo}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Testaments */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Browse Bible</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/testament/old"
            className="bg-white border border-cream-300 rounded-xl p-4 text-center hover:border-maroon-300 transition-colors"
          >
            <p className="font-semibold text-maroon-700">Old Testament</p>
            <p className="text-xs text-gray-500 font-tamil mt-0.5">பழைய ஏற்பாடு</p>
            <p className="text-xs text-gray-400 mt-1">39 Books</p>
          </Link>
          <Link
            to="/testament/new"
            className="bg-white border border-cream-300 rounded-xl p-4 text-center hover:border-maroon-300 transition-colors"
          >
            <p className="font-semibold text-maroon-700">New Testament</p>
            <p className="text-xs text-gray-500 font-tamil mt-0.5">புதிய ஏற்பாடு</p>
            <p className="text-xs text-gray-400 mt-1">27 Books</p>
          </Link>
        </div>
      </div>

      {/* Recent searches */}
      {searchHistory.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Search className="h-4 w-4" /> Recent Searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 3).map((q) => (
              <Link
                key={q}
                to={`/search?q=${encodeURIComponent(q)}`}
                className="px-3 py-1.5 bg-white border border-cream-300 rounded-full text-sm text-gray-700 hover:border-maroon-300"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
