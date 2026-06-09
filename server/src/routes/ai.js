const express = require('express')
const router  = express.Router()
const { getChapter } = require('../data/loader')

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL    = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are a helpful Bible assistant for BibleVoice, a Tamil & English Bible app for Indian Christians.

Your role:
- Answer questions about the Bible, Bible stories, characters, and teachings
- Explain Bible verses in simple, clear language that any Indian Christian can understand
- Find relevant Bible verses for any topic or life situation
- Respond in the same language the user writes in — if they write in Tamil (தமிழ்), reply in Tamil; if in English, reply in English
- When citing verses, always mention the reference: "John 3:16 says..." or "யோவான் 3:16 இல் சொல்கிறார்..."
- Keep replies warm, encouraging, and pastoral in tone
- Keep explanations concise (under 200 words unless the user asks for more detail)

Do not speculate beyond Scripture. If unsure, say so honestly.`

function getKey() {
  const k = process.env.GROQ_API_KEY
  return (!k || k === 'your_groq_api_key_here') ? null : k
}

async function groqChat(messages) {
  const key = getKey()
  if (!key) throw new Error('NOT_CONFIGURED')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens: 2500 }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// GET /api/ai/test — debug: shows actual Groq error
router.get('/test', async (req, res) => {
  const key = getKey()
  if (!key) return res.json({ status: 'NO_KEY', message: 'GROQ_API_KEY not set' })
  try {
    const result = await groqChat([{ role: 'user', content: 'Say "OK" in one word.' }])
    res.json({ status: 'OK', reply: result })
  } catch (err) {
    res.json({ status: 'ERROR', message: err?.message })
  }
})

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  if (!getKey()) {
    return res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to server/.env — get a free key at console.groq.com' })
  }

  const { message, history = [] } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' })

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
        .filter(h => h.role === 'user' || h.role === 'assistant')
        .map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() },
    ]

    const reply = await groqChat(messages)
    res.json({ reply })
  } catch (err) {
    console.error('AI chat error:', err?.message)
    if (err?.message === 'NOT_CONFIGURED') {
      return res.status(503).json({ error: 'AI not configured. Get a free key at console.groq.com' })
    }
    res.status(500).json({ error: 'AI request failed. Please try again.' })
  }
})

// POST /api/ai/explain
router.post('/explain', async (req, res) => {
  if (!getKey()) {
    return res.status(503).json({ error: 'AI not configured.' })
  }

  const { reference, verseText, lang = 'english' } = req.body
  if (!verseText?.trim()) return res.status(400).json({ error: 'Verse text required' })

  const prompt = lang === 'tamil'
    ? `நீங்கள் ஒரு அன்பான போதகர். "${reference}: ${verseText}" — இந்த வசனத்தை 4 பகுதியில் சுருக்கமாக விளக்குங்கள்:

### 🔊 தனிப்பட்ட செய்தி
"நண்பரே..." என்று தொடங்கி 2-3 வாக்கியத்தில் வசனத்தை அறிமுகப்படுத்துங்கள்.

### 2. முக்கிய வார்த்தை
ஒரு வார்த்தையை எடுத்து எளிய உதாரணத்தால் விளக்குங்கள் (3-4 வாக்கியம்).

### 3. வேத வசனங்கள்
2 தொடர்புடைய வசனங்களை > மேற்கோளாக எழுதுங்கள்.

### 🕯️ ஜெபம்
> ஒரு சுருக்கமான தனிப்பட்ட ஜெபம்.

தமிழில் மட்டும் பதில் அளிக்கவும்.`
    : `You are a warm pastor. For this verse — ${reference}: "${verseText}" — write a brief 4-part devotional in English only:

### 🔊 A Personal Message
Start with "Hey friend," — 2-3 sentences introducing the verse personally.

### 2. Key Word
Pick one word, explain its depth with a simple metaphor (3-4 sentences).

### 3. Cross-References
2 related verses in blockquote format (use >).

### 🕯️ Prayer
> A short personal prayer they can pray right now.

Keep it concise and warm. No AI mention.`

  try {
    const reply = await groqChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ])
    res.json({ explanation: reply })
  } catch (err) {
    console.error('AI explain error:', err?.message)
    res.status(500).json({ error: 'AI request failed. Please try again.' })
  }
})

// POST /api/ai/voice-parse
// body: { text: string }
// Returns: { type:'reference', bookId, chapterNo, verseNo } | { type:'search', query }
router.post('/voice-parse', async (req, res) => {
  if (!getKey()) return res.status(503).json({ error: 'AI not configured.' })

  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Text required' })

  const prompt = `You are a Bible reference parser for a Tamil & English Bible app.

The user said (via voice or text): "${text.trim()}"

Decide what they want and reply with ONLY a valid JSON object — no explanation, no markdown, just JSON.

Rules:
- If they ask for a specific verse or chapter, return: {"type":"reference","bookId":<1-66>,"chapterNo":<number>,"verseNo":<number or null>}
- If they ask about a topic, story, or concept, return: {"type":"search","query":"<clear English search phrase>"}
- For Tamil input, translate the reference to English first

Book ID reference (key ones):
Genesis=1, Exodus=2, Psalms=19, Proverbs=20, Isaiah=23, Matthew=40, Mark=41, Luke=42, John=43, Acts=44, Romans=45, 1Corinthians=46, 2Corinthians=47, Galatians=48, Ephesians=49, Philippians=50, Colossians=51, 1Thessalonians=52, 2Thessalonians=53, 1Timothy=54, 2Timothy=55, Hebrews=58, James=59, 1Peter=60, 1John=62, Revelation=66

Examples:
"John 3:16" → {"type":"reference","bookId":43,"chapterNo":3,"verseNo":16}
"யோவான் மூன்று பதினாறு" → {"type":"reference","bookId":43,"chapterNo":3,"verseNo":16}
"Psalm 23" → {"type":"reference","bookId":19,"chapterNo":23,"verseNo":null}
"the beatitudes" → {"type":"reference","bookId":40,"chapterNo":5,"verseNo":3}
"faith moving mountains" → {"type":"search","query":"faith moving mountains"}
"where Jesus walked on water" → {"type":"reference","bookId":40,"chapterNo":14,"verseNo":25}
"love is patient love is kind" → {"type":"reference","bookId":46,"chapterNo":13,"verseNo":4}
"armor of God" → {"type":"reference","bookId":49,"chapterNo":6,"verseNo":11}
"forgiveness seventy times seven" → {"type":"reference","bookId":40,"chapterNo":18,"verseNo":22}`

  try {
    const raw = await groqChat([{ role: 'user', content: prompt }])
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(422).json({ error: 'Could not parse AI response' })
    const parsed = JSON.parse(jsonMatch[0])
    res.json(parsed)
  } catch (err) {
    console.error('AI voice-parse error:', err?.message)
    res.status(500).json({ error: 'AI parse failed.' })
  }
})

// POST /api/ai/cross-ref
// Returns up to 5 cross-reference verses for a given verse
router.post('/cross-ref', async (req, res) => {
  if (!getKey()) return res.status(503).json({ error: 'AI not configured.' })

  const { reference, verseText, lang = 'english' } = req.body
  if (!reference || !verseText?.trim()) return res.status(400).json({ error: 'Reference and verse text required' })

  const isTamil = lang === 'tamil'

  const prompt = isTamil
    ? `You are a Bible cross-reference tool for a Tamil Christian Bible app. Given a Bible verse, find the 4 most thematically related cross-reference verses.

Verse: ${reference} — "${verseText}"

Reply with ONLY a valid JSON array — no explanation, no markdown:
[
  { "ref": "யோவான் 3:16", "bookId": 43, "chapterNo": 3, "verseNo": 16, "preview": "தேவன், தம்முடைய ஒரேபேறான குமாரனை விசுவாசிக்கிறவன் எவனோ..." },
  ...
]

STRICT rules:
- Give exactly 4 cross-references
- The "ref" field MUST be the Tamil Bible book name with chapter:verse (e.g., "யோவான் 3:16", "ரோமர் 8:28", "சங்கீதம் 23:1")
- The "preview" field MUST be actual Tamil verse text (the real Bible text in Tamil), NOT a single keyword or topic label
- NEVER write just one word like "அன்பு" or "கிருபை" — write the actual verse sentence from Tamil Bible
- Mix Old and New Testament where meaningful
- Choose verses sharing the same theme, keyword, prophecy/fulfillment, or teaching as the given verse
- Use these bookIds: Genesis=1,Exodus=2,Psalms=19,Proverbs=20,Isaiah=23,Jeremiah=24,Matthew=40,Mark=41,Luke=42,John=43,Acts=44,Romans=45,1Corinthians=46,Galatians=48,Ephesians=49,Philippians=50,Hebrews=58,James=59,1Peter=60,1John=62,Revelation=66`
    : `You are a Bible cross-reference tool. Given a Bible verse, find the 4 most thematically related cross-reference verses.

Verse: ${reference} — "${verseText}"

Reply with ONLY a valid JSON array — no explanation, no markdown:
[
  { "ref": "John 3:16", "bookId": 43, "chapterNo": 3, "verseNo": 16, "preview": "For God so loved the world that he gave his only Son..." },
  ...
]

STRICT rules:
- Give exactly 4 cross-references
- The "preview" field MUST be actual verse text (a real quote from the Bible), NOT a single keyword or topic label
- NEVER write just one word like "Grace" or "Love" — write the actual verse sentence
- Mix Old and New Testament where meaningful
- Choose verses sharing the same theme, keyword, prophecy/fulfillment, or teaching as the given verse
- Use these bookIds: Genesis=1,Exodus=2,Psalms=19,Proverbs=20,Isaiah=23,Jeremiah=24,Matthew=40,Mark=41,Luke=42,John=43,Acts=44,Romans=45,1Corinthians=46,Galatians=48,Ephesians=49,Philippians=50,Hebrews=58,James=59,1Peter=60,1John=62,Revelation=66`

  try {
    const raw = await groqChat([{ role: 'user', content: prompt }])
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return res.status(422).json({ error: 'Could not parse response' })
    const refs = JSON.parse(jsonMatch[0])

    // Replace AI-generated previews with actual verse text from Bible data
    const bibleLang = isTamil ? 'tamil' : 'english'
    const verified = refs.map(cr => {
      try {
        const chapter = getChapter(bibleLang, cr.bookId, cr.chapterNo)
        const verse = chapter?.verses.find(v => v.verse_no === cr.verseNo)
        if (verse?.text) return { ...cr, preview: verse.text }
      } catch {}
      return cr
    })

    res.json({ refs: verified })
  } catch (err) {
    console.error('AI cross-ref error:', err?.message)
    res.status(500).json({ error: 'AI request failed.' })
  }
})

module.exports = router
