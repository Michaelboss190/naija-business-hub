import { Resend } from 'resend'

export const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY)

export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome-email',
  PREMIUM_ACTIVATED: 'premium-activated',
  PREMIUM_EXPIRING: 'premium-expiring',
  NEW_MESSAGE: 'new-message',
  NEW_COMMENT: 'new-comment',
  MASTERCLASS_REMINDER: 'masterclass-reminder',
} as const