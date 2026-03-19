'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ProfilePage } from '@/components/pages/ProfilePage'

export default function ProfileRoutePage() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  )
}
