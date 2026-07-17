import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export default function SuppliersPage() {
  const { profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('all')

  const industries = [
    'Skincare Ingredients', 'Packaging', 'Food Ingredients',
    'Equipment', 'Raw Materials', 'Logistics', 'Technology'
  ]

  const { data: suppliers, isLoading } = useSupabaseQuery(
    ['suppliers', searchQuery, selectedIndustry],
    function() {
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'published')
        .order('rating', { ascending: false })
        .limit(50)

      if (searchQuery) {
        query = query.or('company_name.ilike.%' + searchQuery + '%,description.ilike.%' + searchQuery + '%')
      }
      if (selectedIndustry !== 'all') {
        query = query.eq('industry', selectedIndustry)
      }

      return query
    }
  )

  return (
    <div className="container-custom py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Wholesale Suppliers</h1>
            <div className="flex items-center gap-3">
              {profile?.is_premium ? <Link to="/suppliers/register"><Button>+ Register as Supplier</Button></Link> : <Link to="/pricing"><Button variant="outline">? Upgrade to Register</Button></Link>}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Connect with verified wholesale suppliers for your business
            </p>
          </div>
          {!profile?.is_premium && (
            <Link to="/pricing" className="mt-4 sm:mt-0">
              <Button variant="outline">⭐ Upgrade to Access Contact Info</Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Premium Banner */}
      {!profile?.is_premium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-4 mb-6 text-center border border-primary-200 dark:border-primary-800"
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">💡 Tip:</span> Browse suppliers for free.{' '}
            <Link to="/pricing" className="text-gray-600 dark:text-gray-400 font-medium hover:underline">
              Upgrade to Premium (₦1,000/mo)
            </Link>{' '}
            to unlock direct contact info and connect with suppliers!
          </p>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value) }}
              placeholder="Search suppliers..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={selectedIndustry}
            onChange={function(e) { setSelectedIndustry(e.target.value) }}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Industries</option>
            {industries.map(function(ind) { return <option key={ind} value={ind}>{ind}</option> })}
          </select>
        </div>
      </motion.div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(function(i) {
            return (
              <div key={i} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-full mb-3"></div>
              </div>
            )
          })}
        </div>
      ) : suppliers && suppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(function(supplier: any, index: number) {
            return (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{supplier.company_name}</h3>
                  {supplier.is_verified && (
                    <span className="text-blue-500" title="Verified Supplier">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3">{supplier.industry}</p>

                {supplier.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{supplier.description}</p>
                )}

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-2">
                    <span>📍</span>
                    <span>{supplier.location}</span>
                  </div>
                  {supplier.minimum_order && (
                    <div className="flex items-center space-x-2">
                      <span>📦</span>
                      <span>Min. Order: {supplier.minimum_order}</span>
                    </div>
                  )}
                </div>

                {profile?.is_premium ? (
                  <div className="flex items-center space-x-2">
                    {supplier.phone && (
                      <a href={'tel:' + supplier.phone} className="flex-1 text-center px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30">
                        📞 Call
                      </a>
                    )}
                    {supplier.whatsapp && (
                      <a href={'https://wa.me/' + supplier.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30">
                        💬 Chat
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      🔒 <Link to="/pricing" className="text-gray-600 dark:text-gray-400 font-medium hover:underline">Upgrade to Premium</Link> to view contact info
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No suppliers found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? 'No suppliers match your search.' : 'No suppliers in this industry yet.'}
          </p>
        </motion.div>
      )}
    </div>
  )
}