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

const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  event_type: z.string().min(1, 'Please select event type'),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_date: z.string().min(1, 'End date is required'),
  end_time: z.string().min(1, 'End time is required'),
  max_attendees: z.string().optional(),
  is_premium: z.boolean().optional(),
  is_free: z.boolean().optional(),
  price: z.string().optional(),
})

type EventForm = z.infer<typeof eventSchema>

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function CreateEventPage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFree, setIsFree] = useState(true)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { event_type: 'online', is_free: true },
  })

  const eventType = watch('event_type')

  if (!isAuthenticated) { navigate('/login'); return null }

  const onSubmit = async (data: EventForm) => {
    setIsSubmitting(true)
    try {
      const slug = slugify(data.title) + '-' + Date.now()
      const startAt = new Date(data.start_date + 'T' + data.start_time).toISOString()
      const endAt = new Date(data.end_date + 'T' + data.end_time).toISOString()

      const { error } = await supabase.from('events').insert({
        title: data.title, slug: slug, description: data.description, organizer_id: profile?.id,
        event_type: data.event_type, location: data.location || null, meeting_link: data.meeting_link || null,
        start_at: startAt, end_at: endAt, max_attendees: data.max_attendees ? parseInt(data.max_attendees) : null,
        is_premium: data.is_premium || false, is_free: data.is_free !== undefined ? data.is_free : true,
        price: data.price ? parseFloat(data.price) : null, status: 'published',
      })

      if (error) throw error
      toast.success('Event created successfully!')
      navigate('/events/' + slug)
    } catch (error: any) { toast.error(error.message || 'Failed to create event') }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Create an Event</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Host a workshop, masterclass, or networking event</p></div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Title <span className="text-red-500">*</span></label><input {...register('title')} placeholder="e.g., How to Start a Food Business" className={inputClass} />{errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}</div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description <span className="text-red-500">*</span></label><textarea {...register('description')} rows={4} placeholder="Describe what the event is about..." className={textareaClass} />{errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Type <span className="text-red-500">*</span></label><select {...register('event_type')} className={selectClass}><option value="online">Online</option><option value="in-person">In-Person</option><option value="hybrid">Hybrid</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{eventType === 'online' ? 'Meeting Link' : 'Location'}</label><input {...register(eventType === 'online' ? 'meeting_link' : 'location')} placeholder={eventType === 'online' ? 'Zoom/Google Meet link' : 'Venue address'} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date <span className="text-red-500">*</span></label><input type="date" {...register('start_date')} className={inputClass} />{errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time <span className="text-red-500">*</span></label><input type="time" {...register('start_time')} className={inputClass} />{errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date <span className="text-red-500">*</span></label><input type="date" {...register('end_date')} className={inputClass} />{errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time <span className="text-red-500">*</span></label><input type="time" {...register('end_time')} className={inputClass} />{errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Attendees</label><input type="number" {...register('max_attendees')} placeholder="Leave empty for unlimited" className={inputClass} /></div>
            <div className="flex items-center space-x-2 pt-6"><input type="checkbox" {...register('is_free')} checked={isFree} onChange={function(e) { setIsFree(e.target.checked) }} className="h-4 w-4 text-primary-600 rounded" /><label className="text-sm text-gray-700 dark:text-gray-300">Free Event</label></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (₦)</label><input type="number" {...register('price')} placeholder="0" disabled={isFree} className={inputClass} /></div>
          </div>
          {profile?.is_premium && <div className="flex items-center space-x-2"><input type="checkbox" {...register('is_premium')} className="h-4 w-4 text-primary-600 rounded" /><label className="text-sm text-gray-700 dark:text-gray-300">Mark as Premium Event ⭐</label></div>}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-gray-200 dark:border-dark-700"><Button variant="outline" type="button" onClick={function() { navigate('/events') }} className="w-full sm:w-auto">Cancel</Button><Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">Create Event</Button></div>
        </form>
      </motion.div>
    </div>
  )
}