import { useEffect } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function NotificationListener() {
  const { profile } = useAuth()

  useEffect(function() {
    if (!profile?.id) return

    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.' + profile.id,
      }, function(payload) {
        const notif = payload.new as any
        if (notif) {
          toast.success(notif.title || 'New notification!', {
            duration: 5000,
            icon: '??',
          })
        }
      })
      .subscribe()

    return function() {
      supabase.removeChannel(channel)
    }
  }, [profile?.id])

  return null
}