import { api } from '@/lib/api'

export function getDailyBrief({ userId, wearableData, profile }) {
  return api.post('/api/daily-brief', {
    wearableData,
    profile,
  })
}

export function coachChat({ messages, userId, wearableData, profile }) {
  return api.post('/api/coach-chat', {
    messages,
    wearableData,
    profile,
  })
}
