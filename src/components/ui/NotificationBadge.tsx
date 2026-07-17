import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function NotificationBadge() {
  const { profile } = useAuth()

  const { data } = useSupabaseQuery(
    ['unread-notification-count', profile?.id || ''],
    function() {
      return supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', profile?.id || '').eq('is_read', false)
    },
    { enabled: !!profile?.id, refetchInterval: 30000 }
  )

  const count = (data as any)?.count || 0

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
      {count > 99 ? '99+' : count}
    </span>
  )
}