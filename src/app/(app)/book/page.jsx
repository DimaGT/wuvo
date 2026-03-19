'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { BookingPage } from '@/components/pages/BookingPage'

export default function BookPage() {
  return (
    <ProtectedRoute>
      <BookingPage />
    </ProtectedRoute>
  )
}
