'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LabResults } from '@/components/pages/LabResults'

export default function LabsPage() {
  return (
    <ProtectedRoute>
      <LabResults />
    </ProtectedRoute>
  )
}
