import { NextResponse } from 'next/server'
const { buildUserContext, callWithConfidence, log } = require('../../../server/llm')

export async function POST(request) {
  try {
    const { pdfBase64, profile } = await request.json()
    const userCtx = buildUserContext(profile)
    const prompt = `Extract all lab values from this document. Provide wellness-focused interpretation (NOT medical diagnoses).\n\n${
      userCtx ? `USER PROFILE:\n${userCtx}\n` : ''
    }Flag values outside normal ranges. Suggest user discuss with healthcare provider.\n\nReturn ONLY JSON:\n{"panelName":"<name>","testDate":"<YYYY-MM-DD>","results":{"<marker>":<value>},"insight":"<2-3 sentence wellness interpretation>"}`

    const result = await callWithConfidence({
      endpoint: 'analyze-labs',
      prompt,
      pdfBase64,
      maxTokens: 1500,
    })

    return NextResponse.json(result)
  } catch (err) {
    log('error', 'analyze-labs', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

