const express = require('express')
const router = express.Router()
const { Resend } = require('resend')

// Simple in-memory rate limit: max 5 per email per day
const rateLimits = new Map()

function checkRateLimit(email) {
  const key = email.toLowerCase()
  const now = Date.now()
  const dayMs = 86400000
  const entry = rateLimits.get(key)
  if (!entry || now - entry.first > dayMs) {
    rateLimits.set(key, { count: 1, first: now })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required' })
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Enter valid email address' })
  }
  if (!message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' })
  }

  if (!checkRateLimit(email)) {
    return res.status(429).json({ error: 'Too many messages. Please try again tomorrow.' })
  }

  console.log(`[Contact] From: ${name} <${email}> | Subject: ${subject} | Message: ${message}`)

  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL

  if (apiKey && adminEmail) {
    const resend = new Resend(apiKey)
    try {
      // Notify admin
      await resend.emails.send({
        from: 'BibleVoice <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `[BibleVoice] ${subject || 'Contact'} — ${name}`,
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      })

      // Auto-reply to user
      await resend.emails.send({
        from: 'BibleVoice <onboarding@resend.dev>',
        to: [email],
        subject: '[BibleVoice] We received your message',
        text: `Hi ${name},\n\nThank you for contacting BibleVoice. We've received your message and will get back to you soon.\n\nGod bless,\nBibleVoice Team\n\n---\nYour message:\n${message}`,
      })
    } catch (err) {
      console.error('[Contact] Resend error:', err.message)
    }
  } else {
    console.warn('[Contact] RESEND_API_KEY or ADMIN_EMAIL not set — email not sent')
  }

  res.json({ success: true })
})

module.exports = router
