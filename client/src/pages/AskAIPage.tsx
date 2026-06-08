import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Send, Sparkles, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { aiApi } from '../utils/api'
import { parseVerseRef } from '../utils/bibleRef'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'What does the Bible say about forgiveness?',
  'Explain John 3:16 in simple words',
  'Who was the Apostle Paul?',
  'மன்னிப்பு பற்றி வேதம் என்ன சொல்கிறது?',
  'Find verses about courage and strength',
  'What happened in the story of Joseph?',
]

export default function AskAIPage() {
  const navigate  = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    // If message is a verse reference, navigate directly to it
    const ref = parseVerseRef(msg)
    if (ref) {
      const url = ref.verse
        ? `/read/${ref.bookId}/${ref.chapter}?verse=${ref.verse}`
        : `/read/${ref.bookId}/${ref.chapter}`
      navigate(url)
      return
    }

    const userMsg: Message = { role: 'user', content: msg }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    try {
      const res = await aiApi.chat(msg, messages)
      setMessages([...updated, { role: 'assistant', content: res.data.reply }])
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } }
      if (e?.response?.status === 503) {
        setError('AI is not configured yet. Please add your GROQ_API_KEY in Railway Variables to enable Bible AI.')
      } else {
        setError(e?.response?.data?.error ?? 'Could not reach AI. Check your internet connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setMessages([])
    setError('')
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-cream-300 px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-maroon-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 bg-maroon-700 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-maroon-700 text-sm leading-tight">Bible AI</p>
            <p className="text-[10px] text-gray-400 leading-tight">Ask anything about the Bible</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} className="p-1 text-gray-400 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome + starters */}
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-maroon-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <p className="font-semibold text-gray-800 text-lg">Bible AI Assistant</p>
              <p className="text-sm text-gray-500 mt-1">Ask questions in English or Tamil</p>
              <p className="text-xs text-gray-400 mt-1 font-tamil">ஆங்கிலம் அல்லது தமிழில் கேளுங்கள்</p>
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Try asking…</p>
            <div className="grid grid-cols-1 gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left bg-cream-50 border border-cream-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:border-maroon-300 hover:bg-maroon-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 bg-maroon-700 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
            )}
            <div
              className={clsx(
                'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-maroon-700 text-white rounded-tr-sm'
                  : 'bg-white border border-cream-200 text-gray-800 rounded-tl-sm'
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 bg-maroon-700 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="bg-white border border-cream-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-maroon-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-cream-300 px-4 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="flex items-center gap-2 bg-cream-50 border border-cream-300 rounded-2xl px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about the Bible…"
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
              input.trim() && !loading ? 'bg-maroon-700 text-white' : 'bg-gray-100 text-gray-300'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">AI can make mistakes — always verify with Scripture</p>
      </div>
    </div>
  )
}
