export interface BookMeta {
  id: number
  name_english: string
  name_tamil: string
  name_local: string   // name in the currently selected language
  chapter_count: number
  testament: string
}

// Cached per "lang:testament" key so language switches re-fetch correctly
const testamentBooksCache: Partial<Record<string, BookMeta[]>> = {}
export default testamentBooksCache
