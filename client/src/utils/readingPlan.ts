export interface DayReading {
  bookId: number
  bookName: string
  chapterNo: number
}

const BOOKS = [
  { id: 1,  name: 'Genesis',          chapters: 50 },
  { id: 2,  name: 'Exodus',           chapters: 40 },
  { id: 3,  name: 'Leviticus',        chapters: 27 },
  { id: 4,  name: 'Numbers',          chapters: 36 },
  { id: 5,  name: 'Deuteronomy',      chapters: 34 },
  { id: 6,  name: 'Joshua',           chapters: 24 },
  { id: 7,  name: 'Judges',           chapters: 21 },
  { id: 8,  name: 'Ruth',             chapters: 4  },
  { id: 9,  name: '1 Samuel',         chapters: 31 },
  { id: 10, name: '2 Samuel',         chapters: 24 },
  { id: 11, name: '1 Kings',          chapters: 22 },
  { id: 12, name: '2 Kings',          chapters: 25 },
  { id: 13, name: '1 Chronicles',     chapters: 29 },
  { id: 14, name: '2 Chronicles',     chapters: 36 },
  { id: 15, name: 'Ezra',             chapters: 10 },
  { id: 16, name: 'Nehemiah',         chapters: 13 },
  { id: 17, name: 'Esther',           chapters: 10 },
  { id: 18, name: 'Job',              chapters: 42 },
  { id: 19, name: 'Psalms',           chapters: 150 },
  { id: 20, name: 'Proverbs',         chapters: 31 },
  { id: 21, name: 'Ecclesiastes',     chapters: 12 },
  { id: 22, name: 'Song of Solomon',  chapters: 8  },
  { id: 23, name: 'Isaiah',           chapters: 66 },
  { id: 24, name: 'Jeremiah',         chapters: 52 },
  { id: 25, name: 'Lamentations',     chapters: 5  },
  { id: 26, name: 'Ezekiel',          chapters: 48 },
  { id: 27, name: 'Daniel',           chapters: 12 },
  { id: 28, name: 'Hosea',            chapters: 14 },
  { id: 29, name: 'Joel',             chapters: 3  },
  { id: 30, name: 'Amos',             chapters: 9  },
  { id: 31, name: 'Obadiah',          chapters: 1  },
  { id: 32, name: 'Jonah',            chapters: 4  },
  { id: 33, name: 'Micah',            chapters: 7  },
  { id: 34, name: 'Nahum',            chapters: 3  },
  { id: 35, name: 'Habakkuk',         chapters: 3  },
  { id: 36, name: 'Zephaniah',        chapters: 3  },
  { id: 37, name: 'Haggai',           chapters: 2  },
  { id: 38, name: 'Zechariah',        chapters: 14 },
  { id: 39, name: 'Malachi',          chapters: 4  },
  { id: 40, name: 'Matthew',          chapters: 28 },
  { id: 41, name: 'Mark',             chapters: 16 },
  { id: 42, name: 'Luke',             chapters: 24 },
  { id: 43, name: 'John',             chapters: 21 },
  { id: 44, name: 'Acts',             chapters: 28 },
  { id: 45, name: 'Romans',           chapters: 16 },
  { id: 46, name: '1 Corinthians',    chapters: 16 },
  { id: 47, name: '2 Corinthians',    chapters: 13 },
  { id: 48, name: 'Galatians',        chapters: 6  },
  { id: 49, name: 'Ephesians',        chapters: 6  },
  { id: 50, name: 'Philippians',      chapters: 4  },
  { id: 51, name: 'Colossians',       chapters: 4  },
  { id: 52, name: '1 Thessalonians',  chapters: 5  },
  { id: 53, name: '2 Thessalonians',  chapters: 3  },
  { id: 54, name: '1 Timothy',        chapters: 6  },
  { id: 55, name: '2 Timothy',        chapters: 4  },
  { id: 56, name: 'Titus',            chapters: 3  },
  { id: 57, name: 'Philemon',         chapters: 1  },
  { id: 58, name: 'Hebrews',          chapters: 13 },
  { id: 59, name: 'James',            chapters: 5  },
  { id: 60, name: '1 Peter',          chapters: 5  },
  { id: 61, name: '2 Peter',          chapters: 3  },
  { id: 62, name: '1 John',           chapters: 5  },
  { id: 63, name: '2 John',           chapters: 1  },
  { id: 64, name: '3 John',           chapters: 1  },
  { id: 65, name: 'Jude',             chapters: 1  },
  { id: 66, name: 'Revelation',       chapters: 22 },
]

// Flatten all 1189 chapters in canonical order
const ALL_CHAPTERS: DayReading[] = BOOKS.flatMap((b) =>
  Array.from({ length: b.chapters }, (_, i) => ({
    bookId: b.id,
    bookName: b.name,
    chapterNo: i + 1,
  }))
)

const TOTAL = ALL_CHAPTERS.length // 1189
const DAYS  = 365

// Evenly distribute 1189 chapters across 365 days
let PLAN: DayReading[][] | null = null
export function getPlan(): DayReading[][] {
  if (PLAN) return PLAN
  PLAN = []
  for (let d = 0; d < DAYS; d++) {
    const start = Math.round((d / DAYS) * TOTAL)
    const end   = Math.round(((d + 1) / DAYS) * TOTAL)
    PLAN.push(ALL_CHAPTERS.slice(start, end))
  }
  return PLAN
}

// Day number (1-365) for a given date
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff  = date.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

// Day number in the plan relative to a start date
export function planDayFor(startDate: string, date: Date = new Date()): number {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const today = new Date(date)
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000)
  return Math.min(Math.max(diff + 1, 1), DAYS) // clamp 1..365
}
