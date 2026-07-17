import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/config/supabase'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const vendorSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  location: z.string().min(2, 'Location is required'),
  address: z.string().optional(),
  phone_code: z.string().min(1, 'Country code is required'),
  phone: z.string().min(7, 'Valid phone number is required').max(15),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  whatsapp_code: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type VendorForm = z.infer<typeof vendorSchema>

const categories = [
  'Skincare', 'Food & Beverages', 'Fashion', 'Technology',
  'Health & Wellness', 'Beauty', 'Agriculture', 'Services',
  'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Other'
]

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara', 'FCT (Abuja)'
]

const countryCodes = [
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
]

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const selectClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
const textareaClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none transition-colors"

export default function RegisterVendorPage() {
  const { profile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sameAsPhone, setSameAsPhone] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const { data: existingVendor, refetch } = useSupabaseQuery(
    ['my-vendor-full', profile?.id || ''],
    function() { return supabase.from('vendors').select('*').eq('owner_id', profile?.id || '').single() },
    { enabled: !!profile?.id }
  )

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<VendorForm>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      business_name: '',
      phone_code: '+234',
      phone: '',
      email: '',
      location: '',
      website: '',
      whatsapp_code: '+234',
    },
  })

  const phoneCode = watch('phone_code')

  useEffect(function() {
    if (existingVendor) {
      setIsEditing(true)
      var phone = existingVendor.phone || ''
      var phoneCodeMatch = phone.match(/^(\+\d{1,3})/)
      var extractedCode = phoneCodeMatch ? phoneCodeMatch[1] : '+234'
      var phoneNumber = phone.replace(/^\+\d{1,3}/, '')
      
      var whatsapp = existingVendor.whatsapp || ''
      var whatsappCodeMatch = whatsapp.match(/^(\+\d{1,3})/)
      var extractedWhatsappCode = whatsappCodeMatch ? whatsappCodeMatch[1] : '+234'
      var whatsappNumber = whatsapp.replace(/^\+\d{1,3}/, '')
      
      reset({
        business_name: existingVendor.business_name || '',
        category: existingVendor.category || '',
        subcategory: existingVendor.subcategory || '',
        description: existingVendor.description || '',
        location: existingVendor.location || '',
        address: existingVendor.address || '',
        phone_code: extractedCode,
        phone: phoneNumber,
        email: existingVendor.email || '',
        whatsapp_code: extractedWhatsappCode,
        whatsapp: whatsappNumber,
        website: existingVendor.website || '',
      })
      
      if (phoneNumber === whatsappNumber && extractedCode === extractedWhatsappCode) {
        setSameAsPhone(true)
      }
    }
  }, [existingVendor, reset])

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  if (!profile?.is_premium) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-6xl mb-4">⭐</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Premium Feature</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Vendor registration is available for premium members only.
          Upgrade your account to list your business in our directory.
        </p>
        <Button onClick={function() { navigate('/pricing') }} size="lg">
          Upgrade to Premium - ₦1,000/mo
        </Button>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your business listing? This action cannot be undone.')) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', existingVendor?.id)
      if (error) throw error
      toast.success('Business listing deleted successfully')
      navigate('/vendors')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete listing')
    } finally {
      setIsDeleting(false)
    }
  }

  const onSubmit = async (data: VendorForm) => {
    setIsSubmitting(true)
    try {
      const fullPhone = data.phone_code + data.phone
      const fullWhatsapp = data.whatsapp ? (data.whatsapp_code || data.phone_code) + data.whatsapp : null

      if (isEditing && existingVendor) {
        const { error } = await supabase
          .from('vendors')
          .update({
            business_name: data.business_name,
            description: data.description,
            category: data.category,
            subcategory: data.subcategory || null,
            location: data.location,
            address: data.address || null,
            phone: fullPhone,
            email: data.email || null,
            whatsapp: fullWhatsapp,
            website: data.website || null,
          })
          .eq('id', existingVendor.id)

        if (error) throw error
        toast.success('Business listing updated successfully!')
        navigate('/vendors/' + existingVendor.slug)
      } else {
        const slug = slugify(data.business_name) + '-' + Date.now().toString(36)

        const { error } = await supabase.from('vendors').insert({
          owner_id: profile?.id,
          business_name: data.business_name,
          slug: slug,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory || null,
          location: data.location,
          address: data.address || null,
          phone: fullPhone,
          email: data.email || null,
          whatsapp: fullWhatsapp,
          website: data.website || null,
          is_premium: true,
          status: 'published',
        })

        if (error) throw error

        await supabase
          .from('profiles')
          .update({
            business_name: data.business_name,
            business_type: data.category,
            phone: fullPhone,
            location: data.location,
            website: data.website || null,
          })
          .eq('id', profile?.id)

        toast.success('Your business has been listed successfully!')
        navigate('/vendors/' + slug)
      }
    } catch (error: any) {
      console.error('Vendor error:', error)
      toast.error(error.message || 'Failed to save vendor. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Your Business' : 'Register Your Business'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isEditing ? 'Update your business information' : 'List your business in our vendor directory and get discovered'}
            </p>
          </div>
          {isEditing && (
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} className="w-full sm:w-auto">
              Delete Listing
            </Button>
          )}
        </div>

        {/* Benefits */}
        {!isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 mb-8 border border-primary-200 dark:border-primary-800"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Benefits of Listing Your Business:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Get discovered by thousands of potential customers',
                'Verified badge to build trust',
                'Direct contact from interested buyers',
                'WhatsApp and phone call buttons',
                'Collect reviews and ratings',
                'Showcase your products and services',
              ].map(function(benefit) {
                return (
                  <div key={benefit} className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 md:p-8 space-y-5 md:space-y-6"
        >
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input {...register('business_name')} placeholder="e.g., Amara's Skincare Empire" className={inputClass} />
            {errors.business_name && <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>}
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category <span className="text-red-500">*</span></label>
              <select {...register('category')} className={selectClass}>
                <option value="">Select category</option>
                {categories.map(function(cat) { return <option key={cat} value={cat}>{cat}</option> })}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subcategory</label>
              <input {...register('subcategory')} placeholder="e.g., Organic Skincare" className={inputClass} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Description <span className="text-red-500">*</span></label>
            <textarea {...register('description')} rows={5} placeholder="Describe your business, products, and services..." className={textareaClass} />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State <span className="text-red-500">*</span></label>
              <select {...register('location')} className={selectClass}>
                <option value="">Select state</option>
                {nigerianStates.map(function(state) { return <option key={state} value={state}>{state}</option> })}
              </select>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Address</label>
              <input {...register('address')} placeholder="e.g., 123 Allen Avenue, Ikeja" className={inputClass} />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <div className="w-24 sm:w-32 flex-shrink-0">
                <select {...register('phone_code')} className={selectClass}>
                  {countryCodes.map(function(cc) { return <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option> })}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <input {...register('phone')} type="tel" placeholder="8012345678" className={inputClass} />
              </div>
            </div>
            {errors.phone_code && <p className="mt-1 text-sm text-red-600">{errors.phone_code.message}</p>}
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          {/* WhatsApp Number */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Number</label>
              <label className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={sameAsPhone} onChange={function(e) {
                  setSameAsPhone(e.target.checked)
                  if (e.target.checked) {
                    setValue('whatsapp', watch('phone'))
                    setValue('whatsapp_code', phoneCode)
                  } else {
                    setValue('whatsapp', '')
                  }
                }} className="h-4 w-4 text-primary-600 rounded border-gray-300" />
                <span>Same as phone</span>
              </label>
            </div>
            <div className="flex gap-2">
              <div className="w-24 sm:w-32 flex-shrink-0">
                <select {...register('whatsapp_code')} className={selectClass} disabled={sameAsPhone}>
                  {countryCodes.map(function(cc) { return <option key={cc.code} value={cc.code}>{cc.flag} {cc.code}</option> })}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <input {...register('whatsapp')} type="tel" placeholder="8012345678" className={inputClass} disabled={sameAsPhone} />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input {...register('email')} type="email" placeholder="business@example.com" className={inputClass} />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
            <input {...register('website')} placeholder="https://www.example.com" className={inputClass} />
            {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 md:pt-6 border-t border-gray-200 dark:border-dark-700">
            {isEditing && (
              <Button variant="danger" type="button" onClick={handleDelete} isLoading={isDeleting} className="w-full sm:w-auto order-3 sm:order-1">
                Delete Listing
              </Button>
            )}
            <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto order-1 sm:order-2">
              <Button variant="outline" type="button" onClick={function() { navigate('/vendors') }} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1 sm:flex-none">
                {isEditing ? 'Update Business' : 'Register My Business'}
              </Button>
            </div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  )
}