import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

export default function EventsPage() {
  const { isAuthenticated } = useAuth()
  const [filter, setFilter] = useState('upcoming')
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: events, isLoading, error, refetch } = useSupabaseQuery(
    ['events-list', filter, typeFilter],
    function() {
      let query = supabase.from('events').select('*, organizer:profiles(username, full_name, avatar_url)').eq('status', 'published').order('start_at', { ascending: filter === 'upcoming' })
      if (filter === 'upcoming') query = query.gte('start_at', new Date().toISOString())
      else if (filter === 'past') query = query.lt('end_at', new Date().toISOString())
      if (typeFilter !== 'all') query = query.eq('event_type', typeFilter)
      return query.limit(20)
    },
    { staleTime: 0 }
  )

  if (error) return (
    <div className="container-custom py-8">
      <ErrorState title="Failed to load events" message="There was an error loading events." onRetry={function() { refetch() }} />
    </div>
  )

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="Events"
        description="Join workshops, masterclasses, and networking events"
        actions={isAuthenticated ? <Link to="/events/new" className="w-full sm:w-auto"><Button className="w-full">+ Create Event</Button></Link> : undefined}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          <button onClick={function() { setFilter('upcoming') }} className={'px-4 py-2 rounded-md text-sm font-medium transition-colors ' + (filter === 'upcoming' ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 shadow' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100')}>Upcoming</button>
          <button onClick={function() { setFilter('past') }} className={'px-4 py-2 rounded-md text-sm font-medium transition-colors ' + (filter === 'past' ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 shadow' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100')}>Past</button>
        </div>
        <select value={typeFilter} onChange={function(e) { setTypeFilter(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
          <option value="all">All Types</option>
          <option value="online">Online</option>
          <option value="in-person">In-Person</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </motion.div>

      {isLoading ? (
        <GridSkeleton cols={3} rows={2} />
      ) : events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {events.map(function(event: any, index: number) {
            const eventTypeLabel = event.event_type === 'online' ? '🌐 Online' : event.event_type === 'in-person' ? '📍 In-Person' : event.event_type === 'hybrid' ? '🔄 Hybrid' : '📅 Event'
            return (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link to={'/events/' + event.slug} className="block bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all overflow-hidden h-full">
                  <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 relative flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-3xl font-bold">{new Date(event.start_at).getDate()}</div>
                      <div className="text-sm">{new Date(event.start_at).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}</div>
                    </div>
                    {event.is_premium && <span className="absolute top-3 right-3 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">⭐ Premium</span>}
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (event.event_type === 'online' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : event.event_type === 'in-person' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400')}>
                        {eventTypeLabel}
                      </span>
                      {event.is_free ? <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">Free</span> : <span className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">₦{event.price}</span>}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{event.title}</h3>
                    {event.description && <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 line-clamp-2">{event.description}</p>}
                    <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{new Date(event.start_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{event.current_attendees || 0} attending</span>
                    </div>
                    {event.organizer && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-dark-700">
                        <div className="w-6 h-6 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                          {event.organizer?.avatar_url ? <img loading="lazy" src={event.organizer.avatar_url} alt="Image" className="w-full h-full object-cover" /> : <span className="text-gray-500 dark:text-gray-400 text-xs">{event.organizer?.full_name?.charAt(0)?.toUpperCase() || "U"}</span>}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{event.organizer.full_name}</span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="📅" title="No events found" description={filter === 'upcoming' ? 'No upcoming events. Check back soon!' : 'No past events.'} actionLabel={isAuthenticated ? 'Create First Event' : undefined} actionLink={isAuthenticated ? '/events/new' : undefined} />
      )}
    </div>
  )
}