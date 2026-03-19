'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CoachingPage } from '@/components/pages/CoachingPage'

export default function CoachPage() {
  return (
    <ProtectedRoute>
      <CoachingPage />
    </ProtectedRoute>
  )
}
