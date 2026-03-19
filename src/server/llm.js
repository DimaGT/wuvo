// Copied and adapted from existing Express server llm.js
// This module is server-only and should never be imported from client components.

/**
 * Wuvo LLM Abstraction Layer  v7.1
 */

let anthropicClient = null
let openaiClient = null
let googleClient = null

function getAnthropic() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    // eslint-disable-next-line global-require
    const Anthropic = require('@anthropic-ai/sdk')
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

function getOpenAI() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    // eslint-disable-next-line global-require
    const OpenAI = require('openai')
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

function getGoogle() {
  if (!googleClient && process.env.GOOGLE_AI_API_KEY) {
    // eslint-disable-next-line global-require
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    googleClient = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  }
  return googleClient
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'
const GOOGLE_MODEL = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-pro'

const MODEL = ANTHROPIC_MODEL
const HEALTH_TEMP = 0.2
const CHAT_TEMP = 0.5
const MAX_RETRIES = 2
const PROVIDER_TIMEOUT = 20000

function getProviderChain() {
  const chain = []
  if (process.env.ANTHROPIC_API_KEY) chain.push('anthropic')
  if (process.env.OPENAI_API_KEY) chain.push('openai')
  if (process.env.GOOGLE_AI_API_KEY) chain.push('google')
  return chain
}

async function callAnthropic({ system, messages, maxTokens, temperature }) {
  const client = getAnthropic()
  if (!client) throw new Error('Anthropic client not configured')

  const r = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    temperature,
    system: system || undefined,
    messages,
  })

  return {
    text: r.content[0]?.text || '',
    usage: { in: r.usage?.input_tokens, out: r.usage?.output_tokens },
  }
}

async function callOpenAI({ system, messages, maxTokens, temperature }) {
  const client = getOpenAI()
  if (!client) throw new Error('OpenAI client not configured')

  const oaiMessages = []
  if (system) oaiMessages.push({ role: 'system', content: system })

  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      oaiMessages.push({ role: msg.role, content: msg.content })
    } else if (Array.isArray(msg.content)) {
      const parts = msg.content.map(part => {
        if (part.type === 'text') return { type: 'text', text: part.text }
        if (part.type === 'image') {
          return {
            type: 'image_url',
            image_url: { url: `data:${part.source.media_type};base64,${part.source.data}` },
          }
        }
        if (part.type === 'document') {
          return {
            type: 'text',
            text: '[PDF document attached — please analyze the content provided in the prompt]',
          }
        }
        return { type: 'text', text: '' }
      })
      oaiMessages.push({ role: msg.role, content: parts })
    }
  }

  const r = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages: oaiMessages,
  })

  return {
    text: r.choices[0]?.message?.content || '',
    usage: { in: r.usage?.prompt_tokens, out: r.usage?.completion_tokens },
  }
}

async function callGoogle({ system, messages, maxTokens, temperature }) {
  const client = getGoogle()
  if (!client) throw new Error('Google AI client not configured')

  const model = client.getGenerativeModel({
    model: GOOGLE_MODEL,
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  })

  const parts = []
  if (system) parts.push({ text: `System: ${system}\n\n` })

  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      parts.push({ text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}` })
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text })
        } else if (part.type === 'image') {
          parts.push({ inlineData: { mimeType: part.source.media_type, data: part.source.data } })
        } else if (part.type === 'document') {
          parts.push({ text: '[PDF document — analyze the content described in the prompt]' })
        }
      }
    }
  }

  const r = await model.generateContent({ contents: [{ parts }] })
  const text = r.response?.text() || ''

  return {
    text,
    usage: { in: null, out: null },
  }
}

const PROVIDERS = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  google: callGoogle,
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ])
}

function log(level, endpoint, msg, meta = {}) {
  const entry = { ts: new Date().toISOString(), level, endpoint, msg, ...meta }
  if (level === 'error') console.error(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

async function callWithFailover({ system, messages, maxTokens, temperature, endpoint }) {
  const chain = getProviderChain()

  if (chain.length === 0) {
    throw new Error('No AI providers configured. Set at least ANTHROPIC_API_KEY in your .env file.')
  }

  let lastErr

  for (const providerName of chain) {
    const providerFn = PROVIDERS[providerName]

    try {
      log('info', endpoint, 'trying_provider', { provider: providerName })

      const result = await withTimeout(
        providerFn({ system, messages, maxTokens, temperature }),
        PROVIDER_TIMEOUT,
      )

      log('info', endpoint, 'provider_responded', {
        provider: providerName,
        isPrimary: providerName === 'anthropic',
        usage: result.usage,
      })

      return { ...result, provider: providerName }
    } catch (err) {
      lastErr = err
      log('warn', endpoint, 'provider_failed', {
        provider: providerName,
        error: err.message,
        willTryNext: chain.indexOf(providerName) < chain.length - 1,
      })
      continue
    }
  }

  log('error', endpoint, 'all_providers_failed', { error: lastErr?.message })
  throw new Error('ALL_PROVIDERS_DOWN')
}

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

function cacheKey(type, payload) {
  return `${type}:${JSON.stringify(payload)}`
}
function getCache(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}
function setCache(key, data) {
  if (cache.size > 100) cache.delete(cache.keys().next().value)
  cache.set(key, { data, ts: Date.now() })
}

function buildUserContext(profile, wearableData) {
  const lines = []

  if (profile) {
    if (profile.full_name) lines.push(`Name: ${profile.full_name}`)
    if (profile.age) lines.push(`Age: ${profile.age}`)
    if (profile.goals) lines.push(`Health goals: ${profile.goals}`)
    if (profile.injuries) lines.push(`Injuries / limitations: ${profile.injuries}`)
    if (profile.subscription) lines.push(`Subscription: ${profile.subscription}`)

    const addons = [
      profile.has_gym_addon && 'gym scanning',
      profile.has_pantry_addon && 'pantry scanning',
      profile.has_coaching_addon && 'coaching + supplements + labs',
      profile.has_np_addon && 'NP wellness plan',
    ].filter(Boolean)
    if (addons.length) lines.push(`Active add-ons: ${addons.join(', ')}`)
  }

  if (wearableData) {
    if (wearableData.recovery_score != null) lines.push(`Recovery: ${wearableData.recovery_score}%`)
    if (wearableData.hrv != null) lines.push(`HRV: ${wearableData.hrv}ms`)
    if (wearableData.rhr != null) lines.push(`Resting HR: ${wearableData.rhr}bpm`)
    if (wearableData.sleep_score != null) lines.push(`Sleep score: ${wearableData.sleep_score}%`)
    if (wearableData.strain != null) lines.push(`Yesterday's strain: ${wearableData.strain}`)
  }

  return lines.length ? lines.join('\n') : 'No profile data available.'
}

const BLOCKED = [
  [/prescri(be|ption|bed)/i, 'prescription language'],
  [/diagnos(e|is|ed)/i, 'diagnosis language'],
  [/medically (necessary|required)/i, 'medical necessity claim'],
  [/\$149/, 'old pricing'],
  [/\$397|\$697|\$1[,.]?297/, 'old pricing'],
]

function validateOutput(text) {
  for (const [pattern, reason] of BLOCKED) {
    if (pattern.test(text)) return { safe: false, reason }
  }
  return { safe: true }
}

function safeParseJSON(text) {
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/s)
  return JSON.parse(match ? match[0] : clean)
}

async function callText({
  endpoint,
  system,
  messages,
  maxTokens = 800,
  temperature = HEALTH_TEMP,
  skipCache = false,
}) {
  const key = cacheKey(endpoint, { system, messages })
  if (!skipCache) {
    const hit = getCache(key)
    if (hit) {
      log('info', endpoint, 'cache_hit')
      return hit
    }
  }

  const t0 = Date.now()

  try {
    const result = await callWithFailover({ system, messages, maxTokens, temperature, endpoint })

    const v = validateOutput(result.text)
    if (!v.safe) {
      log('warn', endpoint, 'output_blocked', { reason: v.reason, provider: result.provider })
      return "I'm not able to provide that specific recommendation. For personalized guidance, please consult a qualified healthcare provider."
    }

    log('info', endpoint, 'done', { ms: Date.now() - t0, provider: result.provider, ...result.usage })
    if (!skipCache) setCache(key, result.text)
    return result.text
  } catch (err) {
    if (err.message === 'ALL_PROVIDERS_DOWN') {
      log('error', endpoint, 'all_providers_down')
      return 'Our AI is experiencing high demand right now. Please try again in a few minutes — your data is safe and nothing was lost.'
    }
    throw err
  }
}

async function callJSON({
  endpoint,
  prompt,
  system,
  imageBase64,
  pdfBase64,
  maxTokens = 1500,
  temperature = HEALTH_TEMP,
  skipCache = false,
}) {
  const canCache = !imageBase64 && !pdfBase64 && !skipCache
  const key = cacheKey(endpoint, { prompt })

  if (canCache) {
    const hit = getCache(key)
    if (hit) {
      log('info', endpoint, 'cache_hit')
      return hit
    }
  }

  const t0 = Date.now()

  let content
  if (imageBase64) {
    content = [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
      { type: 'text', text: prompt },
    ]
  } else if (pdfBase64) {
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
      { type: 'text', text: prompt },
    ]
  } else {
    content = prompt
  }

  let lastErr
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callWithFailover({
        system,
        messages: [{ role: 'user', content }],
        maxTokens,
        temperature,
        endpoint,
      })

      const v = validateOutput(result.text)
      if (!v.safe) {
        log('warn', endpoint, 'blocked_retry', { reason: v.reason, attempt, provider: result.provider })
        const append =
          '\n\nIMPORTANT: Do not include prescription or clinical treatment recommendations, diagnoses, or pricing in your response. Keep the response to evidence-based wellness only.'
        if (typeof content === 'string') {
          content += append
        } else if (Array.isArray(content)) {
          const last = content[content.length - 1]
          if (last.type === 'text') last.text += append
        }
        continue
      }

      const parsed = safeParseJSON(result.text)
      log('info', endpoint, 'done', {
        ms: Date.now() - t0,
        attempt,
        provider: result.provider,
        ...result.usage,
      })
      if (canCache) setCache(key, parsed)
      return parsed
    } catch (err) {
      lastErr = err
      const strictAppend =
        '\n\nYour response must be ONLY the required JSON object—no apologies, no explanation, no markdown, no text before or after the JSON.'
      if (typeof content === 'string') {
        content += strictAppend
      } else if (Array.isArray(content)) {
        const last = content[content.length - 1]
        if (last && last.type === 'text') {
          content = content.slice(0, -1).concat([{ ...last, text: last.text + strictAppend }])
        }
      }
      log('warn', endpoint, 'parse_retry', { attempt, error: err.message })

      if (err.message === 'ALL_PROVIDERS_DOWN') {
        log('error', endpoint, 'all_providers_down')
        return {
          error: true,
          _userMessage:
            'Our AI is experiencing high demand right now. Please try again in a few minutes — your data is safe and nothing was lost.',
        }
      }
    }
  }

  log('error', endpoint, 'failed', { error: lastErr?.message })
  throw new Error(`LLM call failed: ${lastErr?.message}`)
}

const CONFIDENCE_INSTRUCTIONS = `

CRITICAL — ACCURACY REQUIREMENTS:
You must include these fields in your JSON response:

"confidence": "HIGH" | "MEDIUM" | "LOW"
  HIGH   — you have enough user data and are certain this is accurate for this person
  MEDIUM — reasonable recommendation, but some user data is missing or unclear
  LOW    — not enough information to give a reliable, personalized answer

"missing_info": []
  When confidence is MEDIUM or LOW, list what's missing. Examples:
  ["Complete the health assessment", "Upload recent lab results", "Add injury/limitation details", "Connect a wearable device", "Provide more detail about your symptoms"]

Rate HONESTLY. It is better to say you need more information than to guess.
Never rate HIGH unless you have real user data to base your answer on.
If the user profile says "No profile data available" you MUST rate LOW.`

const MEDIUM_DISCLAIMER =
  '⚠️ Based on limited information — verify with your healthcare provider before making changes.'

const LOW_REFUSAL_BASE =
  'I want to give you an accurate, personalized answer — but I need more information first.'

function buildLowRefusal(missingInfo) {
  const items =
    Array.isArray(missingInfo) && missingInfo.length > 0
      ? missingInfo
      : ['Complete your health assessment', 'Add more detail about your goals or concerns']

  return {
    error: false,
    refused: true,
    confidence: 'LOW',
    message: LOW_REFUSAL_BASE,
    action_needed: items,
    _userMessage: `${LOW_REFUSAL_BASE}\n\nTo get a personalized recommendation, try:\n${items
      .map(i => `  • ${i}`)
      .join('\n')}\n\nOnce I have this, I can give you something you can actually trust.`,
  }
}

async function callWithConfidence(options) {
  const result = await callJSON({
    ...options,
    prompt: options.prompt + CONFIDENCE_INSTRUCTIONS,
  })

  if (result?.error) return result

  const confidence = (result?.confidence || 'LOW').toUpperCase()

  if (confidence === 'HIGH') {
    log('info', options.endpoint, 'confidence_high')
    return result
  }

  if (confidence === 'MEDIUM') {
    result._disclaimer = MEDIUM_DISCLAIMER
    result._missingInfo = result.missing_info || []
    log('info', options.endpoint, 'confidence_medium', { missing: result._missingInfo })
    return result
  }

  log('warn', options.endpoint, 'confidence_low_refused', { missing: result?.missing_info })
  return buildLowRefusal(result?.missing_info)
}

module.exports = {
  MODEL,
  HEALTH_TEMP,
  CHAT_TEMP,
  buildUserContext,
  validateOutput,
  callText,
  callJSON,
  callWithConfidence,
  log,
  getProviderChain,
}

