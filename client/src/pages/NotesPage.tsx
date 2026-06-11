import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, ChevronRight } from 'lucide-react'
import { useNoteStore } from '../store/useNoteStore'

export default function NotesPage() {
  const navigate = useNavigate()
  const { notes, remove } = useNoteStore()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const sorted = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-maroon-700 font-serif">Notes</h1>
        <span className="ml-auto text-xs text-gray-400">{sorted.length} note{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📝</div>
          <p className="font-medium text-gray-600 mb-1">No notes yet</p>
          <p className="text-sm text-gray-400">Tap a verse while reading, then choose Note to write your thoughts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((note) => (
            <div key={note.id} className="bg-white border border-cream-200 rounded-2xl overflow-hidden">
              <button
                className="w-full text-left px-4 py-3 flex items-start gap-3"
                onClick={() => navigate(`/read/${note.bookId}/${note.chapterNo}?verse=${note.verseNo}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-maroon-700">
                      {note.bookName} {note.chapterNo}:{note.verseNo}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {new Date(note.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 bg-blue-50 rounded-lg px-3 py-2">
                    {note.text}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
              </button>
              <div className="border-t border-cream-100 px-4 py-2 flex justify-end">
                {confirmDelete === note.id ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Delete this note?</span>
                    <button
                      onClick={() => { remove(note.bookId, note.chapterNo, note.verseNo); setConfirmDelete(null) }}
                      className="text-xs text-red-500 font-medium"
                    >Yes, delete</button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-gray-400"
                    >Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(note.id)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
