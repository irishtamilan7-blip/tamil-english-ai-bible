const express = require('express')
const router = express.Router()
const { getTamil, getEnglish } = require('../data/loader')

router.get('/', (req, res) => {
  const tamil = getTamil()
  const english = getEnglish()
  res.json({
    status: 'ok',
    bible_tamil_loaded: !!tamil,
    bible_english_loaded: !!english,
    tamil_books: tamil?.books?.length ?? 0,
    english_books: english?.books?.length ?? 0,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

module.exports = router
