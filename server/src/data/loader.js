const fs = require('fs')
const path = require('path')

const BIBLE_DATA_DIR = path.join(__dirname, '../../../bible-data')

let tamilBible = null
let englishBible = null
let tamilIndex = {}
let englishIndex = {}

function loadBibles() {
  const tamilPath = path.join(BIBLE_DATA_DIR, 'tamil_bible.json')
  const englishPath = path.join(BIBLE_DATA_DIR, 'english_bible.json')

  try {
    if (!fs.existsSync(tamilPath)) throw new Error('tamil_bible.json not found')
    if (!fs.existsSync(englishPath)) throw new Error('english_bible.json not found')

    tamilBible = JSON.parse(fs.readFileSync(tamilPath, 'utf8'))
    englishBible = JSON.parse(fs.readFileSync(englishPath, 'utf8'))

    buildIndex(tamilBible, tamilIndex)
    buildIndex(englishBible, englishIndex)

    console.log(`✅ Tamil Bible loaded: ${tamilBible.books.length} books`)
    console.log(`✅ English Bible loaded: ${englishBible.books.length} books`)
    return { tamil: true, english: true }
  } catch (err) {
    console.error('❌ CRITICAL: Bible data load failed:', err.message)
    return { tamil: !!tamilBible, english: !!englishBible, error: err.message }
  }
}

function buildIndex(bible, index) {
  for (const book of bible.books) {
    index[book.id] = book
    // index by english name (lowercase) for search
    index[book.name_english.toLowerCase()] = book
    if (book.aliases_english) {
      for (const alias of book.aliases_english) {
        index[alias.toLowerCase()] = book
      }
    }
  }
}

function getTamil() { return tamilBible }
function getEnglish() { return englishBible }

function getBook(lang, bookRef) {
  const idx = lang === 'tamil' ? tamilIndex : englishIndex
  const key = String(bookRef).toLowerCase()
  // try numeric id first
  const numId = parseInt(bookRef)
  if (!isNaN(numId)) {
    const bible = lang === 'tamil' ? tamilBible : englishBible
    return bible?.books.find(b => b.id === numId) || null
  }
  return idx[key] || null
}

function getChapter(lang, bookId, chapterNo) {
  const book = getBook(lang, bookId)
  if (!book) return null
  const ch = parseInt(chapterNo)
  return book.chapters.find(c => c.chapter_no === ch) || null
}

function searchVerses(query, lang = 'both', testament = 'all') {
  const q = query.toLowerCase().trim()
  const results = []

  const bibles = lang === 'tamil'
    ? [{ lang: 'tamil', data: tamilBible }]
    : lang === 'english'
    ? [{ lang: 'english', data: englishBible }]
    : [{ lang: 'english', data: englishBible }, { lang: 'tamil', data: tamilBible }]

  for (const { lang: l, data } of bibles) {
    if (!data) continue
    for (const book of data.books) {
      if (testament !== 'all' && book.testament !== testament) continue
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          if (verse.text.toLowerCase().includes(q)) {
            results.push({
              lang: l,
              book_id: book.id,
              book_name_english: book.name_english,
              book_name_tamil: book.name_tamil,
              chapter_no: chapter.chapter_no,
              verse_no: verse.verse_no,
              text: verse.text,
            })
          }
        }
      }
    }
  }

  return results
}

module.exports = { loadBibles, getTamil, getEnglish, getBook, getChapter, searchVerses }
