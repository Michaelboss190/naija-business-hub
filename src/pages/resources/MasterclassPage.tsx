import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { createNotification } from '@/lib/notifications'
import toast from 'react-hot-toast'

const lessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required'),
  description: z.string().optional(),
  video_url: z.string().optional(),
  duration_minutes: z.string().optional(),
})

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  is_live: z.boolean().optional(),
})

type LessonForm = z.infer<typeof lessonSchema>
type CourseForm = z.infer<typeof courseSchema>

const categories = ['Freelancing', 'Skincare', 'Food Business', 'Marketing', 'Finance', 'Business Growth', 'Technology', 'Leadership']

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function MasterclassPage() {
  const { slug } = useParams()
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [videoWatched, setVideoWatched] = useState<Record<string, boolean>>({})
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [showEditCourse, setShowEditCourse] = useState(false)
  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [isSavingCourse, setIsSavingCourse] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<string | null>(null)
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false)

  const { data: course, isLoading, refetch: refetchCourse } = useSupabaseQuery(
    ['masterclass', slug || ''],
    function() {
      return supabase.from('masterclasses').select('*, instructor:profiles(username, full_name, avatar_url)').eq('slug', slug || '').single()
  },
  { staleTime: 0 }
  )

  const { data: lessons, refetch: refetchLessons } = useSupabaseQuery(
    ['masterclass-lessons', course?.id || ''],
    function() { return supabase.from('lessons').select('*').eq('masterclass_id', course?.id || '').order('order_index', { ascending: true }) },
    { enabled: !!course?.id }
  )

  const { data: progress, refetch: refetchProgress } = useSupabaseQuery(
    ['lesson-progress', course?.id || '', profile?.id || ''],
    function() {
      return supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', profile?.id || '').in('lesson_id', lessons?.map(function(l: any) { return l.id }) || [])
    },
    { enabled: !!course?.id && !!profile?.id && !!lessons }
  )

  const { data: enrollment, refetch: refetchEnrollment } = useSupabaseQuery(
    ['course-enrollment', course?.id || '', profile?.id || ''],
    function() { return supabase.from('course_enrollments').select('id').eq('user_id', profile?.id || '').eq('masterclass_id', course?.id || '').maybeSingle() },
    { enabled: !!course?.id && !!profile?.id, staleTime: 0 }
  )

  const { data: enrolledStudents } = useSupabaseQuery(
    ['enrolled-students', course?.id || ''],
    function() { return supabase.from('course_enrollments').select('user_id').eq('masterclass_id', course?.id || '') },
    { enabled: !!course?.id }
  )

  const isOwner = profile?.id === course?.instructor_id
  const isEnrolled = !!enrollment
  const completedLessons = progress?.filter(function(p: any) { return p.completed }).length || 0
  const totalLessons = lessons?.length || 0
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const { register: registerLesson, handleSubmit: handleLessonSubmit, reset: resetLesson, formState: { errors: lessonErrors } } = useForm<LessonForm>({ resolver: zodResolver(lessonSchema) })
  const { register: registerCourse, handleSubmit: handleCourseSubmit, reset: resetCourse, formState: { errors: courseErrors } } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    values: { title: course?.title || '', description: course?.description || '', category: course?.category || '' },
  })

  useEffect(function() {
    if (course?.id) { supabase.from('masterclasses').update({ view_count: (course.view_count || 0) + 1 }).eq('id', course.id).then() }
  }, [course?.id])

  useEffect(function() {
    if (lessons && lessons.length === 0 && course?.id && isOwner && !isLoading) {
      const deleteEmptyCourse = async () => {
        await supabase.from('course_enrollments').delete().eq('masterclass_id', course.id)
        await supabase.from('masterclasses').delete().eq('id', course.id)
        toast.error('Course deleted because it has no lessons')
        navigate('/masterclasses')
      }
      deleteEmptyCourse()
    }
  }, [lessons?.length, isLoading])

  const handleEnroll = async () => {
    if (!isAuthenticated) { toast.error('Please login to enroll'); navigate('/login'); return }
    if (!profile?.is_premium) { toast.error('Masterclasses are available for premium members'); navigate('/pricing'); return }
    setIsEnrolling(true)
    try {
      const { error } = await supabase.from('course_enrollments').insert({ user_id: profile?.id, masterclass_id: course?.id })
      if (error && error.code !== '23505') throw error
      await supabase.from('masterclasses').update({ enrollment_count: (course?.enrollment_count || 0) + 1 }).eq('id', course?.id)
      if (course?.instructor_id && course.instructor_id !== profile?.id) {
        await createNotification({ userId: course.instructor_id, type: 'event', title: 'New Enrollment', message: (profile?.full_name || 'Someone') + ' enrolled in your course: ' + course.title, data: { course_id: course.id, course_slug: course.slug } })
      }
      toast.success('Enrolled successfully!')
      await Promise.all([refetchCourse(), refetchEnrollment(), refetchProgress()])
    } catch (error: any) { toast.error(error.message || 'Failed to enroll') }
    finally { setIsEnrolling(false) }
  }

  const handleVideoEnded = async (lessonId: string) => {
    if (!isAuthenticated || !profile?.is_premium) return
    if (videoWatched[lessonId]) return
    setVideoWatched(function(prev) { return { ...prev, [lessonId]: true } })
    await markComplete(lessonId)
  }

  const markComplete = async (lessonId: string) => {
    if (!isAuthenticated || !profile?.is_premium) return
    try {
      const { data: existing } = await supabase.from('lesson_progress').select('id').eq('user_id', profile?.id).eq('lesson_id', lessonId).single()
      if (existing) { await supabase.from('lesson_progress').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', existing.id) }
      else { await supabase.from('lesson_progress').insert({ user_id: profile?.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() }) }
      refetchProgress()
      const newCompletedCount = (completedLessons + 1)
      if (newCompletedCount === totalLessons && course?.instructor_id && course.instructor_id !== profile?.id) {
        await createNotification({ userId: course.instructor_id, type: 'event', title: 'Course Completed!', message: (profile?.full_name || 'Someone') + ' completed your course: ' + course.title })
        toast.success('Congratulations! You completed the course! 🎉')
      } else { toast.success('Lesson marked as complete!') }
    } catch (error: any) { console.error('Progress error:', error) }
  }

  const onAddLesson = async (data: LessonForm) => {
    if (!isOwner) return
    setIsAddingLesson(true)
    try {
      const { error } = await supabase.from('lessons').insert({ masterclass_id: course?.id, title: data.title, description: data.description || null, video_url: data.video_url || null, duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : 0, order_index: lessons?.length || 0 })
      if (error) throw error
      await supabase.from('masterclasses').update({ total_lessons: (totalLessons + 1) }).eq('id', course?.id)
      if (enrolledStudents && enrolledStudents.length > 0) {
        for (const student of enrolledStudents) {
          if (student.user_id !== profile?.id) {
            await createNotification({ userId: student.user_id, type: 'event', title: 'New Lesson Added', message: 'A new lesson "' + data.title + '" was added to ' + course?.title, data: { course_id: course?.id, course_slug: course?.slug } })
          }
        }
      }
      toast.success('Lesson added successfully!')
      setShowAddLesson(false); resetLesson(); refetchLessons(); refetchCourse()
    } catch (error: any) { toast.error(error.message || 'Failed to add lesson') }
    finally { setIsAddingLesson(false) }
  }

  const handleDeleteLesson = async () => {
    if (!confirmDeleteLesson || !isOwner) return
    const lessonId = confirmDeleteLesson; setConfirmDeleteLesson(null)
    try {
      await supabase.from('lessons').delete().eq('id', lessonId)
      const newTotal = Math.max(0, totalLessons - 1)
      await supabase.from('masterclasses').update({ total_lessons: newTotal }).eq('id', course?.id)
      if (newTotal === 0) {
        await supabase.from('course_enrollments').delete().eq('masterclass_id', course?.id)
        await supabase.from('masterclasses').delete().eq('id', course?.id)
        toast.success('Course deleted (no lessons remaining)')
        navigate('/masterclasses'); return
      }
      toast.success('Lesson deleted')
      if (activeLesson === lessonId) setActiveLesson(null)
      refetchLessons(); refetchCourse()
    } catch (error: any) { toast.error(error.message || 'Failed to delete lesson') }
  }

  const onSaveCourse = async (data: CourseForm) => {
    if (!isOwner) return
    setIsSavingCourse(true)
    try {
      const { error } = await supabase.from('masterclasses').update({ title: data.title, description: data.description, category: data.category, is_live: data.is_live || false }).eq('id', course?.id)
      if (error) throw error
      toast.success('Course updated!'); setShowEditCourse(false); refetchCourse()
    } catch (error: any) { toast.error(error.message || 'Failed to update course') }
    finally { setIsSavingCourse(false) }
  }

  const handleDeleteCourse = async () => {
    if (!isOwner) return
    setConfirmDeleteCourse(false); setIsDeleting(true)
    try {
      await supabase.from('course_enrollments').delete().eq('masterclass_id', course?.id)
      await supabase.from('lessons').delete().eq('masterclass_id', course?.id)
      await supabase.from('masterclasses').delete().eq('id', course?.id)
      toast.success('Course deleted'); navigate('/masterclasses')
    } catch (error: any) { toast.error(error.message || 'Failed to delete course') }
    finally { setIsDeleting(false) }
  }

  const getYouTubeEmbedUrl = function(url: string) {
    if (!url) return null
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
    if (shortMatch) return 'https://www.youtube.com/embed/' + shortMatch[1] + '?autoplay=0&rel=0'
    const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
    if (watchMatch) return 'https://www.youtube.com/embed/' + watchMatch[1] + '?autoplay=0&rel=0'
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)
    if (embedMatch) return 'https://www.youtube.com/embed/' + embedMatch[1] + '?autoplay=0&rel=0'
    const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/)
    if (vMatch) return 'https://www.youtube.com/embed/' + vMatch[1] + '?autoplay=0&rel=0'
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/)
    if (shortsMatch) return 'https://www.youtube.com/embed/' + shortsMatch[1] + '?autoplay=0&rel=0'
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return 'https://player.vimeo.com/video/' + vimeoMatch[1] + '?autoplay=0'
    return url
  }

  const isYouTubeUrl = function(url: string) { return url && (url.includes('youtube.com') || url.includes('youtu.be')) }
  const isVimeoUrl = function(url: string) { return url && url.includes('vimeo.com') }

  if (isLoading) return <div className="container-custom py-8"><div className="max-w-5xl mx-auto animate-pulse"><div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-xl mb-6"></div></div></div>
  if (!course) return <div className="container-custom py-16 text-center"><div className="text-6xl mb-4">🎓</div><h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Course not found</h2><Link to="/masterclasses"><Button>Back to Masterclasses</Button></Link></div>

  return (
    <div className="container-custom py-8">
      <ConfirmDialog isOpen={!!confirmDeleteLesson} title="Delete Lesson" message="Are you sure you want to delete this lesson?" confirmLabel="Delete Lesson" onConfirm={handleDeleteLesson} onCancel={function() { setConfirmDeleteLesson(null) }} />
      <ConfirmDialog isOpen={confirmDeleteCourse} title="Delete Course" message="Delete this entire course? All lessons, enrollments, and progress will be permanently deleted." confirmLabel="Delete Course" onConfirm={handleDeleteCourse} onCancel={function() { setConfirmDeleteCourse(false) }} isLoading={isDeleting} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6"><Link to="/masterclasses" className="hover:text-primary-600 dark:hover:text-primary-400">Masterclasses</Link><span>/</span><span className="text-gray-900 dark:text-gray-100 truncate">{course.title}</span></div>

        {showEditCourse && isOwner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Edit Course</h3>
            <form onSubmit={handleCourseSubmit(onSaveCourse)} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label><input {...registerCourse('title')} className={inputClass} />{courseErrors.title && <p className="mt-1 text-sm text-red-600">{courseErrors.title.message}</p>}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label><select {...registerCourse('category')} className={selectClass}><option value="">Select</option>{categories.map(function(c){return <option key={c} value={c}>{c}</option>})}</select></div><div className="flex items-center space-x-2 pt-6"><input type="checkbox" {...registerCourse('is_live')} className="h-4 w-4 text-primary-600 rounded" /><label className="text-sm text-gray-700 dark:text-gray-300">Live Course 🔴</label></div></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label><textarea {...registerCourse('description')} rows={4} className={textareaClass} /></div>
              <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={function(){setShowEditCourse(false)}}>Cancel</Button><Button variant="danger" type="button" onClick={function(){setConfirmDeleteCourse(true)}}>Delete Course</Button><Button type="submit" isLoading={isSavingCourse}>Save Changes</Button></div>
            </form>
          </motion.div>
        )}

        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-8 md:p-12 text-white mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4"><span className="px-3 py-1 bg-white/20 rounded-full text-sm">{course.category}</span>{course.is_live&&<span className="px-3 py-1 bg-red-500 rounded-full text-sm animate-pulse">🔴 Live</span>}<span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">⭐ Premium</span></div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{course.title}</h1>
          {course.description&&<p className="text-primary-100 text-lg mb-6">{course.description}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><p className="text-primary-200 text-sm">Duration</p><p className="font-semibold">{course.duration_minutes?Math.floor(course.duration_minutes/60)+'h '+course.duration_minutes%60+'m':'Self-paced'}</p></div><div><p className="text-primary-200 text-sm">Lessons</p><p className="font-semibold">{totalLessons} lessons</p></div><div><p className="text-primary-200 text-sm">Enrolled</p><p className="font-semibold">{course.enrollment_count||0} students</p></div><div><p className="text-primary-200 text-sm">Rating</p><p className="font-semibold">⭐ {course.rating||'New'}</p></div></div>
          {isEnrolled&&progressPercent>0&&<div className="mt-6"><div className="flex items-center justify-between mb-2"><span className="text-sm text-primary-200">Your Progress</span><span className="text-sm font-semibold">{progressPercent}%</span></div><div className="w-full bg-white/20 rounded-full h-2"><div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{width:progressPercent+'%'}}></div></div></div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Course Content</h2>{isOwner&&<Button size="sm" onClick={function(){setShowAddLesson(!showAddLesson)}}>{showAddLesson?'Cancel':'+ Add Lesson'}</Button>}</div>
              {showAddLesson&&isOwner&&<motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600"><form onSubmit={handleLessonSubmit(onAddLesson)} className="space-y-3"><input {...registerLesson('title')} placeholder="Lesson title" className={inputClass} />{lessonErrors.title&&<p className="text-sm text-red-600">{lessonErrors.title.message}</p>}<textarea {...registerLesson('description')} rows={2} placeholder="Description (optional)" className={textareaClass} /><div className="grid grid-cols-2 gap-3"><input {...registerLesson('video_url')} placeholder="Video URL (YouTube/Vimeo/MP4)" className={inputClass} /><input {...registerLesson('duration_minutes')} type="number" placeholder="Duration (minutes)" className={inputClass} /></div><Button type="submit" isLoading={isAddingLesson} size="sm">Add Lesson</Button></form></motion.div>}
              <div className="space-y-3">
                {lessons?.map(function(lesson:any,index:number){const isCompleted=progress?.find(function(p:any){return p.lesson_id===lesson.id})?.completed;const isActive=activeLesson===lesson.id;const embedUrl=getYouTubeEmbedUrl(lesson.video_url||'');return(<div key={lesson.id}><div className="flex items-center gap-2"><button onClick={function(){setActiveLesson(isActive?null:lesson.id)}} className={'flex-1 text-left p-4 rounded-lg transition-colors '+(isActive?'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800':'hover:bg-gray-50 dark:hover:bg-dark-700 border border-transparent')}><div className="flex items-center space-x-3"><div className={'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 '+(isCompleted?'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400':'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400')}>{isCompleted?<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>:<span className="text-sm font-medium">{index+1}</span>}</div><div className="flex-1"><h3 className="font-medium text-gray-900 dark:text-gray-100">{lesson.title}</h3>{lesson.duration_minutes?<p className="text-sm text-gray-500 dark:text-gray-400">{lesson.duration_minutes} min</p>:null}</div>{lesson.is_preview&&<span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">Preview</span>}{lesson.video_url&&<span className="text-lg">▶️</span>}</div></button>{isOwner&&<button onClick={function(){setConfirmDeleteLesson(lesson.id)}} className="text-red-500 hover:text-red-600 p-2 flex-shrink-0" title="Delete lesson"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>}</div>{isActive&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} className="ml-11 mt-2 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">{lesson.description&&<p className="text-gray-700 dark:text-gray-300 mb-4">{lesson.description}</p>}{lesson.video_url&&<div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden relative">{isYouTubeUrl(lesson.video_url)?<iframe src={embedUrl||''} className="w-full h-full absolute inset-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen title={lesson.title}/>:isVimeoUrl(lesson.video_url)?<iframe src={embedUrl||''} className="w-full h-full absolute inset-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={lesson.title}/>:lesson.video_url.match(/\.(mp4|webm|ogg|mov)$/i)?<video src={lesson.video_url} controls className="w-full h-full absolute inset-0" onEnded={function(){handleVideoEnded(lesson.id)}} onTimeUpdate={function(e){const v=e.currentTarget;if(v.duration&&v.currentTime>=v.duration*0.9)handleVideoEnded(lesson.id)}} playsInline><p>Your browser does not support video.</p></video>:<div className="flex items-center justify-center h-full text-white"><div className="text-center p-6"><span className="text-4xl mb-3 block">🎥</span><a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline text-sm">Open video</a></div></div>}</div>}{profile?.is_premium&&isEnrolled&&!isCompleted&&<Button size="sm" onClick={function(){markComplete(lesson.id)}}>Mark as Complete</Button>}{isCompleted&&<p className="text-green-600 dark:text-green-400 text-sm font-medium">✅ Completed</p>}</motion.div>}</div>)})}
                {(!lessons||lessons.length===0)&&<p className="text-gray-500 dark:text-gray-400 text-center py-4">No lessons yet</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {course.instructor&&<div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6"><h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Instructor</h3><div className="flex items-center space-x-3"><div className="w-12 h-12 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">{course.instructor?.avatar_url?<img src={course.instructor.avatar_url} alt={course.instructor?.full_name||''} className="w-full h-full object-cover"/>:<span className="text-gray-600 dark:text-gray-400 font-semibold">{(course.instructor?.full_name||'I')[0]?.toUpperCase()}</span>}</div><div><p className="font-semibold text-gray-900 dark:text-gray-100">{course.instructor.full_name}</p><p className="text-sm text-gray-500 dark:text-gray-400">@{course.instructor.username}</p></div></div>{isOwner&&<div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700"><Button variant="outline" size="sm" onClick={function(){setShowEditCourse(true)}} className="w-full">Edit Course</Button></div>}</div>}

            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
              {isOwner ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4"><svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Your Course</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{course.enrollment_count||0} students enrolled</p>
                  <Button variant="outline" size="sm" onClick={function(){setShowEditCourse(true)}} className="w-full">Edit Course</Button>
                </div>
              ) : !profile?.is_premium ? (
                <div className="text-center"><span className="text-3xl mb-3 block">⭐</span><p className="text-gray-600 dark:text-gray-400 mb-4">Premium membership required</p><Link to="/pricing"><Button className="w-full">Upgrade - ₦1,000/mo</Button></Link></div>
              ) : isEnrolled ? (
                <div className="text-center"><div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"><svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg></div><p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Enrolled!</p><p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{progressPercent}% complete</p><div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2 mb-4"><div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{width:progressPercent+'%'}}></div></div></div>
              ) : (
                <Button onClick={handleEnroll} isLoading={isEnrolling} className="w-full" size="lg">Enroll Now - Start Learning</Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}