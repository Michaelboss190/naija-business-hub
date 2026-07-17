import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/config/supabase'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/stores/themeStore'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { profile, signOut, changePassword } = useAuth()
  const navigate = useNavigate()
  const { theme, resolvedTheme, setTheme } = useThemeStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [isDeleting, setIsDeleting] = useState(false)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState(profile?.notification_preferences || {
    email: true, push: true, in_app: true, marketing: false,
  })

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState(profile?.privacy_settings || {
    show_email: false, show_phone: false, show_location: true, profile_visibility: 'public',
  })

  const getPasswordStrength = function(pwd: string) {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const passwordStrength = getPasswordStrength(newPassword)
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-600']

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changePassword(newPassword)
      if (result.success) {
        toast.success('Password updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(result.error || 'Failed to update password')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      const { error } = await supabase.from('profiles').update({ notification_preferences: notifPrefs }).eq('id', profile?.id)
      if (error) throw error
      toast.success('Notification preferences saved!')
    } catch (error: any) { toast.error(error.message || 'Failed to save preferences') }
  }

  const handleSavePrivacy = async () => {
    try {
      const { error } = await supabase.from('profiles').update({ privacy_settings: privacySettings }).eq('id', profile?.id)
      if (error) throw error
      toast.success('Privacy settings saved!')
    } catch (error: any) { toast.error(error.message || 'Failed to save settings') }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.')
    if (!confirmed) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profile?.id)
      if (error) throw error
      await signOut()
      toast.success('Account deleted')
      navigate('/')
    } catch (error: any) { toast.error(error.message || 'Failed to delete account') }
    finally { setIsDeleting(false) }
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'billing', label: 'Billing' },
    { id: 'danger', label: 'Danger Zone' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-dark-700 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>{tab.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Profile Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"><p className="text-xs text-gray-500 uppercase">Name</p><p className="font-medium text-gray-900 dark:text-gray-100">{profile?.full_name || 'Not set'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"><p className="text-xs text-gray-500 uppercase">Username</p><p className="font-medium text-gray-900 dark:text-gray-100">@{profile?.username}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"><p className="text-xs text-gray-500 uppercase">Membership</p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile?.is_premium ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-200 text-gray-700 dark:bg-dark-600 dark:text-gray-400'}`}>{profile?.is_premium ? 'Premium' : 'Free'}</span></div>
                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"><p className="text-xs text-gray-500 uppercase">Role</p><p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{profile?.role || 'User'}</p></div>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Change Password</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose a strong password with at least 8 characters.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <input type="password" value={newPassword} onChange={function(e) { setNewPassword(e.target.value) }} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500" placeholder="Enter new password" required minLength={8} />
              </div>

              {newPassword.length > 0 && (
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(function(level) {
                      return <div key={level} className={`h-1.5 flex-1 rounded-full ${level <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200 dark:bg-dark-600'}`} />
                    })}
                  </div>
                  <p className={`text-xs ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>{strengthLabels[passwordStrength - 1] || ''}</p>
                  <ul className="mt-2 text-xs space-y-1">
                    <li className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}><span>{newPassword.length >= 8 ? '✓' : '○'}</span> At least 8 characters</li>
                    <li className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}><span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span> One uppercase letter</li>
                    <li className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}><span>{/[a-z]/.test(newPassword) ? '✓' : '○'}</span> One lowercase letter</li>
                    <li className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}><span>{/[0-9]/.test(newPassword) ? '✓' : '○'}</span> One number</li>
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={function(e) { setConfirmPassword(e.target.value) }} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500" placeholder="Confirm new password" required minLength={8} />
              </div>

              <Button type="submit" isLoading={isChangingPassword}>Update Password</Button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'push', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                  { key: 'in_app', label: 'In-App Notifications', desc: 'See notifications within the app' },
                  { key: 'marketing', label: 'Marketing Emails', desc: 'Receive tips, offers, and updates' },
                ].map(function(item) {
                  return (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div><p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p><p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p></div>
                      <button type="button" onClick={function() { setNotifPrefs({ ...notifPrefs, [item.key]: !notifPrefs[item.key as keyof typeof notifPrefs] }) }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${notifPrefs[item.key as keyof typeof notifPrefs] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-500'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifPrefs[item.key as keyof typeof notifPrefs] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <Button onClick={handleSaveNotifications}>Save Preferences</Button>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Privacy Settings</h3>
              <div className="space-y-3">
                {[
                  { key: 'show_email', label: 'Show Email', desc: 'Display your email on your public profile' },
                  { key: 'show_phone', label: 'Show Phone', desc: 'Display your phone number on your public profile' },
                  { key: 'show_location', label: 'Show Location', desc: 'Display your location on your public profile' },
                ].map(function(item) {
                  return (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div><p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p><p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p></div>
                      <button type="button" onClick={function() { setPrivacySettings({ ...privacySettings, [item.key]: !privacySettings[item.key as keyof typeof privacySettings] }) }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${privacySettings[item.key as keyof typeof privacySettings] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-500'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings[item.key as keyof typeof privacySettings] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <Button onClick={handleSavePrivacy}>Save Privacy Settings</Button>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Appearance</h3>
              <div className="p-6 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Theme</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose your preferred theme or follow your device settings.</p>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={function() { setTheme('light') }} className={`p-4 rounded-xl border-2 text-center transition-all ${theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}>
                    <svg className="w-8 h-8 mx-auto mb-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                    <p className={`text-sm font-medium ${theme === 'light' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>Light</p>
                  </button>
                  <button onClick={function() { setTheme('dark') }} className={`p-4 rounded-xl border-2 text-center transition-all ${theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}>
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>Dark</p>
                  </button>
                  <button onClick={function() { setTheme('system') }} className={`p-4 rounded-xl border-2 text-center transition-all ${theme === 'system' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}>
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <p className={`text-sm font-medium ${theme === 'system' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>System</p>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                  {theme === 'system' ? `Following device settings (currently ${resolvedTheme} mode)` : `Using ${theme} mode`}
                </p>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Billing & Subscription</h3>
              {profile?.is_premium ? (
                <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-800">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Premium Plan</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">₦1,000/month</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 mb-4">You have full access to all premium features.</p>
                  <div className="flex gap-3"><Button onClick={function() { navigate('/pricing') }} variant="outline">Manage Plan</Button><Button variant="danger">Cancel Subscription</Button></div>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 dark:bg-dark-700 rounded-xl">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Free Plan</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">Upgrade to Premium for ₦1,000/month and unlock all features.</p>
                  <Button onClick={function() { navigate('/pricing') }}>Upgrade to Premium</Button>
                </div>
              )}
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
              <div className="p-6 border-2 border-red-200 dark:border-red-900/50 rounded-xl bg-red-50/50 dark:bg-red-900/10">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Account</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Once you delete your account, there is no going back. All your data will be permanently deleted.</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1 list-disc list-inside">
                  <li>All your forum posts and comments will be deleted</li>
                  <li>Your vendor listing (if any) will be removed</li>
                  <li>All your messages and conversations will be erased</li>
                  <li>Your subscription will be cancelled immediately</li>
                  <li>This action cannot be undone</li>
                </ul>
                <Button variant="danger" onClick={handleDeleteAccount} isLoading={isDeleting}>Delete My Account Permanently</Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}