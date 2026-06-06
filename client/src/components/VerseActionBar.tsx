import { Highlighter, Bookmark, FileText, Share2, Copy, X } from 'lucide-react'

interface Props {
  bookId: number
  chapterNo: number
  verseNo: number
  text: string
  onClose: () => void
}

const COLORS = ['#FEF08A', '#86EFAC', '#93C5FD', '#F9A8D4', '#FDC57B']

export default function VerseActionBar({ bookId, chapterNo, verseNo, text, onClose }: Props) {
  const ref = `${bookId}:${chapterNo}:${verseNo}`

  function copy() {
    navigator.clipboard?.writeText(text)
    onClose()
  }

  function share() {
    if (navigator.share) {
      navigator.share({ text: `"${text}" (Ref: ${ref})`, title: 'Bible Verse' }).catch(() => {})
    } else {
      copy()
    }
    onClose()
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-cream-300 p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-gray-500 font-medium">Verse {verseNo}</p>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3 justify-around">
        <ActionBtn icon={<Highlighter className="h-5 w-5" />} label="Highlight" onClick={() => {}} />
        <ActionBtn icon={<Bookmark className="h-5 w-5" />} label="Bookmark" onClick={() => {}} />
        <ActionBtn icon={<FileText className="h-5 w-5" />} label="Note" onClick={() => {}} />
        <ActionBtn icon={<Share2 className="h-5 w-5" />} label="Share" onClick={share} />
        <ActionBtn icon={<Copy className="h-5 w-5" />} label="Copy" onClick={copy} />
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-maroon-700 hover:text-maroon-900 min-w-[48px]"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  )
}
