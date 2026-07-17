import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, CheckCircle2, Circle, BookOpen, RotateCcw, Flame, ArrowUp } from 'lucide-react'
import { clsx } from 'clsx'
import { useReadingPlanStore } from '../store/useReadingPlanStore'
import { getPlan, DayReading } from '../utils/readingPlan'
import { bibleApi } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import chapterCache from '../utils/chapterCache'


const PLAN = getPlan()

function groupReadings(
  readings: DayReading[],
  localNames: Record<number, string> = {}
): { label: string; localLabel: string; bookId: number; startCh: number; endCh: number }[] {
  const groups: { label: string; localLabel: string; bookId: number; bookName: string; localName: string; startCh: number; endCh: number }[] = []
  for (const r of readings) {
    const local = localNames[r.bookId] || r.bookName
    const last = groups[groups.length - 1]
    if (last && last.bookId === r.bookId && last.endCh === r.chapterNo - 1) {
      last.endCh = r.chapterNo
      const range = last.startCh === last.endCh ? `${last.startCh}` : `${last.startCh}–${last.endCh}`
      last.label = `${last.bookName} ${range}`
      last.localLabel = `${last.localName} ${range}`
    } else {
      groups.push({ label: `${r.bookName} ${r.chapterNo}`, localLabel: `${local} ${r.chapterNo}`, bookId: r.bookId, bookName: r.bookName, localName: local, startCh: r.chapterNo, endCh: r.chapterNo })
    }
  }
  return groups
}

export default function ReadingPlanPage() {
  const navigate = useNavigate()
  const { startDate, completedDays, startPlan, resetPlan, isDone, isChapterRead, getStreak, markChapterRead } = useReadingPlanStore()
  const { language, showBilingual, bibleVersion } = useAppStore()
  const lang = language
  const isBilingual = showBilingual && language !== 'english'
  const isEnglish = language === 'english'
  const [confirmReset, setConfirmReset] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [localBookNames, setLocalBookNames] = useState<Record<number, string>>({})

  // Fetch local book names whenever language changes (skip for English — names already English)
  useEffect(() => {
    if (isEnglish) { setLocalBookNames({}); return }
    bibleApi.getBooks(language)
      .then((res) => {
        const map: Record<number, string> = {}
        for (const b of (res.data?.books ?? [])) map[b.id] = b.name_local || b.name_english
        setLocalBookNames(map)
      })
      .catch(() => {})
  }, [language, isEnglish])

  const prefetchChapter = useCallback((bookId: number, chapterNo: number) => {
    const key = `${bookId}-${chapterNo}-${lang}-${isBilingual}-${bibleVersion}`
    if (chapterCache[key]) return
    bibleApi.getChapter(bookId, chapterNo, lang, isBilingual, bibleVersion)
      .then((res) => { chapterCache[key] = res.data })
      .catch(() => {})
  }, [lang, isBilingual, bibleVersion])

  useEffect(() => {
    const el = document.querySelector('main')
    if (!el) return
    const onScroll = () => setShowScrollTop(el.scrollTop > 320)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // First uncompleted plan day — flexible, not calendar-based
  // (computed early so we can prefetch before rendering)
  const nextDay = (() => {
    for (let d = 1; d <= 365; d++) {
      if (!isDone(d)) return d
    }
    return 365
  })()

  const nextReading = PLAN[nextDay - 1] ?? []
  const totalDone = completedDays.length

  // Pre-fetch "Up Next" chapters when the page opens so tapping them is instant
  useEffect(() => {
    nextReading.forEach((r) => prefetchChapter(r.bookId, r.chapterNo))
  }, [nextReading, prefetchChapter])

  // IntersectionObserver: prefetch chapters as each day row scrolls into view
  useEffect(() => {
    const scrollRoot = document.querySelector('main')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const day = Number((entry.target as HTMLElement).dataset.day)
          if (!day) return
          ;(PLAN[day - 1] ?? []).forEach((r) => prefetchChapter(r.bookId, r.chapterNo))
        })
      },
      { root: scrollRoot, rootMargin: '300px' }
    )
    document.querySelectorAll('[data-day]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [prefetchChapter])
  const pct = Math.round((totalDone / 365) * 100)
  const streak = getStreak() // consecutive calendar days with reading activity

  if (!startDate) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center text-center gap-6">
        <button onClick={() => navigate(-1)} className="self-start p-1 text-gray-500">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="w-20 h-20 bg-maroon-700 rounded-full flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-maroon-700 font-serif">Read the Bible in a Year</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            A flexible 365-day plan — Genesis to Revelation.<br />
            Read at your own pace. Streak grows as you read chapters.
          </p>
        </div>
        <div className="bg-cream-100 rounded-2xl p-4 w-full text-left space-y-2">
          <p className="text-xs font-semibold text-maroon-700 uppercase tracking-wide">How it works</p>
          <p className="text-sm text-gray-600">📖 Follow the plan at your own pace</p>
          <p className="text-sm text-gray-600">✅ Days auto-complete as you read chapters</p>
          <p className="text-sm text-gray-600">🔥 Streak grows with each day you complete</p>
          <p className="text-sm text-gray-600">⚡ Read ahead — finish in 3 months if you want!</p>
        </div>
        <button
          onClick={startPlan}
          className="w-full py-4 bg-maroon-700 text-white font-bold text-base rounded-2xl"
        >
          Start Reading Plan
        </button>
        <p className="text-xs text-gray-400">You can reset and restart at any time</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-500">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-maroon-700 font-serif">Reading Plan</h1>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-maroon-700 text-white hover:bg-maroon-800 active:bg-maroon-900 text-xs font-medium transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Plan
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-cream-300 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-maroon-700">{pct}%</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Complete</p>
        </div>
        <div className="bg-white border border-cream-300 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame className="h-5 w-5 text-orange-500" />
            <p className="text-2xl font-bold text-orange-500">{streak}</p>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Day streak</p>
        </div>
        <div className="bg-white border border-cream-300 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-maroon-700">{totalDone}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Days done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-cream-200 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="bg-maroon-700 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Up Next reading — first uncompleted day */}
      <div className="bg-maroon-700 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gold-400 uppercase tracking-wide">
            Up Next — Day {nextDay}
          </p>
          {isDone(nextDay) && (
            <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> All Read!
            </span>
          )}
        </div>
        <div className="space-y-2">
          {nextReading.map((r) => {
            const chRead = isChapterRead(r.bookId, r.chapterNo)
            return (
              <div key={`${r.bookId}-${r.chapterNo}`} className="flex items-center gap-1 bg-white/10 rounded-xl overflow-hidden">
                <Link
                  to={`/read/${r.bookId}/${r.chapterNo}`}
                  onTouchStart={() => prefetchChapter(r.bookId, r.chapterNo)}
                  className="flex items-center gap-3 flex-1 px-3 py-2.5 hover:bg-white/10 transition-colors"
                >
                  {chRead
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    : <BookOpen className="h-4 w-4 text-gold-400 shrink-0" />
                  }
                  <span className={clsx('font-medium text-sm flex-1', chRead ? 'text-white/50 line-through' : 'text-white')}>
                    {localBookNames[r.bookId]
                      ? <>{localBookNames[r.bookId]} {r.chapterNo}<span className="block text-[10px] text-white/50 font-normal">{r.bookName} {r.chapterNo}</span></>
                      : <>{r.bookName} {r.chapterNo}</>}
                  </span>
                  {chRead
                    ? <span className="text-[10px] text-emerald-300">Read ✓</span>
                    : <ChevronLeft className="h-4 w-4 text-white/40 rotate-180" />
                  }
                </Link>
                {/* Tap to manually mark as read — fallback when scroll detection misses */}
                {!chRead && (
                  <button
                    onClick={() => markChapterRead(r.bookId, r.chapterNo)}
                    className="shrink-0 px-3 py-3 text-white/30 hover:text-emerald-400 active:text-emerald-300 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* All 365 days — fully scrollable, read-only */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">All 365 Days</p>

        {Array.from({ length: 365 }, (_, i) => i + 1).map((day) => {
          const reading = PLAN[day - 1]
          const done = isDone(day)
          const isNext = day === nextDay
          return (
            <div
              key={day}
              data-day={day}
              className={clsx(
                'flex items-start gap-3 rounded-xl px-3 py-2.5 border',
                isNext ? 'border-maroon-400 bg-maroon-50' : 'border-cream-300 bg-white'
              )}
            >
              {/* Read-only status circle */}
              <div className="shrink-0 mt-0.5">
                {done
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : <Circle className="h-5 w-5 text-gray-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-xs font-semibold mb-1.5', isNext ? 'text-maroon-700' : done ? 'text-gray-400' : 'text-gray-500')}>
                  Day {day}{isNext ? ' · Up Next' : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  {groupReadings(reading ?? [], localBookNames).map((g) => (
                    <Link
                      key={g.label}
                      to={`/read/${g.bookId}/${g.startCh}`}
                      onTouchStart={() => prefetchChapter(g.bookId, g.startCh)}
                      className={clsx(
                        'inline-flex flex-col items-center justify-center text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap leading-none',
                        done
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : isNext
                          ? 'bg-maroon-100 border-maroon-300 text-maroon-700'
                          : 'bg-cream-100 border-cream-300 text-gray-600'
                      )}
                    >
                      {!isEnglish && g.localLabel !== g.label ? (
                        <>
                          <span>{g.localLabel}</span>
                          <span className="text-[9px] opacity-50 font-normal">{g.label}</span>
                        </>
                      ) : g.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scroll-to-top button */}
      {showScrollTop && (
        <button
          onClick={() => { const el = document.querySelector('main'); el?.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className="fixed left-4 z-50 w-11 h-11 bg-maroon-700 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Reset confirm */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <p className="font-bold text-gray-800 mb-2">Reset Reading Plan?</p>
            <p className="text-sm text-gray-500 mb-5">This will clear all your progress and start over from Day 1.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { resetPlan(); setConfirmReset(false) }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 border border-cream-300 text-gray-600 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
