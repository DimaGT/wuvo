import { NextResponse } from 'next/server'
const { getStripe, getSupabase } = require('../../../server/config')
const { log } = require('../../../server/llm')

export async function POST(request) {
  const s = getStripe()
  if (!s) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let event
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    event = s.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (['customer.subscription.created', 'customer.subscription.updated'].includes(event.type)) {
    const sub = event.data.object
    const userId = sub.metadata?.userId
    if (userId) {
      const sb = getSupabase()
      if (sb) {
        const plan = sub.metadata?.planName || ''
        const u = {}
        if (plan === 'base' || plan === 'base_annual') u.subscription = plan
        if (plan === 'gym') u.has_gym_addon = true
        if (plan === 'pantry') u.has_pantry_addon = true
        if (plan === 'coaching') u.has_coaching_addon = true
        if (plan === 'np') u.has_np_addon = true
        if (Object.keys(u).length) {
          await sb.from('profiles').update(u).eq('id', userId)
          log('info', 'stripe-webhook', 'updated', { userId, u })
        }
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const userId = event.data.object.metadata?.userId
    if (userId) {
      const sb = getSupabase()
      if (sb) {
        await sb
          .from('profiles')
          .update({
            subscription: 'free',
            has_gym_addon: false,
            has_pantry_addon: false,
            has_coaching_addon: false,
            has_np_addon: false,
          })
          .eq('id', userId)
      }
    }
  }

  return NextResponse.json({ received: true })
}

