import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const { data: users, refetch } = useSupabaseQuery(
    ['admin-users', searchQuery, roleFilter],
    function() {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
      if (searchQuery) query = query.or('username.ilike.%' + searchQuery + '%,full_name.ilike.%' + searchQuery + '%')
      if (roleFilter !== 'all') query = query.eq('role', roleFilter)
      return query
    }
  )

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      if (error) throw error
      toast.success('User role updated')
      refetch()
    } catch (error: any) { toast.error(error.message || 'Failed to update role') }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input type="text" value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value) }} placeholder="Search users..." className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" />
          <select value={roleFilter} onChange={function(e) { setRoleFilter(e.target.value) }} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
            <option value="all">All Roles</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Business</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(function(user: any) {
                return (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? (
                            <img loading="lazy" src={user.avatar_url} alt={user.full_name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold">{(user.full_name || 'U')[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (user.role === 'premium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-400')}>{user.role}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.business_name || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(user.created_at)}</td>
                    <td className="py-3 px-4">
                      <select value={user.role} onChange={function(e) { handleRoleChange(user.id, e.target.value) }} className="text-sm border border-gray-300 dark:border-dark-600 rounded px-2 py-1 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100">
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}