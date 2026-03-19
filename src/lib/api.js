/** Client API — uses same-origin /api when NEXT_PUBLIC_API_URL is unset (Next.js app). */
const API_BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '') : ''

async function request(path, options = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  let data
  const text = await res.text().catch(() => '')
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed with status ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  get(path) {
    return request(path, { method: 'GET' })
  },
  post(path, body) {
    return request(path, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    })
  },
}
