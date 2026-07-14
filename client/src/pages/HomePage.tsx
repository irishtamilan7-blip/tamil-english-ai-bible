import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Search, Mic, CalendarDays, ChevronRight, ChevronDown, Globe, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useAppStore, type LanguageConfig } from '../store/useAppStore'
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

// Fallback language list when server is unreachable
const FALLBACK_LANGS: LanguageConfig[] = [
  { key: 'english',  native_name: 'English', direction: 'ltr', file: 'english_bible.json' },
  { key: 'tamil',    native_name: 'தமிழ்',   direction: 'ltr', file: 'tamil_bible.json' },
  { key: 'malayalam', native_name: 'മലയാളം', direction: 'ltr', file: 'malayalam_bible.json' },
  { key: 'korean',   native_name: '한국어',   direction: 'ltr', file: 'korean_bible.json' },
  { key: 'spanish',  native_name: 'Español', direction: 'ltr', file: 'spanish_bible.json' },
  { key: 'arabic',   native_name: 'عربي',    direction: 'rtl', file: 'arabic_bible.json' },
]

// Flag emoji per language key (used in full language list + header button)
const FLAG: Record<string, string> = {
  english: '🇬🇧', tamil: '🇮🇳', malayalam: '🇮🇳', hindi: '🇮🇳', telugu: '🇮🇳',
  kannada: '🇮🇳', marathi: '🇮🇳', korean: '🇰🇷', japanese: '🇯🇵',
  chinese_simplified: '🇨🇳', chinese_traditional: '🇹🇼',
  arabic: '🇸🇦', hebrew: '🇮🇱', greek: '🇬🇷',
  spanish: '🇪🇸', french: '🇫🇷', german: '🇩🇪', portuguese: '🇧🇷',
  russian: '🇷🇺', italian: '🇮🇹', dutch: '🇳🇱', swedish: '🇸🇪',
  turkish: '🇹🇷', vietnamese: '🇻🇳', thai: '🇹🇭', indonesian: '🇮🇩',
  afrikaans: '🇿🇦', albanian: '🇦🇱', armenian: '🇦🇲', burmese: '🇲🇲',
  croatian: '🇭🇷', czech: '🇨🇿', danish: '🇩🇰', esperanto: '🌍',
  estonian: '🇪🇪', finnish: '🇫🇮', hungarian: '🇭🇺', latvian: '🇱🇻',
  lithuanian: '🇱🇹', malagasy: '🇲🇬', maori: '🇳🇿', mongolian: '🇲🇳',
  norwegian: '🇳🇴', polish: '🇵🇱', romanian: '🇷🇴', serbian: '🇷🇸',
  shona: '🇿🇼', swahili: '🇹🇿', tagalog: '🇵🇭', ukrainian: '🇺🇦',
}

// Country list — always shows language sub-picker on selection
interface CountryEntry { flag: string; name: string; langs: string[] }
const COUNTRIES: CountryEntry[] = [
  { flag: '🇺🇸', name: 'United States',   langs: ['english'] },
  { flag: '🇬🇧', name: 'United Kingdom',  langs: ['english'] },
  { flag: '🇮🇳', name: 'India',           langs: ['tamil', 'malayalam', 'hindi', 'telugu', 'kannada', 'marathi'] },
  { flag: '🇰🇷', name: 'South Korea',     langs: ['korean'] },
  { flag: '🇯🇵', name: 'Japan',           langs: ['japanese'] },
  { flag: '🇨🇳', name: 'China',           langs: ['chinese_simplified'] },
  { flag: '🇹🇼', name: 'Taiwan',          langs: ['chinese_traditional'] },
  { flag: '🇸🇦', name: 'Saudi Arabia',    langs: ['arabic'] },
  { flag: '🇮🇱', name: 'Israel',          langs: ['hebrew'] },
  { flag: '🇬🇷', name: 'Greece',          langs: ['greek'] },
  { flag: '🇪🇸', name: 'Spain',           langs: ['spanish'] },
  { flag: '🇫🇷', name: 'France',          langs: ['french'] },
  { flag: '🇩🇪', name: 'Germany',         langs: ['german'] },
  { flag: '🇧🇷', name: 'Brazil',          langs: ['portuguese'] },
  { flag: '🇵🇹', name: 'Portugal',        langs: ['portuguese'] },
  { flag: '🇷🇺', name: 'Russia',          langs: ['russian'] },
  { flag: '🇮🇹', name: 'Italy',           langs: ['italian'] },
  { flag: '🇳🇱', name: 'Netherlands',     langs: ['dutch'] },
  { flag: '🇵🇭', name: 'Philippines',     langs: ['tagalog'] },
  { flag: '🇹🇭', name: 'Thailand',        langs: ['thai'] },
  { flag: '🇻🇳', name: 'Vietnam',         langs: ['vietnamese'] },
  { flag: '🇮🇩', name: 'Indonesia',       langs: ['indonesian'] },
  { flag: '🇸🇪', name: 'Sweden',          langs: ['swedish'] },
  { flag: '🇹🇷', name: 'Turkey',          langs: ['turkish'] },
  { flag: '🇺🇦', name: 'Ukraine',         langs: ['ukrainian'] },
  { flag: '🇵🇱', name: 'Poland',          langs: ['polish'] },
  { flag: '🇷🇴', name: 'Romania',         langs: ['romanian'] },
  { flag: '🇨🇿', name: 'Czech Republic',  langs: ['czech'] },
  { flag: '🇭🇺', name: 'Hungary',         langs: ['hungarian'] },
  { flag: '🇩🇰', name: 'Denmark',         langs: ['danish'] },
  { flag: '🇫🇮', name: 'Finland',         langs: ['finnish'] },
  { flag: '🇳🇴', name: 'Norway',          langs: ['norwegian'] },
  { flag: '🇷🇸', name: 'Serbia',          langs: ['serbian'] },
  { flag: '🇭🇷', name: 'Croatia',         langs: ['croatian'] },
  { flag: '🇦🇱', name: 'Albania',         langs: ['albanian'] },
  { flag: '🇦🇲', name: 'Armenia',         langs: ['armenian'] },
  { flag: '🇲🇲', name: 'Myanmar',         langs: ['burmese'] },
  { flag: '🇲🇳', name: 'Mongolia',        langs: ['mongolian'] },
  { flag: '🇲🇬', name: 'Madagascar',      langs: ['malagasy'] },
  { flag: '🇳🇿', name: 'New Zealand',     langs: ['maori'] },
  { flag: '🇿🇦', name: 'South Africa',    langs: ['afrikaans'] },
  { flag: '🇹🇿', name: 'Tanzania',        langs: ['swahili'] },
  { flag: '🇿🇼', name: 'Zimbabwe',        langs: ['shona'] },
  { flag: '🇱🇻', name: 'Latvia',          langs: ['latvian'] },
  { flag: '🇱🇹', name: 'Lithuania',       langs: ['lithuanian'] },
  { flag: '🇪🇪', name: 'Estonia',         langs: ['estonian'] },
  { flag: '🌍',  name: 'Esperanto',       langs: ['esperanto'] },
]

interface DailyVerse {
  ref: string
  textEnglish: string
  textLocal: string   // text in the selected language (empty string when English is selected)
  bookId: number
  chapter: number
  verse: number
}

const STORAGE_PREFIX = 'bv_daily_verse'

function loadStoredVerse(today: string, lang: string): DailyVerse | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}_${lang}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.date === today ? parsed.verse : null
  } catch { return null }
}

function saveVerse(today: string, lang: string, verse: DailyVerse) {
  try { localStorage.setItem(`${STORAGE_PREFIX}_${lang}`, JSON.stringify({ date: today, verse })) } catch {}
}

// Only return cached verse if it has valid local text (or is English)
function loadValidVerse(today: string, lang: string): DailyVerse | null {
  const v = loadStoredVerse(today, lang)
  if (!v) return null
  if (lang === 'english') return v
  // Reject cache if textLocal is missing OR equals English text (stale: server was returning English for this lang)
  if (!v.textLocal || v.textLocal === v.textEnglish) {
    try { localStorage.removeItem(`${STORAGE_PREFIX}_${lang}`) } catch {}
    return null
  }
  return v
}

function prefetchTestaments(lang = 'english') {
  const oldKey = `${lang}:old`
  const newKey = `${lang}:new`
  if (testamentBooksCache[oldKey] && testamentBooksCache[newKey]) return
  bibleApi.getBooks(lang)
    .then((res) => {
      const all = res.data.books
      testamentBooksCache[oldKey] = all.filter((b: { testament: string }) => b.testament === 'old')
      testamentBooksCache[newKey] = all.filter((b: { testament: string }) => b.testament === 'new')
      all.forEach((b: { id: number; name_english: string; name_tamil: string; name_local: string; chapter_count: number; testament: string }) => { bookCache[b.id] = b })
    })
    .catch(() => {})
}

export default function HomePage() {
  const { language, setLanguage, lastRead, searchHistory } = useAppStore()
  const today = new Date().toDateString()
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(() => loadValidVerse(today, language))
  const [showLangSheet, setShowLangSheet]   = useState(false)
  const [langSearch, setLangSearch]         = useState('')
  const [availableLangs, setAvailableLangs] = useState<LanguageConfig[]>(FALLBACK_LANGS)
  const [kbHeight, setKbHeight]             = useState(0)
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [showLangPicker, setShowLangPicker]       = useState(false)
  const [countrySearch, setCountrySearch]         = useState('')

  // Track keyboard height so the language sheet stays above the iOS keyboard
  useEffect(() => {
    if (!showLangSheet) { setKbHeight(0); return }
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setKbHeight(Math.max(0, window.innerHeight - vv.height))
    vv.addEventListener('resize', update)
    return () => vv.removeEventListener('resize', update)
  }, [showLangSheet])

  // Prefetch book lists on mount so Old/New Testament pages open instantly
  useEffect(() => { prefetchTestaments(language) }, [language])

  // Load full language list from server
  useEffect(() => {
    bibleApi.getLanguages()
      .then(r => { if (r.data.languages?.length) setAvailableLangs(r.data.languages) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const stored = loadValidVerse(today, language)
    if (stored) { setDailyVerse(stored); return }
    setDailyVerse(null)

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const pick = DAILY_VERSES[dayOfYear % DAILY_VERSES.length]

    const HEBREW_HEADINGS = /^[-\s]*(ALEPH|BETH|GIMEL|DALETH|HE|VAU|VAV|ZAIN|ZAYIN|CHETH|HETH|TETH|JOD|YOD|CAPH|KAPH|LAMED|MEM|NUN|SAMECH|SAMEKH|AIN|AYIN|PE|TZADDI|TSADE|KOPH|QOPH|RESH|SHIN|SCHIN|TAU|TAV)[-\s.]*/i

    // Fetch English + selected language in parallel; use allSettled so English always shows
    const promises = [
      bibleApi.getChapter(pick.bookId, pick.chapter, 'english'),
      language !== 'english' ? bibleApi.getChapter(pick.bookId, pick.chapter, language) : Promise.resolve(null),
    ] as const

    Promise.allSettled(promises).then(([engResult, localResult]) => {
      if (engResult.status === 'rejected') return  // can't show anything without English
      const findText = (verses: { verse_no: number; text: string }[]) =>
        (verses.find(v => v.verse_no === pick.verse)?.text || '').replace(HEBREW_HEADINGS, '').trim()
      const engVerses = engResult.value.data.verses
      const localVerses = localResult.status === 'fulfilled' && localResult.value
        ? localResult.value.data.verses : null
      const verse: DailyVerse = {
        ref: pick.ref,
        textEnglish: findText(engVerses),
        textLocal:   localVerses ? findText(localVerses) : '',
        bookId: pick.bookId,
        chapter: pick.chapter,
        verse: pick.verse,
      }
      saveVerse(today, language, verse)
      setDailyVerse(verse)
    })
  }, [today, language])

  const currentLang = availableLangs.find(l => l.key === language)
  const filteredLangs = availableLangs.filter(l =>
    !langSearch ||
    l.native_name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.key.toLowerCase().includes(langSearch.toLowerCase())
  )

  const activeCountry = COUNTRIES.find(c => c.langs.includes(language)) ?? COUNTRIES[0]
  const countryLangs  = activeCountry.langs
    .map(k => availableLangs.find(l => l.key === k))
    .filter(Boolean) as LanguageConfig[]

  function handleCountrySelect(c: CountryEntry) {
    setShowCountryPicker(false)
    // Always show language picker so user sees what language they're selecting
    if (!c.langs.includes(language)) setLanguage(c.langs[0])
    setShowLangPicker(true)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-maroon-700 font-serif">Tamil English AI Bible</h1>
          <p className="text-sm text-gray-500 font-tamil">விவிலியம் — Hear the Word</p>
        </div>
      </div>

      {/* ── Country + Language two-step selector ─────────────────────── */}
      <div className="flex gap-3">
        {/* Step 1 — Country */}
        <button
          onClick={() => setShowCountryPicker(true)}
          className="flex-1 flex items-center gap-3 px-4 py-3 bg-white border border-cream-300 rounded-2xl shadow-sm active:bg-cream-50 transition-colors"
        >
          <span className="text-2xl leading-none shrink-0">{activeCountry.flag}</span>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Country</p>
            <p className="text-sm font-bold text-gray-800 truncate">{activeCountry.name}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        </button>

        {/* Step 2 — Language (only shown when country has multiple langs) */}
        <button
          onClick={() => setShowLangPicker(true)}
          className="flex-1 flex items-center gap-3 px-4 py-3 bg-maroon-700 border border-maroon-700 rounded-2xl shadow-sm active:bg-maroon-800 transition-colors"
        >
          <div className="flex-1 text-left min-w-0">
            <p className="text-[10px] text-maroon-300 font-medium uppercase tracking-wide">Language</p>
            <p className="text-sm font-bold text-white truncate" dir={currentLang?.direction ?? 'ltr'}>
              {currentLang?.native_name ?? 'English'}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-maroon-300 shrink-0" />
        </button>
      </div>

      {/* ── Country picker sheet ──────────────────────────────────────── */}
      {showCountryPicker && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => { setShowCountryPicker(false); setCountrySearch('') }} />
          <div
            className="fixed left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl flex flex-col"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)', maxHeight: 'calc(88dvh - 4rem)' }}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-cream-200 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-800 text-base">Select Country</p>
                <button onClick={() => { setShowCountryPicker(false); setCountrySearch('') }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  placeholder="Search country…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-400 bg-cream-50"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Scrollable country grid */}
            <div className="overflow-y-auto flex-1 px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                {COUNTRIES
                  .filter(c => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                  .map(c => {
                    const active = c.langs.includes(language)
                    return (
                      <button
                        key={c.flag + c.name}
                        onClick={() => handleCountrySelect(c)}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-95',
                          active ? 'bg-maroon-700 border-maroon-700' : 'bg-cream-50 border-cream-200 active:bg-cream-100'
                        )}
                      >
                        <span className="text-2xl leading-none shrink-0">{c.flag}</span>
                        <div className="flex-1 text-left min-w-0">
                          <p className={clsx('font-semibold text-sm leading-tight truncate', active ? 'text-white' : 'text-gray-800')}>
                            {c.name}
                          </p>
                          {c.langs.length > 1 && (
                            <p className={clsx('text-[10px] mt-0.5', active ? 'text-maroon-200' : 'text-gray-400')}>
                              {c.langs.length} languages
                            </p>
                          )}
                        </div>
                        {active && <Check className="h-4 w-4 text-white shrink-0" />}
                      </button>
                    )
                  })}
                {COUNTRIES.filter(c => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                  <p className="col-span-2 text-center text-sm text-gray-400 py-8">No country found</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Language picker sheet (for multi-lang countries) ──────────── */}
      {showLangPicker && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/50" onClick={() => setShowLangPicker(false)} />
          <div
            className="fixed left-0 right-0 z-[90] bg-white rounded-t-2xl shadow-2xl"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' }}
          >
            <div className="px-5 pt-4 pb-3 border-b border-cream-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeCountry.flag}</span>
                <p className="font-bold text-gray-800 text-base">{activeCountry.name} — Select Language</p>
              </div>
              <button onClick={() => setShowLangPicker(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {countryLangs.map(l => {
                const sel = language === l.key
                return (
                  <button
                    key={l.key}
                    onClick={() => { setLanguage(l.key); setShowLangPicker(false) }}
                    className={clsx(
                      'flex flex-col items-start px-4 py-3.5 rounded-2xl border transition-all active:scale-95',
                      sel ? 'bg-maroon-700 border-maroon-700' : 'bg-cream-50 border-cream-200 active:bg-cream-100'
                    )}
                  >
                    <p className={clsx('font-bold text-xl leading-tight', sel ? 'text-white' : 'text-gray-800')} dir={l.direction}>
                      {l.native_name}
                    </p>
                    <p className={clsx('text-xs capitalize mt-1', sel ? 'text-maroon-200' : 'text-gray-400')}>
                      {l.key}
                    </p>
                    {sel && <span className="text-maroon-200 text-[10px] mt-0.5">✓ Selected</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Daily Verse */}
      <div className="bg-maroon-700 rounded-2xl p-5 text-white">
        <p className="text-xs font-medium text-gold-400 uppercase tracking-wide mb-3">
          Today's Verse · {new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
        </p>
        {dailyVerse ? (
          <>
            {/* Primary text: selected language (or English if English is selected) */}
            <p className={`text-base leading-relaxed mb-3 opacity-95 ${language === 'english' ? 'font-serif' : language === 'tamil' ? 'font-tamil' : ''}`}
               dir={currentLang?.direction ?? 'ltr'}>
              &ldquo;{dailyVerse.textLocal || dailyVerse.textEnglish}&rdquo;
            </p>
            {/* Secondary text: English (only when a non-English language is active) */}
            {language !== 'english' && dailyVerse.textEnglish && (
              <>
                <div className="border-t border-maroon-500 mb-3" />
                <p className="text-sm leading-relaxed font-serif text-maroon-100 mb-3">
                  &ldquo;{dailyVerse.textEnglish}&rdquo;
                </p>
              </>
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
            onTouchStart={() => prefetchTestaments(language)}
            className="bg-white border border-cream-300 rounded-xl p-4 text-center hover:border-maroon-300 transition-colors"
          >
            <p className="font-semibold text-maroon-700">Old Testament</p>
            {language === 'tamil' && <p className="text-xs text-gray-500 font-tamil mt-0.5">பழைய ஏற்பாடு</p>}
            <p className="text-xs text-gray-400 mt-1">39 Books</p>
          </Link>
          <Link
            to="/testament/new"
            onTouchStart={() => prefetchTestaments(language)}
            className="bg-white border border-cream-300 rounded-xl p-4 text-center hover:border-maroon-300 transition-colors"
          >
            <p className="font-semibold text-maroon-700">New Testament</p>
            {language === 'tamil' && <p className="text-xs text-gray-500 font-tamil mt-0.5">புதிய ஏற்பாடு</p>}
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

      {/* ── Language selector bottom sheet ───────────────────────────── */}
      {showLangSheet && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => setShowLangSheet(false)} />
          <div
            className="fixed left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl flex flex-col"
            style={
              kbHeight > 0
                ? { bottom: kbHeight, maxHeight: `calc(85dvh - ${kbHeight}px)` }
                : { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)', maxHeight: 'calc(85dvh - 4rem)' }
            }
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-cream-200 shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-maroon-700" />
                <p className="font-bold text-gray-800 text-base">Choose Language</p>
              </div>
              <button
                onClick={() => setShowLangSheet(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-cream-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={langSearch}
                  onChange={e => setLangSearch(e.target.value)}
                  placeholder="Search language…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-400 bg-cream-50"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Language list */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1.5">
              {filteredLangs.map(l => (
                <button
                  key={l.key}
                  onClick={() => { setLanguage(l.key); setShowLangSheet(false) }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-left',
                    language === l.key
                      ? 'bg-maroon-700 text-white shadow-sm'
                      : 'bg-cream-50 border border-cream-200 text-gray-800 hover:bg-cream-100 active:bg-cream-200'
                  )}
                >
                  <span className="text-2xl leading-none shrink-0">{FLAG[l.key] ?? '🌐'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base leading-tight" dir={l.direction}>
                      {l.native_name}
                    </p>
                    <p className={clsx('text-xs mt-0.5 capitalize', language === l.key ? 'text-maroon-200' : 'text-gray-400')}>
                      {l.key.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {language === l.key
                    ? <Check className="h-5 w-5 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  }
                </button>
              ))}

              {filteredLangs.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No languages found</p>
              )}
            </div>

            {/* Bilingual hint for non-English */}
            {language !== 'english' && (
              <div className="px-5 py-3 border-t border-cream-200 shrink-0">
                <p className="text-xs text-center text-gray-500">
                  Tip: Tap <span className="font-semibold text-maroon-700">+ EN</span> in the reader to show English side by side
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
