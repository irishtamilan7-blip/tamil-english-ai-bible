import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = string  // 'english', 'tamil', 'malayalam', 'korean', etc.

// Map device locale to app language key — called once per app open
function detectLocale(): Language {
  const raw = navigator.language || (navigator.languages?.[0]) || 'en'
  const lower = raw.toLowerCase()
  const lang = lower.split('-')[0]
  const region = lower.split('-')[1] || ''

  if (lang === 'zh') {
    return (region === 'tw' || region === 'hk' || lower.includes('hant'))
      ? 'chinese_traditional'
      : 'chinese_simplified'
  }

  const MAP: Record<string, Language> = {
    ta: 'tamil', ml: 'malayalam', hi: 'hindi', te: 'telugu',
    kn: 'kannada', mr: 'marathi', ko: 'korean', ja: 'japanese',
    ar: 'arabic', he: 'hebrew', iw: 'hebrew', el: 'greek',
    es: 'spanish', fr: 'french', de: 'german', pt: 'portuguese',
    ru: 'russian', it: 'italian', nl: 'dutch', sv: 'swedish',
    tr: 'turkish', vi: 'vietnamese', th: 'thai', id: 'indonesian',
    af: 'afrikaans', sq: 'albanian', hy: 'armenian', my: 'burmese',
    hr: 'croatian', cs: 'czech', da: 'danish', eo: 'esperanto',
    et: 'estonian', fi: 'finnish', hu: 'hungarian', lv: 'latvian',
    lt: 'lithuanian', mg: 'malagasy', mi: 'maori', mn: 'mongolian',
    no: 'norwegian', pl: 'polish', ro: 'romanian', sr: 'serbian',
    sn: 'shona', sw: 'swahili', tl: 'tagalog', uk: 'ukrainian',
  }

  return MAP[lang] ?? 'english'
}
export type Theme = 'light' | 'dark' | 'sepia'
export type FontSize = number // 12–32

export interface LanguageConfig {
  key: string
  native_name: string
  direction: 'ltr' | 'rtl'
  file: string
}

interface LastRead {
  bookId: number
  bookName: string
  chapterNo: number
  verseNo?: number
}

interface AppState {
  language: Language
  showBilingual: boolean  // show primary language + English side by side (hidden for English)
  theme: Theme
  fontSize: FontSize
  lineSpacing: 'compact' | 'normal' | 'relaxed'
  fontFamily: 'default' | 'serif' | 'tamil-traditional' | 'dyslexic'
  bibleVersion: string
  lastRead: LastRead | null
  searchHistory: string[]
  offlineMode: boolean
  elevenLabsKey: string
  elevenLabsVoiceId: string
  sheetOpen: boolean

  setLanguage: (l: Language) => void
  setShowBilingual: (v: boolean) => void
  setTheme: (t: Theme) => void
  setFontSize: (s: FontSize) => void
  setLineSpacing: (s: AppState['lineSpacing']) => void
  setFontFamily: (f: AppState['fontFamily']) => void
  setBibleVersion: (v: string) => void
  setLastRead: (r: LastRead) => void
  addSearchHistory: (q: string) => void
  removeSearchHistory: (q: string) => void
  clearSearchHistory: () => void
  setOfflineMode: (v: boolean) => void
  setElevenLabsKey: (k: string) => void
  setElevenLabsVoiceId: (id: string) => void
  setSheetOpen: (v: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: detectLocale(),
      showBilingual: false,
      theme: 'light',
      fontSize: 18,
      lineSpacing: 'normal',
      fontFamily: 'serif',
      bibleVersion: 'bsb',
      lastRead: null,
      searchHistory: [],
      offlineMode: false,
      elevenLabsKey: '',
      elevenLabsVoiceId: '',
      sheetOpen: false,

      setLanguage: (language) => {
        // English readers don't need bilingual (English is already the reference language)
        const showBilingual = language === 'english' ? false : get().showBilingual
        set({ language, showBilingual })
      },
      setShowBilingual: (showBilingual) => set({ showBilingual }),
      setBibleVersion: (bibleVersion) => set({ bibleVersion }),
      setTheme: (theme) => {
        document.body.className = theme === 'light' ? '' : `theme-${theme}`
        set({ theme })
      },
      setFontSize: (fontSize) => set({ fontSize }),
      setLineSpacing: (lineSpacing) => set({ lineSpacing }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setLastRead: (lastRead) => set({ lastRead }),
      addSearchHistory: (q) =>
        set((state) => ({
          searchHistory: [q, ...state.searchHistory.filter((h) => h !== q)].slice(0, 20),
        })),
      removeSearchHistory: (q) =>
        set((state) => ({ searchHistory: state.searchHistory.filter((h) => h !== q) })),
      clearSearchHistory: () => set({ searchHistory: [] }),
      setOfflineMode: (offlineMode) => set({ offlineMode }),
      setElevenLabsKey: (elevenLabsKey) => set({ elevenLabsKey }),
      setElevenLabsVoiceId: (elevenLabsVoiceId) => set({ elevenLabsVoiceId }),
      setSheetOpen: (sheetOpen) => set({ sheetOpen }),
    }),
    {
      name: 'biblevoice-app-store',
      // language/showBilingual/sheetOpen are session-only: app always opens in English
      partialize: (state): Partial<AppState> => ({
        theme:            state.theme,
        fontSize:         state.fontSize,
        lineSpacing:      state.lineSpacing,
        fontFamily:       state.fontFamily,
        bibleVersion:     state.bibleVersion,
        lastRead:         state.lastRead,
        searchHistory:    state.searchHistory,
        offlineMode:      state.offlineMode,
        elevenLabsKey:    state.elevenLabsKey,
        elevenLabsVoiceId: state.elevenLabsVoiceId,
      }),
    }
  )
)
