import { supabase } from '@/config/supabase'

export async function createNotification({
  userId,
  type,
  title,
  message,
  data = {},
}: {
  userId: string
  type: 'comment' | 'like' | 'message' | 'event' | 'review' | 'follow'
  title: string
  message: string
  data?: any
}) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      data,
    })
    if (error) console.error('Notification error:', error)
  } catch (err) {
    console.error('Failed to create notification:', err)
  }
}