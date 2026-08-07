const express = require('express')
const router = express.Router()
const multer = require('multer')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')

const tmpDir = '/tmp/bv-audio/'
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
const upload = multer({ dest: tmpDir })

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
      response_format: 'verbose_json',
      // No language lock — Whisper auto-detects any of 100+ languages
    })
    res.json({ text: transcription.text, language: transcription.language })
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
          content: `You are a Bible reference parser supporting 57 languages including Tamil, Hindi, Malayalam, Telugu, Kannada, Marathi, Gujarati, Bengali, Assamese, Oriya, Nepali, Urdu, Swahili, Shona, French, Spanish, Portuguese, German, Chinese, Japanese, Korean, Arabic, and more. The speaker may mispronounce, use phonetic spelling, mix languages, or speak with a non-native accent.

Extract the Bible book, chapter, and verse from: '${text}'

Examples:
- "Yovaan moonru pathinaaru" → John 3:16
- "யோவான் மூன்று பதினாறு" → John 3:16
- "Zaburi ishirini na tatu" (Swahili) → Psalm 23
- "the verse about love is patient" → 1 Corinthians 13:4
- "armor of god" → Ephesians 6:11

Return ONLY valid JSON: {"book_name_english": "...", "chapter_no": 1, "verse_no": null, "confidence_score": 0.95}
If verse not mentioned set verse_no: null. If unsure set confidence_score below 0.5.`,
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
