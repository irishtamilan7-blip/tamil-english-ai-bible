export interface CachedBook {
  id: number
  name_english: string
  name_tamil: string
  name_local?: string   // name in the currently selected language
  chapter_count: number
  testament: string
}

const bookCache: Record<number, CachedBook> = {}
export default bookCache
