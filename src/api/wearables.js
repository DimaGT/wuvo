import { api } from '@/lib/api'

export function whoopCallback({ code, userId }) {
  return api.post('/api/whoop/callback', { code, userId })
}

export function connectOura({ token, userId }) {
  return api.post('/api/oura/connect', { token, userId })
}

export function syncOura({ userId }) {
  return api.post('/api/oura/sync', { userId })
}
