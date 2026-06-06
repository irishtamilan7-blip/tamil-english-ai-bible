import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Settings2, Volume2 } from 'lucide-react'
import { clsx } from 'clsx'
import { bibleApi } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import VerseActionBar from '../components/VerseActionBar'
import TextSettingsModal from '../components/TextSettingsModal'

interface Verse { verse_no: number; text: string }
interface ChapterData {
  book_id: number
  book_name_english: string
  book_name_tamil: string
  chapter_no: number
  verses: Verse[]
  other_lang_verses: Verse[] | null
  has_next: boolean
  has_prev: boolean
}

export default function ReadPage() {
  const { bookId, chapterNo } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { language, fontSize, lineSpacing, fontFamily, setLastRead } = useAppStore()

  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const targetVerse = searchParams.get('verse')
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lang = language === 'bilingual' ? 'english' : language

  const loadChapter = useCallback(async (bId: string, chId: string) => {
    setLoading(true)
    try {
      const res = await bibleApi.getChapter(
        parseInt(bId),
        parseInt(chId),
        lang,
        language === 'bilingual'
      )
      setChapter(res.data)
      setLastRead({
        bookId: parseInt(bId),
        bookName: res.data.book_name_english,
        chapterNo: parseInt(chId),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [lang, language, setLastRead])

  useEffect(() => {
    if (bookId && chapterNo) loadChapter(bookId, chapterNo)
  }, [bookId, chapterNo, loadChapter])

  // Scroll to target verse with golden flash
  useEffect(() => {
    if (!targetVerse || !chapter || loading) return
    const vNo = parseInt(targetVerse)
    const el = verseRefs.current.get(vNo)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('verse-flash')
        flashTimer.current = setTimeout(() => el.classList.remove('verse-flash'), 1500)
      }, 300)
    }
    return () => { if (flashTimer.current) clearTimeout(flashTimer.current) }
  }, [targetVerse, chapter, loading])

  const lineSpacingClass = {
    compact: 'leading-relaxed',
    normal: 'leading-loose',
    relaxed: 'leading-[2.2]',
  }[lineSpacing]

  const fontClass = {
    default: 'font-sans',
    serif: 'font-serif',
    'tamil-traditional': 'font-tamil',
    dyslexic: 'font-dyslexic',
  }[fontFamily]

  function goChapter(dir: 1 | -1) {
    if (!chapter || !bookId) return
    const next = chapter.chapter_no + dir
    if (dir === 1 && !chapter.has_next) {
      // Next book
      navigate(`/read/${parseInt(bookId) + 1}/1`)
    } else if (dir === -1 && !chapter.has_prev) {
      // Prev book
      navigate(`/book/${parseInt(bookId) - 1}`)
    } else {
      navigate(`/read/${bookId}/${next}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-maroon-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!chapter) {
    return <div className="p-8 text-center text-gray-500">Chapter not found</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-cream-300 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-maroon-700 text-sm">{chapter.book_name_english}</p>
          <p className="text-xs text-gray-500 font-tamil">{chapter.book_name_tamil} · {chapter.chapter_no}</p>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 text-gray-600 hover:text-maroon-700">
          <Settings2 className="h-5 w-5" />
        </button>
      </div>

      {/* Language mode toggle */}
      <div className="flex border-b border-cream-300 bg-cream-100">
        {(['english', 'tamil', 'bilingual'] as const).map((m) => (
          <button
            key={m}
            onClick={() => useAppStore.getState().setLanguage(m)}
            className={clsx(
              'flex-1 py-2 text-xs font-medium capitalize transition-colors',
              language === m ? 'bg-maroon-700 text-white' : 'text-gray-600 hover:bg-cream-200'
            )}
          >
            {m === 'bilingual' ? 'Bilingual' : m === 'tamil' ? 'தமிழ்' : 'English'}
          </button>
        ))}
      </div>

      {/* Chapter content */}
      <div className="px-5 py-6">
        <h2 className="text-2xl font-bold text-maroon-700 font-serif mb-6 text-center">
          Chapter {chapter.chapter_no}
        </h2>

        {language === 'bilingual' ? (
          // Bilingual layout
          <div className="space-y-4">
            {chapter.verses.map((v) => {
              const tamilVerse = chapter.other_lang_verses?.find(tv => tv.verse_no === v.verse_no)
              return (
                <div
                  key={v.verse_no}
                  ref={(el) => { if (el) verseRefs.current.set(v.verse_no, el) }}
                  className={clsx(
                    'rounded-xl p-3 border cursor-pointer transition-colors',
                    selectedVerse === v.verse_no ? 'border-gold-500 bg-gold-300/20' : 'border-transparent hover:bg-cream-100'
                  )}
                  onClick={() => setSelectedVerse(selectedVerse === v.verse_no ? null : v.verse_no)}
                >
                  <span className="text-xs font-bold text-gold-600 mr-2">{v.verse_no}</span>
                  {/* Desktop: side by side | Mobile: stacked */}
                  <div className="md:grid md:grid-cols-2 md:gap-4 space-y-2 md:space-y-0 mt-1">
                    <p className={clsx('text-gray-800', fontClass, lineSpacingClass)} style={{ fontSize }}>
                      {v.text}
                    </p>
                    <p className={clsx('text-gray-700 font-tamil border-t md:border-t-0 md:border-l border-cream-300 md:pl-4 pt-2 md:pt-0', lineSpacingClass)} style={{ fontSize: fontSize - 1 }}>
                      {tamilVerse?.text || <span className="text-gray-400 italic text-sm">Tamil not available</span>}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Single language layout
          <div className="space-y-1">
            {chapter.verses.map((v) => (
              <div
                key={v.verse_no}
                ref={(el) => { if (el) verseRefs.current.set(v.verse_no, el) }}
                className={clsx(
                  'rounded-xl px-3 py-2 cursor-pointer transition-colors',
                  selectedVerse === v.verse_no ? 'bg-gold-300/30 border border-gold-500' : 'hover:bg-cream-100'
                )}
                onClick={() => setSelectedVerse(selectedVerse === v.verse_no ? null : v.verse_no)}
              >
                <sup className="text-xs font-bold text-gold-600 mr-1.5 select-none">{v.verse_no}</sup>
                <span
                  className={clsx(
                    'text-gray-800',
                    fontClass,
                    lineSpacingClass,
                    language === 'tamil' && 'font-tamil'
                  )}
                  style={{ fontSize }}
                >
                  {v.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chapter navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-cream-300 mb-4">
        <button
          onClick={() => goChapter(-1)}
          className="flex items-center gap-1 text-sm text-maroon-700 font-medium disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="text-sm text-gray-500">Chapter {chapter.chapter_no}</span>
        <button
          onClick={() => goChapter(1)}
          className="flex items-center gap-1 text-sm text-maroon-700 font-medium"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Verse action bar */}
      {selectedVerse && (
        <VerseActionBar
          bookId={chapter.book_id}
          chapterNo={chapter.chapter_no}
          verseNo={selectedVerse}
          text={chapter.verses.find(v => v.verse_no === selectedVerse)?.text || ''}
          onClose={() => setSelectedVerse(null)}
        />
      )}

      {/* Text settings modal */}
      {showSettings && <TextSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
