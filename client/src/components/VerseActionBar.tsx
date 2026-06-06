import { useState } from 'react'
import { Highlighter, Bookmark, FileText, Share2, Copy, X, Check } from 'lucide-react'
import { useBookmarkStore } from '../store/useBookmarkStore'
import { clsx } from 'clsx'

interface Props {
  bookId: number
  bookName: string
  chapterNo: number
  verseNo: number
  text: string
  onClose: () => void
}

const HIGHLIGHT_COLORS = [
  { hex: '#FEF08A', label: 'Yellow' },
  { hex: '#86EFAC', label: 'Green'  },
  { hex: '#93C5FD', label: 'Blue'   },
  { hex: '#F9A8D4', label: 'Pink'   },
  { hex: '#FDC57B', label: 'Orange' },
]

export default function VerseActionBar({ bookId, bookName, chapterNo, verseNo, text, onClose }: Props) {
  const { add, remove, has } = useBookmarkStore()
  const isBookmarked = has(bookId, chapterNo, verseNo)
  const [showHighlight, setShowHighlight] = useState(false)
  const [copied, setCopied] = useState(false)

  function toggleBookmark() {
    if (isBookmarked) {
      // find and remove
      const { bookmarks } = useBookmarkStore.getState()
      const bm = bookmarks.find(b => b.bookId === bookId && b.chapterNo === chapterNo && b.verseNo === verseNo)
      if (bm) remove(bm.id)
    } else {
      add({ bookId, bookName, chapterNo, verseNo, verseText: text })
    }
  }

  function copy() {
    navigator.clipboard?.writeText(`"${text}" — ${bookName} ${chapterNo}:${verseNo}`)
    setCopied(true)
    setTimeout(() => { setCopied(false); onClose() }, 1200)
  }

  function share() {
    if (navigator.share) {
      navigator.share({
        title: `${bookName} ${chapterNo}:${verseNo}`,
        text: `"${text}" — ${bookName} ${chapterNo}:${verseNo}`,
      }).catch(() => {})
    } else {
      copy()
      return
    }
    onClose()
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-cream-300 p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-gray-500 font-medium">
          {bookName} {chapterNo}:{verseNo}
        </p>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 min-h-0 min-w-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Highlight color picker */}
      {showHighlight && (
        <div className="flex gap-2 mb-3 justify-center">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.hex}
              title={c.label}
              onClick={() => { setShowHighlight(false) }}
              className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform min-h-0 min-w-0"
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-around">
        <ActionBtn
          icon={<Highlighter className="h-5 w-5" />}
          label="Highlight"
          onClick={() => setShowHighlight(!showHighlight)}
        />
        <ActionBtn
          icon={<Bookmark className={clsx('h-5 w-5', isBookmarked && 'fill-gold-500 text-gold-600')} />}
          label={isBookmarked ? 'Saved' : 'Bookmark'}
          onClick={toggleBookmark}
          active={isBookmarked}
        />
        <ActionBtn
          icon={<FileText className="h-5 w-5" />}
          label="Note"
          onClick={() => {}}
        />
        <ActionBtn
          icon={<Share2 className="h-5 w-5" />}
          label="Share"
          onClick={share}
        />
        <ActionBtn
          icon={copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
          label={copied ? 'Copied!' : 'Copy'}
          onClick={copy}
        />
      </div>
    </div>
  )
}

function ActionBtn({
  icon, label, onClick, active,
}: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center gap-1 min-w-[48px] hover:opacity-70 transition-opacity',
        active ? 'text-gold-600' : 'text-maroon-700'
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  )
}
