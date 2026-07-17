import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { useDebounce } from '@/hooks/useDebounce'
import SEO from '@/components/ui/SEO'
import PageHeader from '@/components/ui/PageHeader'
import SearchFilters from '@/components/ui/SearchFilters'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { formatTimeAgo } from '@/lib/utils'

export default function ForumPage() {
  const { categorySlug } = useParams()
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const { data: categories } = useSupabaseQuery(
    ['forum-categories'],
    function() { return supabase.from('forum_categories').select('*').order('order_index', { ascending: true }) }
  )

  const { data: posts, isLoading, error, refetch } = useSupabaseQuery(
    ['forum-posts', categorySlug || '', sortBy, debouncedSearch],
    function() {
      let query = supabase
        .from('forum_posts')
        .select('*, author:profiles(username, avatar_url, full_name), category:forum_categories(name, slug, color)')
        .eq('status', 'published')
        .order(sortBy === 'popular' ? 'like_count' : 'created_at', { ascending: false })
        .limit(50)

      if (categorySlug) query = query.eq('category.slug', categorySlug)
      if (debouncedSearch) query = query.or('title.ilike.%' + debouncedSearch + '%,content.ilike.%' + debouncedSearch + '%')

      return query
    }
  )

  const { data: popularPosts } = useSupabaseQuery(
    ['popular-posts'],
    function() {
      return supabase.from('forum_posts').select('id, title, slug, like_count, comment_count, view_count').eq('status', 'published').order('view_count', { ascending: false }).limit(5)
    }
  )

  const pageTitle = categorySlug ? (categories?.find(function(c: any) { return c.slug === categorySlug })?.name || 'Forum') : 'Community Forum'
  const pageDescription = categorySlug ? (categories?.find(function(c: any) { return c.slug === categorySlug })?.description || '') : 'Discuss business ideas, share experiences, and connect with fellow Nigerian entrepreneurs in our community forum.'

  if (error) {
    return (
      <div className="container-custom py-8">
        <SEO title="Forum - Error" description="Failed to load forum discussions" />
        <ErrorState title="Failed to load discussions" message="There was an error loading the forum. Please try again." onRetry={function() { refetch() }} />
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <SEO title={pageTitle} description={pageDescription} />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <PageHeader
            title={pageTitle}
            description={pageDescription}
            actions={
              isAuthenticated ? (
                <Link to="/forum/new" className="w-full sm:w-auto"><Button className="w-full">+ New Discussion</Button></Link>
              ) : undefined
            }
          />

          {!categorySlug && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 mb-6">
              <Link to="/forum" className={'px-4 py-2 rounded-full text-sm font-medium transition-colors ' + (!categorySlug ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600')}>All</Link>
              {categories?.map(function(c: any) {
                return <Link key={c.id} to={'/forum/category/' + c.slug} className={'px-4 py-2 rounded-full text-sm font-medium transition-colors ' + (categorySlug === c.slug ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600')}>{c.icon} {c.name}</Link>
              })}
            </motion.div>
          )}

          <SearchFilters searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search discussions...">
            <div></div>
            <select value={sortBy} onChange={function(e) { setSortBy(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
            </select>
          </SearchFilters>

          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : posts && posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map(function(post: any, index: number) {
                return (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Link to={'/forum/post/' + post.slug} className="block bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md dark:hover:shadow-black/10 transition-all p-4 md:p-6">
                      <div className="flex items-start space-x-3 md:space-x-4">
                        {/* Author Avatar */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                          {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt={post.author?.full_name || ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">{post.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {post.is_pinned && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">📌 Pinned</span>}
                            {post.is_premium && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">⭐ Premium</span>}
                            {post.category && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: (post.category.color || '#22c55e') + '20', color: post.category.color || '#22c55e' }}>{post.category.name}</span>}
                          </div>
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{post.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{(post.content || '').replace(/<[^>]*>/g, '').substring(0, 200)}...</p>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.tags.map(function(tag: string) { return <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded text-xs">#{tag}</span> })}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                            <span className="font-medium">{post.author?.username || 'Anonymous'}</span><span>•</span><span>{formatTimeAgo(post.created_at)}</span><span>•</span>
                            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>{post.view_count || 0}</span>
                            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>{post.like_count || 0}</span>
                            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{post.comment_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon="💬"
              title="No discussions yet"
              description={debouncedSearch ? 'No discussions match your search.' : 'Be the first to start a discussion!'}
              actionLabel={!debouncedSearch && isAuthenticated ? 'Start a Discussion' : undefined}
              actionLink={!debouncedSearch && isAuthenticated ? '/forum/new' : undefined}
              secondaryActionLabel={debouncedSearch ? 'Clear Search' : !isAuthenticated ? 'Login to Post' : undefined}
              secondaryActionLink={debouncedSearch ? '/forum' : !isAuthenticated ? '/login' : undefined}
              onAction={debouncedSearch ? function() { setSearchQuery('') } : undefined}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">🔥 Popular Discussions</h3>
            <div className="space-y-4">
              {popularPosts?.map(function(post: any) {
                return <Link key={post.id} to={'/forum/post/' + post.slug} className="block group"><h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">{post.title}</h4><div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400"><span>{post.view_count} views</span><span>•</span><span>{post.comment_count} comments</span></div></Link>
              })}
              {(!popularPosts || popularPosts.length === 0) && <p className="text-gray-500 dark:text-gray-400 text-sm">No posts yet</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">📊 Community Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Discussions</span><span className="font-semibold text-gray-900 dark:text-gray-100">{posts?.length || 0}+</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Categories</span><span className="font-semibold text-gray-900 dark:text-gray-100">{categories?.length || 0}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Active Members</span><span className="font-semibold text-gray-900 dark:text-gray-100">1,000+</span></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}