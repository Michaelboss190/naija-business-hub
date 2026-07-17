import { motion } from 'framer-motion'
import { Button } from './Button'
import { Link } from 'react-router-dom'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
  onAction?: () => void
  secondaryActionLabel?: string
  secondaryActionLink?: string
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  secondaryActionLabel,
  secondaryActionLink,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      <div className="flex items-center justify-center gap-3">
        {actionLabel && actionLink && (
          <Link to={actionLink}>
            <Button>{actionLabel}</Button>
          </Link>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
        {secondaryActionLabel && secondaryActionLink && (
          <Link to={secondaryActionLink}>
            <Button variant="outline">{secondaryActionLabel}</Button>
          </Link>
        )}
      </div>
    </motion.div>
  )
}