import { useState } from 'react'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'

interface UseImageUploadOptions {
  bucket: 'avatars' | 'vendors' | 'blog'
  folder?: string
  maxSizeMB?: number
}

export function useImageUpload({ bucket, folder = 'public', maxSizeMB = 5 }: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP, GIF)')
      return null
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error('Image must be less than ' + maxSizeMB + 'MB')
      return null
    }

    setIsUploading(true)
    setProgress(0)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = folder + '/' + Date.now() + '-' + Math.random().toString(36).substring(7) + '.' + fileExt

      console.log('Uploading to bucket:', bucket)
      console.log('File path:', fileName)

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        console.error('Upload error details:', error)
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      setProgress(100)
      toast.success('Image uploaded successfully!')
      console.log('Public URL:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (error: any) {
      console.error('Upload error:', error)
      if (error.message.includes('row-level security')) {
        toast.error('Permission denied. Please ensure you are logged in and try again.')
      } else if (error.message.includes('bucket')) {
        toast.error('Storage not configured. Please contact support.')
      } else {
        toast.error(error.message || 'Failed to upload image')
      }
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      const path = url.split('/').slice(-2).join('/')
      const { error } = await supabase.storage.from(bucket).remove([path])
      if (error) throw error
      toast.success('Image deleted')
      return true
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete image')
      return false
    }
  }

  return {
    uploadImage,
    deleteImage,
    isUploading,
    progress,
  }
}