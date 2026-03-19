import { api } from '@/lib/api'

export function bookConsultation({ userId, userEmail, npName, consultationType, slot, notes, bookingRef }) {
  return api.post('/api/book-consultation', {
    userId,
    userEmail,
    npName,
    consultationType,
    slot,
    notes,
    bookingRef,
  })
}
