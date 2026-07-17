import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import { formatTimeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'
import { createNotification } from '@/lib/notifications'

export default function MessagesPage() {
  const { conversationId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations, refetch: refetchConversations } = useSupabaseQuery(
    ['conversations', profile?.id || ''],
    function() {
      return supabase.from('conversations')
        .select('*, participant1:profiles!participant1_id(username, full_name, avatar_url), participant2:profiles!participant2_id(username, full_name, avatar_url)')
        .or('participant1_id.eq.' + profile?.id + ',participant2_id.eq.' + profile?.id)
        .order('last_message_at', { ascending: false })
    },
    { enabled: !!profile?.id }
  )

  const { data: messages, refetch: refetchMessages } = useSupabaseQuery(
    ['messages', conversationId || ''],
    function() { return supabase.from('messages').select('*').or('sender_id.eq.' + profile?.id + ',receiver_id.eq.' + profile?.id).order('created_at', { ascending: true }).limit(100) },
    { enabled: !!profile?.id && !!conversationId }
  )

  const activeConversation = conversations?.find(function(c: any) { return c.id === conversationId })
  const otherParticipant = activeConversation ? (activeConversation.participant1_id === profile?.id ? activeConversation.participant2 : activeConversation.participant1) : null

  useEffect(function() { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(function() {
    if (!profile?.id) return
    const channel = supabase.channel('messages-realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'receiver_id=eq.' + profile.id }, function() { refetchMessages(); refetchConversations() }).subscribe(function(status) { console.log('Realtime status:', status) })
    return function() { supabase.removeChannel(channel) }
  }, [profile?.id])

  const sendMessage = async () => {
    if (!messageText.trim() || !activeConversation) return
    const receiverId = activeConversation.participant1_id === profile?.id ? activeConversation.participant2_id : activeConversation.participant1_id
    try {
      const { error } = await supabase.from('messages').insert({ sender_id: profile?.id, receiver_id: receiverId, content: messageText })
      if (error) throw error
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId)
      setMessageText('')
      refetchMessages()
      refetchConversations()
    } catch (error: any) { toast.error(error.message || 'Failed to send') }
  }

  if (!profile?.is_premium) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">💌</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Premium Feature</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Private messaging is available for premium members only.</p>
        <Button onClick={function() { navigate('/pricing') }}>Upgrade to Premium - ₦1,000/mo</Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
      <div className={(conversationId ? 'hidden md:block' : 'block') + ' w-full md:w-80 border-r border-gray-200 dark:border-dark-700'}>
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Messages</h2>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value) }} placeholder="Search..." className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {conversations?.filter(function(c: any) { const other = c.participant1_id === profile?.id ? c.participant2 : c.participant1; return other?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) }).map(function(conv: any) {
            const other = conv.participant1_id === profile?.id ? conv.participant2 : conv.participant1
            const isActive = conversationId === conv.id
            return (
              <button key={conv.id} onClick={function() { navigate('/messages/' + conv.id) }} className={'w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors border-b border-gray-100 dark:border-dark-700 ' + (isActive ? 'bg-primary-50 dark:bg-primary-900/20' : '')}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {other?.avatar_url ? (
                      <img src={other.avatar_url} alt={other?.full_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">{(other?.full_name || 'U')[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{other?.full_name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{conv.last_message_at ? formatTimeAgo(conv.last_message_at) : ''}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{other?.username}</p>
                  </div>
                </div>
              </button>
            )
          })}
          {(!conversations || conversations.length === 0) && <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>No conversations yet</p></div>}
        </div>
      </div>

      <div className={(conversationId ? 'flex' : 'hidden md:flex') + ' flex-1 flex-col'}>
        {conversationId && otherParticipant ? (
          <>
            <div className="flex items-center space-x-3 p-4 border-b border-gray-200 dark:border-dark-700">
              <button className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" onClick={function() { navigate('/messages') }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                {otherParticipant?.avatar_url ? (
                  <img src={otherParticipant.avatar_url} alt={otherParticipant?.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">{(otherParticipant?.full_name || 'U')[0]?.toUpperCase()}</span>
                )}
              </div>
              <div><h3 className="font-semibold text-gray-900 dark:text-gray-100">{otherParticipant?.full_name}</h3><p className="text-sm text-gray-500 dark:text-gray-400">@{otherParticipant?.username}</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map(function(msg: any) {
                const isMine = msg.sender_id === profile?.id
                return (
                  <div key={msg.id} className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
                    <div className={'max-w-[70%] rounded-2xl px-4 py-2 ' + (isMine ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-gray-100')}>
                      <p className="text-sm">{msg.content}</p>
                      <div className={'text-xs mt-1 ' + (isMine ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400')}>{formatTimeAgo(msg.created_at)}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-dark-700">
              <div className="flex items-center space-x-2">
                <input type="text" value={messageText} onChange={function(e) { setMessageText(e.target.value) }} onKeyPress={function(e) { if (e.key === 'Enter') sendMessage() }} placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500" />
                <button onClick={sendMessage} disabled={!messageText.trim()} className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><div className="text-6xl mb-4">💬</div><h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your Messages</h3><p className="text-gray-600 dark:text-gray-400">Select a conversation to start messaging</p></div>
          </div>
        )}
      </div>
    </div>
  )
}