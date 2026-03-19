import { api } from '@/lib/api'

export function generateWorkout({ goal, equipment, duration, days, fitnessLevel, injuries, userId }) {
  return api.post('/api/generate-workout', {
    goal,
    equipment,
    duration,
    days,
    fitnessLevel,
    injuries,
    userId,
  })
}

export function gymScan({ imageBase64, userId }) {
  return api.post('/api/gym-scan', {
    imageBase64,
    userId,
  })
}
