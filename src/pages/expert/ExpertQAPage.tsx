import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { formatTimeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ExpertQAPage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [newQuestion, setNewQuestion] = useState('')
  const [questionTitle, setQuestionTitle] = useState('')
  const [questionCategory, setQuestionCategory] = useState('')
  const [isAsking, setIsAsking] = useState(false)

  const categories = ['Freelancing', 'Skincare', 'Food Business', 'Marketing', 'Finance', 'Legal', 'Technology', 'Business Growth']

  const { data: questions, isLoading, refetch } = useSupabaseQuery(
    ['expert-questions', searchQuery, selectedCategory],
    () => {
      let query = supabase.from('expert_questions').select('*, author:profiles(username, full_name, avatar_url)').eq('status', 'published').order('created_at', { ascending: false }).limit(50)
      if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      if (selectedCategory !== 'all') query = query.eq('category', selectedCategory)
      return query
    }
  )

  const handleAskQuestion = async () => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return }
    if (!profile?.is_premium) { toast.error('Premium feature. Please upgrade.'); navigate('/pricing'); return }
    if (!questionTitle.trim() || !newQuestion.trim() || !questionCategory) { toast.error('Please fill all fields'); return }
    try {
      const slug = questionTitle.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') + '-' + Date.now()
      const { error } = await supabase.from('expert_questions').insert({ author_id: profile?.id, title: questionTitle, slug, content: newQuestion, category: questionCategory })
      if (error) throw error
      toast.success('Question submitted!')
      setQuestionTitle(''); setNewQuestion(''); setQuestionCategory(''); setIsAsking(false); refetch()
    } catch (error: any) { toast.error(error.message || 'Failed') }
  }

  if (!profile?.is_premium) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-6xl mb-4">🤝</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Premium Feature</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">Expert Q&A is available for premium members.</p>
        <Link to="/pricing"><Button size="lg">Upgrade to Premium - ₦1,000/mo</Button></Link>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div><h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Expert Q&A</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Get answers from experienced business professionals</p></div>
        <Button onClick={() => setIsAsking(!isAsking)} className="mt-4 sm:mt-0">{isAsking ? 'Cancel' : '+ Ask a Question'}</Button>
      </motion.div>

      {isAsking && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Ask Your Question</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label><input type="text" value={questionTitle} onChange={(e) => setQuestionTitle(e.target.value)} placeholder="e.g., How do I find reliable suppliers?" className="input" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label><select value={questionCategory} onChange={(e) => setQuestionCategory(e.target.value)} className="select w-full"><option value="">Select category</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details</label><textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} rows={4} placeholder="Provide more details..." className="textarea" /></div>
            <Button onClick={handleAskQuestion}>Submit Question</Button>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative"><svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search questions..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" /></div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"><option value="all">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>
      </motion.div>

      {isLoading ? <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 animate-pulse"><div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-3/4"></div></div>)}</div>
      : questions && questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question: any, index: number) => (
            <motion.div key={question.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1"><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{question.title}</h3><p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{question.content}</p></div>
                <div className="flex items-center space-x-2 ml-4">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">{question.category}</span>
                  {question.is_answered ? <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">✓ Answered</span> : <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">Open</span>}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"><span>{question.author?.username}</span><span>•</span><span>{formatTimeAgo(question.created_at)}</span><span>•</span><span>{question.answer_count || 0} answers</span><span>•</span><span>{question.view_count || 0} views</span></div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16"><div className="text-6xl mb-4">🤝</div><h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No questions yet</h3><p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to ask!</p><Button onClick={() => setIsAsking(true)}>Ask a Question</Button></motion.div>
      )}
    </div>
  )
}