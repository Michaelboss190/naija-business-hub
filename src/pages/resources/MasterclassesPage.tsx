import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { useDebounce } from '@/hooks/useDebounce'
import PageHeader from '@/components/ui/PageHeader'
import SearchFilters from '@/components/ui/SearchFilters'
import { GridSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

export default function MasterclassesPage() {
  const { profile, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const debouncedSearch = useDebounce(searchQuery, 400)
  const categories = ['Freelancing', 'Skincare', 'Food Business', 'Marketing', 'Finance', 'Business Growth', 'Technology', 'Leadership']

  const { data: masterclasses, isLoading, error, refetch } = useSupabaseQuery(
    ['masterclasses', debouncedSearch, selectedCategory],
    function() {
      let query = supabase
        .from('masterclasses')
        .select('*, instructor:profiles(username, full_name, avatar_url)')
        .eq('status', 'published')
        .gt('total_lessons', 0)
        .order('created_at', { ascending: false })
        .limit(30)

      if (debouncedSearch) query = query.or('title.ilike.%' + debouncedSearch + '%,description.ilike.%' + debouncedSearch + '%')
      if (selectedCategory !== 'all') query = query.eq('category', selectedCategory)

      return query
    }
  )

  if (error) return (
    <div className="container-custom py-8">
      <ErrorState title="Failed to load masterclasses" message="There was an error loading courses." onRetry={function() { refetch() }} />
    </div>
  )

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="Masterclasses"
        description="Learn from industry experts through in-depth video courses"
        actions={isAuthenticated ? <Link to="/masterclasses/new" className="w-full sm:w-auto"><Button className="w-full">+ Create Course</Button></Link> : undefined}
      />

      {!profile?.is_premium && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 mb-6 text-center border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ⭐ <Link to="/pricing" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Upgrade to Premium (₦1,000/mo)</Link> to enroll in courses.
          </p>
        </motion.div>
      )}

      <SearchFilters searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search courses...">
        <select value={selectedCategory} onChange={function(e) { setSelectedCategory(e.target.value) }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500">
          <option value="all">All Categories</option>
          {categories.map(function(c) { return <option key={c} value={c}>{c}</option> })}
        </select>
      </SearchFilters>

      {isLoading ? (
        <GridSkeleton cols={3} rows={2} />
      ) : masterclasses && masterclasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {masterclasses.map(function(course: any, index: number) {
            return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link to={'/masterclasses/' + course.slug} className="block bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg dark:hover:shadow-black/20 transition-all h-full">
                  <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 relative flex items-center justify-center">
                    {course.thumbnail_url ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" /> : <span className="text-6xl">🎓</span>}
                    <div className="absolute top-3 left-3 flex space-x-2">
                      {course.is_live && <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">🔴 LIVE</span>}
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">⭐ Premium</span>
                    </div>
                    {course.duration_minutes ? <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white rounded text-xs">{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</div> : null}
                  </div>
                  <div className="p-4 md:p-6">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full text-xs mb-3 inline-block">{course.category}</span>
                    <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{course.title}</h3>
                    {course.description && <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-3 line-clamp-2">{course.description}</p>}
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <span>{course.total_lessons || 0} lessons</span><span>•</span><span>{course.enrollment_count || 0} enrolled</span>
                      </div>
                      {course.rating > 0 && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{course.rating}</span>
                        </span>
                      )}
                    </div>
                    {course.instructor && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-dark-700">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                          {course.instructor?.avatar_url ? <img src={course.instructor.avatar_url} alt={course.instructor?.full_name || ''} className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 text-xs font-semibold">{(course.instructor?.full_name || 'I')[0]?.toUpperCase()}</span>}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{course.instructor.full_name}</span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon="🎓"
          title="No masterclasses found"
          description={debouncedSearch ? 'No courses match your search.' : 'Masterclasses will appear here once created.'}
          actionLabel={isAuthenticated ? 'Create First Course' : undefined}
          actionLink={isAuthenticated ? '/masterclasses/new' : undefined}
        />
      )}
    </div>
  )
}