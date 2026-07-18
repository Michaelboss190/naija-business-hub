import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { profile } = useAuth()

  const { data: post, isLoading } = useSupabaseQuery(['blog-post', slug || ''], function() { return supabase.from('blog_posts').select('*, author:profiles(username, full_name, avatar_url)').eq('slug', slug || '').single() })
  const { data: relatedPosts } = useSupabaseQuery(['related-posts', post?.category || ''], function() { return supabase.from('blog_posts').select('id, title, slug, excerpt, published_at').eq('category', post?.category).neq('id', post?.id).eq('status', 'published').limit(3) }, { enabled: !!post?.category })

  if (isLoading) return <div className="container-custom py-8"><div className="max-w-4xl mx-auto animate-pulse"><div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-xl mb-6"></div></div></div>
  if (!post) return <div className="container-custom py-16 text-center"><div className="text-6xl mb-4">📄</div><h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Article not found</h2><Link to="/blog"><Button>Back to Blog</Button></Link></div>

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6"><Link to="/blog" className="hover:text-primary-600 dark:hover:text-primary-400">Blog</Link><span>/</span><span className="text-gray-900 dark:text-gray-100">{post.category}</span></div>
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4"><span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm">{post.category}</span>{post.is_premium&&<span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">⭐ Premium</span>}</div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">{post.title}</h1>
          <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                {post.author?.avatar_url ? <img loading="lazy" src={post.author.avatar_url} alt={post.author?.full_name || ''} className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-semibold">{(post.author?.full_name || 'N')[0]?.toUpperCase()}</span>}
              </div>
              <span className="font-medium">{post.author?.full_name || 'NaijaBizHub'}</span>
            </div>
            <span>•</span><span>{formatDate(post.published_at)}</span><span>•</span><span>{post.view_count || 0} views</span>
          </div>
        </div>
        {post.featured_image_url && <div className="mb-8 rounded-xl overflow-hidden"><img loading="lazy" src={post.featured_image_url} alt={post.title} className="w-full h-96 object-cover" /></div>}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-8 mb-8"><div className="prose prose-green dark:prose-invert max-w-none"><div dangerouslySetInnerHTML={{ __html: post.content }} /></div></div>
        {post.tags && post.tags.length > 0 && <div className="flex flex-wrap gap-2 mb-8">{post.tags.map(function(tag:string){return <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">#{tag}</span>})}</div>}
        {relatedPosts && relatedPosts.length > 0 && <div className="border-t border-gray-200 dark:border-dark-700 pt-8"><h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Related Articles</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{relatedPosts.map(function(r:any){return <Link key={r.id} to={'/blog/'+r.slug} className="block bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all"><h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{r.title}</h3>{r.excerpt&&<p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{r.excerpt}</p>}</Link>})}</div></div>}
      </motion.div>
    </div>
  )
}