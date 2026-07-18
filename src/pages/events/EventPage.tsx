import { useEffect, useState } from 'react'
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
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const eventSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  event_type: z.string().min(1),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  start_date: z.string().min(1),
  start_time: z.string().min(1),
  end_date: z.string().min(1),
  end_time: z.string().min(1),
  max_attendees: z.string().optional(),
  is_premium: z.boolean().optional(),
  is_free: z.boolean().optional(),
  price: z.string().optional(),
})

type EventForm = z.infer<typeof eventSchema>

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function EventPage() {
  const { slug } = useParams()
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showEditForm, setShowEditForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [confirmCancelReg, setConfirmCancelReg] = useState(false)
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState(false)

  const { data: event, isLoading, refetch } = useSupabaseQuery(
    ['event-detail', slug || ''],
    function() { return supabase.from('events').select('*, organizer:profiles(username, full_name, avatar_url)').eq('slug', slug || '').single() },
    { staleTime: 0 }
  )

  const { data: registration, refetch: refetchRegistration } = useSupabaseQuery(
    ['event-registration', event?.id || '', profile?.id || ''],
    function() { return supabase.from('event_registrations').select('*').eq('event_id', event?.id || '').eq('user_id', profile?.id || '').maybeSingle() },
    { enabled: !!event?.id && !!profile?.id, staleTime: 0 }
  )

  const { data: attendees } = useSupabaseQuery(
    ['event-attendees', event?.id || ''],
    function() { return supabase.from('event_registrations').select('user_id').eq('event_id', event?.id || '') },
    { enabled: !!event?.id, staleTime: 0 }
  )

  const { register, handleSubmit, watch, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    values: event ? {
      title: event.title || '', description: event.description || '', event_type: event.event_type || 'online',
      location: event.location || '', meeting_link: event.meeting_link || '',
      start_date: event.start_at ? new Date(event.start_at).toISOString().split('T')[0] : '',
      start_time: event.start_at ? new Date(event.start_at).toTimeString().slice(0, 5) : '',
      end_date: event.end_at ? new Date(event.end_at).toISOString().split('T')[0] : '',
      end_time: event.end_at ? new Date(event.end_at).toTimeString().slice(0, 5) : '',
      max_attendees: event.max_attendees?.toString() || '', is_premium: event.is_premium || false,
      is_free: event.is_free !== false, price: event.price?.toString() || '',
    } : {}
  })

  const eventType = watch('event_type')
  const isOrganizer = profile?.id === event?.organizer_id
  const isPast = event ? new Date(event.end_at) < new Date() : false
  const isRegistered = !!registration
  const isFull = event?.max_attendees ? (event.current_attendees || 0) >= event.max_attendees : false

  useEffect(function() {
    if (event?.id) { supabase.from('events').update({ view_count: (event.view_count || 0) + 1 }).eq('id', event.id).then() }
  }, [event?.id])

  const handleRegister = async () => {
    if (!isAuthenticated) { toast.error('Please login to register'); navigate('/login'); return }
    if (event?.is_premium && !profile?.is_premium) { toast.error('Premium event. Please upgrade.'); navigate('/pricing'); return }
    setIsRegistering(true)
    try {
      const { error } = await supabase.from('event_registrations').insert({ event_id: event?.id, user_id: profile?.id })
      if (error) { if (error.code === '23505') { toast.error('Already registered'); return } else throw error }
      await supabase.from('events').update({ current_attendees: (event?.current_attendees || 0) + 1 }).eq('id', event?.id)
      if (event?.organizer_id && event.organizer_id !== profile?.id) {
        await createNotification({ userId: event.organizer_id, type: 'event', title: 'New Registration', message: (profile?.full_name || 'Someone') + ' registered for: ' + event?.title, data: { event_id: event?.id, event_slug: event?.slug } })
      }
      toast.success('Registered successfully!')
      await Promise.all([refetch(), refetchRegistration()])
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsRegistering(false) }
  }

  const handleCancelRegistration = async () => {
    setConfirmCancelReg(false)
    try {
      await supabase.from('event_registrations').delete().eq('event_id', event?.id).eq('user_id', profile?.id)
      await supabase.from('events').update({ current_attendees: Math.max(0, (event?.current_attendees || 1) - 1) }).eq('id', event?.id)
      toast.success('Registration cancelled')
      await Promise.all([refetch(), refetchRegistration()])
    } catch (error: any) { toast.error(error.message || 'Failed') }
  }

  const onSaveEvent = async (data: EventForm) => {
    if (!isOrganizer) return
    setIsSaving(true)
    try {
      const startAt = new Date(data.start_date + 'T' + data.start_time).toISOString()
      const endAt = new Date(data.end_date + 'T' + data.end_time).toISOString()
      await supabase.from('events').update({
        title: data.title, description: data.description, event_type: data.event_type,
        location: data.location || null, meeting_link: data.meeting_link || null,
        start_at: startAt, end_at: endAt, max_attendees: data.max_attendees ? parseInt(data.max_attendees) : null,
        is_premium: data.is_premium || false, is_free: data.is_free !== undefined ? data.is_free : true,
        price: data.price ? parseFloat(data.price) : null,
      }).eq('id', event?.id)
      if (attendees?.length) {
        for (const att of attendees) {
          if (att.user_id !== profile?.id) {
            await createNotification({ userId: att.user_id, type: 'event', title: 'Event Updated', message: '"' + data.title + '" has been updated.', data: { event_id: event?.id, event_slug: event?.slug } })
          }
        }
      }
      toast.success('Event updated!')
      setShowEditForm(false); refetch()
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsSaving(false) }
  }

  const handleDeleteEvent = async () => {
    setConfirmDeleteEvent(false); setIsDeleting(true)
    try {
      if (attendees?.length) {
        for (const att of attendees) {
          if (att.user_id !== profile?.id) {
            await createNotification({ userId: att.user_id, type: 'event', title: 'Event Cancelled', message: '"' + event?.title + '" has been cancelled.', data: { event_slug: event?.slug } })
          }
        }
      }
      await supabase.from('event_registrations').delete().eq('event_id', event?.id)
      await supabase.from('events').delete().eq('id', event?.id)
      toast.success('Event deleted'); navigate('/events')
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsDeleting(false) }
  }

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="animate-pulse max-w-4xl mx-auto space-y-6">
          <div className="h-6 bg-gray-200 dark:bg-dark-600 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-xl"></div>
          <div className="h-48 bg-gray-200 dark:bg-dark-600 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Event not found</h2>
        <Link to="/events"><Button>Back to Events</Button></Link>
      </div>
    )
  }

  const eventTypeLabel = event.event_type === 'online' ? '🌐 Online' : event.event_type === 'in-person' ? '📍 In-Person' : event.event_type === 'hybrid' ? '🔄 Hybrid' : '📅 Event'
  const locationLabel = event.event_type === 'online' ? '🌐 Online Event' : event.event_type === 'hybrid' ? '🔄 ' + (event.location || 'Hybrid Event') : '📍 ' + (event.location || 'TBA')

  return (
    <div className="container-custom py-8">
      <ConfirmDialog isOpen={confirmCancelReg} title="Cancel Registration" message="Cancel your registration for this event?" confirmLabel="Cancel Registration" onConfirm={handleCancelRegistration} onCancel={function() { setConfirmCancelReg(false) }} />
      <ConfirmDialog isOpen={confirmDeleteEvent} title="Delete Event" message="Delete this event? All registrations will be cancelled." confirmLabel="Delete Event" onConfirm={handleDeleteEvent} onCancel={function() { setConfirmDeleteEvent(false) }} isLoading={isDeleting} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/events" className="hover:text-primary-600 dark:hover:text-primary-400">Events</Link><span>/</span>
          <span className="text-gray-900 dark:text-gray-100 truncate">{event.title}</span>
        </div>

        {showEditForm && isOrganizer && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Edit Event</h3>
            <form onSubmit={handleSubmit(onSaveEvent)} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label><input {...register('title')} className={inputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label><textarea {...register('description')} rows={4} className={textareaClass} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label><select {...register('event_type')} className={selectClass}><option value="online">Online</option><option value="in-person">In-Person</option><option value="hybrid">Hybrid</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{eventType === 'online' ? 'Meeting Link' : 'Location'}</label><input {...register(eventType === 'online' ? 'meeting_link' : 'location')} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label><input type="date" {...register('start_date')} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label><input type="time" {...register('start_time')} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label><input type="date" {...register('end_date')} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time</label><input type="time" {...register('end_time')} className={inputClass} /></div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={function() { setShowEditForm(false) }}>Cancel</Button>
                <Button variant="danger" type="button" onClick={function() { setConfirmDeleteEvent(true) }}>Delete Event</Button>
                <Button type="submit" isLoading={isSaving}>Save Changes</Button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-8 md:p-12 text-white mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{eventTypeLabel}</span>
            {event.is_premium && <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">⭐ Premium</span>}
            {event.is_free ? <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Free</span> : <span className="px-3 py-1 bg-white/20 rounded-full text-sm">₦{event.price}</span>}
            {isPast && <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm">Ended</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{event.title}</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div><p className="text-primary-200 text-sm">Date</p><p className="font-semibold">{formatDate(event.start_at)}{new Date(event.start_at).toDateString() !== new Date(event.end_at).toDateString() ? ' - ' + formatDate(event.end_at) : ''}</p></div>
            <div><p className="text-primary-200 text-sm">Time</p><p className="font-semibold">{new Date(event.start_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p className="text-primary-200 text-sm">Location</p><p className="font-semibold">{locationLabel}</p></div>
            <div><p className="text-primary-200 text-sm">Attendees</p><p className="font-semibold">{event.current_attendees || 0}{event.max_attendees ? ' / ' + event.max_attendees : ''} attending</p></div>
          </div>
          {event.event_type === 'online' && event.meeting_link && !isPast && isRegistered && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg"><p className="text-sm text-primary-200 mb-2">Meeting Link:</p><a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:underline break-all">{event.meeting_link}</a></div>
          )}
          {event.max_attendees && (
            <div className="mt-4"><div className="w-full bg-white/20 rounded-full h-2"><div className="bg-yellow-400 h-2 rounded-full" style={{ width: Math.min(100, ((event.current_attendees || 0) / event.max_attendees) * 100) + '%' }}></div></div><p className="text-xs text-primary-200 mt-1">{Math.max(0, event.max_attendees - (event.current_attendees || 0))} spots left</p></div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">About This Event</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.description}</p>
          {event.organizer && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Organized by</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                  {event.organizer?.avatar_url ? <img src={event.organizer.avatar_url} alt="Image" className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-semibold">{event.organizer?.full_name?.charAt(0)?.toUpperCase() || "U"}</span>}
                </div>
                <div><p className="font-medium text-gray-900 dark:text-gray-100">{event.organizer.full_name}</p><p className="text-sm text-gray-500 dark:text-gray-400">@{event.organizer.username}</p></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-8">
          {isPast ? (
            <div className="text-center"><span className="text-4xl mb-4 block">⏰</span><h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Event ended</h3><p className="text-gray-600 dark:text-gray-400">Took place on {formatDate(event.end_at)}.</p></div>
          ) : isOrganizer ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4"><svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Your Event</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.current_attendees || 0} attending</p>
              <div className="flex justify-center gap-3"><Button variant="outline" size="sm" onClick={function() { setShowEditForm(true) }}>Edit Event</Button><Button variant="danger" size="sm" onClick={function() { setConfirmDeleteEvent(true) }}>Delete</Button></div>
            </div>
          ) : isRegistered ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"><svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Registered! ✅</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{event.event_type === 'online' && event.meeting_link ? <><span>Join: </span><a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Click here</a></> : event.event_type === 'in-person' ? 'See you at ' + (event.location || 'the venue') + '!' : 'Details coming soon.'}</p>
              <Button variant="outline" onClick={function() { setConfirmCancelReg(true) }}>Cancel Registration</Button>
            </div>
          ) : (
            <div className="text-center"><span className="text-4xl mb-4 block">🎟️</span><h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Ready to Join?</h3><p className="text-gray-600 dark:text-gray-400 mb-6">{event.is_free ? 'Free to attend!' : 'Fee: ₦' + event.price}{event.max_attendees ? ' • ' + Math.max(0, event.max_attendees - (event.current_attendees || 0)) + ' spots left' : ''}</p><Button size="lg" onClick={handleRegister} isLoading={isRegistering} disabled={isFull}>{isFull ? 'Event Full' : 'Register Now'}</Button></div>
          )}
        </div>
      </motion.div>
    </div>
  )
}