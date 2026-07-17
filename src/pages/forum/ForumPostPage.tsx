import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { formatDate, formatTimeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'
import { createNotification } from '@/lib/notifications'

export default function ForumPostPage() {
  const { postSlug } = useParams()
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: post, isLoading } = useSupabaseQuery(
    ['forum-post', postSlug || ''],
    async function() {
      const result = await supabase
        .from('forum_posts')
        .select('*, author:profiles(username, avatar_url, full_name), category:forum_categories(name, slug, color)')
        .eq('slug', postSlug || '')
        .maybeSingle()
      return result
    }
  )

  const { data: comments, refetch: refetchComments } = useSupabaseQuery(
    ['post-comments', post?.id || ''],
    function() {
      return supabase
        .from('forum_comments')
        .select('*, author:profiles(username, avatar_url, full_name)')
        .eq('post_id', post?.id || '')
        .is('parent_id', null)
        .order('created_at', { ascending: true })
    },
    { enabled: !!post?.id }
  )

  const { data: allReplies } = useSupabaseQuery(
    ['post-replies', post?.id || ''],
    function() {
      return supabase
        .from('forum_comments')
        .select('*, author:profiles(username, avatar_url, full_name)')
        .eq('post_id', post?.id || '')
        .not('parent_id', 'is', null)
        .order('created_at', { ascending: true })
    },
    { enabled: !!post?.id }
  )

  const { data: userLike } = useSupabaseQuery(
    ['post-like', post?.id || '', profile?.id || ''],
    function() {
      return supabase.from('likes').select('id').eq('post_id', post?.id || '').eq('user_id', profile?.id || '').maybeSingle()
    },
    { enabled: !!post?.id && !!profile?.id }
  )

  useEffect(function() {
    if (post?.id) {
      supabase.from('forum_posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', post.id).then()
    }
  })

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Please login to like posts'); navigate('/login'); return }
    try {
      if (userLike) { await supabase.from('likes').delete().eq('id', userLike.id); toast.success('Like removed') }
      else { await supabase.from('likes').insert({ user_id: profile?.id, post_id: post?.id }); toast.success('Post liked!') }
      refetchComments()
    } catch (error: any) { toast.error(error.message || 'Failed') }
  }

  const handleSubmitComment = async (parentId: string | null = null) => {
    if (!isAuthenticated) { toast.error('Please login to comment'); navigate('/login'); return }
    const content = parentId ? replyContent : newComment
    if (!content.trim()) { toast.error('Comment cannot be empty'); return }
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('forum_comments').insert({ post_id: post?.id, author_id: profile?.id, content, parent_id: parentId })
      if (error) throw error
      toast.success('Comment posted!')
      if (parentId) { setReplyContent(''); setReplyTo(null) } else { setNewComment('') }
      refetchComments()
    } catch (error: any) { toast.error(error.message || 'Failed to post comment') }
    finally { setIsSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try { await supabase.from('forum_posts').delete().eq('id', post?.id); toast.success('Post deleted'); navigate('/forum') }
    catch (error: any) { toast.error(error.message || 'Failed') }
  }

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded"></div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-6xl mb-4">??</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Post not found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">This discussion may have been removed or doesn't exist.</p>
        <Link to="/forum"><Button>Back to Forum</Button></Link>
      </div>
    )
  }

  const replies = allReplies || []

  return (
    <div className="container-custom py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/forum" className="hover:text-primary-600 dark:hover:text-primary-400">Forum</Link><span>/</span>
          <Link to={'/forum/category/' + (post.category?.slug || '')} className="hover:text-primary-600 dark:hover:text-primary-400">{post.category?.name || 'Category'}</Link><span>/</span>
          <span className="text-gray-900 dark:text-gray-100 truncate">{post.title}</span>
        </div>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                {post.author?.avatar_url ? (
                  <img src={post.author.avatar_url} alt={post.author?.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">{post.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{post.author?.full_name || 'Anonymous'}</span>
                  {profile?.is_premium && <span className="text-yellow-500">?</span>}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">@{post.author?.username || 'user'} · {formatDate(post.created_at)}</div>
              </div>
            </div>
            {profile?.id === post.author_id && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">Edit</Button>
                <Button variant="danger" size="sm" onClick={handleDelete} className="flex-1 sm:flex-none">Delete</Button>
              </div>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {post.category && <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: (post.category.color || '#22c55e') + '20', color: post.category.color || '#22c55e' }}>{post.category.name}</span>}
            {post.is_premium && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">? Premium</span>}
            {post.tags?.map(function(tag: string) { return <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">#{tag}</span> })}
          </div>

          <div className="prose prose-green dark:prose-invert max-w-none mb-6"><div dangerouslySetInnerHTML={{ __html: post.content }} /></div>

          <div className="flex items-center space-x-4 md:space-x-6 pt-6 border-t border-gray-100 dark:border-dark-700">
            <button onClick={handleLike} className={'flex items-center space-x-2 text-sm transition-colors ' + (userLike ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500')}>
              <svg className="w-5 h-5" fill={userLike ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <span>{post.like_count || 0} Likes</span>
            </button>
            <span className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg><span>{post.comment_count || 0} Comments</span></span>
            <span className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg><span>{post.view_count || 0} Views</span></span>
          </div>
        </motion.article>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Comments ({(comments || []).length})</h2>

          {isAuthenticated ? (
            <div className="mb-8">
              <textarea value={newComment} onChange={function(e) { setNewComment(e.target.value) }} placeholder="Share your thoughts..." rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 resize-none" />
              <div className="flex justify-end mt-3"><Button onClick={function() { handleSubmitComment(null) }} isLoading={isSubmitting} disabled={!newComment.trim()}>Post Comment</Button></div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg text-center"><p className="text-gray-600 dark:text-gray-400 mb-2">Please login to join the discussion</p><Link to="/login"><Button size="sm">Login</Button></Link></div>
          )}

          <div className="space-y-6">
            {(comments || []).map(function(comment: any) {
              const commentReplies = replies.filter(function(r: any) { return r.parent_id === comment.id })
              return (
                <div key={comment.id} className="border-b border-gray-100 dark:border-dark-700 last:border-0 pb-6 last:pb-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {comment.author?.avatar_url ? (
                        <img src={comment.author.avatar_url} alt={comment.author?.full_name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">{comment.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.author?.full_name || 'Anonymous'}</span>
                        {profile?.is_premium && <span className="text-yellow-500 text-sm">?</span>}
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{comment.content}</p>
                      <div className="flex items-center space-x-4">
                        <button onClick={function() { setReplyTo(replyTo === comment.id ? null : comment.id) }} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Reply</button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{commentReplies.length} replies</span>
                      </div>
                      {commentReplies.length > 0 && (
                        <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-100 dark:border-dark-700">
                          {commentReplies.map(function(reply: any) {
                            return (
                              <div key={reply.id} className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {reply.author?.avatar_url ? (
                                    <img src={reply.author.avatar_url} alt={reply.author?.full_name || ''} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold">{reply.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{reply.author?.full_name || 'Anonymous'}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(reply.created_at)}</span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 text-sm">{reply.content}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {replyTo === comment.id && (
                        <div className="mt-4 pl-6">
                          <textarea value={replyContent} onChange={function(e) { setReplyContent(e.target.value) }} placeholder="Write a reply..." rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm resize-none focus:ring-2 focus:ring-primary-500" />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button variant="ghost" size="sm" onClick={function() { setReplyTo(null); setReplyContent('') }}>Cancel</Button>
                            <Button size="sm" onClick={function() { handleSubmitComment(comment.id) }} isLoading={isSubmitting} disabled={!replyContent.trim()}>Reply</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {(!comments || comments.length === 0) && <div className="text-center py-8 text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</div>}
          </div>
        </motion.div>
      </div>
    </div>
  )
}