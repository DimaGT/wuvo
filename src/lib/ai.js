/**
 * Health assessment: uses Next.js API when available, else direct Anthropic + demo fallback.
 */
import { submitAssessment } from '@/api/assess'

const API_AVAILABLE = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_API_URL !== undefined || process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined)

export async function generateHealthAssessment(answers, questions, profile = null) {
  const summary = questions
    .map((q) => {
      const ans = answers[q.id]
      if (!ans) return null
      const ansText = Array.isArray(ans) ? ans.join(', ') : String(ans)
      return `${q.question}\nAnswer: ${ansText}`
    })
    .filter(Boolean)
    .join('\n\n')

  const prompt = `You are the Wuvo AI health assessment engine. A user has completed their initial health intake assessment. Analyze their responses and provide a comprehensive, personalized health optimization report. Use inclusive, gender-neutral language in all insights and recommendations. Do not assume gender, occupation, or medical history.

USER ASSESSMENT RESPONSES:
${summary}

Generate a detailed JSON response with this EXACT structure:
{
  "score": <integer 30-95>,
  "scoreLabel": "<one of: Critical | Suboptimal | Moderate | Good | Optimized>",
  "scoreInsight": "<2-sentence personalized insight about their score>",
  "priorityAreas": [
    { "area": "<area name>", "status": "<Critical|Needs Work|Good|Optimized>", "insight": "<specific insight>" }
  ],
  "labRecommendations": [
    { "panel": "<panel name>", "tests": ["<test1>", "<test2>"], "urgency": "<Recommended|Priority|Essential>", "reason": "<why this matters for them>" }
  ],
  "protocols": [
    { "title": "<protocol name>", "category": "<Hormone|Sleep|Nutrition|Training|Recovery|Supplementation>", "description": "<specific recommendation>", "timeline": "<e.g. Start immediately | Within 30 days>" }
  ],
  "nextStep": {
    "title": "<primary call to action>",
    "description": "<compelling 2-sentence description>",
    "cta": "<button text>"
  }
}

Be specific to their actual answers. Return ONLY the JSON object, no markdown, no explanation.`

  try {
    if (API_AVAILABLE) {
      return await submitAssessment({ answers, questions, profile })
    }
  } catch (e) {
    console.warn('Assessment API unavailable, trying fallback:', e.message)
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.error('Assessment API error:', err)
    return getDemoResult(answers)
  }
}

function getDemoResult(answers) {
  const energyScore = parseInt(answers[2]) || 5
  const symptoms = answers[3] || []
  const baseScore = 45 + energyScore * 3 - symptoms.length * 2
  const score = Math.max(32, Math.min(91, baseScore))
  return {
    score,
    scoreLabel: score < 45 ? 'Suboptimal' : score < 65 ? 'Moderate' : score < 80 ? 'Good' : 'Optimized',
    scoreInsight:
      'Based on your assessment, there are clear opportunities to elevate your health and performance. Our protocols are designed to address your specific patterns.',
    priorityAreas: [
      { area: 'Hormonal Health', status: symptoms.length > 4 ? 'Critical' : 'Needs Work', insight: 'Multiple symptom clusters suggest suboptimal hormone balance.' },
      { area: 'Sleep & Recovery', status: 'Needs Work', insight: 'Recovery quality directly impacts hormone production and performance.' },
      { area: 'Metabolic Function', status: 'Moderate', insight: 'Metabolic markers should be confirmed with lab work.' },
      { area: 'Physical Performance', status: 'Good', insight: 'Your training frequency provides a strong foundation.' },
    ],
    labRecommendations: [
      { panel: 'Comprehensive Hormone Panel', tests: ['Total Testosterone', 'Free Testosterone', 'Estradiol', 'SHBG', 'LH', 'FSH'], urgency: 'Priority', reason: 'Essential baseline for any optimization protocol.' },
      { panel: 'Metabolic Health Panel', tests: ['Lipid Panel', 'Fasting Glucose', 'HbA1c', 'Insulin', 'TSH', 'Free T3/T4'], urgency: 'Recommended', reason: 'Metabolic health underpins every other system.' },
      { panel: 'Micronutrient Assessment', tests: ['Vitamin D', 'Vitamin B12', 'Magnesium RBC', 'Zinc', 'Ferritin'], urgency: 'Recommended', reason: 'Deficiencies are extremely common and severely impact performance.' },
    ],
    protocols: [
      { title: 'Sleep & Recovery Optimization', category: 'Recovery', description: 'Review your sleep, nutrition, and training patterns to identify areas for improvement. Consider connecting a wearable for real-time tracking.', timeline: 'Start immediately' },
      { title: 'Sleep Protocol Stack', category: 'Sleep', description: 'Magnesium glycinate 400mg + L-theanine 200mg before bed. Blackout curtains. No screens 60 min before sleep.', timeline: 'Start immediately' },
      { title: 'Recovery Protocol', category: 'Recovery', description: 'Focus on evidence-based recovery: quality sleep, anti-inflammatory nutrition, and structured deload periods in your training.', timeline: 'After lab results' },
    ],
    nextStep: {
      title: 'Explore Your Results',
      description: 'Your personalized insights and protocols are ready. Review your priority areas, then connect a wearable or upload labs for even more tailored recommendations.',
      cta: 'Explore Your Dashboard',
    },
  }
}
