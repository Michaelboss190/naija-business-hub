import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import SiteLogo from '@/components/ui/SiteLogo'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')
  const [debugLog, setDebugLog] = useState<string[]>([])

  const addLog = function(msg: string) {
    console.log('[ForgotPassword]', msg)
    setDebugLog(function(prev) { return [...prev, msg] })
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setDebugLog([])
    try {
      const redirectUrl = window.location.origin + '/reset-password'
      addLog('=== FORGOT PASSWORD DEBUG ===')
      addLog('Email: ' + data.email)
      addLog('Redirect URL: ' + redirectUrl)
      addLog('Supabase URL: ' + (import.meta.env.VITE_SUPABASE_URL || 'NOT SET'))
      
      const { data: resetData, error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      })

      addLog('Reset data: ' + JSON.stringify(resetData))
      addLog('Reset error: ' + (error ? JSON.stringify({ message: error.message, status: error.status, name: error.name }) : 'NONE'))

      if (error) {
        addLog('ERROR: ' + error.message)
        // Always show success for security
        setEmailSent(true)
        setSentToEmail(data.email)
        toast.success('If an account exists, a reset link has been sent.')
      } else {
        addLog('SUCCESS: Reset email sent!')
        setEmailSent(true)
        setSentToEmail(data.email)
        toast.success('Password reset link sent! Check your email.')
      }
    } catch (error: any) {
      addLog('EXCEPTION: ' + error.message)
      setEmailSent(true)
      setSentToEmail(data.email)
      toast.success('If an account exists, a reset link has been sent.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!sentToEmail) return
    setIsLoading(true)
    setDebugLog([])
    addLog('=== RESEND DEBUG ===')
    addLog('Email: ' + sentToEmail)
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(sentToEmail, {
        redirectTo: window.location.origin + '/reset-password',
      })
      addLog('Resend data: ' + JSON.stringify(data))
      addLog('Resend error: ' + (error ? error.message : 'NONE'))
      if (error) throw error
      toast.success('Reset link resent! Check your email.')
    } catch (error: any) {
      addLog('Resend error: ' + error.message)
      toast.error(error.message || 'Failed to resend')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="font-display font-bold text-2xl text-gray-900 dark:text-gray-100">
              NaijaBizHub
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
            {emailSent ? 'Check your email' : 'Forgot password?'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {emailSent
              ? 'We sent a password reset link to ' + sentToEmail
              : 'Enter your email and we\'ll send you a reset link'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-8 shadow-sm">
          {!emailSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Send Reset Link
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Check Your Email
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-semibold mb-4">
                {sentToEmail}
              </p>

              <div className="text-left bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Didn't receive the email?
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>Check your spam/junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes - emails can be delayed</li>
                  <li>The link expires after 60 minutes</li>
                  <li>Free tier limit: 4 emails per hour</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  isLoading={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Resend Reset Link
                </Button>

                <Button
                  onClick={function() { setEmailSent(false); setDebugLog([]) }}
                  variant="ghost"
                  className="w-full"
                >
                  Try a different email
                </Button>
              </div>

              {/* Debug Log */}
              {debugLog.length > 0 && (
                <div className="mt-4 bg-gray-100 dark:bg-dark-700 rounded-lg p-3 text-left text-xs font-mono max-h-32 overflow-y-auto">
                  {debugLog.map(function(msg, i) {
                    return <div key={i} className="text-gray-600 dark:text-gray-400 py-0.5">{msg}</div>
                  })}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  Back to sign in
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}