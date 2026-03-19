'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function ProtectedRoute({ children }) {
  const router = useRouter()
  const { user, authLoading } = useStore()

  useEffect(() => {
    if (authLoading) return
    if (!user) router.replace('/auth')
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <div className="apex-spinner" />
      </div>
    )
  }

  if (!user) return null
  return children
}
