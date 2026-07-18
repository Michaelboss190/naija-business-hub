import { useState } from 'react'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export function useBookmark() {
  const { profile, isAuthenticated } = useAuth()
  const [isBookmarking, setIsBookmarking] = useState(false)

  const toggleBookmark = async (postId: string, resourceId?: string) => {
    if (!isAuthenticated) { toast.error('Please login to bookmark'); return false }
    setIsBookmarking(true)
    try {
      // Check if already bookmarked
      const { data: existing } = await supabase.from('bookmarks').select('id')
        .eq('user_id', profile?.id)
        .eq('post_id', postId || '')
        .maybeSingle()

      if (existing) {
        // Remove bookmark
        await supabase.from('bookmarks').delete().eq('id', existing.id)
        toast.success('Bookmark removed')
        setIsBookmarking(false)
        return false
      } else {
        // Add bookmark
        await supabase.from('bookmarks').insert({
          user_id: profile?.id,
          post_id: postId || null,
          resource_id: resourceId || null,
        })
        toast.success('Bookmarked!')
        setIsBookmarking(false)
        return true
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to bookmark')
      setIsBookmarking(false)
      return false
    }
  }

  const isBookmarked = async (postId: string) => {
    if (!isAuthenticated) return false
    const { data } = await supabase.from('bookmarks').select('id')
      .eq('user_id', profile?.id)
      .eq('post_id', postId)
      .maybeSingle()
    return !!data
  }

  return { toggleBookmark, isBookmarked, isBookmarking }
}