export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  headline: string | null
  location: string | null
  website: string | null
  phone: string | null
  role: UserRole
  skills: string[]
  business_name: string | null
  business_type: string | null
  social_links: Record<string, string>
  badges: Badge[]
  achievements: Achievement[]
  notification_preferences: NotificationPreferences
  privacy_settings: PrivacySettings
  theme_preference: 'light' | 'dark'
  is_premium: boolean
  created_at: string
  updated_at: string
}

export type UserRole = 'free' | 'premium' | 'moderator' | 'admin' | 'super_admin'

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earned_at: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  points: number
  earned_at: string
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  in_app: boolean
  marketing: boolean
}

export interface PrivacySettings {
  show_email: boolean
  show_phone: boolean
  show_location: boolean
  profile_visibility: 'public' | 'private' | 'connections'
}

export interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  post_count?: number
}

export interface ForumPost {
  id: string
  category_id: string
  author_id: string
  title: string
  slug: string
  content: string
  tags: string[]
  status: 'published' | 'draft' | 'archived' | 'flagged'
  is_pinned: boolean
  is_premium: boolean
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  author?: Profile
  category?: ForumCategory
  is_liked?: boolean
  is_bookmarked?: boolean
}

export interface ForumComment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  is_answer: boolean
  like_count: number
  created_at: string
  updated_at: string
  author?: Profile
  replies?: ForumComment[]
  is_liked?: boolean
}

export interface Resource {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  type: 'article' | 'video' | 'audio' | 'pdf' | 'template'
  category_id: string | null
  author_id: string | null
  file_url: string | null
  thumbnail_url: string | null
  is_premium: boolean
  is_downloadable: boolean
  download_count: number
  view_count: number
  tags: string[]
  status: string
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  owner_id: string
  business_name: string
  slug: string
  description: string | null
  category: string
  subcategory: string | null
  location: string
  address: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  website: string | null
  logo_url: string | null
  cover_image_url: string | null
  is_verified: boolean
  is_premium: boolean
  rating: number
  review_count: number
  status: string
}

export interface Supplier {
  id: string
  owner_id: string
  company_name: string
  slug: string
  description: string | null
  industry: string
  location: string
  address: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  website: string | null
  logo_url: string | null
  is_verified: boolean
  minimum_order: string | null
  delivery_options: string[]
  rating: number
  review_count: number
  status: string
}

export interface Masterclass {
  id: string
  title: string
  slug: string
  description: string | null
  instructor_id: string | null
  thumbnail_url: string | null
  category: string
  duration_minutes: number | null
  total_lessons: number
  is_premium: boolean
  is_live: boolean
  live_start_at: string | null
  enrollment_count: number
  rating: number
  status: string
  instructor?: Profile
  progress?: number
}

export interface Lesson {
  id: string
  masterclass_id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  order_index: number
  is_preview: boolean
  completed?: boolean
}

export interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  organizer_id: string | null
  thumbnail_url: string | null
  event_type: 'online' | 'in-person' | 'hybrid'
  location: string | null
  meeting_link: string | null
  start_at: string
  end_at: string
  max_attendees: number | null
  current_attendees: number
  is_premium: boolean
  is_free: boolean
  price: number | null
  status: string
  organizer?: Profile
  is_registered?: boolean
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string | null
  message_type: 'text' | 'image' | 'file' | 'system'
  file_url: string | null
  file_name: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  sender?: Profile
}

export interface Conversation {
  id: string
  participant1_id: string
  participant2_id: string
  last_message_at: string | null
  participant1?: Profile
  participant2?: Profile
  last_message?: Message
  unread_count?: number
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  data: Record<string, any>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: string
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  amount: number
  currency: string
  payment_provider: string
  payment_reference: string | null
  starts_at: string | null
  ends_at: string | null
  auto_renew: boolean
  cancelled_at: string | null
  created_at: string
}

export interface Payment {
  id: string
  subscription_id: string | null
  user_id: string
  amount: number
  currency: string
  provider: string
  provider_reference: string | null
  status: string
  metadata: Record<string, any>
  paid_at: string | null
  created_at: string
}

export interface Template {
  id: string
  title: string
  slug: string
  description: string | null
  category: string
  file_url: string
  thumbnail_url: string | null
  file_type: string
  file_size: number | null
  is_premium: boolean
  download_count: number
  status: string
}

export interface ExpertQuestion {
  id: string
  author_id: string
  title: string
  slug: string
  content: string
  category: string
  tags: string[]
  is_answered: boolean
  answer_count: number
  view_count: number
  status: string
  author?: Profile
  answers?: ExpertAnswer[]
}

export interface ExpertAnswer {
  id: string
  question_id: string
  expert_id: string
  content: string
  is_best_answer: boolean
  like_count: number
  created_at: string
  expert?: Profile
}

export interface BusinessOpportunity {
  id: string
  author_id: string
  title: string
  slug: string
  description: string
  category: string
  opportunity_type: 'job' | 'partnership' | 'investment' | 'contract'
  location: string | null
  budget_range: string | null
  deadline: string | null
  is_premium: boolean
  status: string
}

export interface BlogPost {
  id: string
  author_id: string | null
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image_url: string | null
  category: string
  tags: string[]
  is_premium: boolean
  view_count: number
  status: string
  published_at: string
  author?: Profile
}