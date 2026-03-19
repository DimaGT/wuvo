import { NextResponse } from 'next/server'
const { buildUserContext, callText, log } = require('../../../server/llm')

export async function POST(request) {
  try {
    const { wearableData, profile } = await request.json()
    const userCtx = buildUserContext(profile, wearableData)
    const system = `You are the Wuvo AI Health Coach — an evidence-based wellness coach. Direct, specific, actionable.
Specialize in: nutrition, exercise, sleep, stress, and recovery for health-conscious individuals.
Do NOT recommend prescription medications or clinical treatments. For medical questions, direct users to a healthcare provider.
Use inclusive, gender-neutral language. Do not assume gender, occupation, or medical history.
Use **bold** for key points. Address the user by name when available.`
    const userMessage = `Daily brief for:\n\nUSER CONTEXT:\n${userCtx}\n\nInclude:\n1. Recovery assessment from wearable data\n2. Training recommendation for today\n3. Top 3 nutrition priorities\n4. Evening optimization tip\n\n3-4 focused paragraphs. Reference actual numbers.`

    const text = await callText({
      endpoint: 'daily-brief',
      system,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 700,
      skipCache: true,
    })

    return NextResponse.json({ message: text })
  } catch (err) {
    log('error', 'daily-brief', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

