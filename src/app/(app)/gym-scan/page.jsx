'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { WorkoutGenerator } from '@/components/pages/WorkoutGenerator'

export default function GymScanPage() {
  return (
    <ProtectedRoute>
      <WorkoutGenerator />
    </ProtectedRoute>
  )
}
