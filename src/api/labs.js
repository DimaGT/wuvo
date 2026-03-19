import { api } from '@/lib/api'

export function analyzeLabs({ pdfBase64, userId, profile }) {
  return api.post('/api/analyze-labs', {
    pdfBase64,
    userId,
    profile,
  })
}
