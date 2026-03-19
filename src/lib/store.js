import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useStore = create((set) => ({
  user: null,
  profile: null,
  session: null,
  authLoading: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      authLoading: false,
    }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) set({ profile: data })
    return data
  },

  assessmentAnswers: {},
  setAssessmentAnswer: (id, value) =>
    set((state) => ({
      assessmentAnswers: { ...state.assessmentAnswers, [id]: value },
    })),
  clearAssessment: () => set({ assessmentAnswers: {} }),

  assessmentResult: null,
  setAssessmentResult: (result) => set({ assessmentResult: result }),
}))
