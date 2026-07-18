import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { createNotification } from '@/lib/notifications'
import { formatDate, formatTimeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function VendorPage() {
  const { slug } = useParams()
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [activeTab, setActiveTab] = useState('about')
  const [messageText, setMessageText] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)

  const { data: vendor, isLoading, refetch } = useSupabaseQuery(
    ['vendor', slug || ''],
    function() { return supabase.from('vendors').select('*, owner:profiles(username, full_name, avatar_url)').eq('slug', slug || '').single() },
    { staleTime: 0 }
  )

  const { data: reviews, refetch: refetchReviews } = useSupabaseQuery(
    ['vendor-reviews', vendor?.id || ''],
    function() {
      return supabase.from('reviews').select('*, user:profiles(username, full_name, avatar_url)').eq('vendor_id', vendor?.id || '').order('created_at', { ascending: false }).limit(20)
    },
    { enabled: !!vendor?.id }
  )

  const { data: vendorProducts } = useSupabaseQuery(
    ['vendor-products', vendor?.id || ''],
    function() {
      return supabase.from('resources').select('*').eq('author_id', vendor?.owner_id).eq('status', 'published').limit(6)
    },
    { enabled: !!vendor?.owner_id }
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
      const { error } = await supabase.from('reviews').insert({
        user_id: profile?.id, vendor_id: vendor?.id,
        rating: data.rating, title: data.title, content: data.content,
      })
      if (error) { toast.error(error.message || 'Failed'); return }
      toast.success('Review submitted!')
      setShowReviewForm(false); setSelectedRating(0)
      refetchReviews(); refetch()
      if (vendor?.owner_id && vendor.owner_id !== profile?.id) {
        await createNotification({
          userId: vendor.owner_id, type: 'review',
          title: 'New Review', message: (profile?.full_name || 'Someone') + ' reviewed your business',
          data: { vendor_id: vendor.id, vendor_slug: vendor.slug },
        })
      }
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsSubmitting(false) }
  }

  const handleSendMessage = async () => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return }
    if (!profile?.is_premium) { toast.error('Premium required for direct messaging'); navigate('/pricing'); return }
    if (!messageText.trim()) return
    setIsSendingMessage(true)
    try {
      // Create or find conversation
      const { data: existingConv } = await supabase.from('conversations').select('id')
        .or('and(participant1_id.eq.' + profile?.id + ',participant2_id.eq.' + vendor?.owner_id + '),and(participant1_id.eq.' + vendor?.owner_id + ',participant2_id.eq.' + profile?.id + ')')
        .single()

      let conversationId = existingConv?.id

      if (!conversationId) {
        const { data: newConv } = await supabase.from('conversations').insert({
          participant1_id: profile?.id, participant2_id: vendor?.owner_id,
          last_message_at: new Date().toISOString(),
        }).select('id').single()
        conversationId = newConv?.id
      }

      // Send message
      await supabase.from('messages').insert({
        sender_id: profile?.id, receiver_id: vendor?.owner_id,
        content: messageText,
      })

      // Update conversation timestamp
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId)

      // Notify vendor owner
      await createNotification({
        userId: vendor?.owner_id, type: 'message',
        title: 'New Message', message: (profile?.full_name || 'Someone') + ' sent you a message about ' + vendor?.business_name,
        data: { conversation_id: conversationId },
      })

      toast.success('Message sent!')
      setMessageText(''); setShowContactForm(false)
      navigate('/messages/' + conversationId)
    } catch (error: any) { toast.error(error.message || 'Failed to send') }
    finally { setIsSendingMessage(false) }
  }

  if (isLoading) return (
    <div className="container-custom py-8">
      <div className="animate-pulse max-w-5xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-xl"></div>
        <div className="grid grid-cols-3 gap-6"><div className="h-32 bg-gray-200 dark:bg-dark-600 rounded-xl"></div><div className="h-32 bg-gray-200 dark:bg-dark-600 rounded-xl"></div><div className="h-32 bg-gray-200 dark:bg-dark-600 rounded-xl"></div></div>
      </div>
    </div>
  )

  if (!vendor) return (
    <div className="container-custom py-16 text-center">
      <div className="text-6xl mb-4">🏪</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Vendor not found</h2>
      <Link to="/vendors"><Button>Back to Directory</Button></Link>
    </div>
  )

  const isOwner = profile?.id === vendor?.owner_id
  const ratingCount = reviews?.length || 0
  const avgRating = ratingCount > 0 ? (reviews?.reduce(function(sum: number, r: any) { return sum + (r.rating || 0) }, 0) / ratingCount).toFixed(1) : '0.0'

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/vendors" className="hover:text-primary-600 dark:hover:text-primary-400">Vendor Directory</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100">{vendor.category}</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">{vendor.business_name}</span>
        </div>

        {/* Hero Section */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-40 md:h-56 bg-gradient-to-br from-primary-500 to-primary-700 relative">
            {vendor.cover_image_url && <img src={vendor.cover_image_url} alt="" className="w-full h-full object-cover" />}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {vendor.is_verified && <span className="px-3 py-1 bg-white/90 text-blue-600 rounded-full text-xs font-bold">✓ Verified</span>}
              {vendor.is_premium && <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">⭐ Premium</span>}
            </div>
          </div>

          <div className="px-6 md:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 gap-4 sm:gap-6">
              {/* Logo */}
              <div className="w-28 h-28 md:w-32 md:h-32 bg-white dark:bg-dark-800 rounded-2xl border-4 border-white dark:border-dark-800 shadow-lg flex items-center justify-center text-4xl overflow-hidden flex-shrink-0">
                {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" /> : <span className="text-gray-400 font-bold text-5xl">{(vendor.business_name || 'B')[0]}</span>}
              </div>

              <div className="flex-1 pt-2">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-gray-100">{vendor.business_name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm">{vendor.category}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">📍 {vendor.location}</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(function(s) { return <svg key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> })}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{avgRating} ({ratingCount} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full sm:w-auto">
                {!isOwner && (
                  <>
                    {vendor.phone && <a href={'tel:' + vendor.phone} className="flex-1 sm:flex-none"><Button variant="outline" size="sm" className="w-full">📞 Call</Button></a>}
                    {vendor.whatsapp && <a href={'https://wa.me/' + vendor.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none"><Button variant="outline" size="sm" className="w-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">💬 WhatsApp</Button></a>}
                    <Button size="sm" onClick={function() { setShowContactForm(!showContactForm) }} className="flex-1 sm:flex-none">✉️ Message</Button>
                  </>
                )}
                {isOwner && <Link to="/vendors/register"><Button size="sm" variant="outline">Edit Listing</Button></Link>}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contact Form */}
        {showContactForm && !isOwner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Send Message to {vendor.business_name}</h3>
            <textarea value={messageText} onChange={function(e) { setMessageText(e.target.value) }} rows={3} placeholder="Type your message..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 resize-none mb-3" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={function() { setShowContactForm(false) }}>Cancel</Button>
              <Button size="sm" onClick={handleSendMessage} isLoading={isSendingMessage} disabled={!messageText.trim()}>Send Message</Button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-700 mb-8 overflow-x-auto">
          {[
            { id: 'about', label: 'About', icon: '📋' },
            { id: 'products', label: 'Products/Services', icon: '🛍️' },
            { id: 'reviews', label: 'Reviews (' + ratingCount + ')', icon: '⭐' },
            { id: 'contact', label: 'Contact', icon: '📞' },
          ].map(function(tab) {
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id) }} className={'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ' + (activeTab === tab.id ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300')}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">About {vendor.business_name}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{vendor.description || 'No description provided.'}</p>
              {vendor.website && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Website</p>
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">{vendor.website}</a>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Products & Services</h2>
              {vendorProducts && vendorProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendorProducts.map(function(product: any) {
                    return (
                      <Link key={product.id} to={'/resources/' + product.slug} className="block p-4 rounded-lg border border-gray-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{product.type === 'pdf' ? '📕' : product.type === 'video' ? '🎥' : '📄'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded text-xs">{product.type}</span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{product.title}</h3>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No products listed yet.</p>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reviews ({ratingCount})</h2>
                {isAuthenticated && !isOwner && (
                  <Button size="sm" onClick={function() { setShowReviewForm(!showReviewForm) }}>{showReviewForm ? 'Cancel' : 'Write Review'}</Button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 bg-gray-50 dark:bg-dark-700 rounded-xl border border-gray-200 dark:border-dark-600">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Write Your Review</h3>
                  <form onSubmit={function(e: React.FormEvent) { e.preventDefault(); const t = (document.getElementById('review-title') as HTMLInputElement)?.value || ''; const c = (document.getElementById('review-content') as HTMLTextAreaElement)?.value || ''; if (!t || t.length < 3) { toast.error('Title required'); return }; if (!c || c.length < 10) { toast.error('Review too short'); return }; handleSubmitReview({ rating: selectedRating, title: t, content: c }) }} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label><div className="flex items-center gap-1">{[1,2,3,4,5].map(function(s) { return <button key={s} type="button" onClick={function() { setSelectedRating(s) }} className="text-2xl transition-colors hover:scale-110"><svg className={`w-8 h-8 ${s <= selectedRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></button> })}{selectedRating > 0 && <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{['','Poor','Fair','Good','Very Good','Excellent!'][selectedRating]}</span>}</div></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label><input id="review-title" placeholder="Summary" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review</label><textarea id="review-content" rows={4} placeholder="Share your experience..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 resize-none" /></div>
                    <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={function() { setShowReviewForm(false); setSelectedRating(0) }}>Cancel</Button><Button type="submit" isLoading={isSubmitting}>Submit Review</Button></div>
                  </form>
                </motion.div>
              )}

              {/* Reviews List */}
              {ratingCount > 0 ? (
                <div className="space-y-6">
                  {reviews?.map(function(review: any) {
                    return (
                      <div key={review.id} className="border-b border-gray-100 dark:border-dark-700 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {review.user?.avatar_url ? <img src={review.user.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">{(review.user?.full_name || 'U')[0]?.toUpperCase()}</span>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{review.user?.full_name || 'Anonymous'}</span>
                              <div className="flex items-center">{[1,2,3,4,5].map(function(s) { return <svg key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> })})</div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(review.created_at)}</span>
                            </div>
                            {review.title && <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{review.title}</p>}
                            {review.content && <p className="text-gray-700 dark:text-gray-300 text-sm">{review.content}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8"><p className="text-gray-500 dark:text-gray-400">No reviews yet.</p>{!isAuthenticated && <Link to="/login" className="text-primary-600 dark:text-primary-400 text-sm hover:underline mt-2 inline-block">Login to review</Link>}</div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vendor.phone && (
                  <a href={'tel:' + vendor.phone} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    <span className="text-2xl">📞</span>
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Phone</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.phone}</p></div>
                  </a>
                )}
                {vendor.whatsapp && (
                  <a href={'https://wa.me/' + vendor.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    <span className="text-2xl">💬</span>
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.whatsapp}</p></div>
                  </a>
                )}
                {vendor.email && (
                  <a href={'mailto:' + vendor.email} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <span className="text-2xl">✉️</span>
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Email</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.email}</p></div>
                  </a>
                )}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                  <span className="text-2xl">📍</span>
                  <div><p className="text-sm text-gray-500 dark:text-gray-400">Location</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.location}</p></div>
                </div>
                {vendor.address && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl sm:col-span-2">
                    <span className="text-2xl">🏢</span>
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Address</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.address}</p></div>
                  </div>
                )}
              </div>
              {!isOwner && (
                <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Want to send a quick message?</p>
                  <Button onClick={function() { setShowContactForm(true); setActiveTab('about') }}>✉️ Send Message</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}