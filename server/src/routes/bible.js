const express = require('express')
const router = express.Router()
const { getTamil, getEnglish, getBook, getChapter, searchVerses } = require('../data/loader')

// GET /api/bible/books
router.get('/books', (req, res) => {
  const lang = req.query.lang || 'english'
  const bible = lang === 'tamil' ? getTamil() : getEnglish()
  if (!bible) return res.status(503).json({ error: 'Bible data not loaded' })

  const books = bible.books.map(b => ({
    id: b.id,
    name_english: b.name_english,
    name_tamil: b.name_tamil,
    testament: b.testament,
    chapter_count: b.chapters.length,
    aliases_english: b.aliases_english,
    aliases_tamil: b.aliases_tamil,
  }))
  res.json({ books, total: books.length })
})

// GET /api/bible/books/:bookId
router.get('/books/:bookId', (req, res) => {
  const lang = req.query.lang || 'english'
  const book = getBook(lang, req.params.bookId)
  if (!book) return res.status(404).json({ error: 'Book not found' })

  res.json({
    id: book.id,
    name_english: book.name_english,
    name_tamil: book.name_tamil,
    testament: book.testament,
    chapter_count: book.chapters.length,
    aliases_english: book.aliases_english,
    aliases_tamil: book.aliases_tamil,
  })
})

// GET /api/bible/books/:bookId/chapters/:chapterNo
router.get('/books/:bookId/chapters/:chapterNo', (req, res) => {
  const lang = req.query.lang || 'english'
  const { bookId, chapterNo } = req.params

  const book = getBook(lang, bookId)
  if (!book) return res.status(404).json({ error: 'Book not found' })

  const chapter = getChapter(lang, bookId, chapterNo)
  if (!chapter) {
    return res.status(404).json({
      error: `Chapter not found. This book has ${book.chapters.length} chapters.`
    })
  }

  // bilingual mode: attach other language verses if requested
  let otherVerses = null
  if (req.query.bilingual === 'true') {
    const otherLang = lang === 'tamil' ? 'english' : 'tamil'
    const otherChapter = getChapter(otherLang, bookId, chapterNo)
    if (otherChapter) otherVerses = otherChapter.verses
  }

  res.json({
    book_id: book.id,
    book_name_english: book.name_english,
    book_name_tamil: book.name_tamil,
    chapter_no: chapter.chapter_no,
    verses: chapter.verses,
    other_lang_verses: otherVerses,
    total_verses: chapter.verses.length,
    has_next: parseInt(chapterNo) < book.chapters.length,
    has_prev: parseInt(chapterNo) > 1,
  })
})

// GET /api/bible/search?q=love&lang=english&testament=all
router.get('/search', (req, res) => {
  const { q, lang = 'english', testament = 'all' } = req.query
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' })
  }

  const results = searchVerses(q, lang, testament)
  const total = results.length
  const page = parseInt(req.query.page) || 1
  const limit = 50
  const paginated = results.slice((page - 1) * limit, page * limit)

  res.json({
    query: q,
    total,
    page,
    pages: Math.ceil(total / limit),
    results: paginated,
  })
})

module.exports = router
