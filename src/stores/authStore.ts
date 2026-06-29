import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types/database'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (v: boolean) => void
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  hasRole: (role: UserRole) => boolean
  canEdit: () => boolean
  canAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, profile: null })
      },

      fetchProfile: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          if (error) throw error
          set({ profile: data })
        } catch (err) {
          console.error('Error fetching profile:', err)
        }
      },

      hasRole: (role: UserRole) => {
        const { profile } = get()
        if (!profile) return false
        if (profile.role === 'admin') return true
        if (role === 'logistics') return profile.role === 'logistics'
        if (role === 'viewer') return true
        return false
      },

      canEdit: () => {
        const { profile } = get()
        return profile?.role === 'admin' || profile?.role === 'logistics'
      },

      canAdmin: () => {
        const { profile } = get()
        return profile?.role === 'admin'
      }
    }),
    {
      name: 'cratetracker-auth',
      partialize: (state) => ({ profile: state.profile })
    }
  )
)
