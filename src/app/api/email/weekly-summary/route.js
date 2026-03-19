import { NextResponse } from 'next/server'
const { sendEmail } = require('../../../../server/services/email')

export async function POST(request) {
  try {
    const { email, firstName, stats } = await request.json()
    const statsHtml =
      stats?.map(
        s =>
          `<div style="background:#111118;border-radius:10px;padding:16px;display:flex;justify-content:space-between"><span style="color:#a0a0b8">${s.label}</span><span style="color:#00ffc2;font-weight:600">${s.value}</span></div>`,
      ).join('') || '<p style="color:#6b6b8a">Log progress to see stats.</p>'
    const html = `<div style="background:#0a0a0f;color:#f0f0f5;padding:40px 24px;font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:16px"><h1 style="color:#00ffc2;font-size:24px;letter-spacing:2px;margin-bottom:24px">WUVO</h1><h2 style="font-size:20px;margin-bottom:8px">Weekly Summary, ${
      firstName || 'there'
    }</h2><div style="display:grid;gap:12px;margin-bottom:24px">${statsHtml}</div><a href="${
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000/progress'
    }" style="display:inline-block;background:#00ffc2;color:#0a0a0f;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none">View Progress</a></div>`
    await sendEmail(email, 'Your Weekly Wuvo Summary', html)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

