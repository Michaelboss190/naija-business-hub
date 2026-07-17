import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { formatDate } from '@/lib/utils'

export default function AdminDashboard() {
  const { data: stats } = useSupabaseQuery(['admin-stats'], async function() {
    const [users, vendors, posts, payments] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('vendors').select('id', { count: 'exact' }),
      supabase.from('forum_posts').select('id', { count: 'exact' }),
      supabase.from('payments').select('amount').eq('status', 'completed'),
    ])
    const totalRevenue = payments.data?.reduce(function(sum: number, p: any) { return sum + (p.amount || 0) }, 0) || 0
    return { totalUsers: users.count || 0, totalVendors: vendors.count || 0, totalPosts: posts.count || 0, totalRevenue }
  })

  const { data: recentUsers } = useSupabaseQuery(['admin-recent-users'], function() { return supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10) })
  const { data: recentPayments } = useSupabaseQuery(['admin-recent-payments'], function() { return supabase.from('payments').select('*, user:profiles(username, full_name, avatar_url)').eq('status', 'completed').order('created_at', { ascending: false }).limit(10) })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[{ label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'from-blue-500 to-blue-600' },{ label: 'Vendors', value: stats?.totalVendors || 0, icon: '🏪', color: 'from-green-500 to-green-600' },{ label: 'Forum Posts', value: stats?.totalPosts || 0, icon: '💬', color: 'from-purple-500 to-purple-600' },{ label: 'Revenue', value: '₦' + (stats?.totalRevenue || 0).toLocaleString(), icon: '💰', color: 'from-yellow-500 to-yellow-600' }].map(function(stat, index) {
          return <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white`}><span className="text-3xl mb-3 block">{stat.icon}</span><div className="text-2xl font-bold">{stat.value}</div><div className="text-sm opacity-90">{stat.label}</div></motion.div>
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Users</h2>
          <div className="space-y-3">
            {recentUsers?.map(function(user: any) {
              return (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name || ''} className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">{(user.full_name || 'U')[0]?.toUpperCase()}</span>}
                    </div>
                    <div><p className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p><p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p></div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role==='premium'?'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400':user.role==='admin'?'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400':'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-400'}`}>{user.role}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Payments</h2>
          <div className="space-y-3">
            {recentPayments?.map(function(payment: any) {
              return (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700">
                  <div><p className="font-medium text-gray-900 dark:text-gray-100">{payment.user?.full_name || 'Unknown'}</p><p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(payment.created_at)}</p></div>
                  <span className="font-bold text-green-600">₦{payment.amount?.toLocaleString()}</span>
                </div>
              )
            })}
            {(!recentPayments || recentPayments.length === 0) && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No payments yet</p>}
          </div>
        </motion.div>
      </div>
    </div>
  )
}