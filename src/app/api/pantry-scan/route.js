import { NextResponse } from 'next/server'
const { buildUserContext, callWithConfidence, log } = require('../../../server/llm')
const { getSupabase } = require('../../../server/config')

export async function POST(request) {
  try {
    const { imageBase64, goals, restrictions, userId } = await request.json()

    let userCtx = ''
    if (userId) {
      const sb = getSupabase()
      if (sb) {
        const { data: p } = await sb.from('profiles').select('*').eq('id', userId).single()
        userCtx = buildUserContext(p)
      }
    }

    const prompt = `Precision nutrition expert for Wuvo. Analyze this pantry photo, create meal plan.

CRITICAL: You must respond with ONLY a single JSON object. No text before or after, no "I'm sorry", no explanations. If the image is unclear or contains no food, still return valid JSON with empty arrays and optimization set to a short message like "Image unclear. Please retake a clearer photo of your pantry."

${userCtx ? `USER PROFILE:\n${userCtx}\n` : ''}Goals: ${goals || 'balanced nutrition, high protein'}
Restrictions: ${restrictions || 'none'}

SAFETY: If user has food allergies, NEVER include those foods.

Return ONLY this JSON structure (no markdown, no code block):
{"detectedFoods":["<food>"],"mealPlan":{"meals":[{"name":"<n>","type":"<Breakfast|Lunch|Dinner|Snack>","ingredients":["<item>"],"macros":{"calories":<n>,"protein":"<Xg>","carbs":"<Xg>","fat":"<Xg>"},"prep":"<steps>","prepTime":"<X min>"}],"dailyMacros":{"calories":<n>,"protein":"<Xg>","carbs":"<Xg>","fat":"<Xg>"}},"missingItems":["<item>"],"optimization":"<2-sentence insight>"}`

    const result = await callWithConfidence({
      endpoint: 'pantry-scan',
      prompt,
      imageBase64,
      maxTokens: 2500,
    })

    return NextResponse.json(result)
  } catch (err) {
    log('error', 'pantry-scan', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

