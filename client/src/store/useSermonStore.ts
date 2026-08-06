import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SermonTopic {
  id: string
  date: string        // YYYY-MM-DD
  title: string
  scripture: string   // e.g. "John 3:16-20"
  notes: string
  createdAt: string
}

interface SermonStore {
  topics: SermonTopic[]
  add: (t: Omit<SermonTopic, 'id' | 'createdAt'>) => void
  update: (id: string, t: Partial<Omit<SermonTopic, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
}

export const useSermonStore = create<SermonStore>()(
  persist(
    (set) => ({
      topics: [],
      add: (t) =>
        set((s) => ({
          topics: [
            { ...t, id: `sermon-${Date.now()}`, createdAt: new Date().toISOString() },
            ...s.topics,
          ],
        })),
      update: (id, t) =>
        set((s) => ({
          topics: s.topics.map((topic) => (topic.id === id ? { ...topic, ...t } : topic)),
        })),
      remove: (id) =>
        set((s) => ({ topics: s.topics.filter((t) => t.id !== id) })),
    }),
    { name: 'biblevoice-sermons' }
  )
)
