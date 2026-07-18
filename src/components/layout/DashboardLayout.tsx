import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import SiteLogo from '@/components/ui/SiteLogo'
import NotificationBadge from '@/components/ui/NotificationBadge'
import MessageBadge from '@/components/ui/MessageBadge'

const sidebarLinks = [
  { title: 'Dashboard', href: '/dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { title: 'Profile', href: '/profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { title: 'Messages', href: '/messages', icon: <span className="relative"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg><MessageBadge /></span> },
  { title: 'Notifications', href: '/notifications', icon: <span className="relative"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg><NotificationBadge /></span> },
  { title: 'Settings', href: '/settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
]

export default function DashboardLayout() {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(function() { if (!isLoading && !isAuthenticated) navigate('/login') }, [isLoading, isAuthenticated, navigate])

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <nav role="navigation" className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <SiteLogo size="sm" />
            <div className="flex items-center space-x-4">
              <Link to="/forum" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Forum</Link>
              <Link to="/vendors" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Vendors</Link>
              <Link to="/resources" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Resources</Link>
              <div className="w-8 h-8 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? <img loading="lazy" src={profile.avatar_url} alt={profile?.full_name || 'User'} className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">{profile?.full_name?.[0]?.toUpperCase() || 'U'}</span>}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 sticky top-24">
              <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-100 dark:border-dark-700">
                <div className="w-12 h-12 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? <img loading="lazy" src={profile.avatar_url} alt={profile?.full_name || 'User'} className="w-full h-full object-cover" /> : <span className="text-gray-600 dark:text-gray-400 font-semibold text-lg">{profile?.full_name?.[0]?.toUpperCase() || 'U'}</span>}
                </div>
                <div><div className="font-semibold text-gray-900 dark:text-gray-100">{profile?.full_name || 'User'}</div><div className="text-sm text-gray-500 dark:text-gray-400">@{profile?.username}</div></div>
              </div>
              <nav role="navigation" className="space-y-1">
                {sidebarLinks.map(function(link) {
                  const isActive = location.pathname === link.href || location.pathname.startsWith(link.href + '/')
                  return <Link key={link.href} to={link.href} className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-gray-100'}`}>{link.icon}<span className="font-medium">{link.title}</span></Link>
                })}
              </nav>
              {profile?.is_premium ? (
                <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800"><div className="flex items-center space-x-2 mb-2"><span className="text-xl">⭐</span><span className="font-semibold text-primary-700 dark:text-primary-400">Premium Member</span></div><p className="text-sm text-primary-600 dark:text-primary-500">Enjoying exclusive benefits</p></div>
              ) : (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-200 dark:border-dark-600"><p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Upgrade to Premium</p><Link to="/pricing" className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">Upgrade - ₦1,000/mo</Link></div>
              )}
            </div>
          </aside>
          <main className="flex-1 min-w-0 has-bottom-nav"><Outlet /></main>
        </div>
      </div>
    </div>
  )
}