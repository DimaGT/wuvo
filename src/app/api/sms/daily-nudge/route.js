import { NextResponse } from 'next/server'
const { sendSMS } = require('../../../../server/services/sms')

export async function POST(request) {
  try {
    const { phone, firstName, recovery } = await request.json()
    const msg =
      recovery >= 75
        ? `Good morning ${firstName || 'there'}! Recovery ${recovery}% — great day for intensity. wuvo.ai`
        : `Good morning ${firstName || 'there'}. Recovery ${recovery}% — focus on quality. wuvo.ai`

    await sendSMS(phone, msg)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

