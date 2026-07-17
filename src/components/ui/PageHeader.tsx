import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        {description && <p className="text-gray-600 dark:text-gray-400 mt-2">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 w-full sm:w-auto">{actions}</div>}
    </motion.div>
  )
}