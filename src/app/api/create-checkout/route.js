import { NextResponse } from 'next/server'
const { getStripe } = require('../../../server/config')

export async function POST(request) {
  try {
    const { priceId, userId, userEmail, planName, successUrl, cancelUrl } =
      await request.json()

    const s = getStripe()
    if (!s) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const session = await s.checkout.sessions.create({
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, planName },
      subscription_data: { trial_period_days: 7, metadata: { userId, planName } },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

