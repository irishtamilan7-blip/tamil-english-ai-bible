import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, X, Check, BookOpen, Calendar, Edit3 } from 'lucide-react'
import { useSermonStore, type SermonTopic } from '../store/useSermonStore'
import { clsx } from 'clsx'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY: Omit<SermonTopic, 'id' | 'createdAt'> = {
  date: today(),
  title: '',
  scripture: '',
  notes: '',
}

export default function WeeklyTopicsPage() {
  const navigate  = useNavigate()
  const { topics, add, update, remove } = useSermonStore()

  const [showForm, setShowForm]       = useState(false)
  const [editId, setEditId]           = useState<string | null>(null)
  const [form, setForm]               = useState(EMPTY)
  const [confirmDel, setConfirmDel]   = useState<string | null>(null)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  const sorted = [...topics].sort((a, b) => b.date.localeCompare(a.date))

  function openAdd() {
    setForm({ ...EMPTY, date: today() })
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(t: SermonTopic) {
    setForm({ date: t.date, title: t.title, scripture: t.scripture, notes: t.notes })
    setEditId(t.id)
    setShowForm(true)
  }

  function save() {
    if (!form.title.trim()) return
    if (editId) {
      update(editId, form)
    } else {
      add(form)
    }
    setShowForm(false)
    setEditId(null)
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-maroon-700 font-serif">Weekly Topics</h1>
          <p className="text-xs text-gray-400">Pastor's sermon notes & references</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-maroon-700 text-white text-sm font-medium px-3 py-2 rounded-xl"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-cream-200 shrink-0">
              <p className="font-semibold text-gray-800">{editId ? 'Edit Sermon Topic' : 'New Sermon Topic'}</p>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
              {/* Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-maroon-400"
                />
              </div>
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Sermon Title *</label>
                <input
                  type="text"
                  placeholder="e.g. The Power of Faith"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-maroon-400"
                />
              </div>
              {/* Scripture */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Scripture Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Matthew 17:20, Hebrews 11:1"
                  value={form.scripture}
                  onChange={(e) => setForm(f => ({ ...f, scripture: e.target.value }))}
                  className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-maroon-400"
                />
              </div>
              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Sermon Notes</label>
                <textarea
                  rows={5}
                  placeholder="Key points, insights, personal reflections…"
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-maroon-400"
                />
              </div>
            </div>
            <div className="px-5 pb-6 pt-2 shrink-0 flex gap-3">
              <button
                onClick={save}
                disabled={!form.title.trim()}
                className={clsx(
                  'flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2',
                  form.title.trim() ? 'bg-maroon-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                <Check className="h-4 w-4" /> Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-3 border border-cream-300 rounded-xl text-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📖</div>
          <p className="font-medium text-gray-600 mb-1">No sermon topics yet</p>
          <p className="text-sm text-gray-400 mb-6">Tap the Add button to record this week's sermon topic, scripture and notes</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-maroon-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add your first topic
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((t) => (
            <div key={t.id} className="bg-white border border-cream-200 rounded-2xl overflow-hidden">
              {/* Card header */}
              <button
                className="w-full text-left px-4 py-3"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-maroon-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{t.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(t.date)}
                      </span>
                    </div>
                    {t.scripture ? (
                      <span className="inline-block mt-1 text-[11px] bg-maroon-50 text-maroon-600 px-2 py-0.5 rounded-full font-medium">
                        📜 {t.scripture}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-gray-300 text-sm shrink-0">{expandedId === t.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded notes */}
              {expandedId === t.id && t.notes && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-gray-600 leading-relaxed bg-cream-50 rounded-xl px-3 py-2.5 whitespace-pre-wrap">
                    {t.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-cream-100 px-4 py-2 flex items-center justify-between">
                <button
                  onClick={() => openEdit(t)}
                  className="flex items-center gap-1 text-xs text-maroon-600 hover:text-maroon-800"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                {confirmDel === t.id ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Delete?</span>
                    <button onClick={() => { remove(t.id); setConfirmDel(null) }} className="text-xs text-red-500 font-medium">Yes</button>
                    <button onClick={() => setConfirmDel(null)} className="text-xs text-gray-400">No</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDel(t.id)}
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
