import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(5, 'Subject is required'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})

type ContactForm = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success('Message sent successfully! We\'ll get back to you soon.')
    reset()
    setIsSubmitting(false)
  }

  return (
    <div className="container-custom py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-400">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 dark:border-dark-700 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Name</label>
              <input
                {...register('name')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Your name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Subject</label>
            <input
              {...register('subject')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="How can we help?"
            />
            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Message</label>
            <textarea
              {...register('message')}
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Tell us more..."
            />
            {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
            Send Message
          </Button>
        </form>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📧', title: 'Email', content: 'hello@naijabizhub.com' },
            { icon: '📍', title: 'Location', content: 'Lagos, Nigeria' },
            { icon: '💬', title: 'Community', content: 'Join our forum' },
          ].map((item) => (
            <div key={item.title} className="text-center p-6 bg-gray-50 dark:bg-dark-950 rounded-xl">
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-1">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">{item.content}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}