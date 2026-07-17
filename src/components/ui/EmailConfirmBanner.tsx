import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'

export default function EmailConfirmBanner() {
  const { user, profile } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [isResending, setIsResending] = useState(false)

  // Only show if user is logged in and email is not confirmed
  if (!user || user.email_confirmed_at || !isVisible) {
    return null
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      })
      if (error) throw error
      toast.success('Confirmation email resent! Check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="container-custom py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 dark:text-yellow-300">
              <span className="font-medium">Verify your email address.</span>{' '}
              Check your inbox for the confirmation link.
            </p>
          </div>
          <div className="flex items-center space-x-3 ml-4">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-sm font-medium text-yellow-700 dark:text-yellow-400 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 underline whitespace-nowrap"
            >
              {isResending ? 'Sending...' : 'Resend email'}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}