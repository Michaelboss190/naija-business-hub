import { create } from 'zustand'
import { supabase } from '@/config/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  role: 'free' | 'premium' | 'moderator' | 'admin' | 'super_admin'
  is_premium: boolean
  bio?: string
  headline?: string
  location?: string
  website?: string
  phone?: string
  business_name?: string
  business_type?: string
  skills?: string[]
  notification_preferences?: any
  privacy_settings?: any
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
}

async function checkPremiumStatus(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('status, ends_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .single()
    return !!data
  } catch {
    return false
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  signUp: async (email: string, password: string, username: string) => {
    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        return { success: false, error: 'Username is already taken. Please choose another.' }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: window.location.origin + '/confirm-email',
        },
      })

      if (authError) {
        console.error('Auth error:', authError)
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          return { success: false, error: 'An account with this email already exists.' }
        }
        if (authError.message.includes('password')) {
          return { success: false, error: 'Password does not meet requirements.' }
        }
        if (authError.status === 0 || authError.message.includes('fetch') || authError.message.includes('network')) {
          return { success: false, error: 'Unable to connect to server. Please check your internet connection.' }
        }
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create account. Please try again.' }
      }

      await new Promise(function(resolve) { setTimeout(resolve, 1000) })

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username,
            full_name: username,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }

      set({ user: authData.user })
      return { success: true }
    } catch (error: any) {
      console.error('Signup error:', error)
      return { success: false, error: 'A network error occurred. Please check your connection and try again.' }
    }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password')
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please confirm your email before logging in. Check your inbox and spam folder.')
      }
      if (error.status === 0 || error.message.includes('fetch')) {
        throw new Error('Unable to connect. Please check your internet connection.')
      }
      throw error
    }

    if (!data.user) throw new Error('Login failed')

    set({ user: data.user, isAuthenticated: true })
    await get().loadProfile()
  },

  signOut: async () => {
    try { await supabase.auth.signOut() } catch (error) { console.error('Sign out error:', error) }
    set({ user: null, profile: null, isAuthenticated: false })
  },

  loadProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user_' + user.id.substring(0, 8)
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({ id: user.id, username, full_name: username })
              .select()
              .single()

            if (newProfile) {
              const isPremium = await checkPremiumStatus(user.id)
              set({ user, profile: { ...newProfile, is_premium: isPremium }, isAuthenticated: true, isLoading: false })
              return
            }
          }
          console.error('Profile error:', profileError)
        }

        if (profile) {
          const isPremium = await checkPremiumStatus(user.id)
          set({ user, profile: { ...profile, is_premium: isPremium }, isAuthenticated: true, isLoading: false })
        } else {
          set({ user, isAuthenticated: true, isLoading: false })
        }
      } else {
        set({ isLoading: false, isAuthenticated: false })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      set({ isLoading: false, isAuthenticated: false })
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) throw error
    const currentProfile = get().profile
    if (currentProfile) set({ profile: { ...currentProfile, ...updates } })
  },

  changePassword: async (newPassword: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (!session) {
        return { success: false, error: 'You must be logged in to change your password. Please log out and log back in.' }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        if (error.message.includes('session')) {
          return { success: false, error: 'Your session has expired. Please log in again.' }
        }
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to change password' }
    }
  },
}))