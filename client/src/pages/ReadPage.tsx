import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Settings2, Link2, Volume2, VolumeX, BookOpen, X, MoreVertical } from 'lucide-react'
import { clsx } from 'clsx'
import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { bibleApi } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import chapterCache from '../utils/chapterCache'
import VerseActionBar from '../components/VerseActionBar'
import TextSettingsModal from '../components/TextSettingsModal'
import { useHighlightStore } from '../store/useHighlightStore'
import { useNoteStore } from '../store/useNoteStore'
import { useReadingPlanStore } from '../store/useReadingPlanStore'
import { getPlan } from '../utils/readingPlan'

// chapterCache imported from ../utils/chapterCache (shared with BookPage for prefetch)

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
interface DictMeaning {
  partOfSpeech: string
  definitions: { definition: string; example?: string }[]
}
interface DictEntry {
  word: string
  phonetic?: string
  meanings: DictMeaning[]
}

export default function ReadPage() {
  const { bookId, chapterNo } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { language, fontSize, lineSpacing, fontFamily, setLastRead, lastRead, bibleVersion, setBibleVersion, elevenLabsKey, elevenLabsVoiceId } = useAppStore()

  // Synchronous cache check — if BookPage prefetched this chapter, render it immediately with no spinner
  const _initLang = language === 'bilingual' ? 'english' : language
  const _initKey = bookId && chapterNo ? `${bookId}-${chapterNo}-${_initLang}-${language === 'bilingual'}-${bibleVersion}` : ''
  const _initChapter: ChapterData | null = _initKey ? (chapterCache[_initKey] as ChapterData ?? null) : null

  const [chapter, setChapter]         = useState<ChapterData | null>(_initChapter)
  const [loading, setLoading]         = useState(!_initChapter)
  const [loadError, setLoadError]     = useState(false)
  const [loadingSlow, setLoadingSlow] = useState(false)
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [showSettings, setShowSettings]   = useState(false)
  const [copiedVerse, setCopiedVerse]     = useState<number | null>(null)

  // Audio TTS
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioVerse, setAudioVerse]     = useState<number | null>(null)
  const iosTimer   = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const abortCtrl  = useRef<AbortController | null>(null)

  // Language / version sheet
  const [showLangMenu, setShowLangMenu] = useState(false)

  // Version catalog loaded from server
  interface VersionMeta { id: string; name: string; short: string; year: number; free: boolean; available: boolean }
  const [versionCatalog, setVersionCatalog] = useState<VersionMeta[]>([])

  // Dictionary
  const [dictWord, setDictWord]     = useState('')
  const [dictEntry, setDictEntry]   = useState<DictEntry | null>(null)
  const [dictTamil, setDictTamil]   = useState('')
  const [dictLoading, setDictLoading] = useState(false)
  const [dictError, setDictError]   = useState(false)

  const targetVerse = searchParams.get('verse')
  const verseRefs   = useRef<Map<number, HTMLDivElement>>(new Map())
  const flashTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lang = language === 'bilingual' ? 'english' : language

  const { highlights } = useHighlightStore()
  const { notes }      = useNoteStore()
  const planStore = useReadingPlanStore()

  // ── Reading Plan tracking ───────────────────────────────────────────────────
  // When user reaches the last verse AND has spent ≥15 s on page → mark chapter read
  const lastVerseRef   = useRef<HTMLDivElement | null>(null)
  const pageEntryTime  = useRef<number>(Date.now())
  const markedReadRef  = useRef(false)

  useEffect(() => {
    // Reset on chapter change
    pageEntryTime.current = Date.now()
    markedReadRef.current = false
    lastVerseRef.current  = null
  }, [bookId, chapterNo])

  useEffect(() => {
    if (!chapter || !planStore.startDate || markedReadRef.current) return

    // Flexible plan: any chapter in the plan qualifies — user reads at own pace
    const plan = getPlan()
    const isInPlan = plan.some(dayChapters =>
      dayChapters.some(c => c.bookId === chapter.book_id && c.chapterNo === chapter.chapter_no)
    )
    if (!isInPlan) return

    const el = lastVerseRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        markedReadRef.current = true
        planStore.markChapterRead(chapter.book_id, chapter.chapter_no)
        observer.disconnect()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [chapter, planStore, planStore.startDate])

  function getHighlightColor(verseNo: number): string | undefined {
    if (!chapter) return undefined
    return highlights.find(
      (h) => h.bookId === chapter.book_id && h.chapterNo === chapter.chapter_no && h.verseNo === verseNo
    )?.color
  }

  function hasNote(verseNo: number): boolean {
    if (!chapter) return false
    return notes.some(
      (n) => n.bookId === chapter.book_id && n.chapterNo === chapter.chapter_no && n.verseNo === verseNo
    )
  }

  // /read with no params → redirect handled below via <Navigate> before render

  const loadChapter = useCallback(async (bId: string, chId: string) => {
    stopAudio()
    setSelectedVerse(null)
    if (slowTimer.current) clearTimeout(slowTimer.current)

    const cacheKey = `${bId}-${chId}-${lang}-${language === 'bilingual'}-${bibleVersion}`
    const cached = chapterCache[cacheKey]
    if (cached) {
      setChapter(cached)
      setLoading(false)
      setLoadingSlow(false)
      document.querySelector('main')?.scrollTo({ top: 0 })
      setLastRead({ bookId: parseInt(bId), bookName: cached.book_name_english, chapterNo: parseInt(chId) })
      ;([ ['english', false], ['tamil', false], ['english', true] ] as Array<[string, boolean]>).forEach(([vLang, vBilingual]) => {
        if (vLang === lang && vBilingual === (language === 'bilingual')) return
        const vKey = `${bId}-${chId}-${vLang}-${vBilingual}-${bibleVersion}`
        if (chapterCache[vKey]) return
        bibleApi.getChapter(parseInt(bId), parseInt(chId), vLang, vBilingual, bibleVersion).then((r) => { chapterCache[vKey] = r.data }).catch(() => {})
      })
      const chNo = parseInt(chId)
      if (cached.has_prev) {
        const pk = `${bId}-${chNo - 1}-${lang}-${language === 'bilingual'}-${bibleVersion}`
        if (!chapterCache[pk]) bibleApi.getChapter(parseInt(bId), chNo - 1, lang, language === 'bilingual', bibleVersion).then(r => { chapterCache[pk] = r.data }).catch(() => {})
      }
      if (cached.has_next) {
        const nk = `${bId}-${chNo + 1}-${lang}-${language === 'bilingual'}-${bibleVersion}`
        if (!chapterCache[nk]) bibleApi.getChapter(parseInt(bId), chNo + 1, lang, language === 'bilingual', bibleVersion).then(r => { chapterCache[nk] = r.data }).catch(() => {})
      }
      return
    }

    // Cache miss — show spinner and fetch
    setChapter(null)
    setLoading(true)
    setLoadingSlow(false)
    slowTimer.current = setTimeout(() => setLoadingSlow(true), 8000)

    let loaded = false
    let lastErr: unknown
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await bibleApi.getChapter(parseInt(bId), parseInt(chId), lang, language === 'bilingual', bibleVersion, 12000)
        if (slowTimer.current) clearTimeout(slowTimer.current)
        chapterCache[cacheKey] = res.data
        ;([ ['english', false], ['tamil', false], ['english', true] ] as Array<[string, boolean]>).forEach(([vLang, vBilingual]) => {
          if (vLang === lang && vBilingual === (language === 'bilingual')) return
          const vKey = `${bId}-${chId}-${vLang}-${vBilingual}-${bibleVersion}`
          if (chapterCache[vKey]) return
          bibleApi.getChapter(parseInt(bId), parseInt(chId), vLang, vBilingual, bibleVersion).then((r) => { chapterCache[vKey] = r.data }).catch(() => {})
        })
        const chNo = parseInt(chId)
        if (res.data.has_prev) {
          const pk = `${bId}-${chNo - 1}-${lang}-${language === 'bilingual'}-${bibleVersion}`
          if (!chapterCache[pk]) bibleApi.getChapter(parseInt(bId), chNo - 1, lang, language === 'bilingual', bibleVersion).then(r => { chapterCache[pk] = r.data }).catch(() => {})
        }
        if (res.data.has_next) {
          const nk = `${bId}-${chNo + 1}-${lang}-${language === 'bilingual'}-${bibleVersion}`
          if (!chapterCache[nk]) bibleApi.getChapter(parseInt(bId), chNo + 1, lang, language === 'bilingual', bibleVersion).then(r => { chapterCache[nk] = r.data }).catch(() => {})
        }
        setChapter(res.data)
        setLastRead({ bookId: parseInt(bId), bookName: res.data.book_name_english, chapterNo: parseInt(chId) })
        document.querySelector('main')?.scrollTo({ top: 0 })
        setLoadError(false)
        setLoadingSlow(false)
        loaded = true
        break
      } catch (err) {
        lastErr = err
        if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt))
      }
    }
    if (slowTimer.current) clearTimeout(slowTimer.current)
    if (!loaded) { console.error('loadChapter failed:', lastErr); setLoadError(true) }
    setLoading(false)
    setLoadingSlow(false)
  }, [lang, language, bibleVersion, setLastRead])

  useEffect(() => {
    if (bookId && chapterNo) loadChapter(bookId, chapterNo)
  }, [bookId, chapterNo, loadChapter])

  // Load version catalog once
  useEffect(() => {
    bibleApi.getVersions().then(r => setVersionCatalog(r.data.versions)).catch(() => {})
  }, [])

  // Scroll to target verse
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

  // Cleanup on unmount
  useEffect(() => () => {
    stopAudio()
    if (slowTimer.current) clearTimeout(slowTimer.current)
  }, [])

  const isNative = Capacitor.isNativePlatform()

  // ── Audio ──────────────────────────────────────────────────────────────────
  function stopAudio() {
    if (iosTimer.current) { clearInterval(iosTimer.current); iosTimer.current = null }
    if (isNative) { TextToSpeech.stop().catch(() => {}) } else { window.speechSynthesis?.cancel() }
    if (abortCtrl.current) { abortCtrl.current.abort(); abortCtrl.current = null }
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.src = ''; audioElRef.current = null }
    setAudioPlaying(false)
    setAudioVerse(null)
  }

  function cleanForSpeech(text: string, isTamil: boolean): string {
    let t = text
    t = t.replace(/\{[^}]*\}/g, '')
    if (isTamil) {
      t = t.replace(/[.,;:!?'"()\-–—\[\]{}*\/\\]/g, ' ')
    } else {
      t = t.replace(/[\[\]]/g, '').replace(/\s{2,}/g, ' ')
    }
    return t.trim()
  }

  async function speakAtElevenLabs(verses: Verse[], idx: number) {
    if (idx >= verses.length) { stopAudio(); return }
    const v = verses[idx]
    setAudioVerse(v.verse_no)
    setTimeout(() => verseRefs.current.get(v.verse_no)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)

    try {
      const abort = new AbortController()
      abortCtrl.current = abort

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elevenLabsKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanForSpeech(v.text, language === 'tamil'),
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0 },
        }),
        signal: abort.signal,
      })

      if (!res.ok) { console.error('ElevenLabs error', res.status); stopAudio(); return }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const el   = new Audio(url)
      audioElRef.current = el
      el.onended = () => { URL.revokeObjectURL(url); speakAtElevenLabs(verses, idx + 1) }
      el.onerror = () => { URL.revokeObjectURL(url); stopAudio() }
      el.play()
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') stopAudio()
    }
  }

  async function speakAtNative(verses: Verse[], idx: number) {
    if (idx >= verses.length) { stopAudio(); return }
    const v = verses[idx]
    setAudioVerse(v.verse_no)
    setTimeout(() => verseRefs.current.get(v.verse_no)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
    const isTamil = language === 'tamil'
    try {
      await TextToSpeech.speak({
        text: cleanForSpeech(v.text, isTamil),
        lang: isTamil ? 'ta-IN' : 'en-IN',
        rate: isTamil ? 0.82 : 0.88,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      })
      speakAtNative(verses, idx + 1)
    } catch {
      stopAudio()
    }
  }

  function speakAt(verses: Verse[], idx: number) {
    if (idx >= verses.length) { stopAudio(); return }

    if (elevenLabsKey && elevenLabsVoiceId) {
      speakAtElevenLabs(verses, idx)
      return
    }

    if (isNative) {
      speakAtNative(verses, idx)
      return
    }

    const v = verses[idx]
    setAudioVerse(v.verse_no)
    setTimeout(() => verseRefs.current.get(v.verse_no)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)

    const isTamil = language === 'tamil'
    const utter = new SpeechSynthesisUtterance(cleanForSpeech(v.text, isTamil))
    utter.lang  = isTamil ? 'ta-IN' : 'en-IN'
    utter.rate  = isTamil ? 0.82 : 0.88
    utter.onend   = () => speakAt(verses, idx + 1)
    utter.onerror = (e: SpeechSynthesisErrorEvent) => { if (e.error !== 'interrupted') stopAudio() }
    window.speechSynthesis?.speak(utter)
  }

  function toggleAudio() {
    if (audioPlaying) { stopAudio(); return }
    if (!chapter) return
    if (!elevenLabsKey && !isNative && !('speechSynthesis' in window)) { alert('Text-to-speech not supported in this browser.'); return }
    setAudioPlaying(true)
    if (!elevenLabsKey && !isNative) {
      // iOS watchdog: resume Web Speech if it pauses itself
      iosTimer.current = setInterval(() => {
        if (window.speechSynthesis?.speaking && window.speechSynthesis?.paused) window.speechSynthesis.resume()
      }, 5000)
    }
    speakAt(chapter.verses, 0)
  }

  // ── Dictionary ─────────────────────────────────────────────────────────────
  async function lookupWord(word: string) {
    if (!word || word.length < 2 || word.length > 40) return
    setSelectedVerse(null)   // close verse action bar
    setDictWord(word)
    setDictEntry(null)
    setDictTamil('')
    setDictError(false)
    setDictLoading(true)
    try {
      const [defRes, taRes] = await Promise.allSettled([
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`),
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ta`),
      ])
      if (defRes.status === 'fulfilled' && defRes.value.ok) {
        const data = await defRes.value.json()
        setDictEntry(data[0] as DictEntry)
      } else {
        setDictError(true)
      }
      if (taRes.status === 'fulfilled' && taRes.value.ok) {
        const taData = await taRes.value.json()
        const translated: string = taData?.responseData?.translatedText || ''
        const match: number      = taData?.responseData?.match ?? 0
        const hasTamil = /[஀-௿]/.test(translated)
        if (hasTamil && match >= 0.5 && translated.toLowerCase() !== word) {
          setDictTamil(translated)
        }
      }
    } catch { setDictError(true) }
    finally { setDictLoading(false) }
  }

  // Verse tap: show action bar (only when no text is being selected)
  function handleVerseTap(verseNo: number) {
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) return
    setDictWord('')
    setSelectedVerse(selectedVerse === verseNo ? null : verseNo)
  }

  // Render English verse text as individually-tappable word spans
  function renderWords(text: string) {
    return text.split(/(\s+)/).map((token, i) => {
      const clean = token.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
      if (clean.length >= 2) {
        return (
          <span
            key={i}
            className="cursor-pointer rounded px-0.5 -mx-0.5 active:bg-maroon-100 active:text-maroon-800 transition-colors"
            onClick={(e) => { e.stopPropagation(); lookupWord(clean) }}
          >
            {token}
          </span>
        )
      }
      return <span key={i}>{token}</span>
    })
  }

  // ── Swipe navigation ───────────────────────────────────────────────────────
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goChapter(1)
      else goChapter(-1)
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const lineSpacingClass = { compact: 'leading-relaxed', normal: 'leading-loose', relaxed: 'leading-[2.2]' }[lineSpacing]
  const fontClass = { default: 'font-sans', serif: 'font-serif', 'tamil-traditional': 'font-tamil', dyslexic: 'font-dyslexic' }[fontFamily]
  const currentVersion = versionCatalog.find(v => v.id === bibleVersion)
  const langLabel = language === 'tamil' ? 'தமிழ்'
    : language === 'bilingual' ? `BI·${currentVersion?.short ?? bibleVersion.toUpperCase()}`
    : currentVersion?.short ?? bibleVersion.toUpperCase()

  function goChapter(dir: 1 | -1) {
    if (!chapter || !bookId) return
    const next = chapter.chapter_no + dir
    if (dir === 1 && !chapter.has_next) navigate(`/read/${parseInt(bookId) + 1}/1`)
    else if (dir === -1 && !chapter.has_prev) navigate(`/book/${parseInt(bookId) - 1}`)
    else navigate(`/read/${bookId}/${next}`)
  }

  function handleVerseNumberTap(e: React.MouseEvent, verseNo: number) {
    e.stopPropagation()
    if (!chapter || !bookId || !chapterNo) return
    const el = verseRefs.current.get(verseNo)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.remove('verse-flash')
      void el.offsetWidth
      el.classList.add('verse-flash')
      setTimeout(() => el.classList.remove('verse-flash'), 1500)
    }
    navigate(`/read/${bookId}/${chapterNo}?verse=${verseNo}`, { replace: true })
    const ref = `${chapter.book_name_english} ${chapterNo}:${verseNo}`
    const refTamil = `${chapter.book_name_tamil} ${chapterNo}:${verseNo}`
    const copyText = `${ref} (${refTamil})\n${chapter.verses.find(v => v.verse_no === verseNo)?.text || ''}`
    try {
      navigator.clipboard?.writeText(copyText).catch(() => {})
    } catch {}
    setCopiedVerse(verseNo)
    setTimeout(() => setCopiedVerse(null), 2000)
  }

  // No bookId/chapterNo → redirect immediately (no spinner flash)
  if (!bookId || !chapterNo) {
    return <Navigate to={`/read/${lastRead?.bookId ?? 43}/${lastRead?.chapterNo ?? 1}`} replace />
  }

  if (loadError) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <p className="text-maroon-700 font-semibold text-lg">Could not load chapter</p>
      <p className="text-sm text-gray-500">Check your internet connection and try again.</p>
      <button
        className="px-6 py-3 bg-maroon-700 text-white rounded-xl text-sm font-semibold"
        onClick={() => { setLoadError(false); setLoading(true); if (bookId && chapterNo) loadChapter(bookId, chapterNo) }}
      >
        Retry
      </button>
      <button className="text-sm text-gray-400 underline" onClick={() => navigate(`/book/${bookId}`)}>Go back</button>
    </div>
  )

  if (!chapter) return (
    <div className="max-w-2xl mx-auto">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 bg-white border-b border-cream-300 px-4 py-3 flex items-center gap-2 animate-pulse">
        <div className="w-6 h-6 bg-cream-200 rounded" />
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="h-3.5 w-32 bg-cream-200 rounded" />
          <div className="h-2.5 w-20 bg-cream-100 rounded" />
        </div>
        <div className="w-8 h-6 bg-cream-200 rounded" />
        <div className="w-6 h-6 bg-cream-200 rounded" />
      </div>
      <div className="flex flex-col items-center justify-center gap-3 pt-16 px-6 text-center">
        <div className="h-8 w-8 border-2 border-maroon-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading verses…</p>
        {loadingSlow && <p className="text-xs text-gray-400">Check your internet connection</p>}
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-cream-300 px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(`/book/${bookId}`)} className="p-1 text-gray-600 hover:text-maroon-700 shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => navigate(`/book/${bookId}`)} className="flex-1 min-w-0 text-center min-h-0">
          <p className="font-semibold text-maroon-700 text-sm truncate">{chapter.book_name_english} {chapter.chapter_no}</p>
          <p className="text-xs text-gray-500 font-tamil truncate">{chapter.book_name_tamil}</p>
        </button>
        {/* Language badge — always visible, tap to open language sheet */}
        <button
          onClick={() => {
            setShowLangMenu(true)
            // Prefetch all available versions for this chapter so switching is instant
            if (bookId && chapterNo) {
              versionCatalog.filter(v => v.available && v.id !== bibleVersion).forEach(v => {
                const vKey = `${bookId}-${chapterNo}-${lang}-${language === 'bilingual'}-${v.id}`
                if (!chapterCache[vKey]) {
                  bibleApi.getChapter(parseInt(bookId), parseInt(chapterNo), lang, language === 'bilingual', v.id).then(r => { chapterCache[vKey] = r.data }).catch(() => {})
                }
              })
            }
          }}
          className="shrink-0 px-2 py-1 text-xs font-bold bg-maroon-100 text-maroon-700 rounded-lg hover:bg-maroon-700 hover:text-white transition-colors"
          title="Change language"
        >
          {langLabel}
        </button>
        {/* Audio */}
        <button
          onClick={toggleAudio}
          className={clsx('shrink-0 p-1.5 rounded-lg transition-colors', audioPlaying ? 'bg-maroon-100 text-maroon-700' : 'text-gray-600 hover:text-maroon-700')}
          title={audioPlaying ? 'Stop reading' : 'Read aloud'}
        >
          {audioPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button onClick={() => setShowSettings(true)} className="shrink-0 p-1 text-gray-600 hover:text-maroon-700">
          <Settings2 className="h-5 w-5" />
        </button>
      </div>

      {/* ── Audio now-reading bar ────────────────────────────────────────── */}
      {/* ── Language row (sticky, below header) ───── */}
      <div className={clsx(
        'sticky top-[57px] z-20 flex border-b border-cream-300 bg-cream-100',
      )}>
        {(['english', 'tamil', 'bilingual'] as const).map((m) => (
          <button
            key={m}
            onTouchStart={() => {
              if (m === language) return
              const vLang = m === 'bilingual' ? 'english' : m
              const vBilingual = m === 'bilingual'
              if (!bookId || !chapterNo) return
              const vKey = `${bookId}-${chapterNo}-${vLang}-${vBilingual}-${bibleVersion}`
              if (chapterCache[vKey]) return
              bibleApi.getChapter(parseInt(bookId), parseInt(chapterNo), vLang, vBilingual, bibleVersion).then((r) => { chapterCache[vKey] = r.data }).catch(() => {})
            }}
            onClick={() => useAppStore.getState().setLanguage(m)}
            className={clsx(
              'flex-1 py-2 text-xs font-medium transition-colors',
              language === m ? 'bg-maroon-700 text-white' : 'text-gray-600 hover:bg-cream-200'
            )}
          >
            {m === 'bilingual' ? 'Bilingual' : m === 'tamil' ? 'தமிழ்' : 'English'}
          </button>
        ))}
      </div>

      {/* ── Chapter content — tap any English word to see dictionary */}
      <div className="px-5 py-6">
        <h2 className="text-2xl font-bold text-maroon-700 font-serif mb-3 text-center">
          Chapter {chapter.chapter_no}
        </h2>
        {/* Top Previous / Next */}
        <div className="flex items-center justify-between mb-5 border-b border-cream-300 pb-3">
          <button onClick={() => goChapter(-1)} className="flex items-center gap-1 text-sm text-maroon-700 font-medium">
            <ChevronLeft className="h-4 w-4" />Previous
          </button>
          <span className="text-xs text-gray-400">{chapter.book_name_english}</span>
          <button onClick={() => goChapter(1)} className="flex items-center gap-1 text-sm text-maroon-700 font-medium">
            Next<ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {language === 'bilingual' ? (
          <div className="space-y-2">
            {chapter.verses.map((v) => {
              const tamilVerse = chapter.other_lang_verses?.find(tv => tv.verse_no === v.verse_no)
              const hlColor    = getHighlightColor(v.verse_no)
              const vHasNote   = hasNote(v.verse_no)
              const isLast     = v.verse_no === chapter.verses[chapter.verses.length - 1].verse_no
              return (
                <div
                  key={v.verse_no}
                  ref={(el) => {
                    if (el) {
                      verseRefs.current.set(v.verse_no, el)
                      if (isLast) lastVerseRef.current = el
                    }
                  }}
                  className={clsx(
                    'rounded-xl border transition-colors overflow-hidden select-none',
                    audioVerse === v.verse_no  ? 'border-gold-500 ring-1 ring-gold-400' :
                    selectedVerse === v.verse_no ? 'border-gold-500' : 'border-cream-200'
                  )}
                  style={hlColor && !audioVerse ? { backgroundColor: hlColor + '55' } :
                         audioVerse === v.verse_no ? { backgroundColor: '#fde68a55' } : undefined}
                >
                  {/* Verse number row */}
                  <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 border-b border-cream-200">
                    <button
                      onClick={(e) => handleVerseNumberTap(e, v.verse_no)}
                      className={clsx(
                        'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 transition-all min-h-0 min-w-0',
                        copiedVerse === v.verse_no ? 'bg-emerald-500 text-white' : 'bg-maroon-700 text-white'
                      )}
                    >
                      {copiedVerse === v.verse_no ? <Link2 className="h-2.5 w-2.5" /> : v.verse_no}
                    </button>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {copiedVerse === v.verse_no
                        ? `${chapter.book_name_english} ${chapter.chapter_no}:${v.verse_no} · ${chapter.book_name_tamil}`
                        : `Verse ${v.verse_no}`}
                    </span>
                    {hlColor && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hlColor }} />}
                    {vHasNote && <span className="text-[10px] text-blue-400 font-medium">📝</span>}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVerseTap(v.verse_no) }}
                      className={clsx(
                        'ml-auto shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium transition-colors min-h-0 min-w-0',
                        selectedVerse === v.verse_no
                          ? 'border-maroon-400 bg-maroon-100 text-maroon-700'
                          : 'border-maroon-200 bg-maroon-50 text-maroon-500'
                      )}
                      title="Options"
                    >
                      <MoreVertical className="h-3 w-3" />
                      More
                    </button>
                  </div>
                  {/* Always two-column side by side — even on mobile */}
                  <div className="grid grid-cols-2">
                    <p className={clsx('text-gray-800 px-3 py-2.5 border-r border-cream-200', lineSpacingClass)}
                       style={{ fontSize: Math.max(fontSize - 2, 13) }}>
                      {renderWords(v.text)}
                    </p>
                    <p className={clsx('text-gray-700 font-tamil px-3 py-2.5', lineSpacingClass)}
                       style={{ fontSize: Math.max(fontSize - 3, 12) }}>
                      {tamilVerse?.text || ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {chapter.verses.map((v) => {
              const hlColor  = getHighlightColor(v.verse_no)
              const vHasNote = hasNote(v.verse_no)
              const isLast = v.verse_no === chapter.verses[chapter.verses.length - 1].verse_no
              return (
              <div
                key={v.verse_no}
                ref={(el) => {
                  if (el) {
                    verseRefs.current.set(v.verse_no, el)
                    if (isLast) lastVerseRef.current = el
                  }
                }}
                className={clsx(
                  'flex gap-2 rounded-xl px-3 py-2.5 transition-colors select-none',
                  audioVerse === v.verse_no  ? 'border border-gold-500 ring-1 ring-gold-400' :
                  selectedVerse === v.verse_no ? 'border border-gold-500' : 'border border-transparent'
                )}
                style={hlColor && audioVerse !== v.verse_no ? { backgroundColor: hlColor + '55' } :
                       audioVerse === v.verse_no ? { backgroundColor: '#fde68a55' } : undefined}
              >
                <div className="flex flex-col items-center shrink-0 mt-0.5 gap-1">
                  <button
                    onClick={(e) => handleVerseNumberTap(e, v.verse_no)}
                    className={clsx(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all min-h-0 min-w-0',
                      copiedVerse === v.verse_no ? 'bg-emerald-500 text-white scale-110' : 'bg-maroon-100 text-maroon-700 hover:bg-maroon-700 hover:text-white'
                    )}
                  >
                    {copiedVerse === v.verse_no ? <Link2 className="h-3 w-3" /> : v.verse_no}
                  </button>
                  {hlColor && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hlColor }} />}
                  {vHasNote && <span className="text-[9px] leading-none">📝</span>}
                </div>
                <span
                  className={clsx('text-gray-800 flex-1 min-w-0', fontClass, lineSpacingClass, language === 'tamil' && 'font-tamil')}
                  style={{ fontSize }}
                >
                  {language === 'english' ? renderWords(v.text) : v.text}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleVerseTap(v.verse_no) }}
                  className={clsx(
                    'shrink-0 p-1.5 rounded-lg border transition-colors self-start min-h-0 min-w-0',
                    selectedVerse === v.verse_no
                      ? 'border-maroon-400 bg-maroon-100 text-maroon-700'
                      : 'border-maroon-200 bg-maroon-50 text-maroon-500 hover:bg-maroon-100'
                  )}
                  title="Options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* ── Chapter nav ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-cream-300 mb-4">
        <button onClick={() => goChapter(-1)} className="flex items-center gap-1 text-sm text-maroon-700 font-medium">
          <ChevronLeft className="h-4 w-4" />Previous
        </button>
        <button onClick={() => navigate(`/book/${bookId}`)} className="flex flex-col items-center min-h-0 min-w-0">
          <span className="text-sm font-semibold text-maroon-700">{chapter.book_name_english}</span>
          <span className="text-[10px] text-gray-400">Chapter {chapter.chapter_no}</span>
        </button>
        <button onClick={() => goChapter(1)} className="flex items-center gap-1 text-sm text-maroon-700 font-medium">
          Next<ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {selectedVerse && (
        <VerseActionBar
          key={selectedVerse}
          bookId={chapter.book_id} bookName={chapter.book_name_english}
          bookNameTamil={chapter.book_name_tamil}
          chapterNo={chapter.chapter_no} verseNo={selectedVerse}
          text={chapter.verses.find(v => v.verse_no === selectedVerse)?.text || ''}
          textOther={chapter.other_lang_verses?.find(v => v.verse_no === selectedVerse)?.text}
          onClose={() => setSelectedVerse(null)}
        />
      )}

      {showSettings && <TextSettingsModal onClose={() => setShowSettings(false)} />}

      {/* ── Language + Version selector sheet ─────────────────────────── */}
      {showLangMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowLangMenu(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-cream-200 shrink-0">
              <p className="font-semibold text-center text-gray-800 text-base">Language &amp; Version</p>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-5">
              {/* Language picker */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Language</p>
                <div className="space-y-2">
                  {([
                    { key: 'english',   label: 'English',   sub: 'Read in English',              flag: '🇬🇧' },
                    { key: 'tamil',     label: 'தமிழ்',      sub: 'Tamil Bible Society',          flag: '🇮🇳' },
                    { key: 'bilingual', label: 'Bilingual', sub: 'English + Tamil side by side', flag: '📖' },
                  ] as const).map(({ key, label, sub, flag }) => (
                    <button
                      key={key}
                      onClick={() => useAppStore.getState().setLanguage(key)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left',
                        language === key ? 'bg-maroon-700 text-white' : 'bg-cream-100 text-gray-800 hover:bg-cream-200'
                      )}
                    >
                      <span className="text-xl">{flag}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{label}</p>
                        <p className={clsx('text-xs', language === key ? 'text-maroon-200' : 'text-gray-500')}>{sub}</p>
                      </div>
                      {language === key && <span className="text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* English version picker — only relevant for English / Bilingual */}
              {(language === 'english' || language === 'bilingual') && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">English Translation</p>
                  <div className="space-y-2">
                    {versionCatalog.map((v) => (
                      <button
                        key={v.id}
                        disabled={!v.available}
                        onTouchStart={() => {
                          if (!v.available || !bookId || !chapterNo) return
                          const vKey = `${bookId}-${chapterNo}-${lang}-${language === 'bilingual'}-${v.id}`
                          if (!chapterCache[vKey]) {
                            bibleApi.getChapter(parseInt(bookId), parseInt(chapterNo), lang, language === 'bilingual', v.id).then(r => { chapterCache[vKey] = r.data }).catch(() => {})
                          }
                        }}
                        onClick={() => { if (v.available) { setBibleVersion(v.id); setShowLangMenu(false) } }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left',
                          !v.available && 'opacity-40 cursor-not-allowed',
                          v.available && bibleVersion === v.id  ? 'bg-maroon-700 text-white' :
                          v.available                            ? 'bg-cream-100 text-gray-800 hover:bg-cream-200' :
                                                                   'bg-gray-50 text-gray-500'
                        )}
                      >
                        <span className={clsx(
                          'shrink-0 w-10 text-center text-xs font-bold px-1 py-0.5 rounded',
                          bibleVersion === v.id && v.available ? 'bg-white/20' : 'bg-maroon-50 text-maroon-700'
                        )}>
                          {v.short}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{v.name}</p>
                          <p className={clsx('text-xs', bibleVersion === v.id && v.available ? 'text-maroon-200' : 'text-gray-400')}>
                            {v.available ? `${v.year} · Free` : 'License required'}
                          </p>
                        </div>
                        {v.available && bibleVersion === v.id && <span className="text-xs font-bold shrink-0">✓</span>}
                        {!v.available && <span className="text-gray-400 shrink-0">🔒</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pb-6 pt-2 shrink-0">
              <button
                onClick={() => setShowLangMenu(false)}
                className="w-full py-3 bg-maroon-700 text-white rounded-xl font-medium text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Dictionary bottom sheet ─────────────────────────────────────── */}
      {dictWord && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDictWord('')} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight: '82vh' }}>
            {/* Dict header */}
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-cream-300 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <BookOpen className="h-4 w-4 text-maroon-400 shrink-0" />
                  <p className="font-bold text-maroon-700 text-xl capitalize">{dictWord}</p>
                  {dictEntry?.phonetic && (
                    <p className="text-xs text-gray-400">{dictEntry.phonetic}</p>
                  )}
                </div>
                {/* Tamil translation pill */}
                {dictTamil && (
                  <div className="mt-2 ml-6 inline-flex items-center gap-1.5 bg-maroon-50 border border-maroon-100 rounded-full px-3 py-1">
                    <span className="text-[10px] text-maroon-400 font-medium uppercase tracking-wide">தமிழ்</span>
                    <span className="text-sm font-semibold text-maroon-700 font-tamil">{dictTamil}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setDictWord('')} className="p-1 text-gray-400 hover:text-gray-600 min-h-0 min-w-0 mt-1 shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Dict body */}
            <div className="overflow-y-auto flex-1 px-5 py-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
              {dictLoading && (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 border-2 border-maroon-700 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!dictLoading && dictError && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No definition found for "<span className="font-medium text-gray-600">{dictWord}</span>"</p>
                  <p className="text-xs mt-1">Try selecting a single common English word</p>
                </div>
              )}
              {!dictLoading && dictEntry && dictEntry.meanings.slice(0, 4).map((m, i) => (
                <div key={i} className="mb-5">
                  <span className="inline-block bg-maroon-50 text-maroon-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 capitalize border border-maroon-100">
                    {m.partOfSpeech}
                  </span>
                  {m.definitions.slice(0, 3).map((d, j) => (
                    <div key={j} className="mb-2.5 pl-2 border-l-2 border-cream-300">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        <span className="text-gray-400 mr-1">{j + 1}.</span>{d.definition}
                      </p>
                      {d.example && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">"{d.example}"</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
