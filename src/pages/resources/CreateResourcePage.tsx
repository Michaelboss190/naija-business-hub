import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

const resourceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  type: z.string().min(1, 'Please select a type'),
  category_id: z.string().min(1, 'Please select a category'),
  content: z.string().optional(),
  is_premium: z.boolean().optional(),
  is_downloadable: z.boolean().optional(),
})

type ResourceForm = z.infer<typeof resourceSchema>

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function CreateResourcePage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { data: categories } = useSupabaseQuery(
    ['resource-categories'],
    function() { return supabase.from('resource_categories').select('*').order('name') }
  )

  const { register, handleSubmit, formState: { errors } } = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
  })

  if (!isAuthenticated) { navigate('/login'); return null }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = folder + '/' + Date.now() + '-' + Math.random().toString(36).substring(7) + '.' + fileExt
      const { data, error } = await supabase.storage.from('resources').upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('resources').getPublicUrl(data.path)
      return urlData.publicUrl
    } catch (error: any) { toast.error('Upload failed: ' + error.message); return null }
    finally { setIsUploading(false) }
  }

  const onSubmit = async (data: ResourceForm) => {
    setIsSubmitting(true)
    try {
      const slug = slugify(data.title) + '-' + Date.now()
      let fileUrl = null

      // Upload file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile, 'resources')
        if (!fileUrl) { setIsSubmitting(false); return }
      }

      const { error } = await supabase.from('resources').insert({
        title: data.title, slug: slug, description: data.description,
        type: data.type, category_id: data.category_id, content: data.content || null,
        author_id: profile?.id, file_url: fileUrl,
        is_premium: data.is_premium || false, is_downloadable: data.is_downloadable || false,
        status: 'published',
      })

      if (error) throw error
      toast.success('Resource published successfully!')
      navigate('/resources/' + slug)
    } catch (error: any) { toast.error(error.message || 'Failed to create resource') }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Add a Resource</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Share guides, templates, and tools with the community</p></div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title <span className="text-red-500">*</span></label><input {...register('title')} placeholder="e.g., Business Plan Guide" className={inputClass} />{errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type <span className="text-red-500">*</span></label><select {...register('type')} className={selectClass}><option value="">Select type</option><option value="article">Article</option><option value="video">Video</option><option value="pdf">PDF</option><option value="template">Template</option><option value="audio">Audio</option></select>{errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category <span className="text-red-500">*</span></label><select {...register('category_id')} className={selectClass}><option value="">Select category</option>{categories?.map(function(c: any) { return <option key={c.id} value={c.id}>{c.name}</option> })}</select>{errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>}</div>
          </div>

          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description <span className="text-red-500">*</span></label><textarea {...register('description')} rows={3} placeholder="Brief description..." className={textareaClass} />{errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}</div>

          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label><textarea {...register('content')} rows={8} placeholder="Main content (for articles and guides)..." className={textareaClass} /></div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload File (PDF, DOC, Images, etc.)</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl p-6 text-center">
              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={function() { setSelectedFile(null) }} className="text-red-500 hover:text-red-600 text-sm">Remove</button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload file</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PDF, DOC, Images, Videos - Max 50MB</p>
                  <input type="file" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2"><input type="checkbox" {...register('is_premium')} className="h-4 w-4 text-primary-600 rounded" /><label className="text-sm text-gray-700 dark:text-gray-300">Premium Content ⭐</label></div>
            <div className="flex items-center space-x-2"><input type="checkbox" {...register('is_downloadable')} className="h-4 w-4 text-primary-600 rounded" /><label className="text-sm text-gray-700 dark:text-gray-300">Downloadable</label></div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-dark-700">
            <Button variant="outline" type="button" onClick={function() { navigate('/resources') }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting || isUploading}>Publish Resource</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}