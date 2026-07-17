import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ResourcePage() {
  const { slug } = useParams()
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const { data: resource, isLoading } = useSupabaseQuery(
    ['resource', slug || ''],
    () => supabase
      .from('resources')
      .select('*, category:resource_categories(name, slug)')
      .eq('slug', slug)
      .single()
  )

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to download')
      navigate('/login')
      return
    }

    if (resource?.is_premium && !profile?.is_premium) {
      toast.error('This is a premium resource. Please upgrade to download.')
      navigate('/pricing')
      return
    }

    try {
      // Increment download count
      await supabase
        .from('resources')
        .update({ download_count: (resource.download_count || 0) + 1 })
        .eq('id', resource.id)

      // Open file in new tab
      if (resource.file_url) {
        window.open(resource.file_url, '_blank')
      }
      toast.success('Download started!')
    } catch (error: any) {
      toast.error('Failed to download')
    }
  }

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">Resource not found</h2>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-6">This resource may have been removed or doesn't exist.</p>
        <Link to="/resources">
          <Button>Back to Resources</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-6">
          <Link to="/resources" className="hover:text-gray-600 dark:text-gray-400">Resources</Link>
          {resource.category && (
            <>
              <span>/</span>
              <Link to={`/resources?category=${resource.category.slug}`} className="hover:text-gray-600 dark:text-gray-400">
                {resource.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 dark:text-gray-100 truncate">{resource.title}</span>
        </div>

        {/* Resource Content */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 dark:border-dark-700 p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium">
                  {resource.type}
                </span>
                {resource.is_premium && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
                    ⭐ Premium
                  </span>
                )}
                {resource.category && (
                  <span className="px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 dark:text-gray-400 rounded-full text-sm">
                    {resource.category.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">{resource.title}</h1>
            </div>
          </div>

          {/* Description */}
          {resource.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-8">{resource.description}</p>
          )}

          {/* Content */}
          {resource.content && (
            <div className="prose prose-green max-w-none mb-8">
              <div dangerouslySetInnerHTML={{ __html: resource.content }} />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-gray-200 dark:border-dark-700 dark:border-dark-700">
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-4 sm:mb-0">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{resource.view_count || 0} views</span>
              </span>
              {resource.is_downloadable && (
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{resource.download_count || 0} downloads</span>
                </span>
              )}
              <span>{formatDate(resource.created_at)}</span>
            </div>

            <div className="flex space-x-3">
              {resource.is_downloadable && (
                <Button onClick={handleDownload}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </Button>
              )}
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Bookmark
              </Button>
            </div>
          </div>

          {/* Premium Lock Overlay */}
          {resource.is_premium && !profile?.is_premium && (
            <div className="mt-8 p-8 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 text-center">
              <span className="text-4xl mb-4 block">⭐</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">Premium Content</h3>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-4">
                Upgrade to premium for ₦1,000/month to access this resource and many more.
              </p>
              <Link to="/pricing">
                <Button>Upgrade to Premium</Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}