# BibleVoice — விவிலியம்
> Hear the Word. Find it in a Fraction of a Second.

Tamil & English Bible PWA with voice search powered by OpenAI Whisper.

## Quick Start

### Server
```bash
cd server
cp .env.example .env   # fill in your keys
npm install
npm run dev            # runs on port 5000
```

### Client
```bash
cd client
npm install
npm run dev            # runs on port 3000
```

Open http://localhost:3000

## Features (Spec F-001 to F-015)
- ✅ F-001: Project setup + Bible data (KJV + Tamil, 31,100 verses)
- ✅ F-003: Bible reader with bilingual mode
- ✅ F-005: Instant search
- ✅ F-015: Home screen + navigation
- 🔲 F-002: Voice listener (needs OpenAI key in .env)
- 🔲 F-006/7/8: Bookmarks / Highlights / Notes (coming)
- 🔲 F-011: Characters encyclopedia (coming)
- 🔲 F-012: Bible quiz (coming)

## Environment Variables
See `server/.env.example` for all required keys.

## API
- `GET /health` — server status
- `GET /api/bible/books` — all 66 books
- `GET /api/bible/books/:id/chapters/:no` — chapter verses
- `GET /api/bible/search?q=love` — keyword search
- `POST /api/voice/transcribe` — audio → text (Whisper)
- `POST /api/voice/parse` — text → Bible reference (GPT-4o-mini)

## Bible Data
- English: KJV (31,100 verses)
- Tamil: Tamil Bible Society (31,096 verses)
- Stored locally in `/bible-data/` — works fully offline
