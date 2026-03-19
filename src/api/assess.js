import { api } from '@/lib/api'

export function submitAssessment({ answers, questions, profile }) {
  return api.post('/api/assess', {
    answers,
    questions,
    profile,
  })
}
