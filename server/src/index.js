require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { loadBibles } = require('./data/loader')

const app = express()
let PORT = parseInt(process.env.PORT) || 5000

// Middleware
app.use(cors({
  origin: true, // allow all origins (Capacitor iOS uses capacitor:// scheme)
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/health', require('./routes/health'))
app.use('/api/bible', require('./routes/bible'))
app.use('/api/voice', require('./routes/voice'))
app.use('/api/contact', require('./routes/contact'))
app.use('/api/ai', require('./routes/ai'))

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Start
function start(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`\n🟢 BibleVoice Server running on port ${port}`)
    console.log(`   Health: http://localhost:${port}/health`)
    console.log(`   Bible:  http://localhost:${port}/api/bible/books\n`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} busy — trying ${port + 1}`)
      start(port + 1)
    } else {
      throw err
    }
  })
}

// Load Bible data then start server
const loaded = loadBibles()
if (!loaded.tamil && !loaded.english) {
  console.error('❌ CRITICAL: No Bible data loaded. Check /bible-data/ folder.')
}
start(PORT)

module.exports = app
