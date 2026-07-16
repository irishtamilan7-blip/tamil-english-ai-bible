const express = require('express')
const router  = express.Router()

// BCP-47 → Google Translate language code
const LANG_MAP = {
  'ta-IN': 'ta', 'ml-IN': 'ml', 'hi-IN': 'hi', 'te-IN': 'te',
  'kn-IN': 'kn', 'mr-IN': 'mr', 'en-IN': 'en', 'en-US': 'en',
  'ko-KR': 'ko', 'ja-JP': 'ja', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW',
  'ar-SA': 'ar', 'he-IL': 'iw', 'el-GR': 'el',
  'es-ES': 'es', 'fr-FR': 'fr', 'de-DE': 'de', 'pt-BR': 'pt',
  'ru-RU': 'ru', 'it-IT': 'it', 'nl-NL': 'nl', 'sv-SE': 'sv',
  'tr-TR': 'tr', 'vi-VN': 'vi', 'th-TH': 'th', 'id-ID': 'id',
}

// Simple in-memory cache — same verse + language always produces same audio
const audioCache = new Map()

function splitIntoChunks(text, maxLen = 150) {
  const words = text.split(' ')
  const chunks = []
  let current = ''
  for (const word of words) {
    if (current.length + word.length + 1 > maxLen) {
      if (current) chunks.push(current.trim())
      current = word
    } else {
      current += (current ? ' ' : '') + word
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length ? chunks : [text.slice(0, maxLen)]
}

// GET /api/tts/speak?text=...&lang=ml-IN
router.get('/speak', async (req, res) => {
  const { text, lang } = req.query
  if (!text || !lang) return res.status(400).json({ error: 'text and lang required' })

  const cacheKey = `${lang}::${text}`
  if (audioCache.has(cacheKey)) {
    const cached = audioCache.get(cacheKey)
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.end(cached)
  }

  const googleLang = LANG_MAP[lang] || lang.split('-')[0]
  const chunks = splitIntoChunks(String(text))

  const buffers = []
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${googleLang}&client=tw-ob`
    try {
      const gRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          'Referer': 'https://translate.google.com/',
        },
      })
      if (!gRes.ok) continue
      buffers.push(Buffer.from(await gRes.arrayBuffer()))
    } catch { /* skip chunk on error */ }
  }

  if (!buffers.length) return res.status(502).json({ error: 'TTS unavailable' })

  const combined = Buffer.concat(buffers)
  if (audioCache.size > 2000) audioCache.clear() // prevent unbounded growth
  audioCache.set(cacheKey, combined)

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.end(combined)
})

module.exports = router
