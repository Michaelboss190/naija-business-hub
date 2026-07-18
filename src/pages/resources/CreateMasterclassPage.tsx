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

const masterclassSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  is_live: z.boolean().optional(),
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
  const [isUploading, setIsUploading] = useState(false)
  const [lessonCount, setLessonCount] = useState(1)
  // Store uploaded files for each lesson
  const [lessonFiles, setLessonFiles] = useState<Record<number, File | null>>({})
  const [lessonFileNames, setLessonFileNames] = useState<Record<number, string>>({})

  const { register, handleSubmit, formState: { errors } } = useForm<MasterclassForm>({
    resolver: zodResolver(masterclassSchema),
  })

  if (!isAuthenticated) { navigate('/login'); return null }

  const handleVideoFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLessonFiles(function(prev) { return { ...prev, [index]: file } })
      setLessonFileNames(function(prev) { return { ...prev, [index]: file.name } })
    }
  }

  const removeVideoFile = (index: number) => {
    setLessonFiles(function(prev) { return { ...prev, [index]: null } })
    setLessonFileNames(function(prev) { return { ...prev, [index]: '' } })
  }

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = folder + '/' + Date.now() + '-' + Math.random().toString(36).substring(7) + '.' + fileExt
      const { data, error } = await supabase.storage.from('resources').upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('resources').getPublicUrl(data.path)
      return urlData.publicUrl
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message)
      return null
    }
  }

  const onSubmit = async (data: MasterclassForm) => {
    setIsSubmitting(true)
    setIsUploading(true)
    try {
      const slug = slugify(data.title) + '-' + Date.now()

      // Upload videos and collect lesson data
      let totalDuration = 0
      const lessonData = []
      let firstVideoUrl: string | null = null

      for (let i = 0; i < lessonCount; i++) {
        const lessonTitle = (document.getElementById('lesson-title-' + i) as HTMLInputElement)?.value
        const lessonDesc = (document.getElementById('lesson-desc-' + i) as HTMLTextAreaElement)?.value
        const lessonDuration = parseInt((document.getElementById('lesson-duration-' + i) as HTMLInputElement)?.value || '0')
        const videoFile = lessonFiles[i]

        let videoUrl: string | null = null

        // Upload video file if selected
        if (videoFile) {
          toast.loading('Uploading video ' + (i + 1) + '...')
          videoUrl = await uploadFile(videoFile, 'videos')
          if (!videoUrl) {
            toast.error('Failed to upload video for lesson ' + (i + 1))
            continue
          }
          if (!firstVideoUrl) firstVideoUrl = videoUrl
        } else {
          // Check if URL was entered instead
          const urlInput = (document.getElementById('lesson-video-' + i) as HTMLInputElement)?.value
          if (urlInput) videoUrl = urlInput
        }

        if (lessonTitle) {
          lessonData.push({
            title: lessonTitle,
            description: lessonDesc || null,
            video_url: videoUrl,
            duration_minutes: lessonDuration || 0,
            order_index: i,
          })
          totalDuration += lessonDuration || 0
        }
      }

      if (lessonData.length === 0) {
        toast.error('Please add at least one lesson with a title')
        setIsSubmitting(false)
        setIsUploading(false)
        return
      }

      // Auto-generate thumbnail from first video (use a default or the video itself)
      const thumbnailUrl = firstVideoUrl || null

      // Create masterclass
      const { data: newCourse, error: courseError } = await supabase.from('masterclasses').insert({
        title: data.title,
        slug: slug,
        description: data.description,
        instructor_id: profile?.id,
        category: data.category,
        thumbnail_url: thumbnailUrl,
        duration_minutes: totalDuration,
        total_lessons: lessonData.length,
        is_live: data.is_live || false,
        is_premium: true,
        status: 'published',
      }).select('id').single()

      if (courseError) throw courseError

      // Create lessons
      if (lessonData.length > 0 && newCourse) {
        const { error: lessonsError } = await supabase.from('lessons').insert(
          lessonData.map(function(l) { return { ...l, masterclass_id: newCourse.id } })
        )
        if (lessonsError) throw lessonsError
      }

      toast.success('Masterclass created successfully!')
      navigate('/masterclasses/' + slug)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create masterclass')
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
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
          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Title <span className="text-red-500">*</span></label>
            <input {...register('title')} placeholder="e.g., Complete Guide to Starting a Business" className={inputClass} />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Category and Live Toggle */}
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

          {/* Description */}
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
                  <div key={i} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg space-y-3 border border-gray-200 dark:border-dark-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lesson {i + 1}</span>
                      {lessonCount > 1 && (
                        <button type="button" onClick={function() { setLessonCount(lessonCount - 1) }} className="text-red-500 text-sm hover:text-red-600">Remove</button>
                      )}
                    </div>

                    {/* Lesson Title */}
                    <input id={'lesson-title-' + i} placeholder="Lesson title" className={inputClass} />

                    {/* Lesson Description */}
                    <textarea id={'lesson-desc-' + i} rows={2} placeholder="Lesson description (optional)" className={textareaClass} />

                    {/* Video Upload OR URL */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Video</label>
                      
                      {lessonFileNames[i] ? (
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🎥</span>
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{lessonFileNames[i]}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {lessonFiles[i] ? ((lessonFiles[i]?.size || 0) / (1024 * 1024)).toFixed(1) + ' MB' : ''}
                              </p>
                            </div>
                          </div>
                          <button type="button" onClick={function() { removeVideoFile(i) }} className="text-red-500 hover:text-red-600 text-sm">Remove</button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-4 text-center">
                          <label className="cursor-pointer">
                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Upload video (MP4, WebM, MOV)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Max 100MB</p>
                            <input
                              type="file"
                              accept="video/*,.mp4,.webm,.mov,.avi"
                              onChange={function(e) { handleVideoFileChange(i, e) }}
                              className="hidden"
                            />
                          </label>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">OR paste video URL below</div>
                        </div>
                      )}

                      {/* Video URL fallback */}
                      <input
                        id={'lesson-video-' + i}
                        placeholder={lessonFileNames[i] ? 'URL (optional if file uploaded)' : 'Video URL (YouTube/Vimeo/MP4)'}
                        className={inputClass + ' mt-2'}
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Duration (minutes)</label>
                      <input id={'lesson-duration-' + i} type="number" placeholder="e.g., 15" className={inputClass} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-gray-200 dark:border-dark-700">
            <Button variant="outline" type="button" onClick={function() { navigate('/masterclasses') }} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting || isUploading} className="w-full sm:w-auto">
              {isUploading ? 'Uploading Videos...' : 'Create Masterclass'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}