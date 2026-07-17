import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useImageUpload } from '@/hooks/useImageUpload'

interface ImageUploadProps {
  bucket: 'avatars' | 'vendors' | 'blog'
  folder?: string
  currentImage?: string | null
  onUpload: (url: string) => void
  onDelete?: () => void
  className?: string
}

export default function ImageUpload({
  bucket,
  folder = 'public',
  currentImage,
  onUpload,
  onDelete,
  className = '',
}: ImageUploadProps) {
  const { uploadImage, deleteImage, isUploading, progress } = useImageUpload({ bucket, folder })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const url = await uploadImage(acceptedFiles[0])
    if (url) onUpload(url)
  }, [uploadImage, onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isUploading,
  })

  const handleDelete = async () => {
    if (currentImage) {
      const success = await deleteImage(currentImage)
      if (success && onDelete) onDelete()
    }
  }

  return (
    <div className={className}>
      {currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt="Uploaded"
            className="w-full h-48 object-cover rounded-xl"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-dark-600 hover:border-primary-400 dark:hover:border-primary-600'
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Uploading... {progress}%</p>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                JPEG, PNG, WebP, GIF up to 5MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}