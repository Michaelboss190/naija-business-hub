import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const topicSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  category_id: z.string().min(1, 'Please select a category'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  tags: z.string().optional(),
  is_premium: z.boolean().optional(),
})

type TopicForm = z.infer<typeof topicSchema>

export default function ForumTopicPage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: categories } = useSupabaseQuery(
    ['forum-categories'],
    function() { return supabase.from('forum_categories').select('*').order('order_index') }
  )

  const { register, handleSubmit, formState: { errors } } = useForm<TopicForm>({
    resolver: zodResolver(topicSchema),
  })

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const onSubmit = async (data: TopicForm) => {
    setIsSubmitting(true)
    try {
      const slug = slugify(data.title) + '-' + Date.now()
      const tagsArray = data.tags ? data.tags.split(',').map(function(t: string) { return t.trim() }).filter(Boolean) : []

      const { data: newPost, error } = await supabase
        .from('forum_posts')
        .insert({
          title: data.title,
          slug: slug,
          content: data.content,
          category_id: data.category_id,
          author_id: profile?.id,
          tags: tagsArray,
          is_premium: data.is_premium || false,
        })
        .select('slug')
        .single()

      if (error) {
        console.error('Insert error:', error)
        throw error
      }

      toast.success('Discussion created successfully!')
      navigate('/forum/post/' + newPost.slug)
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Failed to create discussion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Start a Discussion</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Share your thoughts, ask questions, and connect with the community</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 space-y-5 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select {...register('category_id')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
              <option value="">Select a category</option>
              {categories?.map(function(c: any) {
                return <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              })}
            </select>
            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
            <input {...register('title')} placeholder="What's your discussion about?" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500" />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
            <textarea {...register('content')} rows={8} placeholder="Share your thoughts, experiences, or questions..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 resize-none" />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags <span className="text-gray-400 dark:text-gray-500">(comma separated)</span>
            </label>
            <input {...register('tags')} placeholder="e.g., freelancing, marketing, tips" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500" />
          </div>

          {profile?.is_premium && (
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('is_premium')} className="h-4 w-4 text-primary-600 rounded border-gray-300" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Mark as premium content</label>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-gray-200 dark:border-dark-700">
            <Button variant="outline" type="button" onClick={function() { navigate('/forum') }} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
              Create Discussion
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}