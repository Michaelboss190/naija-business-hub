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

const supplierSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  location: z.string().min(2, 'Location is required'),
  address: z.string().optional(),
  phone: z.string().min(7, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  minimum_order: z.string().optional(),
  delivery_options: z.string().optional(),
})

type SupplierForm = z.infer<typeof supplierSchema>

const industries = ['Skincare Ingredients', 'Packaging', 'Food Ingredients', 'Equipment', 'Raw Materials', 'Logistics', 'Technology', 'Other']
const nigerianStates = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT (Abuja)']

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function RegisterSupplierPage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SupplierForm>({ resolver: zodResolver(supplierSchema) })

  if (!isAuthenticated) { navigate('/login'); return null }
  if (!profile?.is_premium) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-6xl mb-4">⭐</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Premium Feature</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Supplier registration is available for premium members only.</p>
        <Button onClick={function() { navigate('/pricing') }} size="lg">Upgrade to Premium - ₦1,000/mo</Button>
      </div>
    )
  }

  const onSubmit = async (data: SupplierForm) => {
    setIsSubmitting(true)
    try {
      const slug = slugify(data.company_name) + '-' + Date.now().toString(36)
      const deliveryArray = data.delivery_options ? data.delivery_options.split(',').map(function(t: string) { return t.trim() }).filter(Boolean) : []

      const { error } = await supabase.from('suppliers').insert({
        owner_id: profile?.id,
        company_name: data.company_name,
        slug: slug,
        description: data.description,
        industry: data.industry,
        location: data.location,
        address: data.address || null,
        phone: data.phone,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        website: data.website || null,
        minimum_order: data.minimum_order || null,
        delivery_options: deliveryArray,
        status: 'published',
      })

      if (error) throw error
      toast.success('Supplier registered successfully!')
      navigate('/suppliers')
    } catch (error: any) { toast.error(error.message || 'Failed to register') }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="container-custom py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">Register as Supplier</h1><p className="text-gray-600 dark:text-gray-400 mt-2">List your wholesale supply business</p></div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name <span className="text-red-500">*</span></label><input {...register('company_name')} placeholder="e.g., Lagos Raw Materials Ltd" className={inputClass} />{errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Industry <span className="text-red-500">*</span></label><select {...register('industry')} className={selectClass}><option value="">Select industry</option>{industries.map(function(i){return <option key={i} value={i}>{i}</option>})}</select>{errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location (State) <span className="text-red-500">*</span></label><select {...register('location')} className={selectClass}><option value="">Select state</option>{nigerianStates.map(function(s){return <option key={s} value={s}>{s}</option>})}</select>{errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}</div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description <span className="text-red-500">*</span></label><textarea {...register('description')} rows={4} placeholder="Describe your products and services..." className={textareaClass} />{errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone <span className="text-red-500">*</span></label><input {...register('phone')} placeholder="08012345678" className={inputClass} />{errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">WhatsApp</label><input {...register('whatsapp')} placeholder="08012345678" className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label><input {...register('email')} type="email" placeholder="supplier@example.com" className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label><input {...register('website')} placeholder="https://..." className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Order</label><input {...register('minimum_order')} placeholder="e.g., 100 units" className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Options</label><input {...register('delivery_options')} placeholder="e.g., Nationwide, Lagos only" className={inputClass} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-dark-700">
            <Button variant="outline" type="button" onClick={function(){navigate('/suppliers')}}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Register as Supplier</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}