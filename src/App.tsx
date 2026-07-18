import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/config/supabase'
import ScrollToTop from '@/components/ui/ScrollToTop'
import NotificationListener from '@/components/ui/NotificationListener'

// Layouts
import MainLayout from '@/components/layout/MainLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import ConfirmEmailPage from '@/pages/auth/ConfirmEmailPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ProfilePage from '@/pages/dashboard/ProfilePage'
import SettingsPage from '@/pages/dashboard/SettingsPage'
import ForumPage from '@/pages/forum/ForumPage'
import ForumTopicPage from '@/pages/forum/ForumTopicPage'
import ForumPostPage from '@/pages/forum/ForumPostPage'
import ResourcesPage from '@/pages/resources/ResourcesPage'
import ResourcePage from '@/pages/resources/ResourcePage'
import CreateResourcePage from '@/pages/resources/CreateResourcePage'
import MasterclassesPage from '@/pages/resources/MasterclassesPage'
import MasterclassPage from '@/pages/resources/MasterclassPage'
import CreateMasterclassPage from '@/pages/resources/CreateMasterclassPage'
import TemplatesPage from '@/pages/resources/TemplatesPage'
import CreateTemplatePage from '@/pages/resources/CreateTemplatePage'
import VendorsPage from '@/pages/vendors/VendorsPage'
import VendorPage from '@/pages/vendors/VendorPage'
import RegisterVendorPage from '@/pages/vendors/RegisterVendorPage'
import SuppliersPage from '@/pages/vendors/SuppliersPage'
import RegisterSupplierPage from '@/pages/vendors/RegisterSupplierPage'
import EventsPage from '@/pages/events/EventsPage'
import EventPage from '@/pages/events/EventPage'
import CreateEventPage from '@/pages/events/CreateEventPage'
import MessagesPage from '@/pages/messages/MessagesPage'
import NotificationsPage from '@/pages/dashboard/NotificationsPage'
import ExpertQAPage from '@/pages/expert/ExpertQAPage'
import BlogPage from '@/pages/blog/BlogPage'
import BlogPostPage from '@/pages/blog/BlogPostPage'
import CreateBlogPost from '@/pages/blog/CreateBlogPost'
import PricingPage from '@/pages/PricingPage'
import AboutPage from '@/pages/AboutPage'
import ContactPage from '@/pages/ContactPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminContent from '@/pages/admin/AdminContent'
import AdminPayments from '@/pages/admin/AdminPayments'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AuthProvider({ children }: { children: React.ReactNode }) {
  const loadProfile = useAuthStore(state => state.loadProfile)

  useEffect(() => {
    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile()
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <NotificationListener />
          <Routes>
            {/* Public routes with MainLayout */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/confirm-email" element={<ConfirmEmailPage />} />

              {/* Forum - static before dynamic */}
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/forum/new" element={<ForumTopicPage />} />
              <Route path="/forum/category/:categorySlug" element={<ForumPage />} />
              <Route path="/forum/post/:postSlug" element={<ForumPostPage />} />

              {/* Resources - static before dynamic */}
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/new" element={<CreateResourcePage />} />
              <Route path="/resources/:slug" element={<ResourcePage />} />

              {/* Masterclasses - static before dynamic */}
              <Route path="/masterclasses" element={<MasterclassesPage />} />
              <Route path="/masterclasses/new" element={<CreateMasterclassPage />} />
              <Route path="/masterclasses/:slug" element={<MasterclassPage />} />

              {/* Templates */}
              <Route path="/templates" element={<TemplatesPage />} />`n              <Route path="/templates/new" element={<CreateTemplatePage />} />

              {/* Vendors - static before dynamic */}
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/vendors/register" element={<RegisterVendorPage />} />
              <Route path="/vendors/:slug" element={<VendorPage />} />

              {/* Suppliers - static before dynamic */}
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/suppliers/register" element={<RegisterSupplierPage />} />

              {/* Expert Q&A */}
              <Route path="/expert-qa" element={<ExpertQAPage />} />

              {/* Events - static before dynamic */}
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/new" element={<CreateEventPage />} />
              <Route path="/events/:slug" element={<EventPage />} />

              {/* Blog - static before dynamic */}
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/new" element={<CreateBlogPost />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
            </Route>

            {/* Dashboard routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
            </Route>
            <Route path="/profile" element={<DashboardLayout />}>
              <Route index element={<ProfilePage />} />
              <Route path=":username" element={<ProfilePage />} />
            </Route>
            <Route path="/settings" element={<DashboardLayout />}>
              <Route index element={<SettingsPage />} />
            </Route>
            <Route path="/notifications" element={<DashboardLayout />}>
              <Route index element={<NotificationsPage />} />
            </Route>
            <Route path="/messages" element={<DashboardLayout />}>
              <Route index element={<MessagesPage />} />
              <Route path=":conversationId" element={<MessagesPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="payments" element={<AdminPayments />} />
            </Route>

            {/* 404 - Catch all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />
    </QueryClientProvider>
  )
}