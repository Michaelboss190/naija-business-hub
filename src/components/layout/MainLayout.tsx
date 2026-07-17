import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import EmailConfirmBanner from '@/components/ui/EmailConfirmBanner'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-dark-900">
      <EmailConfirmBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}