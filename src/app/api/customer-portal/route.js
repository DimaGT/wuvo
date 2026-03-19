import { NextResponse } from 'next/server'
const { getStripe } = require('../../../server/config')

export async function POST(request) {
  try {
    const { customerId, returnUrl } = await request.json()

    const s = getStripe()
    if (!s) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const session = await s.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

