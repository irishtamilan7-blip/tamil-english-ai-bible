import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Highlighter, Bookmark, FileText, Share2, Copy, X, Check, Trash2, Sparkles, Link2 as LinkIcon, Image as ImageIcon, Search, Youtube } from 'lucide-react'
import { clsx } from 'clsx'
import { useNavigate } from 'react-router-dom'
import { useBookmarkStore } from '../store/useBookmarkStore'
import { useHighlightStore } from '../store/useHighlightStore'
import { useNoteStore } from '../store/useNoteStore'
import { aiApi } from '../utils/api'
import { useAppStore } from '../store/useAppStore'
import VerseCardModal from './VerseCardModal'

const explainCache: Record<string, string> = {}

interface Props {
  bookId: number
  bookName: string
  bookNameTamil?: string
  chapterNo: number
  verseNo: number
  text: string
  textOther?: string   // other language text for the verse card
  onClose: () => void
}

const HIGHLIGHT_COLORS = [
  { hex: '#FEF08A', label: 'Yellow' },
  { hex: '#86EFAC', label: 'Green'  },
  { hex: '#93C5FD', label: 'Blue'   },
  { hex: '#F9A8D4', label: 'Pink'   },
  { hex: '#FDC57B', label: 'Orange' },
]

export default function VerseActionBar({ bookId, bookName, bookNameTamil, chapterNo, verseNo, text, textOther, onClose }: Props) {
  const { add, remove: removeBookmark, has } = useBookmarkStore()
  const hlStore   = useHighlightStore()
  const noteStore = useNoteStore()

  const isBookmarked    = has(bookId, chapterNo, verseNo)
  const existingHL      = hlStore.get(bookId, chapterNo, verseNo)
  const existingNote    = noteStore.get(bookId, chapterNo, verseNo)

  const navigate = useNavigate()
  const [showHighlight, setShowHighlight] = useState(false)
  const [showNote, setShowNote]           = useState(false)
  const [showShare, setShowShare]         = useState(false)
  const [showExplain, setShowExplain]     = useState(false)
  const [showCrossRef, setShowCrossRef]   = useState(false)
  const [showCard, setShowCard]           = useState(false)
  const [explainText, setExplainText]     = useState('')
  const [explainLoading, setExplainLoading] = useState(false)
  const [crossRefs, setCrossRefs]         = useState<{ ref: string; bookId: number; chapterNo: number; verseNo: number; preview: string }[]>([])
  const [crossRefLoading, setCrossRefLoading] = useState(false)
  const [crossRefFetchedLang, setCrossRefFetchedLang] = useState('')
  const [noteText, setNoteText]           = useState(existingNote?.text ?? '')
  const [copied, setCopied]               = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { language } = useAppStore()

  useEffect(() => {
    if (showNote) textareaRef.current?.focus()
  }, [showNote])

  function toggleBookmark() {
    if (isBookmarked) {
      const bm = useBookmarkStore.getState().bookmarks.find(
        (b) => b.bookId === bookId && b.chapterNo === chapterNo && b.verseNo === verseNo
      )
      if (bm) removeBookmark(bm.id)
    } else {
      add({ bookId, bookName, chapterNo, verseNo, verseText: text })
    }
  }

  function pickHighlight(hex: string) {
    if (existingHL?.color === hex) {
      hlStore.remove(bookId, chapterNo, verseNo)
    } else {
      hlStore.set(bookId, bookName, chapterNo, verseNo, text, hex)
    }
    setShowHighlight(false)
    onClose()
  }

  function saveNote() {
    if (noteText.trim()) {
      noteStore.save(bookId, bookName, chapterNo, verseNo, noteText.trim())
    } else {
      noteStore.remove(bookId, chapterNo, verseNo)
    }
    setShowNote(false)
    onClose()
  }

  const ref      = `${bookName} ${chapterNo}:${verseNo}`
  const shareText = `"${text}" — ${ref}`

  function copyVerse() {
    navigator.clipboard?.writeText(shareText)
    setCopied(true)
    setTimeout(() => { setCopied(false); onClose() }, 1400)
  }

  function shareWhatsApp() {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank')
    onClose()
  }

  function shareTelegram() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`, '_blank')
    onClose()
  }

  function openGoogle() {
    const isTamil = language === 'tamil'
    const baseRef = isTamil && bookNameTamil ? `${bookNameTamil} ${chapterNo}:${verseNo}` : ref
    const q = encodeURIComponent(isTamil ? `${baseRef} தமிழ் வேதாகமம் விளக்கம்` : `${ref} Bible verse explanation`)
    window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noreferrer')
  }

  function openYouTube() {
    const isTamil = language === 'tamil'
    const baseRef = isTamil && bookNameTamil ? `${bookNameTamil} ${chapterNo}:${verseNo}` : ref
    const q = encodeURIComponent(isTamil ? `${baseRef} தமிழ் வேதாகமம்` : `${ref} Bible verse`)
    window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank', 'noreferrer')
  }

  async function toggleCrossRef() {
    const next = !showCrossRef
    setShowHighlight(false); setShowNote(false); setShowShare(false); setShowExplain(false)
    setShowCrossRef(next)
    const currentLang = language === 'tamil' ? 'tamil' : 'english'
    // Re-fetch if opening and either no results yet, or language changed since last fetch
    if (next && (!crossRefs.length || crossRefFetchedLang !== currentLang)) {
      setCrossRefLoading(true)
      setCrossRefs([])
      try {
        const res = await aiApi.crossRef(ref, text, currentLang)
        setCrossRefs(res.data.refs || [])
        setCrossRefFetchedLang(currentLang)
      } catch {
        setCrossRefs([])
      } finally {
        setCrossRefLoading(false)
      }
    }
  }

  async function toggleExplain() {
    const next = !showExplain
    setShowHighlight(false); setShowNote(false); setShowShare(false)
    setShowExplain(next)
    if (next && !explainText) {
      const explainLang = language === 'tamil' ? 'tamil' : 'english'
      const cacheKey = `${bookId}-${chapterNo}-${verseNo}-${explainLang}`
      if (explainCache[cacheKey]) {
        setExplainText(explainCache[cacheKey])
      } else {
        setExplainLoading(true)
        try {
          const res = await aiApi.explain(ref, text, explainLang)
          explainCache[cacheKey] = res.data.explanation
          setExplainText(res.data.explanation)
        } catch {
          setExplainText('Could not load explanation. Please try again.')
        } finally {
          setExplainLoading(false)
        }
      }
    }
  }

  function shareNative() {
    if (navigator.share) {
      navigator.share({ title: ref, text: shareText }).catch(() => {})
      onClose()
    }
  }

  return (
    <>
    <div className="fixed bottom-40 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-cream-300" style={{ maxHeight: 'calc(100dvh - 180px)', overflowY: 'auto' }}>
      {/* Header — sticky so X button stays visible while scrolling */}
      <div className="sticky top-0 z-10 bg-white flex justify-between items-center px-4 pt-3 pb-2 border-b border-cream-100">
        <p className="text-xs text-gray-500 font-medium">{bookName} {chapterNo}:{verseNo}</p>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 min-h-0 min-w-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Share sheet */}
      {showShare && (
        <div className="px-4 py-3 border-b border-cream-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">Share verse</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-medium"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button
              onClick={shareTelegram}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#229ED9] text-white text-xs font-medium"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </button>
            {'share' in navigator && (
              <button
                onClick={shareNative}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium"
              >
                <Share2 className="h-4 w-4" /> More
              </button>
            )}
            <button
              onClick={() => { navigator.clipboard?.writeText(shareText); setCopied(true); setTimeout(() => { setCopied(false); setShowShare(false); onClose() }, 1200) }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy text'}
            </button>
          </div>
        </div>
      )}

      {/* Highlight color picker */}
      {showHighlight && (
        <div className="px-4 py-3 border-b border-cream-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">Choose highlight colour</p>
          <div className="flex gap-2 items-center">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.hex}
                title={c.label}
                onClick={() => pickHighlight(c.hex)}
                className={clsx(
                  'w-8 h-8 rounded-full border-2 shadow-sm hover:scale-110 transition-transform min-h-0 min-w-0',
                  existingHL?.color === c.hex ? 'border-gray-700 scale-110' : 'border-white'
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {existingHL && (
              <button
                onClick={() => { hlStore.remove(bookId, chapterNo, verseNo); setShowHighlight(false) }}
                className="ml-auto text-xs text-red-400 flex items-center gap-1 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        </div>
      )}

      {/* Note editor */}
      {showNote && (
        <div className="px-4 py-3 border-b border-cream-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">
            {existingNote ? 'Edit note' : 'Add note'}
          </p>
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your note here…"
            rows={3}
            className="w-full border border-cream-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-maroon-400 text-gray-800"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={saveNote}
              className="flex-1 py-2 bg-maroon-700 text-white text-sm rounded-xl font-medium"
            >
              Save
            </button>
            {existingNote && (
              <button
                onClick={() => { noteStore.remove(bookId, chapterNo, verseNo); setNoteText(''); setShowNote(false); onClose() }}
                className="px-3 py-2 text-red-500 border border-red-200 text-sm rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setShowNote(false)}
              className="px-4 py-2 border border-cream-300 text-gray-500 text-sm rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI Explain panel */}
      {showExplain && (
        <div className="px-4 py-3 border-b border-cream-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-maroon-500" />
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">AI Explanation</p>
          </div>
          {explainLoading ? (
            <div className="flex gap-1 py-2">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 bg-maroon-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-700 leading-relaxed bg-maroon-50 rounded-xl px-3 py-2.5 prose prose-sm max-w-none
              prose-headings:text-maroon-700 prose-headings:font-semibold prose-headings:text-sm prose-headings:mt-3 prose-headings:mb-1
              prose-p:my-1.5 prose-p:leading-relaxed
              prose-blockquote:border-l-2 prose-blockquote:border-maroon-300 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-maroon-800 prose-blockquote:bg-maroon-100/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:my-2
              prose-strong:text-maroon-700
              prose-hr:border-cream-300 prose-hr:my-2">
              <ReactMarkdown>{explainText}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Cross-reference panel */}
      {showCrossRef && (
        <div className="px-4 py-3 border-b border-cream-100">
          <div className="flex items-center gap-1.5 mb-2">
            <LinkIcon className="h-3.5 w-3.5 text-maroon-500" />
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Cross References</p>
          </div>
          {crossRefLoading ? (
            <div className="flex gap-1 py-2">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 bg-maroon-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          ) : crossRefs.length > 0 ? (
            <div className="space-y-2">
              {crossRefs.map((cr, i) => (
                <button
                  key={i}
                  onClick={() => { navigate(`/read/${cr.bookId}/${cr.chapterNo}?verse=${cr.verseNo}`); onClose() }}
                  className="w-full text-left flex items-start gap-2 bg-maroon-50 rounded-xl px-3 py-2 hover:bg-maroon-100 transition-colors"
                >
                  <span className="text-xs font-bold text-maroon-700 shrink-0 mt-0.5">{cr.ref}</span>
                  <span className="text-xs text-gray-600 leading-relaxed">{cr.preview}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-1">No AI cross-references available.</p>
          )}

          {/* External search — always shown */}
          <div className="mt-3 pt-2 border-t border-cream-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">Search Externally</p>
            <div className="flex gap-2">
              <button
                onClick={openGoogle}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium active:bg-blue-100 transition-colors"
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                Google
              </button>
              <button
                onClick={openYouTube}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium active:bg-red-100 transition-colors"
              >
                <Youtube className="h-3.5 w-3.5 shrink-0" />
                YouTube
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons — row 1: 4 buttons, row 2: 3 buttons */}
      <div className="px-3 py-3 space-y-1">
        <div className="grid grid-cols-4 gap-1">
          <ActionBtn
            icon={<Highlighter className="h-5 w-5" />}
            label="Highlight"
            onClick={() => { setShowNote(false); setShowShare(false); setShowExplain(false); setShowCrossRef(false); setShowHighlight(!showHighlight) }}
            active={!!existingHL}
            dotColor={existingHL?.color}
          />
          <ActionBtn
            icon={<Bookmark className={clsx('h-5 w-5', isBookmarked && 'fill-gold-500 text-gold-600')} />}
            label={isBookmarked ? 'Saved' : 'Bookmark'}
            onClick={toggleBookmark}
            active={isBookmarked}
          />
          <ActionBtn
            icon={<FileText className={clsx('h-5 w-5', existingNote && 'text-blue-500')} />}
            label={existingNote ? 'Edit Note' : 'Note'}
            onClick={() => { setShowHighlight(false); setShowShare(false); setShowExplain(false); setShowCrossRef(false); setNoteText(existingNote?.text ?? ''); setShowNote(!showNote) }}
            active={!!existingNote}
          />
          <ActionBtn
            icon={<Share2 className="h-5 w-5" />}
            label="Share"
            onClick={() => { setShowHighlight(false); setShowNote(false); setShowExplain(false); setShowCrossRef(false); setShowShare(!showShare) }}
            active={showShare}
          />
        </div>
        <div className="grid grid-cols-4 gap-1">
          <ActionBtn
            icon={copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
            label={copied ? 'Copied!' : 'Copy'}
            onClick={copyVerse}
            active={copied}
          />
          <ActionBtn
            icon={<Sparkles className="h-5 w-5" />}
            label="Explain"
            onClick={toggleExplain}
            active={showExplain}
          />
          <ActionBtn
            icon={<LinkIcon className="h-5 w-5" />}
            label="Ref"
            onClick={toggleCrossRef}
            active={showCrossRef}
          />
          <ActionBtn
            icon={<ImageIcon className="h-5 w-5" />}
            label="Card"
            onClick={() => setShowCard(true)}
            active={false}
          />
        </div>
      </div>
    </div>

    {showCard && (
      <VerseCardModal
        bookName={bookName}
        chapterNo={chapterNo}
        verseNo={verseNo}
        text={text}
        textOther={textOther}
        language={language}
        onClose={() => setShowCard(false)}
      />
    )}
    </>
  )
}

function ActionBtn({
  icon, label, onClick, active, dotColor,
}: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; dotColor?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center gap-1 min-w-[48px] hover:opacity-70 transition-opacity relative',
        active ? 'text-maroon-700' : 'text-maroon-700'
      )}
    >
      {icon}
      {dotColor && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span className={clsx('text-xs', active && 'font-semibold')}>{label}</span>
    </button>
  )
}
