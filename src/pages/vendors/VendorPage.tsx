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
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [productTitle, setProductTitle] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [chatProductId, setChatProductId] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')

  const { data: vendor, isLoading, refetch } = useSupabaseQuery(
    ['vendor', slug || ''],
    function() { return supabase.from('vendors').select('*, owner:profiles!owner_id(username, full_name, avatar_url)').eq('slug', slug || '').single() },
    { staleTime: 0 }
  )

  const { data: reviews, refetch: refetchReviews } = useSupabaseQuery(
    ['vendor-reviews', vendor?.id || ''],
    function() { return supabase.from('reviews').select('*, user:profiles(username, full_name, avatar_url)').eq('vendor_id', vendor?.id || '').order('created_at', { ascending: false }).limit(20) },
    { enabled: !!vendor?.id }
  )

  const { data: products, refetch: refetchProducts } = useSupabaseQuery(
    ['vendor-products', vendor?.id || ''],
    function() { return supabase.from('vendor_products').select('*').eq('vendor_id', vendor?.id || '').order('created_at', { ascending: false }) },
    { enabled: !!vendor?.id }
  )

  useEffect(function() {
    if (vendor?.id) { supabase.from('vendors').update({ view_count: (vendor.view_count || 0) + 1 }).eq('id', vendor.id).then() }
  }, [vendor?.id])

  const isOwner = profile?.id === vendor?.owner_id
  const ratingCount = reviews?.length || 0
  const avgRating = ratingCount > 0 ? (reviews?.reduce(function(sum: number, r: any) { return sum + (r.rating || 0) }, 0) / ratingCount).toFixed(1) : '0.0'

  const handleSubmitReview = async (data: { rating: number; title: string; content: string }) => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return }
    if (data.rating === 0) { toast.error('Select a rating'); return }
    setIsSubmitting(true)
    try {
      await supabase.from('reviews').insert({ user_id: profile?.id, vendor_id: vendor?.id, rating: data.rating, title: data.title, content: data.content })
      toast.success('Review submitted!')
      setShowReviewForm(false); setSelectedRating(0); refetchReviews(); refetch()
      if (vendor?.owner_id && vendor.owner_id !== profile?.id) {
        await createNotification({ userId: vendor.owner_id, type: 'review', title: 'New Review', message: (profile?.full_name || 'Someone') + ' reviewed your business', data: { vendor_id: vendor.id } })
      }
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsSubmitting(false) }
  }

  const handleSendMessage = async (productId?: string) => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return }
    if (!profile?.is_premium) { toast.error('Premium required for messaging'); navigate('/pricing'); return }
    const msg = productId ? chatMessage : messageText
    if (!msg.trim()) return
    setIsSendingMessage(true)
    try {
      let { data: existingConv } = await supabase.from('conversations').select('id')
        .or('and(participant1_id.eq.' + profile?.id + ',participant2_id.eq.' + vendor?.owner_id + '),and(participant1_id.eq.' + vendor?.owner_id + ',participant2_id.eq.' + profile?.id + ')')
        .single()

      let conversationId = existingConv?.id
      if (!conversationId) {
        const { data: newConv } = await supabase.from('conversations').insert({ participant1_id: profile?.id, participant2_id: vendor?.owner_id, last_message_at: new Date().toISOString() }).select('id').single()
        conversationId = newConv?.id
      }

      const fullMessage = productId ? '[About: ' + (products?.find(function(p: any) { return p.id === productId })?.title || 'Product') + '] ' + msg : msg

      await supabase.from('messages').insert({ sender_id: profile?.id, receiver_id: vendor?.owner_id, content: fullMessage })
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId)

      await createNotification({ userId: vendor?.owner_id, type: 'message', title: 'New Message', message: (profile?.full_name || 'Someone') + ' sent you a message', data: { conversation_id: conversationId } })

      toast.success('Message sent!')
      setMessageText(''); setChatMessage(''); setShowContactForm(false); setChatProductId(null)
      navigate('/messages/' + conversationId)
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsSendingMessage(false) }
  }

  const handleAddProduct = async () => {
    if (!isOwner) return
    if (!productTitle.trim()) { toast.error('Product title required'); return }
    setIsAddingProduct(true)
    try {
      await supabase.from('vendor_products').insert({ vendor_id: vendor?.id, title: productTitle, description: productDesc, price: productPrice ? parseFloat(productPrice) : null })
      toast.success('Product added!')
      setProductTitle(''); setProductDesc(''); setProductPrice(''); setShowAddProduct(false)
      refetchProducts()
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsAddingProduct(false) }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!isOwner) return
    try {
      await supabase.from('vendor_products').delete().eq('id', productId)
      toast.success('Product removed')
      refetchProducts()
    } catch (error: any) { toast.error(error.message || 'Failed') }
  }

  if (isLoading) return <div className="container-custom py-8"><div className="animate-pulse max-w-5xl mx-auto space-y-6"><div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-1/4"></div><div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-xl"></div></div></div>
  if (!vendor) return <div className="container-custom py-16 text-center"><div className="text-6xl mb-4">🏪</div><h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Vendor not found</h2><Link to="/vendors"><Button>Back to Directory</Button></Link></div>

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link to="/vendors" className="hover:text-primary-600 dark:hover:text-primary-400">Vendor Directory</Link><span>/</span><span className="text-gray-900 dark:text-gray-100 font-medium">{vendor.business_name}</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden mb-8">
          <div className="h-40 md:h-56 bg-gradient-to-br from-primary-500 to-primary-700 relative flex items-end p-6">
            <div className="absolute top-4 right-4 flex gap-2">
              {vendor.is_verified && <span className="px-3 py-1 bg-white/90 text-blue-600 rounded-full text-xs font-bold">✓ Verified</span>}
              {vendor.is_premium && <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">⭐ Premium</span>}
            </div>
          </div>
          <div className="px-6 md:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 gap-4 sm:gap-6">
              <div className="w-28 h-28 md:w-32 md:h-32 bg-white dark:bg-dark-800 rounded-2xl border-4 border-white dark:border-dark-800 shadow-lg flex items-center justify-center text-4xl overflow-hidden flex-shrink-0">
                {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" /> : <span className="text-gray-400 dark:text-gray-500 font-bold text-5xl">{(vendor.business_name || 'B')[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex-1 pt-2">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-gray-100">{vendor.business_name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm">{vendor.category}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">📍 {vendor.location}</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(function(s) { return <svg key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> })}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{avgRating} ({ratingCount})</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {!isOwner && (
                  <>
                    {vendor.phone && <a href={'tel:' + vendor.phone}><Button variant="outline" size="sm">📞 Call</Button></a>}
                    {vendor.whatsapp && <a href={'https://wa.me/' + vendor.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">💬 WhatsApp</Button></a>}
                    <Button size="sm" onClick={function() { setShowContactForm(!showContactForm) }}>✉️ Message</Button>
                  </>
                )}
                {isOwner && <Link to="/vendors/register"><Button size="sm" variant="outline">✏️ Edit Listing</Button></Link>}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        {showContactForm && !isOwner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Send Message to {vendor.business_name}</h3>
            <textarea value={messageText} onChange={function(e) { setMessageText(e.target.value) }} rows={3} placeholder="Type your message..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 resize-none mb-3" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={function() { setShowContactForm(false) }}>Cancel</Button>
              <Button size="sm" onClick={function() { handleSendMessage() }} isLoading={isSendingMessage} disabled={!messageText.trim()}>Send Message</Button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-700 mb-8 overflow-x-auto">
          {[
            { id: 'about', label: 'About', icon: '📋' },
            { id: 'products', label: 'Products (' + (products?.length || 0) + ')', icon: '🛍️' },
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
          {/* About */}
          {activeTab === 'about' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">About {vendor.business_name}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{vendor.description || 'No description provided.'}</p>
              {vendor.owner && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Business Owner</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                      {vendor.owner?.avatar_url ? <img src={vendor.owner.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-semibold">{(vendor.owner?.full_name || 'U')[0]?.toUpperCase()}</span>}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{vendor.owner?.full_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{vendor.owner?.username}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products */}
          {activeTab === 'products' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Products & Services</h2>
                {isOwner && (
                  <Button size="sm" onClick={function() { setShowAddProduct(!showAddProduct) }}>{showAddProduct ? 'Cancel' : '+ Add Product'}</Button>
                )}
              </div>

              {isOwner && showAddProduct && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600 space-y-3">
                  <input value={productTitle} onChange={function(e) { setProductTitle(e.target.value) }} placeholder="Product name" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" />
                  <textarea value={productDesc} onChange={function(e) { setProductDesc(e.target.value) }} rows={2} placeholder="Description (optional)" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 resize-none" />
                  <div className="flex gap-3">
                    <input value={productPrice} onChange={function(e) { setProductPrice(e.target.value) }} type="number" placeholder="Price (₦)" className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" />
                    <Button onClick={handleAddProduct} isLoading={isAddingProduct}>Add Product</Button>
                  </div>
                </motion.div>
              )}

              {products && products.length > 0 ? (
                <div className="space-y-4">
                  {products.map(function(product: any) {
                    return (
                      <div key={product.id} className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{product.title}</h3>
                          {product.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{product.description}</p>}
                          {product.price && <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">₦{product.price.toLocaleString()}</p>}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {!isOwner && (
                            <Button size="sm" variant="outline" onClick={function() { setChatProductId(chatProductId === product.id ? null : product.id); setChatMessage('') }}>
                              💬 Chat
                            </Button>
                          )}
                          {isOwner && (
                            <button onClick={function() { handleDeleteProduct(product.id) }} className="text-red-500 hover:text-red-600 p-2" title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No products listed yet.</p>
              )}

              {/* Chat about product */}
              {chatProductId && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chat about: {products?.find(function(p: any) { return p.id === chatProductId })?.title}
                  </p>
                  <textarea value={chatMessage} onChange={function(e) { setChatMessage(e.target.value) }} rows={2} placeholder="Ask about this product..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 resize-none mb-3" />
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={function() { setChatProductId(null) }}>Cancel</Button>
                    <Button size="sm" onClick={function() { handleSendMessage(chatProductId) }} isLoading={isSendingMessage} disabled={!chatMessage.trim()}>Send</Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reviews ({ratingCount})</h2>
                {isAuthenticated && !isOwner && (
                  <Button size="sm" onClick={function() { setShowReviewForm(!showReviewForm) }}>{showReviewForm ? 'Cancel' : 'Write Review'}</Button>
                )}
              </div>
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap"><span className="font-semibold text-gray-900 dark:text-gray-100">{review.user?.full_name || 'Anonymous'}</span><div className="flex items-center">{[1,2,3,4,5].map(function(s) { return <svg key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg> })})}</div><span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(review.created_at)}</span></div>
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

          {/* Contact */}
          {activeTab === 'contact' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vendor.phone && <a href={'tel:' + vendor.phone} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><span className="text-2xl">📞</span><div><p className="text-sm text-gray-500 dark:text-gray-400">Phone</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.phone}</p></div></a>}
                {vendor.whatsapp && <a href={'https://wa.me/' + vendor.whatsapp.replace(/\D/g, '')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"><span className="text-2xl">💬</span><div><p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.whatsapp}</p></div></a>}
                {vendor.email && <a href={'mailto:' + vendor.email} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><span className="text-2xl">✉️</span><div><p className="text-sm text-gray-500 dark:text-gray-400">Email</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.email}</p></div></a>}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl"><span className="text-2xl">📍</span><div><p className="text-sm text-gray-500 dark:text-gray-400">Location</p><p className="font-semibold text-gray-900 dark:text-gray-100">{vendor.location}</p></div></div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}