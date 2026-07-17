import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useImageUpload } from '@/hooks/useImageUpload'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().max(500).optional(),
  headline: z.string().max(100).optional(),
  location: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  business_type: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { username } = useParams()
  const { profile: currentProfile, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { uploadImage, isUploading } = useImageUpload({ bucket: 'avatars', folder: currentProfile?.id || 'public' })

  const isOwnProfile = !username || username === currentProfile?.username
  const { data: profileData, isLoading } = useSupabaseQuery(['profile', username || currentProfile?.username || ''], function() { return supabase.from('profiles').select('*').eq('username', username || currentProfile?.username || '').single() })
  const { data: userPosts } = useSupabaseQuery(['user-posts', profileData?.id || ''], function() { return supabase.from('forum_posts').select('*, category:forum_categories(name, slug)').eq('author_id', profileData?.id).eq('status', 'published').order('created_at', { ascending: false }).limit(10) }, { enabled: !!profileData?.id })

  const profile = isOwnProfile ? currentProfile : profileData

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { full_name: profile?.full_name || '', username: profile?.username || '', bio: profile?.bio || '', headline: profile?.headline || '', location: profile?.location || '', website: profile?.website || '', phone: profile?.phone || '', business_name: profile?.business_name || '', business_type: profile?.business_type || '' },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (url) { await updateProfile({ avatar_url: url } as any); toast.success('Profile picture updated!') }
  }

  const onSubmit = async (data: ProfileForm) => { setIsSaving(true); try { await updateProfile(data); toast.success('Profile updated!'); setIsEditing(false) } catch (error: any) { toast.error(error.message || 'Failed') } finally { setIsSaving(false) } }

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary-500 to-primary-700" />
        <div className="px-6 md:px-8 pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 gap-4 sm:gap-6">
            <div className="relative group">
              <div className="w-32 h-32 bg-white dark:bg-dark-800 rounded-2xl border-4 border-white dark:border-dark-800 shadow-lg flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile?.full_name || ''} className="w-full h-full object-cover" /> : <span className="text-5xl font-bold text-gray-600 dark:text-gray-400">{profile?.full_name?.[0]?.toUpperCase() || 'U'}</span>}
              </div>
              {isOwnProfile && (
                <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  {isUploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              )}
            </div>
            <div className="flex-1"><h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">{profile?.full_name || 'User'}</h1><p className="text-gray-600 dark:text-gray-400">@{profile?.username}</p>{profile?.headline && <p className="text-gray-700 dark:text-gray-300 mt-1">{profile.headline}</p>}</div>
            {isOwnProfile && <Button variant={isEditing?'outline':'primary'} onClick={function(){setIsEditing(!isEditing);if(isEditing)reset()}} className="w-full sm:w-auto">{isEditing?'Cancel':'Edit Profile'}</Button>}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            {profile?.location && <span>📍 {profile.location}</span>}
            {profile?.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">🔗 {profile.website}</a>}
            {profile?.business_name && <span>🏢 {profile.business_name}</span>}
            <span>📅 Joined {formatDate(profile?.created_at || '')}</span>
            {profile?.is_premium && <span className="text-yellow-600 dark:text-yellow-400 font-medium">⭐ Premium Member</span>}
          </div>
          {profile?.bio && <p className="mt-4 text-gray-700 dark:text-gray-300">{profile.bio}</p>}
        </div>
      </motion.div>

      {isEditing && isOwnProfile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Profile</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label><input {...register('full_name')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" />{errors.full_name&&<p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label><input {...register('username')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" />{errors.username&&<p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Headline</label><input {...register('headline')} placeholder="e.g., Freelance Developer" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label><input {...register('location')} placeholder="e.g., Lagos, Nigeria" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label><input {...register('website')} placeholder="https://..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label><input {...register('phone')} placeholder="+234..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Name</label><input {...register('business_name')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Type</label><select {...register('business_type')} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"><option value="">Select type</option><option value="freelancer">Freelancer</option><option value="skincare">Skincare Vendor</option><option value="food">Food Business</option><option value="other">Other</option></select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label><textarea {...register('bio')} rows={4} placeholder="Tell us about yourself..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 resize-none" /></div>
            <div className="flex gap-3 pt-2"><Button type="submit" isLoading={isSaving}>Save Changes</Button><Button type="button" variant="outline" onClick={function(){reset();setIsEditing(false)}}>Cancel</Button></div>
          </form>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Recent Activity</h2>
        {userPosts && userPosts.length > 0 ? <div className="space-y-4">{userPosts.map(function(post:any){return <Link key={post.id} to={'/forum/post/'+post.slug} className="block p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"><div className="flex items-start justify-between"><div><h3 className="font-medium text-gray-900 dark:text-gray-100">{post.title}</h3><div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400"><span>{post.category?.name}</span><span>•</span><span>{formatDate(post.created_at)}</span><span>•</span><span>{post.comment_count} comments</span></div></div><span className="text-sm text-gray-500 dark:text-gray-400">{post.view_count} views</span></div></Link>})}</div> : <p className="text-gray-500 dark:text-gray-400 text-center py-8">No posts yet</p>}
      </motion.div>
    </div>
  )
}