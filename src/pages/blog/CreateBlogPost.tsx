import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

const blogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters').max(300),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  tags: z.string().optional(),
  is_premium: z.boolean().optional(),
})

type BlogForm = z.infer<typeof blogSchema>

const categories = ['Freelancing', 'Skincare', 'Food Business', 'Marketing', 'Finance', 'Business Growth', 'Technology', 'Success Stories']

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function CreateBlogPost() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<BlogForm>({
    resolver: zodResolver(blogSchema),
  })

  if (!isAuthenticated) { navigate('/login'); return null }

  const onSubmit = async (data: BlogForm) => {
    setIsSubmitting(true)
    try {
      const slug = slugify(data.title) + '-' + Date.now()
      const tagsArray = data.tags ? data.tags.split(',').map(function(t: string) { return t.trim() }).filter(Boolean) : []

      const { error } = await supabase.from('blog_posts').insert({
        title: data.title,
        slug: slug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        author_id: profile?.id,
        tags: tagsArray,
        is_premium: data.is_premium || false,
        status: 'published',
        published_at: new Date().toISOString(),
      })

      if (error) throw error
      toast.success('Blog post published!')
      navigate('/blog/' + slug)
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Write a Blog Post</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Share your knowledge and insights with the community</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
            <input {...register('title')} placeholder="Enter your blog title" className={inputClass} />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
              <select {...register('category')} className={selectClass}>
                <option value="">Select category</option>
                {categories.map(function(c) { return <option key={c} value={c}>{c}</option> })}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (comma separated)</label>
              <input {...register('tags')} placeholder="e.g., business, marketing, tips" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Excerpt *</label>
            <textarea {...register('excerpt')} rows={2} placeholder="A short summary of your post (shown in previews)" className={textareaClass} />
            {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content *</label>
            <textarea {...register('content')} rows={15} placeholder="Write your blog post content here..." className={textareaClass} />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
          </div>

          {profile?.is_premium && (
            <div className="flex items-center space-x-2">
              <input type="checkbox" {...register('is_premium')} className="h-4 w-4 text-primary-600 rounded" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Mark as premium content ⭐</label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-dark-700">
            <Button variant="outline" type="button" onClick={function() { navigate('/blog') }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Publish Post</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}