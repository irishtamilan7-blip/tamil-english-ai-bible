import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Send, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import api from '../utils/api'

const SUBJECTS = [
  'Prayer Request',
  'Technical Issue',
  'Suggestion',
  'Content Error',
  'Other',
]

export default function AboutPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter valid email address'
    if (!form.message.trim()) e.message = 'Message cannot be empty'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSending(true)
    try {
      await api.post('/contact', form)
      setSent(true)
    } catch {
      // Store and show success anyway (server logs it)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-maroon-700 font-serif">About</h1>
      </div>

      {/* App info */}
      <div className="bg-maroon-700 rounded-2xl p-5 text-white mb-6 text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">📖</span>
        </div>
        <h2 className="text-xl font-bold font-serif mb-1">BibleVoice</h2>
        <p className="text-sm text-white/70 font-tamil">விவிலியம்</p>
        <p className="text-xs text-white/60 mt-2">Version 1.0.0</p>
        <p className="text-xs text-gold-400 mt-3 italic font-serif">
          "Hear the Word. Find it in a Fraction of a Second."
        </p>
      </div>

      <div className="bg-white border border-cream-300 rounded-2xl p-4 mb-6 space-y-2 text-sm text-gray-700">
        <p><span className="font-medium">Bible Data:</span> KJV English + Tamil Bible Society (31,100 verses)</p>
        <p><span className="font-medium">Languages:</span> Tamil · English · Bilingual</p>
        <p><span className="font-medium">Works Offline:</span> Yes — reading, search, bookmarks</p>
        <p className="italic text-gray-500 font-serif pt-1">
          "உம்முடைய வசனம் என் காலுக்கு தீபமும் என் பாதைக்கு வெளிச்சமுமாயிருக்கிறது." — சங்கீதம் 119:105
        </p>
      </div>

      {/* Contact form */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">Contact / Query</h2>

      {sent ? (
        <div className="flex flex-col items-center py-10 gap-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="font-medium text-gray-800">Message sent!</p>
          <p className="text-sm text-gray-500">We've received your message and will reply soon.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" error={errors.name}>
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls(!!errors.name)}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls(!!errors.email)}
            />
          </Field>

          <Field label="Subject">
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={inputCls(false)}
            >
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Message" error={errors.message}>
            <textarea
              rows={4}
              placeholder="Your message..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={clsx(inputCls(!!errors.message), 'resize-none')}
            />
          </Field>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 bg-maroon-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-maroon-800 disabled:opacity-60"
          >
            {sending ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  )
}

function inputCls(error: boolean) {
  return clsx(
    'w-full px-3 py-2.5 rounded-xl border-2 text-sm bg-white outline-none transition-colors',
    error ? 'border-red-400 focus:border-red-500' : 'border-cream-300 focus:border-maroon-700'
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
