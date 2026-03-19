/**
 * SendGrid email helper for Next.js API routes.
 */
async function sendEmail(to, subject, html) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[EMAIL SKIPPED] ${to} | ${subject}`)
    return
  }
  const ok = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'hello@wuvo.ai',
        name: 'Wuvo',
      },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  }).then((r) => r.ok)
  return ok
}

module.exports = { sendEmail }
