const express = require('express')
const router = express.Router()
const multer = require('multer')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')

const upload = multer({ dest: '/tmp/bv-audio/' })

// Lazy init OpenAI client
let openai = null
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openai
}

// POST /api/voice/transcribe — audio → text via Whisper
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' })

  const client = getOpenAI()
  if (!client) {
    fs.unlinkSync(req.file.path)
    return res.status(503).json({ error: 'OpenAI API key not configured' })
  }

  try {
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: 'en', // handles both Tamil and English
    })
    res.json({ text: transcription.text })
  } catch (err) {
    res.status(500).json({ error: 'Transcription failed', detail: err.message })
  } finally {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
  }
})

// POST /api/voice/parse — text → {book, chapter, verse}
router.post('/parse', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  const client = getOpenAI()
  if (!client) {
    return res.status(503).json({ error: 'OpenAI API key not configured' })
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `You are a Bible reference parser. Extract the book name, chapter number, and verse number from this text (which may be in Tamil, English, or mixed): '${text}'
Return ONLY valid JSON: {"book_name_english": "...", "chapter_no": 1, "verse_no": null, "confidence_score": 0.0}
If verse not mentioned, return verse_no: null.
If unsure, return top_matches: [{"book_name_english": "...", "chapter_no": 1, "verse_no": null, "confidence": 0.0}] with confidence_score: 0.0`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })

    const result = JSON.parse(completion.choices[0].message.content)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Parsing failed', detail: err.message })
  }
})

module.exports = router
