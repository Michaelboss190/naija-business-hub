import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import { formatDate, formatTimeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('posts')

  const { data: posts, refetch: refetchPosts } = useSupabaseQuery(
    ['admin-posts'],
    () => supabase
      .from('forum_posts')
      .select('*, author:profiles(username), category:forum_categories(name)')
      .order('created_at', { ascending: false })
      .limit(50)
  )

  const { data: comments } = useSupabaseQuery(
    ['admin-comments'],
    () => supabase
      .from('forum_comments')
      .select('*, author:profiles(username), post:forum_posts(title)')
      .order('created_at', { ascending: false })
      .limit(50)
  )

  const { data: resources } = useSupabaseQuery(
    ['admin-resources'],
    () => supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
  )

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm(`Delete this ${type}?`)) return

    try {
      const table = type === 'post' ? 'forum_posts' : type === 'comment' ? 'forum_comments' : 'resources'
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      toast.success(`${type} deleted`)
      if (type === 'post') refetchPosts()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Content Management</h1>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1 w-fit">
        {['posts', 'comments', 'resources'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 dark:text-gray-100 shadow' : 'text-gray-600 dark:text-gray-400 dark:text-gray-400'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {activeTab === 'posts' && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 dark:border-dark-700 p-6">
          <div className="space-y-4">
            {posts?.map((post: any) => (
              <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-dark-700 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 dark:hover:bg-dark-700">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      post.status === 'published' ? 'bg-green-100 text-green-700 dark:text-green-400' :
                      post.status === 'flagged' ? 'bg-red-100 text-red-700 dark:text-red-400' :
                      'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 dark:text-gray-300'
                    }`}>
                      {post.status}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{post.category?.name}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{post.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">by {post.author?.username} • {formatTimeAgo(post.created_at)}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDelete('post', post.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {activeTab === 'comments' && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 dark:border-dark-700 p-6">
          <div className="space-y-4">
            {comments?.map((comment: any) => (
              <div key={comment.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-dark-700 dark:border-dark-700">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">on "{comment.post?.title}"</p>
                  <p className="text-gray-900 dark:text-gray-100 dark:text-gray-100">{comment.content}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">by {comment.author?.username} • {formatTimeAgo(comment.created_at)}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDelete('comment', comment.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      {activeTab === 'resources' && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 dark:border-dark-700 p-6">
          <div className="space-y-4">
            {resources?.map((resource: any) => (
              <div key={resource.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-dark-700 dark:border-dark-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{resource.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{resource.type} • {formatDate(resource.created_at)}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDelete('resource', resource.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}