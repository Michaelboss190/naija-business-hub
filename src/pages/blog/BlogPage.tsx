import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import SearchFilters from '@/components/ui/SearchFilters'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { formatDate } from '@/lib/utils'

export default function BlogPage() {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const categories = ['Freelancing', 'Skincare', 'Food Business', 'Marketing', 'Finance', 'Business Growth', 'Technology', 'Success Stories']

  const { data: posts, isLoading, error, refetch } = useSupabaseQuery(
    ['blog-posts', debouncedSearch, selectedCategory],
    function() {
      let query = supabase.from('blog_posts').select('*, author:profiles(username, full_name, avatar_url)').eq('status', 'published').order('published_at', { ascending: false }).limit(20)
      if (debouncedSearch) query = query.or('title.ilike.%' + debouncedSearch + '%,excerpt.ilike.%' + debouncedSearch + '%')
      if (selectedCategory !== 'all') query = query.eq('category', selectedCategory)
      return query
    }
  )

  const { data: featuredPosts } = useSupabaseQuery(
    ['featured-posts'],
    function() { return supabase.from('blog_posts').select('*, author:profiles(username, full_name, avatar_url)').eq('status', 'published').order('view_count', { ascending: false }).limit(3) }
  )

  if (error) {
    return (
      <div className="container-custom py-8">
        <ErrorState title="Failed to load blog" message="There was an error loading articles. Please try again." onRetry={function() { refetch() }} />
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="Blog"
        description="Business insights, tips, and success stories for Nigerian entrepreneurs"
        actions={
          isAuthenticated ? <Link to="/blog/new" className="w-full sm:w-auto"><Button className="w-full">+ Write Article</Button></Link> : undefined
        }
      />

      {featuredPosts && featuredPosts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          {featuredPosts.map(function(post: any) {
            return (
              <Link key={post.id} to={'/blog/' + post.slug} className="group relative bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden hover:shadow-lg dark:hover:shadow-black/20 transition-all">
                <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-4xl">
                  {post.featured_image_url ? <img loading="lazy" src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" /> : <span>📝</span>}
                </div>
                <div className="p-4 md:p-6">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium">{post.category}</span>
                  <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 mt-3 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">{post.title}</h2>
                  {post.excerpt && <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm line-clamp-2">{post.excerpt}</p>}
                  <div className="flex items-center gap-2 mt-4 text-xs md:text-sm text-gray-500 dark:text-gray-400"><span>{post.author?.full_name || 'NaijaBizHub'}</span><span>•</span><span>{formatDate(post.published_at)}</span></div>
                </div>
              </Link>
            )
          })}
        </motion.div>
      )}

      <SearchFilters searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search articles...">
        <select value={selectedCategory} onChange={function(e) { setSelectedCategory(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
          <option value="all">All Categories</option>
          {categories.map(function(c) { return <option key={c} value={c}>{c}</option> })}
        </select>
      </SearchFilters>

      {isLoading ? (
        <GridSkeleton cols={3} rows={2} />
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {posts.map(function(post: any, index: number) {
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link to={'/blog/' + post.slug} className="block bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all overflow-hidden h-full">
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center text-4xl">
                    {post.featured_image_url ? <img loading="lazy" src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" /> : <span>📄</span>}
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">{post.category}</span>
                      {post.is_premium && <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">⭐ Premium</span>}
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{post.title}</h2>
                    {post.excerpt && <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 line-clamp-2">{post.excerpt}</p>}
                    <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 dark:text-gray-400"><span>{post.author?.full_name || 'NaijaBizHub'}</span><span>{formatDate(post.published_at)}</span></div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon="📝"
          title="No articles found"
          description={debouncedSearch ? 'No articles match your search.' : 'Articles will be published soon.'}
          actionLabel={isAuthenticated ? 'Write First Article' : undefined}
          actionLink={isAuthenticated ? '/blog/new' : undefined}
        />
      )}
    </div>
  )
}