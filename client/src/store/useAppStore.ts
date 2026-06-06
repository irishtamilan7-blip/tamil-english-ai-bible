import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'english' | 'tamil' | 'bilingual'
export type Theme = 'light' | 'dark' | 'sepia'
export type FontSize = number // 12–32

interface LastRead {
  bookId: number
  bookName: string
  chapterNo: number
  verseNo?: number
}

interface AppState {
  language: Language
  theme: Theme
  fontSize: FontSize
  lineSpacing: 'compact' | 'normal' | 'relaxed'
  fontFamily: 'default' | 'serif' | 'tamil-traditional' | 'dyslexic'
  lastRead: LastRead | null
  searchHistory: string[]
  offlineMode: boolean

  setLanguage: (l: Language) => void
  setTheme: (t: Theme) => void
  setFontSize: (s: FontSize) => void
  setLineSpacing: (s: AppState['lineSpacing']) => void
  setFontFamily: (f: AppState['fontFamily']) => void
  setLastRead: (r: LastRead) => void
  addSearchHistory: (q: string) => void
  removeSearchHistory: (q: string) => void
  clearSearchHistory: () => void
  setOfflineMode: (v: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'english',
      theme: 'light',
      fontSize: 18,
      lineSpacing: 'normal',
      fontFamily: 'serif',
      lastRead: null,
      searchHistory: [],
      offlineMode: false,

      setLanguage: (language) => set({ language }),
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
    }),
    { name: 'biblevoice-app-store' }
  )
)
