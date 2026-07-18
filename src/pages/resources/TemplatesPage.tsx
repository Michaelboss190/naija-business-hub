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
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import toast from 'react-hot-toast'

export default function TemplatesPage() {
  const { profile, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const debouncedSearch = useDebounce(searchQuery, 400)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    if (!profile?.is_premium) { toast.error('Templates are for premium members'); return }
    try {
      await supabase.from('templates').update({ download_count: (template.download_count || 0) + 1 }).eq('id', template.id)
      if (template.file_url) window.open(template.file_url, '_blank')
      toast.success('Download started!')
      refetch()
    } catch (error: any) { toast.error('Failed to download') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      console.log('Deleting template:', deleteTarget)
      const { error } = await supabase.from('templates').delete().eq('id', deleteTarget)
      if (error) {
        console.error('Delete error:', error)
        toast.error(error.message || 'Failed to delete template')
      } else {
        toast.success('Template deleted successfully!')
        setDeleteTarget(null)
        refetch()
      }
    } catch (error: any) {
      console.error('Delete exception:', error)
      toast.error(error.message || 'Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  if (error) return (
    <div className="container-custom py-8">
      <ErrorState title="Failed to load templates" onRetry={function() { refetch() }} />
    </div>
  )

  return (
    <div className="container-custom py-8">
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={function() { setDeleteTarget(null) }}
        isLoading={isDeleting}
      />

      <PageHeader
        title="Business Templates"
        description="Download ready-to-use templates for your business"
        actions={isAuthenticated ? <Link to="/templates/new"><Button aria-label="Button">+ Upload Template</Button></Link> : undefined}
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
            const isOwner = profile?.id && template.author_id === profile?.id
            return (
              <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all p-4 md:p-6 h-full flex flex-col">
                  {/* Top section with icon and badges */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{template.file_type === 'pdf' ? '📕' : template.file_type === 'doc' ? '📝' : template.file_type === 'xls' ? '📊' : '📋'}</span>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button
                          onClick={function() { setDeleteTarget(template.id) }}
                          className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                          title="Delete Template"
                         aria-label="Button">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      )}
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">⭐ Premium</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{template.title}</h3>

                  {/* Description */}
                  {template.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-4 line-clamp-2">{template.description}</p>
                  )}

                  {/* Spacer */}
                  <div className="flex-1"></div>

                  {/* Bottom section */}
                  <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-3 pt-3 border-t border-gray-100 dark:border-dark-700">
                    <span>{template.category}</span>
                    <span>{template.file_type?.toUpperCase()}</span>
                  </div>

                  {/* Download Button */}
                  <Button onClick={function() { handleDownload(template) }} className="w-full" disabled={!profile?.is_premium} aria-label="Button">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download ({template.download_count || 0})
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon="📋"
          title="No templates found"
          description={debouncedSearch ? 'No templates match your search.' : 'Templates will appear here once uploaded.'}
          actionLabel={isAuthenticated ? 'Upload First Template' : undefined}
          actionLink={isAuthenticated ? '/templates/new' : undefined}
        />
      )}
    </div>
  )
}