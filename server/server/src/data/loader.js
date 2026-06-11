const fs = require('fs')
const path = require('path')

const BIBLE_DATA_DIR = path.join(process.cwd(), 'bible-data')
const VERSIONS_DIR   = path.join(BIBLE_DATA_DIR, 'versions')

let tamilBible   = null
let englishBible = null
let tamilIndex   = {}
let englishIndex = {}

// version_id → flat map of "bookId:chapterNo:verseNo" → text
const versionTexts = {}

const VERSION_CATALOG = [
  // ── Free / public domain ─────────────────────────────────────────────────
  { id: 'bsb', name: 'Berean Standard Bible',    short: 'BSB',  year: 2022, free: true  },
  { id: 'kjv', name: 'King James Version',        short: 'KJV',  year: 1611, free: true  },
  { id: 'bbe', name: 'Bible in Basic English',    short: 'BBE',  year: 1949, free: true  },
  { id: 'web', name: 'World English Bible',       short: 'WEB',  year: 2000, free: true  },
  { id: 'asv', name: 'American Standard Version', short: 'ASV',  year: 1901, free: true  },
  // ── Copyrighted — not included ───────────────────────────────────────────
  { id: 'niv',  name: 'New International Version',  short: 'NIV',  year: 1984, free: false },
  { id: 'nlt',  name: 'New Living Translation',     short: 'NLT',  year: 1996, free: false },
  { id: 'esv',  name: 'English Standard Version',   short: 'ESV',  year: 2001, free: false },
  { id: 'nkjv', name: 'New King James Version',     short: 'NKJV', year: 1982, free: false },
  { id: 'nasb', name: 'New American Standard Bible', short: 'NASB', year: 1971, free: false },
  { id: 'csb',  name: 'Christian Standard Bible',   short: 'CSB',  year: 2017, free: false },
  { id: 'gnt',  name: 'Good News Translation',      short: 'GNT',  year: 1976, free: false },
]

function loadBibles() {
  const tamilPath   = path.join(BIBLE_DATA_DIR, 'tamil_bible.json')
  const englishPath = path.join(BIBLE_DATA_DIR, 'english_bible.json')

  try {
    if (!fs.existsSync(tamilPath))   throw new Error('tamil_bible.json not found')
    if (!fs.existsSync(englishPath)) throw new Error('english_bible.json not found')

    tamilBible   = JSON.parse(fs.readFileSync(tamilPath, 'utf8'))
    englishBible = JSON.parse(fs.readFileSync(englishPath, 'utf8'))

    buildIndex(tamilBible, tamilIndex)
    buildIndex(englishBible, englishIndex)

    console.log(`✅ Tamil Bible loaded: ${tamilBible.books.length} books`)
    console.log(`✅ English Bible loaded: ${englishBible.books.length} books`)
  } catch (err) {
    console.error('❌ CRITICAL: Bible data load failed:', err.message)
    return { tamil: !!tamilBible, english: !!englishBible, error: err.message }
  }

  // Load available version text files
  if (fs.existsSync(VERSIONS_DIR)) {
    for (const meta of VERSION_CATALOG.filter(v => v.free)) {
      const vPath = path.join(VERSIONS_DIR, `${meta.id}.json`)
      if (fs.existsSync(vPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(vPath, 'utf8'))
          versionTexts[meta.id] = data.texts
          console.log(`✅ Version loaded: ${meta.name} (${meta.short})`)
        } catch (e) {
          console.warn(`⚠️  Could not load version ${meta.id}:`, e.message)
        }
      }
    }
  }

  return { tamil: true, english: true }
}

function buildIndex(bible, index) {
  for (const book of bible.books) {
    index[book.id] = book
    index[book.name_english.toLowerCase()] = book
    if (book.aliases_english) {
      for (const alias of book.aliases_english) {
        index[alias.toLowerCase()] = book
      }
    }
  }
}

function getTamil()   { return tamilBible }
function getEnglish() { return englishBible }

/** Returns the available-versions catalog with a `available` flag per entry */
function getVersionCatalog() {
  return VERSION_CATALOG.map(v => ({ ...v, available: !!versionTexts[v.id] }))
}

function getBook(lang, bookRef) {
  const idx   = lang === 'tamil' ? tamilIndex : englishIndex
  const numId = parseInt(bookRef)
  if (!isNaN(numId)) {
    const bible = lang === 'tamil' ? tamilBible : englishBible
    return bible?.books.find(b => b.id === numId) || null
  }
  return idx[String(bookRef).toLowerCase()] || null
}

function getChapter(lang, bookId, chapterNo) {
  const book = getBook(lang, bookId)
  if (!book) return null
  return book.chapters.find(c => c.chapter_no === parseInt(chapterNo)) || null
}

/** Overlay a version's verse texts onto a chapter's verses array (returns new array) */
function applyVersion(verses, bookId, chapterNo, version) {
  if (!version || version === 'bbe' || !versionTexts[version]) return verses
  const texts = versionTexts[version]
  return verses.map(v => {
    const key  = `${bookId}:${chapterNo}:${v.verse_no}`
    const text = texts[key]
    return text ? { ...v, text } : v
  })
}

function searchVerses(query, lang = 'both', testament = 'all', version = 'bbe') {
  const q = query.toLowerCase().trim()
  const results = []

  const bibles = lang === 'tamil'
    ? [{ lang: 'tamil', data: tamilBible }]
    : lang === 'english'
    ? [{ lang: 'english', data: englishBible }]
    : [{ lang: 'english', data: englishBible }, { lang: 'tamil', data: tamilBible }]

  const texts = (lang !== 'tamil' && versionTexts[version]) ? versionTexts[version] : null

  for (const { lang: l, data } of bibles) {
    if (!data) continue
    for (const book of data.books) {
      if (testament !== 'all' && book.testament !== testament) continue
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          const text = (l === 'english' && texts)
            ? (texts[`${book.id}:${chapter.chapter_no}:${verse.verse_no}`] || verse.text)
            : verse.text
          if (text.toLowerCase().includes(q)) {
            results.push({
              lang: l,
              book_id: book.id,
              book_name_english: book.name_english,
              book_name_tamil:   book.name_tamil,
              chapter_no: chapter.chapter_no,
              verse_no:   verse.verse_no,
              text,
            })
          }
        }
      }
    }
  }

  return results
}

module.exports = {
  loadBibles, getTamil, getEnglish,
  getBook, getChapter, applyVersion,
  searchVerses, getVersionCatalog,
}
