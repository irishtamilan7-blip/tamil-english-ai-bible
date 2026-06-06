import { useState, useRef } from 'react'
import { Mic, MicOff, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { voiceApi } from '../utils/api'
import { clsx } from 'clsx'

interface ParseResult {
  book_name_english: string
  chapter_no: number
  verse_no: number | null
  confidence_score: number
  top_matches?: Array<{ book_name_english: string; chapter_no: number; verse_no: number | null; confidence: number }>
}

// Fallback: parse reference from text locally (for offline use)
function parseReferenceLocally(text: string): ParseResult | null {
  const t = text.trim()
  // Match patterns like "John 3 16", "John 3:16", "John chapter 3 verse 16"
  const match = t.match(/^(.+?)\s+(?:chapter\s+)?(\d+)(?:[:\s]+(?:verse\s+)?(\d+))?/i)
  if (!match) return null
  return {
    book_name_english: match[1].trim(),
    chapter_no: parseInt(match[2]),
    verse_no: match[3] ? parseInt(match[3]) : null,
    confidence_score: 0.6,
  }
}

export default function VoiceFab() {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ParseResult['top_matches']>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const navigate = useNavigate()

  const bookNameToId: Record<string, number> = {
    genesis:1, exodus:2, leviticus:3, numbers:4, deuteronomy:5,
    joshua:6, judges:7, ruth:8, '1samuel':9, '2samuel':10,
    '1kings':11, '2kings':12, '1chronicles':13, '2chronicles':14,
    ezra:15, nehemiah:16, esther:17, job:18, psalms:19, proverbs:20,
    ecclesiastes:21, 'song of solomon':22, isaiah:23, jeremiah:24,
    lamentations:25, ezekiel:26, daniel:27, hosea:28, joel:29,
    amos:30, obadiah:31, jonah:32, micah:33, nahum:34, habakkuk:35,
    zephaniah:36, haggai:37, zechariah:38, malachi:39,
    matthew:40, mark:41, luke:42, john:43, acts:44,
    romans:45, '1corinthians':46, '2corinthians':47, galatians:48,
    ephesians:49, philippians:50, colossians:51, '1thessalonians':52,
    '2thessalonians':53, '1timothy':54, '2timothy':55, titus:56,
    philemon:57, hebrews:58, james:59, '1peter':60, '2peter':61,
    '1john':62, '2john':63, '3john':64, jude:65, revelation:66,
  }

  function navigateTo(result: { book_name_english: string; chapter_no: number; verse_no: number | null }) {
    const key = result.book_name_english.toLowerCase().replace(/\s+/g, '')
    const bookId = bookNameToId[key] || bookNameToId[result.book_name_english.toLowerCase()]
    if (!bookId) { setError(`Book "${result.book_name_english}" not found`); return }
    const path = `/read/${bookId}/${result.chapter_no}${result.verse_no ? `?verse=${result.verse_no}` : ''}`
    setSuggestions(null)
    navigate(path)
  }

  async function startRecording() {
    setError(null)
    setSuggestions(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await processAudio(blob)
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch {
      setError('Microphone permission denied. Please allow mic access.')
    }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
    setProcessing(true)
  }

  async function processAudio(blob: Blob) {
    try {
      let text = ''
      // Try Web Speech API first (offline-capable)
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        // Already captured via MediaRecorder, send to server for Whisper
      }

      try {
        const res = await voiceApi.transcribe(blob)
        text = res.data.text
      } catch {
        setError('Could not connect to voice server. Try typing your search instead.')
        setProcessing(false)
        return
      }

      if (!text.trim()) {
        setError('No speech detected. Try again.')
        setProcessing(false)
        return
      }

      try {
        const parseRes = await voiceApi.parse(text)
        const result: ParseResult = parseRes.data
        if (result.confidence_score >= 0.7) {
          navigateTo(result)
        } else if (result.top_matches?.length) {
          setSuggestions(result.top_matches)
        } else {
          setError(`Couldn't understand "${text}". Try again.`)
        }
      } catch {
        // Fallback: parse locally
        const local = parseReferenceLocally(text)
        if (local) {
          navigateTo(local)
        } else {
          setError(`Couldn't parse reference from: "${text}"`)
        }
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      {/* Suggestions panel */}
      {suggestions && suggestions.length > 0 && (
        <div className="fixed bottom-24 right-4 z-50 bg-white rounded-xl shadow-xl border border-cream-300 p-4 w-72">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-maroon-700">Did you mean?</p>
            <button onClick={() => setSuggestions(null)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => navigateTo(s)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-cream-100 text-sm mb-1"
            >
              <span className="font-medium text-maroon-700">{s.book_name_english}</span>
              <span className="text-gray-600"> {s.chapter_no}{s.verse_no ? `:${s.verse_no}` : ''}</span>
              <span className="text-xs text-gray-400 ml-2">{Math.round(s.confidence * 100)}%</span>
            </button>
          ))}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div
          className="fixed bottom-24 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl shadow-lg max-w-xs cursor-pointer"
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}

      {/* FAB button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={(e) => { e.preventDefault(); startRecording() }}
        onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
        disabled={processing}
        className={clsx(
          'fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all',
          recording
            ? 'bg-red-600 mic-recording'
            : processing
            ? 'bg-gold-500 cursor-wait'
            : 'bg-maroon-700 hover:bg-maroon-800 active:scale-95'
        )}
        title="Hold to speak a Bible reference"
      >
        {recording ? (
          <MicOff className="h-6 w-6 text-white" />
        ) : processing ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </button>
    </>
  )
}
