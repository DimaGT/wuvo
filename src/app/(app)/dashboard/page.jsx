'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Dashboard } from '@/components/pages/Dashboard'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
