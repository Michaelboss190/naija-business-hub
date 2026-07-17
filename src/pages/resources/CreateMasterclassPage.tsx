import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

const lessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required'),
  description: z.string().optional(),
  video_url: z.string().optional(),
  duration_minutes: z.string().optional(),
})

const masterclassSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  is_live: z.boolean().optional(),
  live_start_at: z.string().optional(),
  lessons: z.array(lessonSchema).optional(),
})

type MasterclassForm = z.infer<typeof masterclassSchema>

const categories = ['Freelancing', 'Skincare', 'Food Business', 'Marketing', 'Finance', 'Business Growth', 'Technology', 'Leadership']

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function CreateMasterclassPage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lessonCount, setLessonCount] = useState(1)

  const { register, handleSubmit, formState: { errors } } = useForm<MasterclassForm>({
    resolver: zodResolver(masterclassSchema),
  })

  if (!isAuthenticated) { navigate('/login'); return null }

  const onSubmit = async (data: MasterclassForm) => {
    setIsSubmitting(true)
    try {
      const slug = slugify(data.title) + '-' + Date.now()

      // Calculate total duration
      let totalDuration = 0
      const lessonData = []
      for (let i = 0; i < lessonCount; i++) {
        const lessonTitle = (document.getElementById('lesson-title-' + i) as HTMLInputElement)?.value
        const lessonDesc = (document.getElementById('lesson-desc-' + i) as HTMLTextAreaElement)?.value
        const lessonVideo = (document.getElementById('lesson-video-' + i) as HTMLInputElement)?.value
        const lessonDuration = parseInt((document.getElementById('lesson-duration-' + i) as HTMLInputElement)?.value || '0')

        if (lessonTitle) {
          lessonData.push({
            title: lessonTitle,
            description: lessonDesc || null,
            video_url: lessonVideo || null,
            duration_minutes: lessonDuration || 0,
            order_index: i,
          })
          totalDuration += lessonDuration || 0
        }
      }

      // Create masterclass
      const { data: newCourse, error: courseError } = await supabase
        .from('masterclasses')
        .insert({
          title: data.title,
          slug: slug,
          description: data.description,
          instructor_id: profile?.id,
          category: data.category,
          duration_minutes: totalDuration,
          total_lessons: lessonData.length,
          is_live: data.is_live || false,
          live_start_at: data.live_start_at || null,
          is_premium: true,
          status: 'published',
        })
        .select('id')
        .single()

      if (courseError) throw courseError

      // Create lessons
      if (lessonData.length > 0 && newCourse) {
        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonData.map(function(l) { return { ...l, masterclass_id: newCourse.id } }))

        if (lessonsError) throw lessonsError
      }

      toast.success('Masterclass created successfully!')
      navigate('/masterclasses/' + slug)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create masterclass')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Create a Masterclass</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Build a course with video lessons for the community</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Title <span className="text-red-500">*</span></label>
            <input {...register('title')} placeholder="e.g., Complete Guide to Starting a Skincare Business" className={inputClass} />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category <span className="text-red-500">*</span></label>
              <select {...register('category')} className={selectClass}>
                <option value="">Select category</option>
                {categories.map(function(c) { return <option key={c} value={c}>{c}</option> })}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input type="checkbox" {...register('is_live')} className="h-4 w-4 text-primary-600 rounded border-gray-300" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Live Course 🔴</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description <span className="text-red-500">*</span></label>
            <textarea {...register('description')} rows={4} placeholder="Describe what students will learn in this course..." className={textareaClass} />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          {/* Lessons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lessons</label>
              <Button type="button" variant="outline" size="sm" onClick={function() { setLessonCount(lessonCount + 1) }}>
                + Add Lesson
              </Button>
            </div>
            <div className="space-y-4">
              {Array.from({ length: lessonCount }, function(_, i) {
                return (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lesson {i + 1}</span>
                      {lessonCount > 1 && (
                        <button type="button" onClick={function() { setLessonCount(lessonCount - 1) }} className="text-red-500 text-sm hover:text-red-600">Remove</button>
                      )}
                    </div>
                    <input id={'lesson-title-' + i} placeholder="Lesson title" className={inputClass} />
                    <textarea id={'lesson-desc-' + i} rows={2} placeholder="Lesson description (optional)" className={textareaClass} />
                    <div className="grid grid-cols-2 gap-3">
                      <input id={'lesson-video-' + i} placeholder="Video URL (optional)" className={inputClass} />
                      <input id={'lesson-duration-' + i} type="number" placeholder="Duration (minutes)" className={inputClass} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-gray-200 dark:border-dark-700">
            <Button variant="outline" type="button" onClick={function() { navigate('/masterclasses') }} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">Create Masterclass</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}