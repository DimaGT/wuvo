import { NextResponse } from 'next/server'
const { sendEmail } = require('../../../../server/services/email')

export async function POST(request) {
  try {
    const { email, firstName, plan } = await request.json()
    const html = `<div style="background:#0a0a0f;color:#f0f0f5;padding:40px 24px;font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:16px"><h1 style="color:#00ffc2;font-size:28px;font-weight:600;letter-spacing:2px;margin-bottom:8px">WUVO</h1><p style="color:#6b6b8a;font-size:13px;margin-bottom:32px">AI-Powered Health Optimization</p><h2 style="font-size:22px;margin-bottom:12px">Welcome, ${firstName || 'there'}</h2><p style="color:#a0a0b8;line-height:1.7;margin-bottom:24px">Your ${plan || 'Wuvo'} membership is active.</p><div style="background:#111118;border:1px solid rgba(0,255,194,0.15);border-radius:12px;padding:20px;margin-bottom:24px"><p style="color:#00ffc2;font-size:12px;letter-spacing:2px;margin-bottom:12px">NEXT STEPS</p><p style="margin:8px 0;color:#a0a0b8">1. Complete your health assessment</p><p style="margin:8px 0;color:#a0a0b8">2. Connect your wearable device</p><p style="margin:8px 0;color:#a0a0b8">3. Chat with your AI coach</p></div><a href="${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000/dashboard'}" style="display:inline-block;background:#00ffc2;color:#0a0a0f;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none">Open Wuvo</a><p style="color:#4a4a5a;font-size:11px;margin-top:32px">Wuvo provides AI-powered wellness insights, not medical advice.</p></div>`
    await sendEmail(email, 'Welcome to Wuvo', html)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

