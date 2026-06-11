const { Router } = require('express')
const router = Router()

router.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy – BibleVoice</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fdf6ec; color: #2d2d2d; line-height: 1.7; }
    header { background: #7b1c1c; color: #fff; padding: 32px 24px; text-align: center; }
    header h1 { font-size: 1.8rem; font-weight: 700; }
    header p { margin-top: 6px; font-size: 0.95rem; opacity: 0.85; }
    main { max-width: 780px; margin: 40px auto; padding: 0 24px 60px; }
    h2 { font-size: 1.15rem; font-weight: 700; color: #7b1c1c; margin: 32px 0 10px; }
    p { margin-bottom: 12px; }
    ul { padding-left: 20px; margin-bottom: 12px; }
    ul li { margin-bottom: 6px; }
    a { color: #7b1c1c; }
    footer { text-align: center; padding: 20px; font-size: 0.85rem; color: #888; border-top: 1px solid #e5d5c0; }
  </style>
</head>
<body>
  <header>
    <h1>BibleVoice</h1>
    <p>Privacy Policy</p>
  </header>
  <main>
    <p><strong>Effective Date:</strong> June 11, 2026</p>
    <p>BibleVoice ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use the BibleVoice mobile application.</p>

    <h2>1. Information We Collect</h2>
    <p>We may collect the following information when you use the app:</p>
    <ul>
      <li><strong>Account information</strong> – name and email address if you contact us or submit a prayer request.</li>
      <li><strong>Usage data</strong> – bookmarks, highlights, notes, and reading progress stored locally on your device.</li>
      <li><strong>Device information</strong> – device type and operating system for compatibility purposes.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To provide and improve the app experience.</li>
      <li>To respond to prayer requests and support messages you send us.</li>
      <li>To generate AI-powered Bible study responses via our AI feature.</li>
    </ul>

    <h2>3. Data Storage</h2>
    <p>Bookmarks, notes, highlights, and reading plans are stored locally on your device. They are not uploaded to our servers unless you explicitly use a sync feature.</p>

    <h2>4. AI Feature</h2>
    <p>When you use the Ask AI feature, your question is sent to our server to generate a response. We do not store your AI queries beyond the current session.</p>

    <h2>5. Text-to-Speech</h2>
    <p>The voice/audio feature uses your device's built-in text-to-speech engine. No audio is recorded or transmitted to our servers.</p>

    <h2>6. Third-Party Services</h2>
    <p>We use the following third-party services:</p>
    <ul>
      <li><strong>OpenAI / AI provider</strong> – for AI-powered Bible study responses. Your queries are subject to their privacy policy.</li>
      <li><strong>Railway</strong> – for server hosting.</li>
    </ul>

    <h2>7. Data Sharing</h2>
    <p>We do not sell, trade, or share your personal information with third parties except as described above or as required by law.</p>

    <h2>8. Children's Privacy</h2>
    <p>BibleVoice is intended for users aged 18 and above. We do not knowingly collect personal information from children under 13.</p>

    <h2>9. Data Deletion</h2>
    <p>You can delete your locally stored data at any time by clearing the app data from your device settings. To request deletion of any data held on our servers, contact us at the email below.</p>

    <h2>10. Security</h2>
    <p>All data transmitted between the app and our servers is encrypted using HTTPS/TLS.</p>

    <h2>11. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the effective date above.</p>

    <h2>12. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy, please contact us at:</p>
    <p><a href="mailto:irishtamilan7@gmail.com">irishtamilan7@gmail.com</a></p>
  </main>
  <footer>
    &copy; 2026 BibleVoice. All rights reserved.
  </footer>
</body>
</html>`)
})

module.exports = router
