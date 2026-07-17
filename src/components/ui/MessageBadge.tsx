import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function MessageBadge() {
  const { profile } = useAuth()

  const { data } = useSupabaseQuery(
    ['unread-message-count', profile?.id || ''],
    function() {
      return supabase.from('messages').select('id', { count: 'exact' }).eq('receiver_id', profile?.id || '').eq('is_read', false)
    },
    { enabled: !!profile?.id, refetchInterval: 30000 }
  )

  const count = (data as any)?.count || 0

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
      {count > 99 ? '99+' : count}
    </span>
  )
}