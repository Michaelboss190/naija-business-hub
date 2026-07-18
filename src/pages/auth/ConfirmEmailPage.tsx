import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import SiteLogo from '@/components/ui/SiteLogo'
import toast from 'react-hot-toast'

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Checking your email status...')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(function() {
    if (!hasChecked) {
      handleEmailConfirmation()
      setHasChecked(true)
    }
  }, [hasChecked])

  const handleEmailConfirmation = async () => {
    try {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const emailFromUrl = searchParams.get('email')

      // If we have a token, verify it
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        })

        if (error) {
          console.error('Verification error:', error)
          if (error.message.includes('expired')) {
            setStatus('error')
            setMessage('This confirmation link has expired. Please request a new one.')
          } else if (error.message.includes('already used')) {
            setStatus('success')
            setMessage('Your email has already been confirmed! Redirecting to dashboard...')
            setTimeout(function() { navigate('/dashboard') }, 2000)
            return
          } else {
            setStatus('error')
            setMessage(error.message || 'Failed to confirm email. Please try again.')
          }
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user?.email) setEmail(session.user.email)
        } else {
          setStatus('success')
          setMessage('Your email has been confirmed successfully! Welcome to NaijaBizHub.')
          toast.success('Email confirmed!')
          setTimeout(function() { navigate('/dashboard') }, 2000)
        }
        return
      }

      // No token - check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.email_confirmed_at) {
        setStatus('success')
        setMessage('Your email is already confirmed! Redirecting to dashboard...')
        setTimeout(function() { navigate('/dashboard') }, 2000)
        return
      }

      if (session?.user && !session.user.email_confirmed_at) {
        setStatus('error')
        setMessage('A confirmation email has been sent to your inbox. Please check your email and click the confirmation link to verify your account.')
        setEmail(emailFromUrl || session.user.email || '')
        return
      }

      // No session at all - they probably just signed up
      if (emailFromUrl) {
        setStatus('error')
        setMessage('A confirmation email has been sent to ' + emailFromUrl + '. Please check your inbox and spam folder, then click the confirmation link.')
        setEmail(emailFromUrl)
      } else {
        setStatus('error')
        setMessage('Please check your email for the confirmation link. If you just signed up, the email should arrive shortly. Check your spam folder if you don\'t see it.')
      }
    } catch (error: any) {
      console.error('Confirmation error:', error)
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
    }
  }

  const handleResendEmail = async () => {
    const emailToUse = email || searchParams.get('email') || ''
    
    if (!emailToUse) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setEmail(session.user.email)
      } else {
        toast.error('Please enter your email address first')
        return
      }
    }

    setIsResending(true)
    try {
      const finalEmail = email || searchParams.get('email') || ''
      if (!finalEmail) {
        toast.error('Please enter your email address')
        setIsResending(false)
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: finalEmail,
        options: {
          emailRedirectTo: window.location.origin + '/confirm-email',
        },
      })

      if (error) {
        if (error.message.includes('already confirmed')) {
          setStatus('success')
          setMessage('Your email is already confirmed! Redirecting to dashboard...')
          setTimeout(function() { navigate('/dashboard') }, 2000)
          return
        }
        throw error
      }
      
      toast.success('Confirmation email resent! Please check your inbox and spam folder.')
      setMessage('A new confirmation email has been sent. Please check your inbox and spam folder.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="max-w-md w-full space-y-8">
        <div className="text-center">
          <SiteLogo size="lg" />
          <h2 className="mt-6 text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Email Confirmation</h2>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-8 shadow-sm">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Email Confirmed!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Button onClick={function() { navigate('/dashboard') }} className="w-full">Go to Dashboard</Button>
                <Button variant="outline" onClick={function() { navigate('/profile') }} className="w-full">Complete Your Profile</Button>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-6">
                <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check Your Email</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

              <div className="space-y-4">
                {!searchParams.get('email') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={function(e) { setEmail(e.target.value) }}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 text-base md:text-sm rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <Button onClick={handleResendEmail} isLoading={isResending} className="w-full">
                  Resend Confirmation Email
                </Button>

                <div className="text-sm text-gray-500 dark:text-gray-400 text-left">
                  <p className="font-medium mb-1">Didn't receive the email?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Check your spam/junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes - emails can sometimes be delayed</li>
                    <li>If using Gmail, check the "Promotions" tab</li>
                    <li>Try adding no-reply@supabase.com to your contacts</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-dark-700 flex flex-col gap-2">
                  <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">Back to Login</Link>
                  <Link to="/register" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">Try a different email</Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}