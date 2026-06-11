import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Search, Mic, CalendarDays, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { bibleApi } from '../utils/api'
import bookCache from '../utils/bookCache'
import testamentBooksCache from '../utils/testamentBooksCache'

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
  textEnglish: string
  textTamil: string
  bookId: number
  chapter: number
  verse: number
}

const STORAGE_KEY = 'bv_daily_verse'

function loadStoredVerse(today: string): DailyVerse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.date === today ? parsed.verse : null
  } catch { return null }
}

function saveVerse(today: string, verse: DailyVerse) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, verse })) } catch {}
}

function prefetchTestaments() {
  if (testamentBooksCache['old'] && testamentBooksCache['new']) return
  bibleApi.getBooks('english')
    .then((res) => {
      const all = res.data.books
      testamentBooksCache['old'] = all.filter((b: { testament: string }) => b.testament === 'old')
      testamentBooksCache['new'] = all.filter((b: { testament: string }) => b.testament === 'new')
      all.forEach((b: { id: number; name_english: string; name_tamil: string; chapter_count: number; testament: string }) => { bookCache[b.id] = b })
    })
    .catch(() => {})
}

export default function HomePage() {
  const { lastRead, searchHistory } = useAppStore()
  const today = new Date().toDateString()
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(() => loadStoredVerse(today))

  // Prefetch book lists on mount so Old/New Testament pages open instantly
  useEffect(() => { prefetchTestaments() }, [])

  useEffect(() => {
    if (loadStoredVerse(today)) return
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const pick = DAILY_VERSES[dayOfYear % DAILY_VERSES.length]

    Promise.all([
      bibleApi.getChapter(pick.bookId, pick.chapter, 'english'),
      bibleApi.getChapter(pick.bookId, pick.chapter, 'tamil'),
    ]).then(([engRes, tamRes]) => {
      const HEBREW_HEADINGS = /^[-\s]*(ALEPH|BETH|GIMEL|DALETH|HE|VAU|VAV|ZAIN|ZAYIN|CHETH|HETH|TETH|JOD|YOD|CAPH|KAPH|LAMED|MEM|NUN|SAMECH|SAMEKH|AIN|AYIN|PE|TZADDI|TSADE|KOPH|QOPH|RESH|SHIN|SCHIN|TAU|TAV)[-\s.]*/i
      const findText = (verses: { verse_no: number; text: string }[]) =>
        (verses.find(v => v.verse_no === pick.verse)?.text || '').replace(HEBREW_HEADINGS, '').trim()
      const verse: DailyVerse = {
        ref: pick.ref,
        textEnglish: findText(engRes.data.verses),
        textTamil:   findText(tamRes.data.verses),
        bookId: pick.bookId,
        chapter: pick.chapter,
        verse: pick.verse,
      }
      saveVerse(today, verse)
      setDailyVerse(verse)
    }).catch(() => {})
  }, [today])

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-maroon-700 font-serif">Tamil English AI Bible</h1>
        <p className="text-sm text-gray-500 font-tamil">விவிலியம் — Hear the Word</p>
      </div>

      {/* Daily Verse */}
      <div className="bg-maroon-700 rounded-2xl p-5 text-white">
        <p className="text-xs font-medium text-gold-400 uppercase tracking-wide mb-3">
          Today's Verse · {new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
        </p>
        {dailyVerse ? (
          <>
            {/* English */}
            <p className="text-base leading-relaxed font-serif mb-3 opacity-95">
              "{dailyVerse.textEnglish}"
            </p>
            {/* Divider */}
            <div className="border-t border-maroon-500 mb-3" />
            {/* Tamil */}
            {dailyVerse.textTamil && (
              <p className="text-sm leading-relaxed font-tamil text-maroon-100 mb-3">
                "{dailyVerse.textTamil}"
              </p>
            )}
            <Link
              to={`/read/${dailyVerse.bookId}/${dailyVerse.chapter}?verse=${dailyVerse.verse}`}
              className="inline-block text-sm text-gold-400 font-medium hover:text-gold-300"
            >
              — {dailyVerse.ref} →
            </Link>
          </>
        ) : (
          <div className="space-y-2">
            <div className="h-4 animate-pulse bg-maroon-600 rounded w-full" />
            <div className="h-4 animate-pulse bg-maroon-600 rounded w-4/5" />
            <div className="h-px bg-maroon-500 my-3" />
            <div className="h-4 animate-pulse bg-maroon-600 rounded w-full" />
            <div className="h-4 animate-pulse bg-maroon-600 rounded w-3/4" />
          </div>
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
            onTouchStart={prefetchTestaments}
            className="bg-white border border-cream-300 rounded-xl p-4 text-center hover:border-maroon-300 transition-colors"
          >
            <p className="font-semibold text-maroon-700">Old Testament</p>
            <p className="text-xs text-gray-500 font-tamil mt-0.5">பழைய ஏற்பாடு</p>
            <p className="text-xs text-gray-400 mt-1">39 Books</p>
          </Link>
          <Link
            to="/testament/new"
            onTouchStart={prefetchTestaments}
            className="bg-white border border-cream-300 rounded-xl p-4 text-center hover:border-maroon-300 transition-colors"
          >
            <p className="font-semibold text-maroon-700">New Testament</p>
            <p className="text-xs text-gray-500 font-tamil mt-0.5">புதிய ஏற்பாடு</p>
            <p className="text-xs text-gray-400 mt-1">27 Books</p>
          </Link>
        </div>
      </div>

      {/* Reading Plan */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Reading Plan</h2>
        <Link
          to="/plan"
          className="flex items-center gap-4 bg-white border border-cream-300 rounded-xl px-4 py-3.5 hover:border-maroon-300 transition-colors"
        >
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">Reading Plan</p>
            <p className="text-xs text-gray-500">Read the Bible in 365 days</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        </Link>
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
