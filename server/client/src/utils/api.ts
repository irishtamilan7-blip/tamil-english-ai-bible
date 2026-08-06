import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

// Bible API helpers
export const bibleApi = {
  getBooks: (lang = 'english') =>
    api.get(`/bible/books?lang=${lang}`),
  getBook: (bookId: number, lang = 'english') =>
    api.get(`/bible/books/${bookId}?lang=${lang}`),
  getChapter: (bookId: number, chapterNo: number, lang = 'english', bilingual = false, version = 'bbe') =>
    api.get(`/bible/books/${bookId}/chapters/${chapterNo}?lang=${lang}&bilingual=${bilingual}&version=${version}`),
  search: (q: string, lang = 'english', testament = 'all', page = 1, version = 'bbe') =>
    api.get(`/bible/search?q=${encodeURIComponent(q)}&lang=${lang}&testament=${testament}&page=${page}&version=${version}`),
  getVersions: () =>
    api.get('/bible/versions'),
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
