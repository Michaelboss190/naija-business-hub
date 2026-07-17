import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: any) => { openIframe: () => void }
    }
  }
}

export default function PricingPage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaystackReady, setIsPaystackReady] = useState(false)

  // Load Paystack script dynamically
  useEffect(() => {
    if (window.PaystackPop) {
      setIsPaystackReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v2/inline.js'
    script.async = true
    script.onload = () => {
      console.log('Paystack script loaded')
      setIsPaystackReady(true)
    }
    script.onerror = () => {
      console.error('Failed to load Paystack script')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  const handlePaystackPayment = () => {
    if (!isAuthenticated) {
      toast.error('Please login first')
      navigate('/login')
      return
    }

    if (profile?.is_premium) {
      toast.success('You are already a premium member! ⭐')
      return
    }

    // Try to load Paystack if not ready
    if (!window.PaystackPop) {
      toast.error('Payment system is still loading. Please wait a moment and try again.')
      
      // Try to reload the script
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v2/inline.js'
      script.async = true
      script.onload = () => {
        setIsPaystackReady(true)
        toast.success('Payment system ready! Click Pay again.')
      }
      document.head.appendChild(script)
      return
    }

    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
    
    // For testing, use Paystack test key if env variable is not set
    const key = paystackKey || 'pk_test_5078c1b2f6d5a5c1e0e3f2a7b4d9c8e6'

    setIsProcessing(true)

    try {
      const handler = window.PaystackPop.setup({
        key: key,
        email: 'customer@email.com', // Use a default for testing
        amount: 100000,
        currency: 'NGN',
        ref: 'NH-' + Date.now(),
        callback: async (response: any) => {
          console.log('Payment response:', response)
          
          if (response.status === 'success') {
            try {
              if (profile?.id) {
                const { error: subError } = await supabase
                  .from('subscriptions')
                  .insert({
                    user_id: profile.id,
                    plan: 'premium',
                    status: 'active',
                    amount: 1000,
                    currency: 'NGN',
                    payment_provider: 'paystack',
                    payment_reference: response.reference,
                    starts_at: new Date().toISOString(),
                    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  })

                if (subError) {
                  console.error('Subscription error:', subError)
                }

                await supabase
                  .from('payments')
                  .insert({
                    user_id: profile.id,
                    amount: 1000,
                    currency: 'NGN',
                    provider: 'paystack',
                    provider_reference: response.reference,
                    status: 'completed',
                    paid_at: new Date().toISOString(),
                  })
              }

              toast.success('Payment successful! Welcome to Premium! 🎉')
              setTimeout(() => {
                window.location.href = '/dashboard'
              }, 2000)
            } catch (error: any) {
              console.error('Error:', error)
              toast.error('Payment received. Please refresh the page.')
            }
          } else {
            toast.error('Payment failed. Please try again.')
          }
          setIsProcessing(false)
        },
        onClose: () => {
          setIsProcessing(false)
        },
      })

      handler.openIframe()
    } catch (error: any) {
      console.error('Paystack error:', error)
      toast.error('Failed to open payment. Please try again.')
      setIsProcessing(false)
    }
  }

  const features = {
    free: [
      'Community Forum Access',
      'Basic Resource Library',
      'Public Business Guides',
      'Public Articles & Tips',
      'Profile Creation',
      'Create Posts & Comments',
      'Likes & Bookmarks',
      'Basic Search',
      'Community Events Viewing',
    ],
    premium: [
      'Everything in Free, plus:',
      '⭐ Expert Q&A Sessions',
      '⭐ Vendor Directory Access',
      '⭐ Wholesale Supplier Contacts',
      '⭐ Business Templates Downloads',
      '⭐ Masterclass Library',
      '⭐ Monthly Live Masterclasses',
      '⭐ Premium Community Groups',
      '⭐ Verified Supplier Listings',
      '⭐ Priority Customer Support',
      '⭐ Advanced Search Filters',
      '⭐ Market Research Reports',
      '⭐ Premium Articles & Content',
      '⭐ Private Messaging',
      '⭐ Business Opportunities Board',
      '⭐ Job Board Access',
      '⭐ Premium Events Access',
      '⭐ Exclusive Deals & Discounts',
    ],
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-950 min-h-screen">
      <div className="container-custom py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-400 max-w-2xl mx-auto">
            Start free and upgrade anytime to unlock premium features
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-dark-800 rounded-2xl border-2 border-gray-200 dark:border-dark-700 dark:border-dark-700 p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">Free</h2>
              <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">₦0</div>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">Forever free</p>
            </div>

            <div className="space-y-3 mb-8">
              {features.free.map((feature) => (
                <div key={feature} className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 dark:text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Link to={isAuthenticated ? '/dashboard' : '/register'}>
              <Button variant="outline" className="w-full" size="lg">
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-8 text-white relative overflow-hidden border-2 border-green-500 shadow-2xl"
          >
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-6 py-2 rounded-bl-xl text-sm font-bold shadow-lg">
              BEST VALUE
            </div>

            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-bold mb-2">Premium</h2>
              <div className="text-5xl font-bold mb-2">
                ₦1,000<span className="text-xl font-normal text-green-200">/month</span>
              </div>
              <p className="text-green-200">Billed monthly • Cancel anytime</p>
            </div>

            <div className="space-y-2 mb-8 relative z-10">
              {features.premium.map((feature) => (
                <div key={feature} className="flex items-center space-x-3 py-1">
                  <svg className="w-5 h-5 text-yellow-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-green-100">{feature}</span>
                </div>
              ))}
            </div>

            <div className="relative z-10">
              {profile?.is_premium ? (
                <Button variant="secondary" className="w-full" size="lg" disabled>
                  ⭐ Current Plan
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  onClick={handlePaystackPayment}
                  isLoading={isProcessing || !isPaystackReady}
                  disabled={!isPaystackReady && !isProcessing}
                >
                  {!isPaystackReady ? 'Loading payment system...' : (
                    <>
                      <span className="mr-2">💳</span>
                      Pay with Paystack - ₦1,000
                    </>
                  )}
                </Button>
              )}
              
              <div className="mt-4 text-center">
                <p className="text-xs text-green-200">
                  Secured by Paystack • Instant activation
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}