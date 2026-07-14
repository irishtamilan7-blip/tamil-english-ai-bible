const express = require('express')
const router  = express.Router()
const { getTamil, getEnglish, getBook, getChapter, applyVersion, searchVerses, getVersionCatalog, getLanguageConfig } = require('../data/loader')

// GET /api/bible/versions
router.get('/versions', (req, res) => {
  res.json({ versions: getVersionCatalog() })
})

// GET /api/bible/languages — list all available languages
router.get('/languages', (req, res) => {
  res.json({ languages: getLanguageConfig() })
})

// GET /api/bible/books
router.get('/books', (req, res) => {
  const lang = req.query.lang || 'english'
  const base = getEnglish()  // always use English as the canonical book list
  if (!base) return res.status(503).json({ error: 'Bible data not loaded' })

  const books = base.books.map(b => {
    // name_local: the book name in the requested language
    let nameLocal = b.name_english
    if (lang === 'tamil') {
      nameLocal = b.name_tamil || b.name_english
    } else if (lang !== 'english') {
      const langBook = getBook(lang, b.id)
      nameLocal = (langBook && langBook[`name_${lang}`]) || b.name_english
    }
    return {
      id: b.id,
      name_english: b.name_english,
      name_tamil:   b.name_tamil,
      name_local:   nameLocal,
      testament:    b.testament,
      chapter_count: b.chapters.length,
      aliases_english: b.aliases_english,
      aliases_tamil:   b.aliases_tamil,
    }
  })
  res.json({ books, total: books.length })
})

// GET /api/bible/books/:bookId
router.get('/books/:bookId', (req, res) => {
  const lang = req.query.lang || 'english'
  const engBook = getBook('english', req.params.bookId)
  if (!engBook) return res.status(404).json({ error: 'Book not found' })

  let nameLocal = engBook.name_english
  if (lang === 'tamil') {
    nameLocal = engBook.name_tamil || engBook.name_english
  } else if (lang !== 'english') {
    const langBook = getBook(lang, req.params.bookId)
    nameLocal = (langBook && langBook[`name_${lang}`]) || engBook.name_english
  }

  res.json({
    id: engBook.id,
    name_english: engBook.name_english,
    name_tamil:   engBook.name_tamil,
    name_local:   nameLocal,
    testament:    engBook.testament,
    chapter_count: engBook.chapters.length,
    aliases_english: engBook.aliases_english,
    aliases_tamil:   engBook.aliases_tamil,
  })
})

// GET /api/bible/books/:bookId/chapters/:chapterNo?lang=english&bilingual=false&version=bbe
router.get('/books/:bookId/chapters/:chapterNo', (req, res) => {
  const lang    = req.query.lang    || 'english'
  const version = req.query.version || 'bsb'
  const { bookId, chapterNo } = req.params

  // Get the English book for metadata (name, testament)
  const engBook = getBook('english', bookId)
  if (!engBook) return res.status(404).json({ error: 'Book not found' })

  const chapter = getChapter(lang, bookId, chapterNo)
  if (!chapter) {
    return res.status(404).json({
      error: `Chapter not found. This book has ${engBook.chapters.length} chapters.`
    })
  }

  // Apply version overlay for English
  const verses = lang === 'english'
    ? applyVersion(chapter.verses, engBook.id, chapter.chapter_no, version)
    : chapter.verses

  // Bilingual: other language is always English (for non-English primary)
  // For English primary, other lang is Tamil (backward compat)
  let otherVerses = null
  if (req.query.bilingual === 'true') {
    const otherLang    = lang === 'english' ? 'tamil' : 'english'
    const otherChapter = getChapter(otherLang, bookId, chapterNo)
    if (otherChapter) {
      otherVerses = otherLang === 'english'
        ? applyVersion(otherChapter.verses, engBook.id, otherChapter.chapter_no, version)
        : otherChapter.verses
    }
  }

  // book_name_local: name in the requested language
  let bookNameLocal = engBook.name_english
  if (lang === 'tamil') {
    bookNameLocal = engBook.name_tamil || engBook.name_english
  } else if (lang !== 'english') {
    const langBook = getBook(lang, bookId)
    bookNameLocal = (langBook && langBook[`name_${lang}`]) || engBook.name_english
  }

  res.json({
    book_id:           engBook.id,
    book_name_english: engBook.name_english,
    book_name_tamil:   engBook.name_tamil,
    book_name_local:   bookNameLocal,
    chapter_no:        chapter.chapter_no,
    verses,
    other_lang_verses: otherVerses,
    total_verses:      verses.length,
    has_next: parseInt(chapterNo) < engBook.chapters.length,
    has_prev: parseInt(chapterNo) > 1,
  })
})

// GET /api/bible/search?q=love&lang=english&testament=all&version=bbe
router.get('/search', (req, res) => {
  const { q, lang = 'english', testament = 'all', version = 'bbe' } = req.query
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' })
  }

  const results   = searchVerses(q, lang, testament, version)
  const total     = results.length
  const page      = parseInt(req.query.page) || 1
  const limit     = 50
  const paginated = results.slice((page - 1) * limit, page * limit)

  res.json({ query: q, total, page, pages: Math.ceil(total / limit), results: paginated })
})

module.exports = router
