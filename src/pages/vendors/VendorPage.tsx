import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { createNotification } from '@/lib/notifications'

export default function VendorPage() {
  const { slug } = useParams()
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)

  const { data: vendor, isLoading, refetch } = useSupabaseQuery(
    ['vendor', slug || ''],
    function() { return supabase.from('vendors').select('*').eq('slug', slug || '').single() }
  )

  const { data: reviews, refetch: refetchReviews } = useSupabaseQuery(
    ['vendor-reviews', vendor?.id || ''],
    function() {
      return supabase.from('reviews').select('*, user:profiles(username, full_name, avatar_url)').eq('vendor_id', vendor?.id || '').order('created_at', { ascending: false }).limit(20)
    },
    { enabled: !!vendor?.id }
  )

  useEffect(function() {
    if (vendor?.id) {
      supabase.from('vendors').update({ view_count: (vendor.view_count || 0) + 1 }).eq('id', vendor.id).then()
    }
  }, [vendor?.id])

  const handleSubmitReview = async (data: { rating: number; title: string; content: string }) => {
    if (!isAuthenticated) { toast.error('Please login to review'); navigate('/login'); return }
    if (data.rating === 0) { toast.error('Please select a rating'); return }
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({ user_id: profile?.id, vendor_id: vendor?.id, rating: data.rating, title: data.title, content: data.content })
      if (error) { toast.error(error.message || 'Failed to submit review') }
      else { toast.success('Review submitted successfully!'); setShowReviewForm(false); setSelectedRating(0); refetchReviews(); refetch() }
    } catch (error: any) { toast.error(error.message || 'Failed to submit review') }
    finally { setIsSubmitting(false) }
  }

  if (isLoading) return <div className="container-custom py-8"><div className="animate-pulse max-w-4xl mx-auto"><div className="h-48 bg-gray-200 dark:bg-dark-600 rounded-xl mb-6"></div><div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-3/4"></div></div></div>
  if (!vendor) return <div className="container-custom py-16 text-center"><div className="text-6xl mb-4">🏪</div><h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Vendor not found</h2><Link to="/vendors"><Button>Back to Directory</Button></Link></div>

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6"><Link to="/vendors" className="hover:text-primary-600 dark:hover:text-primary-400">Vendor Directory</Link><span>/</span><span className="text-gray-900 dark:text-gray-100">{vendor.business_name}</span></div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-dark-700 rounded-2xl flex items-center justify-center text-3xl md:text-4xl flex-shrink-0 overflow-hidden">
              {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-bold">{(vendor.business_name || 'B')[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap"><h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">{vendor.business_name}</h1>{vendor.is_verified && <span className="text-blue-500"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></span>}</div>
              <p className="text-gray-600 dark:text-gray-400">{vendor.category}{vendor.subcategory ? ' • ' + vendor.subcategory : ''}</p>
              {vendor.rating > 0 && <div className="flex items-center gap-1 mt-2">{[1,2,3,4,5].map(function(s){return <svg key={s} className={`w-5 h-5 ${s<=Math.floor(vendor.rating)?'text-yellow-400':'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>})}<span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{vendor.rating} ({vendor.review_count||0} reviews)</span></div>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vendor.phone && <a href={'tel:'+vendor.phone} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><span className="text-xl">📞</span><div><p className="text-xs text-gray-500 dark:text-gray-400">Phone</p><p className="font-medium text-gray-900 dark:text-gray-100">{vendor.phone}</p></div></a>}
            {vendor.whatsapp && <a href={'https://wa.me/'+vendor.whatsapp.replace(/\D/g,'')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><span className="text-xl">💬</span><div><p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</p><p className="font-medium text-gray-900 dark:text-gray-100">{vendor.whatsapp}</p></div></a>}
            {vendor.email && <a href={'mailto:'+vendor.email} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><span className="text-xl">✉️</span><div><p className="text-xs text-gray-500 dark:text-gray-400">Email</p><p className="font-medium text-gray-900 dark:text-gray-100">{vendor.email}</p></div></a>}
            {vendor.website && <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"><span className="text-xl">🌐</span><div><p className="text-xs text-gray-500 dark:text-gray-400">Website</p><p className="font-medium text-gray-900 dark:text-gray-100 truncate">{vendor.website}</p></div></a>}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"><span className="text-xl">📍</span><div><p className="text-xs text-gray-500 dark:text-gray-400">Location</p><p className="font-medium text-gray-900 dark:text-gray-100">{vendor.location}</p></div></div>
          </div>
        </div>

        {vendor.description && <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 mb-8"><h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">About</h2><p className="text-gray-700 dark:text-gray-300 leading-relaxed">{vendor.description}</p></div>}

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reviews ({(reviews||[]).length})</h2>{isAuthenticated&&!showReviewForm&&<Button onClick={function(){setShowReviewForm(true)}}>Write a Review</Button>}</div>
          {showReviewForm && (
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8 p-6 bg-gray-50 dark:bg-dark-700 rounded-xl border border-gray-200 dark:border-dark-600">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Write Your Review</h3>
              <form onSubmit={function(e:React.FormEvent){e.preventDefault();if(selectedRating===0){toast.error('Please select a rating');return};const t=(document.getElementById('review-title')as HTMLInputElement)?.value||'';const c=(document.getElementById('review-content')as HTMLTextAreaElement)?.value||'';if(!t||t.length<3){toast.error('Title must be at least 3 characters');return};if(!c||c.length<10){toast.error('Review must be at least 10 characters');return};handleSubmitReview({rating:selectedRating,title:t,content:c})}} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label><div className="flex items-center gap-1">{[1,2,3,4,5].map(function(s){return <button key={s} type="button" onClick={function(){setSelectedRating(s)}} className="text-2xl transition-colors hover:scale-110"><svg className={`w-8 h-8 ${s<=selectedRating?'text-yellow-400':'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></button>})}{selectedRating>0&&<span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{selectedRating===5?'Excellent!':selectedRating===4?'Very Good!':selectedRating===3?'Good':selectedRating===2?'Fair':'Poor'}</span>}</div></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label><input id="review-title" placeholder="Summary of your review" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review</label><textarea id="review-content" rows={4} placeholder="Share your experience..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 resize-none" /></div>
                <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={function(){setShowReviewForm(false);setSelectedRating(0)}}>Cancel</Button><Button type="submit" isLoading={isSubmitting}>Submit Review</Button></div>
              </form>
            </motion.div>
          )}
          {(reviews||[]).length>0?<div className="space-y-6">{reviews.map(function(review:any){return <div key={review.id} className="border-b border-gray-100 dark:border-dark-700 last:border-0 pb-6 last:pb-0"><div className="flex items-start gap-3"><div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">{review.user?.avatar_url?<img src={review.user.avatar_url} alt={review.user?.full_name||''} className="w-full h-full object-cover"/>:<span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">{(review.user?.full_name||'U')[0]?.toUpperCase()}</span>}</div><div className="flex-1"><div className="flex items-center gap-2 mb-1 flex-wrap"><span className="font-semibold text-gray-900 dark:text-gray-100">{review.user?.full_name||'Anonymous'}</span><div className="flex items-center">{[1,2,3,4,5].map(function(s){return <svg key={s} className={`w-4 h-4 ${s<=review.rating?'text-yellow-400':'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>})}</div><span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(review.created_at)}</span></div>{review.title&&<p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{review.title}</p>}{review.content&&<p className="text-gray-700 dark:text-gray-300 text-sm">{review.content}</p>}</div></div></div>})}</div>:<div className="text-center py-8"><p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>{!isAuthenticated&&<Link to="/login" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline mt-2 inline-block">Login to write a review</Link>}</div>}
        </div>
      </motion.div>
    </div>
  )
}