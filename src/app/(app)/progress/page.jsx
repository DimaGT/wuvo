'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ProgressPage } from '@/components/pages/ProgressPage'

export default function ProgressRoutePage() {
  return (
    <ProtectedRoute>
      <ProgressPage />
    </ProtectedRoute>
  )
}
