'use client'

import { createContext, useContext, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { setSession, fetchProfile } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
