import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Highlight {
  id: string
  bookId: number
  bookName: string
  chapterNo: number
  verseNo: number
  verseText: string
  color: string
  createdAt: string
}

interface HighlightStore {
  highlights: Highlight[]
  set: (bookId: number, bookName: string, chapterNo: number, verseNo: number, verseText: string, color: string) => void
  remove: (bookId: number, chapterNo: number, verseNo: number) => void
  get: (bookId: number, chapterNo: number, verseNo: number) => Highlight | undefined
}

export const useHighlightStore = create<HighlightStore>()(
  persist(
    (setState, getState) => ({
      highlights: [],
      set: (bookId, bookName, chapterNo, verseNo, verseText, color) =>
        setState((s) => {
          const filtered = s.highlights.filter(
            (h) => !(h.bookId === bookId && h.chapterNo === chapterNo && h.verseNo === verseNo)
          )
          return {
            highlights: [
              ...filtered,
              {
                id: `${bookId}-${chapterNo}-${verseNo}`,
                bookId, bookName, chapterNo, verseNo, verseText, color,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        }),
      remove: (bookId, chapterNo, verseNo) =>
        setState((s) => ({
          highlights: s.highlights.filter(
            (h) => !(h.bookId === bookId && h.chapterNo === chapterNo && h.verseNo === verseNo)
          ),
        })),
      get: (bookId, chapterNo, verseNo) =>
        getState().highlights.find(
          (h) => h.bookId === bookId && h.chapterNo === chapterNo && h.verseNo === verseNo
        ),
    }),
    { name: 'biblevoice-highlights' }
  )
)
