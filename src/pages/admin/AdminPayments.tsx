import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { formatDate } from '@/lib/utils'

export default function AdminPayments() {
  const { data: payments } = useSupabaseQuery(
    ['admin-payments'],
    () => supabase
      .from('payments')
      .select('*, user:profiles(username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(100)
  )

  const { data: subscriptions } = useSupabaseQuery(
    ['admin-subscriptions'],
    () => supabase
      .from('subscriptions')
      .select('*, user:profiles(username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50)
  )

  const totalRevenue = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
  const activeSubscriptions = subscriptions?.filter((s: any) => s.status === 'active').length || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Payments & Subscriptions</h1>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <span className="text-3xl mb-3 block">💰</span>
          <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
          <div className="text-sm opacity-90">Total Revenue</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <span className="text-3xl mb-3 block">⭐</span>
          <div className="text-2xl font-bold">{activeSubscriptions}</div>
          <div className="text-sm opacity-90">Active Subscriptions</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <span className="text-3xl mb-3 block">💳</span>
          <div className="text-2xl font-bold">{payments?.length || 0}</div>
          <div className="text-sm opacity-90">Total Transactions</div>
        </motion.div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 dark:border-dark-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-700 dark:border-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400">Provider</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((payment: any) => (
                <tr key={payment.id} className="border-b border-gray-100 dark:border-dark-700 dark:border-dark-700">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{payment.user?.full_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">@{payment.user?.username}</p>
                  </td>
                  <td className="py-3 px-4 font-medium">₦{payment.amount?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm">{payment.provider}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-700 dark:text-green-400' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:text-red-400'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">{formatDate(payment.created_at)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 font-mono">{payment.provider_reference?.substring(0, 12)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 dark:border-dark-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">Active Subscriptions</h2>
        <div className="space-y-3">
          {subscriptions?.filter((s: any) => s.status === 'active').map((sub: any) => (
            <div key={sub.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-dark-700 dark:border-dark-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{sub.user?.full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Expires: {formatDate(sub.ends_at)}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                Active
              </span>
            </div>
          ))}
          {(!subscriptions || subscriptions.filter((s: any) => s.status === 'active').length === 0) && (
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-center py-4">No active subscriptions</p>
          )}
        </div>
      </div>
    </div>
  )
}