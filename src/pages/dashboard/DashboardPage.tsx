import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import { formatTimeAgo, formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { profile } = useAuth()

  const { data: recentPosts } = useSupabaseQuery(
    ['dashboard-recent-posts'],
    function() {
      return supabase
        .from('forum_posts')
        .select('*, author:profiles(username, avatar_url), category:forum_categories(name, color)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5)
    }
  )

  const { data: myBookmarks } = useSupabaseQuery(
    ['my-bookmarks', profile?.id || ''],
    function() {
      return supabase
        .from('bookmarks')
        .select('*, post:forum_posts(id, title, slug, created_at)')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5)
    },
    { enabled: !!profile?.id }
  )

  const { data: upcomingEvents } = useSupabaseQuery(
    ['dashboard-events'],
    function() {
      return supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(3)
    }
  )

  const { data: notifications } = useSupabaseQuery(
    ['dashboard-notifications', profile?.id || ''],
    function() {
      return supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5)
    },
    { enabled: !!profile?.id }
  )

  const { data: myVendor } = useSupabaseQuery(
    ['my-vendor-full', profile?.id || ''],
    function() {
      return supabase.from('vendors').select('*').eq('owner_id', profile?.id || '').single()
    },
    { enabled: !!profile?.id && !!profile?.is_premium }
  )

  const { data: mySubscription } = useSupabaseQuery(
    ['my-subscription', profile?.id || ''],
    function() {
      return supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    },
    { enabled: !!profile?.id }
  )

  const stats = [
    { label: 'Forum Posts', value: '2,450+', icon: '💬', color: 'from-blue-500 to-blue-600', link: '/forum' },
    { label: 'Resources', value: '1,200+', icon: '📚', color: 'from-green-500 to-green-600', link: '/resources' },
    { label: 'Vendors', value: '850+', icon: '🏪', color: 'from-purple-500 to-purple-600', link: '/vendors' },
    { label: 'Events', value: upcomingEvents?.length || '0', icon: '📅', color: 'from-orange-500 to-orange-600', link: '/events' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Entrepreneur'}! 👋
            </h1>
            <p className="text-primary-100">
              {profile?.is_premium ? 'Enjoying your premium benefits. Keep growing your business!' : 'Ready to take your business to the next level?'}
            </p>
            {mySubscription?.ends_at && (
              <p className="text-primary-200 text-sm mt-2">Premium expires: {formatDate(mySubscription.ends_at)}</p>
            )}
          </div>
          {!profile?.is_premium ? (
            <Link to="/pricing" className="mt-4 md:mt-0">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-white text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Upgrade to Premium - ₦1,000/mo
              </motion.button>
            </Link>
          ) : (
            <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-white/20 rounded-lg px-4 py-2">
              <span>⭐</span><span className="font-semibold">Premium Active</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(function(stat, index) {
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Link to={stat.link} className={`block bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white hover:shadow-lg transition-shadow`}>
                <span className="text-3xl mb-3 block">{stat.icon}</span>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Business Listing */}
        {profile?.is_premium && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">🏪 My Business Listing</h2>
              {myVendor && <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">Listed</span>}
            </div>
            {myVendor ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                    {myVendor.logo_url ? (
                      <img src={myVendor.logo_url} alt={myVendor.business_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400 font-bold">{(myVendor.business_name || 'B')[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{myVendor.business_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{myVendor.category} • {myVendor.location}</p>
                    <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>👁 {myVendor.view_count || 0} views</span>
                      {myVendor.rating > 0 && <span>⭐ {myVendor.rating}</span>}
                      {myVendor.is_verified && <span className="text-blue-500">✓ Verified</span>}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Link to={'/vendors/' + myVendor.slug}><Button size="sm" variant="outline">View Listing</Button></Link>
                  <Link to="/vendors/register"><Button size="sm" variant="outline">Edit Listing</Button></Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">List your business in our vendor directory and get discovered by thousands of potential customers</p>
                <Link to="/vendors/register"><Button>Register Your Business</Button></Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Recent Discussions */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">📰 Recent Discussions</h2>
            <Link to="/forum" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-700 dark:hover:text-primary-300">View all</Link>
          </div>
          <div className="space-y-4">
            {recentPosts?.map(function(post: any) {
              return (
                <Link key={post.id} to={'/forum/post/' + post.slug} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: post.category?.color || '#22c55e' }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{post.title}</h3>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{post.author?.username}</span><span>•</span><span>{formatTimeAgo(post.created_at)}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
            {(!recentPosts || recentPosts.length === 0) && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No discussions yet</p>}
          </div>
        </motion.div>

        {/* Bookmarks */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">🔖 Your Bookmarks</h2></div>
          <div className="space-y-4">
            {myBookmarks?.map(function(bookmark: any) {
              return (
                <Link key={bookmark.id} to={'/forum/post/' + bookmark.post?.slug} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <span className="text-lg flex-shrink-0">📌</span>
                  <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{bookmark.post?.title}</h3></div>
                </Link>
              )
            })}
            {(!myBookmarks || myBookmarks.length === 0) && (
              <div className="text-center py-4"><p className="text-gray-500 dark:text-gray-400 mb-2">No bookmarks yet</p><Link to="/forum" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-700 dark:hover:text-primary-300">Browse discussions</Link></div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">📅 Upcoming Events</h2>
            <Link to="/events" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-700 dark:hover:text-primary-300">View all</Link>
          </div>
          <div className="space-y-4">
            {upcomingEvents?.map(function(event: any) {
              return (
                <Link key={event.id} to={'/events/' + event.slug} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <div className="flex-shrink-0 w-14 h-14 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{new Date(event.start_at).toLocaleDateString('en-NG', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-primary-700 dark:text-primary-400">{new Date(event.start_at).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{event.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.event_type === 'online' ? '🌐 Online' : '📍 ' + event.location}</p>
                  </div>
                </Link>
              )
            })}
            {(!upcomingEvents || upcomingEvents.length === 0) && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming events</p>}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">🔔 Notifications</h2>
            <Link to="/notifications" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-700 dark:hover:text-primary-300">View all</Link>
          </div>
          <div className="space-y-3">
            {notifications?.map(function(notif: any) {
              return (
                <div key={notif.id} className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${notif.is_read ? '' : 'bg-primary-50 dark:bg-primary-900/10'}`}>
                  <span className="text-lg flex-shrink-0">{notif.type === 'comment' ? '💬' : notif.type === 'like' ? '❤️' : notif.type === 'event' ? '📅' : '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{notif.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTimeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />}
                </div>
              )
            })}
            {(!notifications || notifications.length === 0) && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No notifications</p>}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Start Discussion', icon: '💬', href: '/forum/new', color: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300' },
            { label: 'Find Vendors', icon: '🏪', href: '/vendors', color: 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300' },
            { label: 'Masterclasses', icon: '🎓', href: '/masterclasses', color: 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300' },
            { label: 'Templates', icon: '📋', href: '/templates', color: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300' },
            { label: 'Expert Q&A', icon: '🤝', href: '/expert-qa', color: 'hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-300' },
            { label: 'Suppliers', icon: '📦', href: '/suppliers', color: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300' },
            { label: 'Events', icon: '🎉', href: '/events', color: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300' },
            { label: 'Messages', icon: '💌', href: '/messages', color: 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300' },
          ].map(function(action) {
            return (
              <Link key={action.label} to={action.href} className={`p-4 rounded-lg border border-gray-200 dark:border-dark-700 text-center transition-all ${action.color}`}>
                <span className="text-2xl mb-2 block">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}