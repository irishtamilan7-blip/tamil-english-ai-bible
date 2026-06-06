const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')

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

let transporter = null
function getTransporter() {
  if (!transporter && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
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

  const t = getTransporter()
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER

  try {
    if (t && adminEmail) {
      // Send to admin
      await t.sendMail({
        from: `BibleVoice <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `[BibleVoice Contact] ${subject || 'General'} — ${name}`,
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      })

      // Auto-reply to user
      await t.sendMail({
        from: `BibleVoice <${process.env.SMTP_USER}>`,
        to: email,
        subject: '[BibleVoice] We received your message',
        text: `Hi ${name},\n\nThank you for contacting BibleVoice. We've received your message and will get back to you soon.\n\nGod bless,\nBibleVoice Team\n\n---\nYour message:\n${message}`,
      })
    }

    console.log(`[Contact] ${email}: ${subject}`)
    res.json({ success: true })
  } catch (err) {
    console.error('[Contact] Email failed:', err.message)
    // Still acknowledge to user
    res.json({ success: true })
  }
})

module.exports = router
