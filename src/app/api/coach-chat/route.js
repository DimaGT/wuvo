import { NextResponse } from 'next/server'
const { buildUserContext, callText, log } = require('../../../server/llm')

export async function POST(request) {
  try {
    const { messages, wearableData, profile } = await request.json()
    const userCtx = buildUserContext(profile, wearableData)
    const system = `You are the Wuvo AI Health Coach — direct, evidence-based wellness coach for health-conscious individuals.

USER CONTEXT:
${userCtx}

Specialize in: nutrition, exercise, sleep, and recovery optimization.
Do NOT recommend prescription medications or clinical treatments. For medical questions, direct users to a healthcare provider.
Use inclusive, gender-neutral language. Do not assume gender, occupation, or medical history.
Keep responses concise (2-4 paragraphs). Use **bold** for key recommendations.`

    const text = await callText({
      endpoint: 'coach-chat',
      system,
      messages: (messages || []).slice(-10),
      maxTokens: 900,
      skipCache: true,
    })

    return NextResponse.json({ response: text })
  } catch (err) {
    log('error', 'coach-chat', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

