import { NextResponse } from 'next/server'
const { buildUserContext, callWithConfidence, log } = require('../../../server/llm')

export async function POST(request) {
  try {
    const body = await request.json()
    const { answers, questions, profile } = body

    const summary = questions
      .map(q => {
        const ans = answers[q.id]
        if (!ans) return null
        return `${q.question}\nAnswer: ${Array.isArray(ans) ? ans.join(', ') : ans}`
      })
      .filter(Boolean)
      .join('\n\n')

    const userCtx = buildUserContext(profile)
    const prompt = `You are the Wuvo AI health assessment engine. Analyze the user's responses and provide a comprehensive, personalized wellness optimization report.\n\nUSER CONTEXT:\n${userCtx}\n\nUSER RESPONSES:\n${summary}\n\nReturn ONLY valid JSON:\n{"score":<30-95>,"scoreLabel":"<Critical|Suboptimal|Moderate|Good|Optimized>","scoreInsight":"<2-sentence insight>","priorityAreas":[{"area":"<area>","status":"<Critical|Needs Work|Good|Optimized>","insight":"<insight>"}],"labRecommendations":[{"panel":"<panel>","tests":["<test>"],"urgency":"<Recommended|Priority|Essential>","reason":"<reason>"}],"protocols":[{"title":"<title>","category":"<Sleep|Nutrition|Training|Recovery|Supplementation>","description":"<recommendation>","timeline":"<Start immediately|Within 30 days|After labs>"}],"nextStep":{"title":"<title>","description":"<2-sentence>","cta":"Explore Your Dashboard"}}`

    const result = await callWithConfidence({ endpoint: 'assess', prompt, maxTokens: 1500 })
    return NextResponse.json(result)
  } catch (err) {
    log('error', 'assess', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

