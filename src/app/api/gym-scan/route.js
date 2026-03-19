import { NextResponse } from 'next/server'
const { buildUserContext, callWithConfidence, log } = require('../../../server/llm')
const { getSupabase } = require('../../../server/config')

export async function POST(request) {
  try {
    const { imageBase64, userId } = await request.json()

    let userCtx = ''
    if (userId) {
      const sb = getSupabase()
      if (sb) {
        const { data: p } = await sb.from('profiles').select('*').eq('id', userId).single()
        userCtx = buildUserContext(p)
      }
    }

    const prompt = `Expert trainer for Wuvo. Analyze this gym photo, create workout using ONLY visible equipment.\n\n${
      userCtx ? `USER PROFILE:\n${userCtx}\n` : ''
    }SAFETY: Avoid exercises that aggravate user injuries.\n\nReturn ONLY JSON:\n{"equipment":["<item>"],"workoutPlan":{"name":"<name>","duration":"<dur>","difficulty":"<lvl>","exercises":[{"name":"<ex>","sets":<n>,"reps":"<reps>","rest":"<rest>","notes":"<tips>"}],"tips":["<tip>"]}}`

    const result = await callWithConfidence({
      endpoint: 'gym-scan',
      prompt,
      imageBase64,
      maxTokens: 2000,
    })
    return NextResponse.json(result)
  } catch (err) {
    log('error', 'gym-scan', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

