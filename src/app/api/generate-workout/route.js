import { NextResponse } from 'next/server'
const { buildUserContext, callWithConfidence, log } = require('../../../server/llm')
const { getSupabase } = require('../../../server/config')

export async function POST(request) {
  try {
    const { goal, equipment, duration, days, fitnessLevel, injuries, userId } = await request.json()

    let userCtx = ''
    if (userId) {
      const sb = getSupabase()
      if (sb) {
        const { data: p } = await sb.from('profiles').select('*').eq('id', userId).single()
        userCtx = buildUserContext(p)
      }
    }

    const prompt = `Expert personal trainer for Wuvo. Create a safe, effective workout.\n\n${
      userCtx ? `USER PROFILE:\n${userCtx}\n` : ''
    }PARAMETERS:\n- Goal: ${goal}\n- Equipment: ${equipment}\n- Duration: ${duration}\n- Frequency: ${days} days/week\n- Level: ${fitnessLevel}\n- Injuries: ${
      injuries || 'None'
    }\n\nSAFETY: If user has injuries, NEVER include exercises that aggravate them.\n\nReturn ONLY JSON:\n{"name":"<name>","duration":"${duration}","difficulty":"${fitnessLevel}","exercises":[{"name":"<ex>","sets":<n>,"reps":"<reps>","rest":"<rest>","notes":"<tips>"}],"tips":["<tip>"]}`

    const result = await callWithConfidence({ endpoint: 'generate-workout', prompt, maxTokens: 2000 })
    return NextResponse.json(result)
  } catch (err) {
    log('error', 'generate-workout', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

