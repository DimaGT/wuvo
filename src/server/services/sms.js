/**
 * Twilio SMS helper for Next.js API routes.
 */
function sendSMS(to, body) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[SMS SKIPPED] ${to} | ${body.slice(0, 60)}`)
    return
  }
  const twilio = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  return twilio.messages.create({
    body,
    from: process.env.TWILIO_PHONE,
    to,
  })
}

module.exports = { sendSMS }
