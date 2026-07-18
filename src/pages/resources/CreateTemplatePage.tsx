import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/config/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

const templateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  file_type: z.string().min(1, 'Please select file type'),
})

type TemplateForm = z.infer<typeof templateSchema>

const categories = ['Invoice', 'Receipt', 'Business Plan', 'Marketing', 'Proposal', 'Inventory', 'Budget', 'Contract', 'Other']
const fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip']

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function CreateTemplatePage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { file_type: 'pdf' },
  })

  if (!isAuthenticated) { navigate('/login'); return null }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setThumbnailFile(file); const reader = new FileReader(); reader.onloadend = function() { setThumbnailPreview(reader.result as string) }; reader.readAsDataURL(file) }
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

  const onSubmit = async (data: TemplateForm) => {
    if (!selectedFile) { toast.error('Please select a file'); return }
    setIsSubmitting(true)
    try {
      const slug = slugify(data.title) + '-' + Date.now().toString(36)
      const fileUrl = await uploadFile(selectedFile, 'templates')
      if (!fileUrl) { setIsSubmitting(false); return }
      let thumbnailUrl = null
      if (thumbnailFile) thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails')

      const { error } = await supabase.from('templates').insert({
        title: data.title, slug: slug, description: data.description,
        category: data.category, file_url: fileUrl, thumbnail_url: thumbnailUrl,
        file_type: data.file_type, file_size: selectedFile.size, is_premium: true, status: 'published',
      })
      if (error) throw error
      toast.success('Template published!')
      navigate('/templates')
    } catch (error: any) { toast.error(error.message || 'Failed') }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Upload Template</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Share a business template with the community</p></div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title <span className="text-red-500">*</span></label><input {...register('title')} placeholder="e.g., Business Plan Template" className={inputClass} />{errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}</div>
          <div className="grid grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category <span className="text-red-500">*</span></label><select {...register('category')} className={selectClass}><option value="">Select</option>{categories.map(function(c){return <option key={c} value={c}>{c}</option>})}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Type <span className="text-red-500">*</span></label><select {...register('file_type')} className={selectClass}><option value="">Select</option>{fileTypes.map(function(f){return <option key={f} value={f}>{f.toUpperCase()}</option>})}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description <span className="text-red-500">*</span></label><textarea {...register('description')} rows={4} className={textareaClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template File <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl p-6 text-center">
              {selectedFile ? (
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-2xl">??</span><div className="text-left"><p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{(selectedFile.size/1024).toFixed(1)} KB</p></div></div><button type="button" onClick={function(){setSelectedFile(null)}} className="text-red-500 hover:text-red-600 text-sm">Remove</button></div>
              ) : (
                <label className="cursor-pointer"><svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg><p className="text-sm text-gray-600 dark:text-gray-400">Click to upload PDF, DOC, XLS, PPT, ZIP</p><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" onChange={handleFileChange} className="hidden" /></label>
              )}
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thumbnail (optional)</label>
            <div className="flex items-center gap-4">
              {thumbnailPreview ? <div className="relative"><img src={thumbnailPreview} alt="" className="w-24 h-24 object-cover rounded-lg" /><button type="button" onClick={function(){setThumbnailFile(null);setThumbnailPreview(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">?</button></div> : <label className="cursor-pointer"><div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg flex items-center justify-center"><svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div><input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" /></label>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-dark-700"><Button variant="outline" type="button" onClick={function(){navigate('/templates')}}>Cancel</Button><Button type="submit" isLoading={isSubmitting||isUploading}>Publish Template</Button></div>
        </form>
      </motion.div>
    </div>
  )
}