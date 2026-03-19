import { NextResponse } from 'next/server'
const { buildUserContext, callWithConfidence, log } = require('../../../server/llm')

export async function POST(request) {
  try {
    const { profile, assessmentResult, labResults } = await request.json()
    const userCtx = buildUserContext(profile)
    const prompt = `Wuvo supplement intelligence. Recommend evidence-based supplement stack.\n\nUSER:\n${userCtx}\n\nASSESSMENT: ${
      assessmentResult ? JSON.stringify(assessmentResult) : 'Not completed'
    }\nLABS: ${
      labResults ? JSON.stringify(labResults) : 'Not uploaded'
    }\n\nRULES: Only recommend supplements with strong clinical evidence. Include dosage, timing, reason. Flag interactions. Do NOT recommend prescription medications.\n\nReturn ONLY JSON:\n{"stack":[{"name":"<supplement>","dosage":"<amount>","timing":"<when>","reason":"<why>","evidence":"<brief>"}],"interactions":["<warnings>"],"disclaimer":"Consult your healthcare provider before starting any supplement regimen."}`

    const result = await callWithConfidence({
      endpoint: 'supplement-recommendation',
      prompt,
      maxTokens: 1500,
    })

    return NextResponse.json(result)
  } catch (err) {
    log('error', 'supplement-recommendation', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

