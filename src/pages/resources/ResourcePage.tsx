import { useState, useEffect } from 'react'
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
  const [bookmarked, setBookmarked] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: resource, isLoading, refetch } = useSupabaseQuery(
    ['resource', slug || ''],
    function() {
      return supabase.from('resources').select('*, category:resource_categories(name, slug)').eq('slug', slug || '').single()
    }
  )

  useEffect(function() {
    if (resource?.id) {
      supabase.from('resources').update({ view_count: (resource.view_count || 0) + 1 }).eq('id', resource.id).then()
    }
    // Check if bookmarked
    if (resource?.id && profile?.id) {
      supabase.from('bookmarks').select('id').eq('user_id', profile.id).eq('resource_id', resource.id).maybeSingle().then(function({ data }) {
        setBookmarked(!!data)
      })
    }
  }, [resource?.id, profile?.id])

  const handleDownload = async () => {
    if (!isAuthenticated) { toast.error('Please login to download'); navigate('/login'); return }
    if (resource?.is_premium && !profile?.is_premium) { toast.error('Premium resource. Please upgrade.'); navigate('/pricing'); return }
    try {
      await supabase.from('resources').update({ download_count: (resource.download_count || 0) + 1 }).eq('id', resource.id)
      if (resource.file_url) window.open(resource.file_url, '_blank')
      toast.success('Download started!')
      refetch()
    } catch (error: any) { toast.error('Failed to download') }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) { toast.error('Please login to bookmark'); navigate('/login'); return }
    setIsBookmarking(true)
    try {
      const { data: existing } = await supabase.from('bookmarks').select('id').eq('user_id', profile?.id).eq('resource_id', resource?.id).maybeSingle()
      if (existing) {
        await supabase.from('bookmarks').delete().eq('id', existing.id)
        setBookmarked(false)
        toast.success('Bookmark removed')
      } else {
        await supabase.from('bookmarks').insert({ user_id: profile?.id, resource_id: resource?.id })
        setBookmarked(true)
        toast.success('Bookmarked!')
      }
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsBookmarking(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return
    setIsDeleting(true)
    try {
      if (resource?.file_url) {
        const path = resource.file_url.split('/').slice(-2).join('/')
        await supabase.storage.from('resources').remove([path])
      }
      await supabase.from('resources').delete().eq('id', resource?.id)
      toast.success('Resource deleted')
      navigate('/resources')
    } catch (error: any) { toast.error(error.message || 'Failed to delete') }
    finally { setIsDeleting(false) }
  }

  const isOwner = profile?.id === resource?.author_id

  if (isLoading) return (
    <div className="container-custom py-8">
      <div className="animate-pulse max-w-4xl mx-auto space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-3/4"></div>
        <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-xl"></div>
      </div>
    </div>
  )

  if (!resource) return (
    <div className="container-custom py-16 text-center">
      <div className="text-6xl mb-4">📄</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Resource not found</h2>
      <Link to="/resources"><Button aria-label="Button">Back to Resources</Button></Link>
    </div>
  )

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/resources" className="hover:text-primary-600 dark:hover:text-primary-400">Resources</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100">{resource.title}</span>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium">{resource.type}</span>
              {resource.is_premium && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">⭐ Premium</span>}
              {resource.category && <span className="px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">{resource.category.name}</span>}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDelete} isLoading={isDeleting} aria-label="Button">Delete</Button>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">{resource.title}</h1>
          {resource.description && <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{resource.description}</p>}
          {resource.content && (
            <div className="prose prose-green dark:prose-invert max-w-none mb-8">
              <div dangerouslySetInnerHTML={{ __html: resource.content }} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-100 dark:border-dark-700 gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>{resource.view_count || 0} views</span>
              {resource.download_count > 0 && <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>{resource.download_count} downloads</span>}
              <span>{formatDate(resource.created_at)}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBookmark} isLoading={isBookmarking} aria-label="Button">
                <svg className="w-4 h-4 mr-2" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              {resource.file_url && (
                <Button onClick={handleDownload} aria-label="Button">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download
                </Button>
              )}
            </div>
          </div>

          {resource.is_premium && !profile?.is_premium && (
            <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800 text-center">
              <span className="text-3xl mb-3 block">⭐</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Premium Content</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Upgrade to access this resource and download it.</p>
              <Link to="/pricing"><Button aria-label="Button">Upgrade - ₦1,000/mo</Button></Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}