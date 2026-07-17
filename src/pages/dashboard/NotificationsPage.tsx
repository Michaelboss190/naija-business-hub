import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import { formatTimeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const { data: notifications, refetch } = useSupabaseQuery(
    ['notifications', profile?.id || '', filter],
    function() {
      let query = supabase.from('notifications').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(50)
      if (filter === 'unread') query = query.eq('is_read', false)
      return query
    },
    { enabled: !!profile?.id }
  )

  useEffect(function() {
    if (!profile?.id) return
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.' + profile.id,
      }, function() {
        refetch()
      })
      .subscribe()
    return function() { supabase.removeChannel(channel) }
  }, [profile?.id])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id)
    refetch()
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', profile?.id).eq('is_read', false)
    refetch()
    toast.success('All marked as read')
  }

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) await markAsRead(notif.id)

    // Navigate based on notification type and data
    const data = notif.data || {}
    
    if (notif.type === 'comment' || notif.type === 'like') {
      if (data.post_slug) navigate('/forum/post/' + data.post_slug)
      else navigate('/forum')
    } else if (notif.type === 'message') {
      if (data.conversation_id) navigate('/messages/' + data.conversation_id)
      else navigate('/messages')
    } else if (notif.type === 'review') {
      if (data.vendor_slug) navigate('/vendors/' + data.vendor_slug)
      else navigate('/vendors')
    } else if (notif.type === 'event') {
      if (data.course_slug) navigate('/masterclasses/' + data.course_slug)
      else if (data.event_slug) navigate('/events/' + data.event_slug)
      else navigate('/events')
    } else if (notif.type === 'follow') {
      navigate('/profile/' + (data.username || ''))
    }
  }

  const unreadCount = notifications?.filter(function(n: any) { return !n.is_read }).length || 0

  const getNotificationIcon = function(type: string) {
    switch (type) {
      case 'comment': return '💬'
      case 'like': return '❤️'
      case 'message': return '💌'
      case 'review': return '⭐'
      case 'event': return '📅'
      case 'follow': return '👤'
      default: return '🔔'
    }
  }

  const getNotificationColor = function(type: string) {
    switch (type) {
      case 'comment': return 'bg-blue-100 dark:bg-blue-900/30'
      case 'like': return 'bg-red-100 dark:bg-red-900/30'
      case 'message': return 'bg-purple-100 dark:bg-purple-900/30'
      case 'review': return 'bg-yellow-100 dark:bg-yellow-900/30'
      case 'event': return 'bg-green-100 dark:bg-green-900/30'
      case 'follow': return 'bg-indigo-100 dark:bg-indigo-900/30'
      default: return 'bg-gray-100 dark:bg-dark-700'
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>Mark all as read</Button>
          )}
        </div>

        <div className="flex border-b border-gray-200 dark:border-dark-700">
          {['all', 'unread'].map(function(f) {
            return (
              <button key={f} onClick={function() { setFilter(f) }} className={'flex-1 px-4 py-3 text-sm font-medium transition-colors ' + (filter === f ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300')}>
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            )
          })}
        </div>

        <div className="divide-y divide-gray-100 dark:divide-dark-700">
          {notifications?.map(function(notif: any) {
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={function() { handleNotificationClick(notif) }}
                className={'flex items-start space-x-4 p-6 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer ' + (!notif.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : '')}
              >
                <div className="flex-shrink-0">
                  <div className={'w-10 h-10 rounded-full flex items-center justify-center text-xl ' + getNotificationColor(notif.type)}>
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(notif.created_at)}</span>
                      {!notif.is_read && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
          {(!notifications || notifications.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No notifications</h3>
              <p className="text-gray-600 dark:text-gray-400">{filter === 'unread' ? 'No unread notifications' : "You're all caught up!"}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}