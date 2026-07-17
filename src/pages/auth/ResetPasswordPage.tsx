import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import SiteLogo from '@/components/ui/SiteLogo'
import toast from 'react-hot-toast'

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(function(data) { return data.password === data.confirmPassword }, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasAccessToken, setHasAccessToken] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password', '')

  const getPasswordStrength = function(pwd: string) {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-600']

  const addDebug = function(msg: string) {
    console.log('[ResetPassword]', msg)
    setDebugInfo(function(prev) { return [...prev, msg] })
  }

  useEffect(function() {
    let isMounted = true

    const checkSession = async () => {
      try {
        addDebug('=== RESET PASSWORD DEBUG ===')
        addDebug('Full URL: ' + window.location.href)
        addDebug('Pathname: ' + window.location.pathname)
        addDebug('Hash: ' + (window.location.hash || '(empty)'))
        addDebug('Search: ' + (window.location.search || '(empty)'))

        // Parse hash manually
        const hash = window.location.hash
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1))
          addDebug('access_token present: ' + (hashParams.get('access_token') ? 'YES' : 'NO'))
          addDebug('refresh_token present: ' + (hashParams.get('refresh_token') ? 'YES' : 'NO'))
          addDebug('type: ' + (hashParams.get('type') || 'MISSING'))
          addDebug('token_hash: ' + (hashParams.get('token_hash') || 'MISSING'))
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async function(event, session) {
          addDebug('Auth event: ' + event)
          addDebug('Session: ' + (session ? 'YES (user: ' + session.user?.email + ')' : 'NO'))

          if (session && isMounted) {
            setHasAccessToken(true)
            setIsChecking(false)
          }
        })

        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        addDebug('Initial session: ' + (session ? 'YES (user: ' + session.user?.email + ')' : 'NO'))
        if (sessionError) addDebug('Session error: ' + sessionError.message)

        if (session && isMounted) {
          setHasAccessToken(true)
          setIsChecking(false)
          return
        }

        // If hash has access_token but no session, try manual setSession
        const hasAccessTokenInHash = hash.includes('access_token')
        if (hasAccessTokenInHash && !session && isMounted) {
          addDebug('Hash has token but no session. Trying manual setSession...')
          
          try {
            const hashParams = new URLSearchParams(hash.substring(1))
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')

            if (accessToken && refreshToken) {
              const { data: setData, error: setError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              })
              addDebug('setSession result: ' + (setData.session ? 'SUCCESS' : 'FAILED'))
              if (setError) addDebug('setSession error: ' + setError.message)

              if (setData.session && isMounted) {
                setHasAccessToken(true)
                setIsChecking(false)
                return
              }
            }
          } catch (err) {
            addDebug('Manual setSession error: ' + (err as Error).message)
          }

          // Wait and retry
          addDebug('Waiting 3 seconds and retrying...')
          await new Promise(function(resolve) { setTimeout(resolve, 3000) })

          const { data: { session: retrySession } } = await supabase.auth.getSession()
          addDebug('Retry session: ' + (retrySession ? 'YES' : 'NO'))

          if (retrySession && isMounted) {
            setHasAccessToken(true)
          } else if (isMounted) {
            addDebug('FAILED: Could not verify reset link')
            setErrorMessage('Could not verify reset link. The token may be invalid or expired.')
          }
        } else if (!hasAccessTokenInHash && isMounted) {
          addDebug('No access token in URL hash')
          setErrorMessage('No reset token found in the URL. Please use the link from your email.')
        }

        if (isMounted) setIsChecking(false)

        return function() {
          subscription.unsubscribe()
        }
      } catch (err) {
        addDebug('ERROR: ' + (err as Error).message)
        if (isMounted) {
          setErrorMessage('An error occurred: ' + (err as Error).message)
          setIsChecking(false)
        }
      }
    }

    checkSession()

    return function() {
      isMounted = false
    }
  }, [])

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    try {
      addDebug('Updating password...')
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error

      addDebug('Password updated. Signing out...')
      await supabase.auth.signOut()

      setPasswordChanged(true)
      toast.success('Password updated! Please login with your new password.')
      setTimeout(function() { navigate('/login') }, 3000)
    } catch (error: any) {
      addDebug('Password update error: ' + error.message)
      if (error.message.includes('session') || error.message.includes('Auth session missing')) {
        toast.error('Reset link has expired. Please request a new one.')
        setHasAccessToken(false)
      } else {
        toast.error(error.message || 'Failed to update password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Verifying your reset link...</p>
          <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4 text-left text-xs font-mono max-h-48 overflow-y-auto">
            {debugInfo.map(function(msg, i) {
              return <div key={i} className="text-gray-600 dark:text-gray-400 py-0.5">{msg}</div>
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-md w-full space-y-8">
        <div className="text-center">
          <SiteLogo size="lg" />
          <h2 className="mt-6 text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
            {passwordChanged ? 'Password Updated!' : 'Reset your password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {passwordChanged ? 'Your password has been changed.' : 'Enter your new password below'}
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-8 shadow-sm">
          {!hasAccessToken && !passwordChanged ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-6">
                <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invalid or Expired Link</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage || 'This password reset link is invalid or has expired.'}</p>
              <div className="space-y-3">
                <Link to="/forgot-password"><Button className="w-full">Request New Reset Link</Button></Link>
                <Link to="/login"><Button variant="outline" className="w-full">Back to Login</Button></Link>
              </div>
              <div className="mt-4 bg-gray-100 dark:bg-dark-700 rounded-lg p-4 text-left text-xs font-mono max-h-32 overflow-y-auto">
                {debugInfo.map(function(msg, i) {
                  return <div key={i} className="text-gray-600 dark:text-gray-400 py-0.5">{msg}</div>
                })}
              </div>
            </motion.div>
          ) : passwordChanged ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Password Updated!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Please login with your new password.</p>
              <Link to="/login"><Button className="w-full">Go to Login</Button></Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <input type="password" autoComplete="new-password" {...register('password')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500" placeholder="Enter new password" />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                {password.length > 0 && (
                  <div className="mt-3">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(function(level) {
                        return <div key={level} className={`h-1.5 flex-1 rounded-full ${level <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200 dark:bg-dark-600'}`} />
                      })}
                    </div>
                    <p className={`text-xs ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>{strengthLabels[passwordStrength - 1] || ''}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                <input type="password" autoComplete="new-password" {...register('confirmPassword')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500" placeholder="Confirm new password" />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">Update Password</Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}