import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getPlan } from '../utils/readingPlan'

interface ReadingPlanStore {
  startDate: string | null
  completedDays: number[]
  readChapters: string[]   // "bookId-chapterNo"
  readDates: string[]      // "YYYY-MM-DD" — calendar days when user read at least one chapter
  startPlan: () => void
  resetPlan: () => void
  markDay: (day: number) => void
  unmarkDay: (day: number) => void
  isDone: (day: number) => boolean
  markChapterRead: (bookId: number, chapterNo: number) => void
  isChapterRead: (bookId: number, chapterNo: number) => boolean
  getStreak: () => number
}

function chapterKey(bookId: number, chapterNo: number) {
  return `${bookId}-${chapterNo}`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export const useReadingPlanStore = create<ReadingPlanStore>()(
  persist(
    (set, get) => ({
      startDate: null,
      completedDays: [],
      readChapters: [],
      readDates: [],

      startPlan: () => set({ startDate: new Date().toISOString().split('T')[0], completedDays: [], readChapters: [], readDates: [] }),
      resetPlan: () => set({ startDate: null, completedDays: [], readChapters: [], readDates: [] }),

      markDay: (day) => set((s) => ({
        completedDays: s.completedDays.includes(day) ? s.completedDays : [...s.completedDays, day],
      })),
      unmarkDay: (day) => set((s) => ({
        completedDays: s.completedDays.filter((d) => d !== day),
      })),
      isDone: (day) => get().completedDays.includes(day),

      markChapterRead: (bookId, chapterNo) => {
        const key = chapterKey(bookId, chapterNo)
        const state = get()
        if (state.readChapters.includes(key)) return

        const newRead = [...state.readChapters, key]

        // Record today as a reading date for streak tracking
        const today = todayStr()
        const newDates = state.readDates.includes(today)
          ? state.readDates
          : [...state.readDates, today]

        set({ readChapters: newRead, readDates: newDates })

        // Find which plan day this chapter belongs to — mark that day complete if all its chapters are read
        if (!state.startDate) return
        const plan = getPlan()
        for (let d = 0; d < plan.length; d++) {
          const dayChapters = plan[d]
          const inThisDay = dayChapters.some(c => c.bookId === bookId && c.chapterNo === chapterNo)
          if (inThisDay) {
            const allRead = dayChapters.every(c => newRead.includes(chapterKey(c.bookId, c.chapterNo)))
            if (allRead && !state.completedDays.includes(d + 1)) {
              set(s => ({ completedDays: [...s.completedDays, d + 1] }))
            }
            break
          }
        }
      },

      isChapterRead: (bookId, chapterNo) =>
        get().readChapters.includes(chapterKey(bookId, chapterNo)),

      // Streak = total number of plan days completed
      getStreak: () => get().completedDays.length,
    }),
    { name: 'biblevoice-reading-plan' }
  )
)
