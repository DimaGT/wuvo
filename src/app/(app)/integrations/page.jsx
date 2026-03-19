'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { WearablePage } from '@/components/pages/WearablePage'

export default function IntegrationsPage() {
  return (
    <ProtectedRoute>
      <WearablePage />
    </ProtectedRoute>
  )
}
