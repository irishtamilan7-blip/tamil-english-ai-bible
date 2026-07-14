const fs = require('fs')
const path = require('path')

const BIBLE_DATA_DIR = path.join(process.cwd(), 'bible-data')
const VERSIONS_DIR   = path.join(BIBLE_DATA_DIR, 'versions')

// English and Tamil are kept in memory permanently (they are the base languages)
let tamilBible   = null
let englishBible = null
let tamilIndex   = {}
let englishIndex = {}

// Other languages are lazy-loaded on first request
const lazyBibles  = {}
const lazyIndices = {}

// Language config from language_config.json
let languageConfig = []

// version_id → flat map of "bookId:chapterNo:verseNo" → text
const versionTexts = {}

const VERSION_CATALOG = [
  { id: 'bsb', name: 'Berean Standard Bible',      short: 'BSB',  year: 2022, free: true  },
  { id: 'kjv', name: 'King James Version',           short: 'KJV',  year: 1611, free: true  },
  { id: 'bbe', name: 'Bible in Basic English',       short: 'BBE',  year: 1949, free: true  },
  { id: 'web', name: 'World English Bible',          short: 'WEB',  year: 2000, free: true  },
  { id: 'asv', name: 'American Standard Version',    short: 'ASV',  year: 1901, free: true  },
  { id: 'niv',  name: 'New International Version',   short: 'NIV',  year: 1984, free: false },
  { id: 'nlt',  name: 'New Living Translation',      short: 'NLT',  year: 1996, free: false },
  { id: 'esv',  name: 'English Standard Version',    short: 'ESV',  year: 2001, free: false },
  { id: 'nkjv', name: 'New King James Version',      short: 'NKJV', year: 1982, free: false },
  { id: 'nasb', name: 'New American Standard Bible',  short: 'NASB', year: 1971, free: false },
  { id: 'csb',  name: 'Christian Standard Bible',    short: 'CSB',  year: 2017, free: false },
  { id: 'gnt',  name: 'Good News Translation',       short: 'GNT',  year: 1976, free: false },
]

function loadBibles() {
  // Load language config
  const configPath = path.join(BIBLE_DATA_DIR, 'language_config.json')
  if (fs.existsSync(configPath)) {
    try {
      languageConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    } catch (e) {
      console.warn('⚠️  Could not parse language_config.json:', e.message)
    }
  }

  // Ensure English and Tamil always appear first in config
  if (!languageConfig.find(l => l.key === 'english')) {
    languageConfig.unshift({ key: 'english', native_name: 'English', direction: 'ltr', file: 'english_bible.json' })
  }
  if (!languageConfig.find(l => l.key === 'tamil')) {
    const idx = languageConfig.findIndex(l => l.key === 'english')
    languageConfig.splice(idx + 1, 0, { key: 'tamil', native_name: 'தமிழ்', direction: 'ltr', file: 'tamil_bible.json' })
  }

  // Load English and Tamil eagerly (they are the base languages)
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
    console.log(`📚 ${languageConfig.length} languages available (others lazy-load on first request)`)
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

/** Lazy-load a language Bible on first request. Returns the bible data or null. */
function loadLanguageLazy(lang) {
  if (lang === 'english') return englishBible
  if (lang === 'tamil')   return tamilBible
  if (lazyBibles[lang])   return lazyBibles[lang]

  const config = languageConfig.find(l => l.key === lang)
  if (!config) return null

  const filePath = path.join(BIBLE_DATA_DIR, config.file)
  if (!fs.existsSync(filePath)) return null

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    lazyBibles[lang]  = data
    lazyIndices[lang] = {}
    buildIndex(data, lazyIndices[lang])
    console.log(`📖 Lazy-loaded: ${config.native_name} (${lang})`)
    return data
  } catch (e) {
    console.error(`❌ Failed to lazy-load ${lang}:`, e.message)
    return null
  }
}

function getTamil()   { return tamilBible }
function getEnglish() { return englishBible }

function getVersionCatalog() {
  return VERSION_CATALOG.map(v => ({ ...v, available: !!versionTexts[v.id] }))
}

function getLanguageConfig() {
  return languageConfig.filter(l => {
    if (l.key === 'english' || l.key === 'tamil') return true
    return fs.existsSync(path.join(BIBLE_DATA_DIR, l.file))
  })
}

function getBook(lang, bookRef) {
  if (lang === 'english') {
    const numId = parseInt(bookRef)
    if (!isNaN(numId)) return englishBible?.books.find(b => b.id === numId) || null
    return englishIndex[String(bookRef).toLowerCase()] || null
  }
  if (lang === 'tamil') {
    const numId = parseInt(bookRef)
    if (!isNaN(numId)) return tamilBible?.books.find(b => b.id === numId) || null
    return tamilIndex[String(bookRef).toLowerCase()] || null
  }

  const bible = loadLanguageLazy(lang)
  if (!bible) return null
  const numId = parseInt(bookRef)
  if (!isNaN(numId)) return bible.books.find(b => b.id === numId) || null
  const idx = lazyIndices[lang] || {}
  return idx[String(bookRef).toLowerCase()] || null
}

function getChapter(lang, bookId, chapterNo) {
  const book = getBook(lang, bookId)
  if (!book) return null
  return book.chapters.find(c => c.chapter_no === parseInt(chapterNo)) || null
}

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

  let bibleList
  if (lang === 'both') {
    bibleList = [{ lang: 'english', data: englishBible }, { lang: 'tamil', data: tamilBible }]
  } else if (lang === 'english' || lang === 'tamil') {
    bibleList = [{ lang, data: lang === 'tamil' ? tamilBible : englishBible }]
  } else {
    const data = loadLanguageLazy(lang)
    bibleList = data ? [{ lang, data }] : []
  }

  const texts = versionTexts[version] || null

  for (const { lang: l, data } of bibleList) {
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
  loadBibles,
  getTamil, getEnglish,
  getBook, getChapter, applyVersion,
  searchVerses, getVersionCatalog, getLanguageConfig,
}
