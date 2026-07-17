import { Paystack } from '@paystack/paystack-sdk'
import Flutterwave from 'flutterwave-node-v3'
import { loadStripe } from '@stripe/stripe-js'

export const paystack = new Paystack(import.meta.env.VITE_PAYSTACK_SECRET_KEY!)
export const flutterwave = new Flutterwave(
  import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY!,
  import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY!
)
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)

export const CURRENCY = 'NGN'
export const PREMIUM_PRICE = 1000 // ₦1,000
export const PREMIUM_PRICE_CENTS = 100000 // In kobo for Paystack