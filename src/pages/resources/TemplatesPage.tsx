import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import { useDebounce } from '@/hooks/useDebounce'
import PageHeader from '@/components/ui/PageHeader'
import SearchFilters from '@/components/ui/SearchFilters'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import toast from 'react-hot-toast'

export default function TemplatesPage() {
  const { profile, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const categories = ['Invoice', 'Receipt', 'Business Plan', 'Marketing', 'Proposal', 'Inventory', 'Budget', 'Contract']

  const { data: templates, isLoading, error, refetch } = useSupabaseQuery(
    ['templates', debouncedSearch, selectedCategory],
    function() {
      let query = supabase.from('templates').select('*').eq('status', 'published').order('download_count', { ascending: false }).limit(50)
      if (debouncedSearch) query = query.or('title.ilike.%' + debouncedSearch + '%,description.ilike.%' + debouncedSearch + '%')
      if (selectedCategory !== 'all') query = query.eq('category', selectedCategory)
      return query
    }
  )

  const handleDownload = async (template: any) => {
    if (!isAuthenticated) { toast.error('Please login to download'); return }
    if (!profile?.is_premium) { toast.error('Templates are available for premium members only'); return }
    try {
      await supabase.from('templates').update({ download_count: (template.download_count || 0) + 1 }).eq('id', template.id)
      if (template.file_url) window.open(template.file_url, '_blank')
      toast.success('Download started!')
    } catch (error: any) { toast.error('Failed to download') }
  }

  if (error) {
    return (
      <div className="container-custom py-8">
        <ErrorState title="Failed to load templates" message="There was an error loading templates." onRetry={function() { refetch() }} />
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="Business Templates"
        description="Download ready-to-use templates for your business"
        actions={isAuthenticated ? <Link to="/templates/new"><Button>+ Upload Template</Button></Link> : undefined}
      />

      {!profile?.is_premium && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 mb-6 text-center border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ⭐ <Link to="/pricing" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Upgrade to Premium (₦1,000/mo)</Link> to download templates.
          </p>
        </motion.div>
      )}

      <SearchFilters searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search templates...">
        <select value={selectedCategory} onChange={function(e) { setSelectedCategory(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
          <option value="all">All Categories</option>
          {categories.map(function(c) { return <option key={c} value={c}>{c}</option> })}
        </select>
      </SearchFilters>

      {isLoading ? (
        <GridSkeleton cols={3} rows={2} />
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {templates.map(function(template: any, index: number) {
            return (
              <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{template.file_type === 'pdf' ? '📕' : template.file_type === 'doc' ? '📝' : template.file_type === 'xls' ? '📊' : '📋'}</span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">⭐ Premium</span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{template.title}</h3>
                {template.description && <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 line-clamp-2">{template.description}</p>}
                <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span>{template.category}</span>
                  <span>{template.file_type?.toUpperCase()}</span>
                </div>
                <Button onClick={function() { handleDownload(template) }} className="w-full" disabled={!profile?.is_premium}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download ({template.download_count || 0})
                </Button>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="📋" title="No templates found" description={debouncedSearch ? 'No templates match your search.' : 'Templates will appear here once uploaded.'} actionLabel={isAuthenticated ? 'Upload First Template' : undefined} actionLink={isAuthenticated ? '/templates/new' : undefined} />
      )}
    </div>
  )
}