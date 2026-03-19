import { api } from '@/lib/api'

export function pantryScan({ imageBase64, goals, restrictions, userId }) {
  return api.post('/api/pantry-scan', {
    imageBase64,
    goals,
    restrictions,
    userId,
  })
}
