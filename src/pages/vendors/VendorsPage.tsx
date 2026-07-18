import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { useDebounce } from '@/hooks/useDebounce'
import PageHeader from '@/components/ui/PageHeader'
import SearchFilters from '@/components/ui/SearchFilters'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

export default function VendorsPage() {
  const { profile } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const categories = ['Skincare', 'Food & Beverages', 'Fashion', 'Technology', 'Health & Wellness', 'Beauty', 'Agriculture', 'Services']
  const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Abeokuta', 'Benin City']

  const { data: vendors, isLoading, error, refetch } = useSupabaseQuery(
    ['vendors', debouncedSearch, selectedCategory, selectedLocation],
    function() {
      let query = supabase.from('vendors').select('*').eq('status', 'published').order('rating', { ascending: false }).limit(50)
      if (debouncedSearch) query = query.or('business_name.ilike.%' + debouncedSearch + '%,description.ilike.%' + debouncedSearch + '%')
      if (selectedCategory !== 'all') query = query.eq('category', selectedCategory)
      if (selectedLocation !== 'all') query = query.ilike('location', '%' + selectedLocation + '%')
      return query
    }
  )

  const { data: myVendor } = useSupabaseQuery(
    ['my-vendor', profile?.id || ''],
    function() { return supabase.from('vendors').select('id,slug,logo_url,business_name').eq('owner_id', profile?.id || '').single() },
    { enabled: !!profile?.id && !!profile?.is_premium }
  )

  const clearFilters = function() { setSearchQuery(''); setSelectedCategory('all'); setSelectedLocation('all') }

  if (error) {
    return (
      <div className="container-custom py-8">
        <ErrorState title="Failed to load vendors" message="There was an error loading the vendor directory. Please try again." onRetry={function() { refetch() }} />
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="Vendor Directory"
        description="Discover verified businesses and service providers across Nigeria"
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {profile?.is_premium && !myVendor && <Link to="/vendors/register" className="w-full sm:w-auto"><Button className="w-full">+ Register Your Business</Button></Link>}
            {profile?.is_premium && myVendor && <Link to={'/vendors/' + myVendor.slug} className="w-full sm:w-auto"><Button variant="outline" className="w-full">View My Listing</Button></Link>}
            {!profile?.is_premium && <Link to="/pricing" className="w-full sm:w-auto"><Button variant="outline" className="w-full">⭐ Upgrade to Register</Button></Link>}
          </div>
        }
      />

      {!profile?.is_premium && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-4 mb-6 text-center border border-primary-200 dark:border-primary-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">💡 Tip:</span> Browse all vendors for free.{' '}
            <Link to="/pricing" className="text-gray-600 dark:text-gray-400 font-medium hover:underline">Upgrade to Premium (₦1,000/mo)</Link> to register your business.
          </p>
        </motion.div>
      )}

      <SearchFilters searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search vendors...">
        <select value={selectedCategory} onChange={function(e) { setSelectedCategory(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
          <option value="all">All Categories</option>
          {categories.map(function(c) { return <option key={c} value={c}>{c}</option> })}
        </select>
        <select value={selectedLocation} onChange={function(e) { setSelectedLocation(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
          <option value="all">All Locations</option>
          {locations.map(function(l) { return <option key={l} value={l}>{l}</option> })}
        </select>
      </SearchFilters>

      {isLoading ? (
        <GridSkeleton cols={3} rows={2} />
      ) : vendors && vendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {vendors.map(function(vendor: any, index: number) {
            return (
              <motion.div key={vendor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link to={'/vendors/' + vendor.slug} className="block bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all p-4 md:p-6 h-full">
                  <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 dark:bg-dark-700 rounded-xl flex items-center justify-center text-xl md:text-2xl flex-shrink-0 overflow-hidden">
                      {vendor.logo_url ? (
                        <img loading="lazy" src={vendor.logo_url} alt={vendor.business_name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400 font-bold">{(vendor.business_name || 'B')[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{vendor.business_name}</h3>
                        {vendor.is_verified && (
                          <span className="text-blue-500 flex-shrink-0" title="Verified">
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">{vendor.category}</p>
                    </div>
                  </div>
                  {vendor.description && <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 line-clamp-2">{vendor.description}</p>}
                  <div className="flex items-center justify-between text-xs md:text-sm mb-3">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{vendor.location}</span>
                    {vendor.rating > 0 && <span className="flex items-center gap-1 text-yellow-500"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span className="text-gray-900 dark:text-gray-100 font-medium">{vendor.rating}</span><span className="text-gray-500 dark:text-gray-400">({vendor.review_count})</span></span>}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                    {vendor.phone && <a href={'tel:' + vendor.phone} className="flex-1 text-center px-2 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30" onClick={function(e) { e.stopPropagation() }}>📞 Call</a>}
                    {vendor.whatsapp && <a href={'https://wa.me/' + vendor.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-2 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/30" onClick={function(e) { e.stopPropagation() }}>💬 WhatsApp</a>}
                    {vendor.email && <a href={'mailto:' + vendor.email} className="flex-1 text-center px-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30" onClick={function(e) { e.stopPropagation() }}>✉️ Email</a>}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon="🏪"
          title="No vendors found"
          description={debouncedSearch || selectedCategory !== 'all' || selectedLocation !== 'all' ? 'No vendors match your filters.' : 'No vendors listed yet.'}
          actionLabel={debouncedSearch || selectedCategory !== 'all' || selectedLocation !== 'all' ? 'Clear Filters' : profile?.is_premium ? 'Register Your Business' : undefined}
          onAction={debouncedSearch || selectedCategory !== 'all' || selectedLocation !== 'all' ? clearFilters : undefined}
          actionLink={!debouncedSearch && selectedCategory === 'all' && selectedLocation === 'all' && profile?.is_premium ? '/vendors/register' : undefined}
          secondaryActionLabel={!debouncedSearch && selectedCategory === 'all' && selectedLocation === 'all' && !profile?.is_premium ? 'Upgrade to Premium' : undefined}
          secondaryActionLink={!debouncedSearch && selectedCategory === 'all' && selectedLocation === 'all' && !profile?.is_premium ? '/pricing' : undefined}
        />
      )}
    </div>
  )
}