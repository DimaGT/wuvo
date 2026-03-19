'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PantryScanner } from '@/components/pages/PantryScanner'

export default function PantryScanPage() {
  return (
    <ProtectedRoute>
      <PantryScanner />
    </ProtectedRoute>
  )
}
