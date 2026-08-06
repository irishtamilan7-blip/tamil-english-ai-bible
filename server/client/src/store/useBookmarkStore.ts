import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Bookmark {
  id: string
  bookId: number
  bookName: string
  chapterNo: number
  verseNo: number
  verseText: string
  label?: string
  color: string
  createdAt: string
}

const COLORS = ['#FEF08A', '#86EFAC', '#93C5FD', '#F9A8D4', '#FDC57B', '#C084FC']

interface BookmarkStore {
  bookmarks: Bookmark[]
  add: (b: Omit<Bookmark, 'id' | 'createdAt' | 'color'> & { color?: string }) => void
  remove: (id: string) => void
  has: (bookId: number, chapterNo: number, verseNo: number) => boolean
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      add: (b) => set((state) => ({
        bookmarks: [
          {
            ...b,
            id: `${b.bookId}-${b.chapterNo}-${b.verseNo}-${Date.now()}`,
            color: b.color || COLORS[0],
            createdAt: new Date().toISOString(),
          },
          ...state.bookmarks,
        ],
      })),
      remove: (id) => set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),
      has: (bookId, chapterNo, verseNo) =>
        get().bookmarks.some((b) => b.bookId === bookId && b.chapterNo === chapterNo && b.verseNo === verseNo),
    }),
    { name: 'biblevoice-bookmarks' }
  )
)
