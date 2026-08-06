import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Note {
  id: string
  bookId: number
  bookName: string
  chapterNo: number
  verseNo: number
  text: string
  createdAt: string
  updatedAt: string
}

interface NoteStore {
  notes: Note[]
  save: (bookId: number, bookName: string, chapterNo: number, verseNo: number, text: string) => void
  remove: (bookId: number, chapterNo: number, verseNo: number) => void
  get: (bookId: number, chapterNo: number, verseNo: number) => Note | undefined
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (setState, getState) => ({
      notes: [],
      save: (bookId, bookName, chapterNo, verseNo, text) =>
        setState((s) => {
          const existing = s.notes.find(
            (n) => n.bookId === bookId && n.chapterNo === chapterNo && n.verseNo === verseNo
          )
          const now = new Date().toISOString()
          if (existing) {
            return {
              notes: s.notes.map((n) =>
                n.id === existing.id ? { ...n, text, updatedAt: now } : n
              ),
            }
          }
          return {
            notes: [
              {
                id: `${bookId}-${chapterNo}-${verseNo}`,
                bookId, bookName, chapterNo, verseNo, text,
                createdAt: now, updatedAt: now,
              },
              ...s.notes,
            ],
          }
        }),
      remove: (bookId, chapterNo, verseNo) =>
        setState((s) => ({
          notes: s.notes.filter(
            (n) => !(n.bookId === bookId && n.chapterNo === chapterNo && n.verseNo === verseNo)
          ),
        })),
      get: (bookId, chapterNo, verseNo) =>
        getState().notes.find(
          (n) => n.bookId === bookId && n.chapterNo === chapterNo && n.verseNo === verseNo
        ),
    }),
    { name: 'biblevoice-notes' }
  )
)
