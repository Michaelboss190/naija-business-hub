interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl md:w-24 md:h-24 md:text-3xl',
  }

  const firstLetter = (name || 'U')[0].toUpperCase()

  return (
    <div className={`${sizeClasses[size]} bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name || 'User'} className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-600 dark:text-gray-400 font-semibold">{firstLetter}</span>
      )}
    </div>
  )
}