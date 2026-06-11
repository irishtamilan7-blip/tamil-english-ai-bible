import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

// Use fetch() for Bible API calls — on Android/iOS the CapacitorHttp plugin
// intercepts fetch() and routes it through the OS HTTP stack, bypassing WebView
// restrictions. AbortController gives a real, reliable timeout.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiFetch<T = any>(path: string, params: Record<string, string>, timeout = 12000): Promise<{ data: T }> {
  const base = API_BASE.replace(/\/$/, '')
  const qs = new URLSearchParams(params).toString()
  const url = `${base}${path}${qs ? '?' + qs : ''}`

  const fetchPromise = fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { data: await res.json() as T }
  })

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeout)
  )

  return Promise.race([fetchPromise, timeoutPromise])
}

export const bibleApi = {
  getBooks: (lang = 'english') =>
    apiFetch('/bible/books', { lang }),

  getBook: (bookId: number, lang = 'english') =>
    apiFetch(`/bible/books/${bookId}`, { lang }),

  getChapter: (bookId: number, chapterNo: number, lang = 'english', bilingual = false, version = 'bbe', timeout = 12000) =>
    apiFetch(`/bible/books/${bookId}/chapters/${chapterNo}`, { lang, bilingual: String(bilingual), version }, timeout),

  search: (q: string, lang = 'english', testament = 'all', page = 1, version = 'bbe') =>
    apiFetch('/bible/search', { q, lang, testament, page: String(page), version }),

  getVersions: () =>
    apiFetch('/bible/versions', {}),
}

export const aiApi = {
  chat: (message: string, history: { role: string; content: string }[]) =>
    api.post('/ai/chat', { message, history }, { timeout: 30000 }),
  explain: (reference: string, verseText: string, lang = 'english') =>
    api.post('/ai/explain', { reference, verseText, lang }, { timeout: 90000 }),
  voiceParse: (text: string) =>
    api.post('/ai/voice-parse', { text }, { timeout: 15000 }),
  crossRef: (reference: string, verseText: string, lang = 'english') =>
    api.post('/ai/cross-ref', { reference, verseText, lang }, { timeout: 25000 }),
}

export const voiceApi = {
  transcribe: (audioBlob: Blob) => {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.webm')
    return api.post('/voice/transcribe', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  parse: (text: string) => api.post('/voice/parse', { text }),
}
