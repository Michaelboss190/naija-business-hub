import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import ThemeToggle from '@/components/ui/ThemeToggle'
import SiteLogo from '@/components/ui/SiteLogo'
import NotificationBadge from '@/components/ui/NotificationBadge'
import MessageBadge from '@/components/ui/MessageBadge'

const navigation = [
  { name: 'Forum', href: '/forum' },
  { name: 'Resources', href: '/resources' },
  { name: 'Vendors', href: '/vendors' },
  { name: 'Masterclasses', href: '/masterclasses' },
  { name: 'Events', href: '/events' },
  { name: 'Blog', href: '/blog' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { isAuthenticated, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setIsOpen(false)
  }

  return (
    <nav className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <SiteLogo size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <NotificationBadge />
                </Link>
                <Link to="/messages" className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  <MessageBadge />
                </Link>
                <div className="relative">
                  <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile?.full_name || 'User'} className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">{profile?.full_name?.[0]?.toUpperCase() || 'U'}</span>}
                    </div>
                    <svg className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 z-20">
                        <div className="py-1">
                          <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setProfileOpen(false)}>Dashboard</Link>
                          <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setProfileOpen(false)}>Profile</Link>
                          <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setProfileOpen(false)}>Settings</Link>
                          {(profile?.role === 'admin' || profile?.role === 'super_admin') && <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setProfileOpen(false)}>Admin Panel</Link>}
                          <hr className="my-1 border-gray-200 dark:border-dark-700" />
                          <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700">Sign Out</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link to="/register"><Button size="sm">Get Started</Button></Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-gray-200 dark:border-dark-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link key={item.name} to={item.href} className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20" onClick={() => setIsOpen(false)}>{item.name}</Link>
                ))}
                <hr className="my-2 border-gray-200 dark:border-dark-700" />
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setIsOpen(false)}>Dashboard</Link>
                    <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setIsOpen(false)}>Profile</Link>
                    <Link to="/messages" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setIsOpen(false)}>Messages</Link>
                    <Link to="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setIsOpen(false)}>Settings</Link>
                    <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700" onClick={() => setIsOpen(false)}>Log in</Link>
                    <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700 text-center" onClick={() => setIsOpen(false)}>Get Started</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}