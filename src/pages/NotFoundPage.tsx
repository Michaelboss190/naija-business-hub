import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button className="w-full sm:w-auto">Go Home</Button>
          </Link>
          <Link to="/forum">
            <Button variant="outline" className="w-full sm:w-auto">Browse Forum</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}