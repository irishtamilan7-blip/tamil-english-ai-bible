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
  getBooks: (lang = 'english') => api.get(`/bible/books?lang=${lang}`),
  getBook: (bookId: number, lang = 'english') => api.get(`/bible/books/${bookId}?lang=${lang}`),
  getChapter: (bookId: number, chapterNo: number, lang = 'english', bilingual = false) =>
    api.get(`/bible/books/${bookId}/chapters/${chapterNo}?lang=${lang}&bilingual=${bilingual}`),
  search: (q: string, lang = 'english', testament = 'all', page = 1) =>
    api.get(`/bible/search?q=${encodeURIComponent(q)}&lang=${lang}&testament=${testament}&page=${page}`),
}

export const voiceApi = {
  transcribe: (audioBlob: Blob) => {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.webm')
    return api.post('/voice/transcribe', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  parse: (text: string) => api.post('/voice/parse', { text }),
}
