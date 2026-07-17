import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export function useAuth() {
  return useAuthStore()
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isLoading, isAuthenticated, navigate])

  return { isAuthenticated, isLoading }
}

export function useRequirePremium() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login')
      } else if (!profile?.is_premium) {
        navigate('/pricing')
      }
    }
  }, [isLoading, isAuthenticated, profile, navigate])

  return { isPremium: profile?.is_premium, isLoading }
}

export function useRequireAdmin() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login')
      } else if (!['admin', 'super_admin'].includes(profile?.role || '')) {
        navigate('/dashboard')
      }
    }
  }, [isLoading, isAuthenticated, profile, navigate])

  return { isAdmin: ['admin', 'super_admin'].includes(profile?.role || ''), isLoading }
}