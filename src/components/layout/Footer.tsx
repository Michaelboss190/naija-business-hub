import { Link } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import SiteLogo from '@/components/ui/SiteLogo'
import toast from 'react-hot-toast'

const footerLinks = {
  Platform: [
    { name: 'Forum', href: '/forum' }, { name: 'Resources', href: '/resources' }, { name: 'Vendors', href: '/vendors' }, { name: 'Masterclasses', href: '/masterclasses' }, { name: 'Events', href: '/events' },
  ],
  Community: [
    { name: 'Freelancers', href: '/forum/category/freelancing' }, { name: 'Skincare Vendors', href: '/forum/category/skincare' }, { name: 'Food Business', href: '/forum/category/food-business' }, { name: 'Success Stories', href: '/forum/category/success-stories' }, { name: 'Expert Q&A', href: '/expert-qa' },
  ],
  Resources: [
    { name: 'Business Templates', href: '/templates' }, { name: 'Suppliers Directory', href: '/suppliers' }, { name: 'Blog', href: '/blog' }, { name: 'About', href: '/about' }, { name: 'Contact', href: '/contact' },
  ],
  Legal: [
    { name: 'Privacy Policy', href: '/privacy' }, { name: 'Terms of Service', href: '/terms' }, { name: 'Cookie Policy', href: '/cookies' },
  ],
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => { e.preventDefault(); if (!email) return; setIsSubscribing(true); try { const { error } = await supabase.from('newsletter_subscribers').insert({ email }); if (error) throw error; toast.success('Subscribed!'); setEmail('') } catch (error: any) { toast.error(error.message || 'Failed') } finally { setIsSubscribing(false) } }

  return (
    <footer className="bg-gray-900 dark:bg-dark-950 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <SiteLogo size="md" />
            <p className="text-gray-400 mb-6 max-w-md mt-4">The ultimate platform for Nigerian entrepreneurs and professionals. Connect, learn, and grow your business with our community.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 px-4 py-2 rounded-lg bg-gray-800 dark:bg-dark-800 border border-gray-700 dark:border-dark-600 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500" required />
              <Button type="submit" isLoading={isSubscribing}>Subscribe</Button>
            </form>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}><h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">{category}</h3><ul className="space-y-2">{links.map((link) => <li key={link.name}><Link to={link.href} className="text-gray-300 hover:text-white transition-colors text-sm">{link.name}</Link></li>)}</ul></div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 dark:border-dark-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} NaijaBizHub. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5C6.21 22.5 1.5 17.79 1.5 12S6.21 1.5 12 1.5 22.5 6.21 22.5 12 17.79 22.5 12 22.5z"/></svg></a>
          </div>
        </div>
      </div>
    </footer>
  )
}