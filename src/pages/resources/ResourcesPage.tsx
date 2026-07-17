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

export default function ResourcesPage() {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const { data: categories } = useSupabaseQuery(
    ['resource-categories'],
    function() { return supabase.from('resource_categories').select('*').order('name') }
  )

  const { data: resources, isLoading, error, refetch } = useSupabaseQuery(
    ['resources', selectedCategory, selectedType, debouncedSearch],
    function() {
      let query = supabase.from('resources').select('*, category:resource_categories(name, slug)').eq('status', 'published').order('created_at', { ascending: false }).limit(50)
      if (selectedCategory !== 'all') query = query.eq('category.slug', selectedCategory)
      if (selectedType !== 'all') query = query.eq('type', selectedType)
      if (debouncedSearch) query = query.or('title.ilike.%' + debouncedSearch + '%,description.ilike.%' + debouncedSearch + '%')
      return query
    }
  )

  const typeIcons: Record<string, string> = { article: '📄', video: '🎥', pdf: '📕', template: '📋' }

  const clearFilters = function() { setSearchQuery(''); setSelectedCategory('all'); setSelectedType('all') }

  if (error) {
    return (
      <div className="container-custom py-8">
        <ErrorState title="Failed to load resources" message="There was an error loading resources. Please try again." onRetry={function() { refetch() }} />
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="Resource Library"
        description="Business guides, templates, videos, and tools to help you grow"
        actions={
          isAuthenticated ? <Link to="/resources/new" className="w-full sm:w-auto"><Button className="w-full">+ Add Resource</Button></Link> : undefined
        }
      />

      <SearchFilters searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search resources...">
        <select value={selectedCategory} onChange={function(e) { setSelectedCategory(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
          <option value="all">All Categories</option>
          {categories?.map(function(cat: any) { return <option key={cat.id} value={cat.slug}>{cat.name}</option> })}
        </select>
        <select value={selectedType} onChange={function(e) { setSelectedType(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
          <option value="all">All Types</option>
          <option value="article">📄 Article</option>
          <option value="video">🎥 Video</option>
          <option value="pdf">📕 PDF</option>
          <option value="template">📋 Template</option>
        </select>
      </SearchFilters>

      {isLoading ? (
        <GridSkeleton cols={3} rows={2} />
      ) : resources && resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {resources.map(function(resource: any, index: number) {
            return (
              <motion.div key={resource.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link to={'/resources/' + resource.slug} className="block bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all p-4 md:p-6 h-full">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <span className="text-2xl">{typeIcons[resource.type] || '📄'}</span>
                    <div className="flex items-center gap-2">
                      {resource.is_premium && <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">⭐ Premium</span>}
                      <span className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">{resource.type}</span>
                    </div>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{resource.title}</h3>
                  {resource.description && <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 line-clamp-2">{resource.description}</p>}
                  <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-auto">
                    <span>{resource.category?.name || 'Uncategorized'}</span>
                    <div className="flex items-center gap-2">
                      {resource.is_downloadable && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>{resource.download_count || 0}</span>}
                      <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>{resource.view_count || 0}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon="📚"
          title="No resources found"
          description={debouncedSearch || selectedCategory !== 'all' || selectedType !== 'all' ? 'No resources match your filters.' : 'Resources will appear here once published.'}
          actionLabel={debouncedSearch || selectedCategory !== 'all' || selectedType !== 'all' ? 'Clear Filters' : isAuthenticated ? 'Add First Resource' : undefined}
          onAction={debouncedSearch || selectedCategory !== 'all' || selectedType !== 'all' ? clearFilters : undefined}
          actionLink={!debouncedSearch && selectedCategory === 'all' && selectedType === 'all' && isAuthenticated ? '/resources/new' : undefined}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Link to="/templates" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
          <span className="text-3xl mb-3 block">📋</span>
          <h3 className="text-xl font-bold mb-2">Templates</h3>
          <p className="text-blue-100 text-sm">Ready-to-use business templates</p>
        </Link>
        <Link to="/masterclasses" className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
          <span className="text-3xl mb-3 block">🎓</span>
          <h3 className="text-xl font-bold mb-2">Masterclasses</h3>
          <p className="text-purple-100 text-sm">Learn from industry experts</p>
        </Link>
        <Link to="/expert-qa" className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
          <span className="text-3xl mb-3 block">🤝</span>
          <h3 className="text-xl font-bold mb-2">Expert Q&A</h3>
          <p className="text-green-100 text-sm">Get answers from professionals</p>
        </Link>
      </motion.div>
    </div>
  )
}