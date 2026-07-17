import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log for debugging (remove in production)
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'MISSING')
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables!\n' +
    'Please create a .env file in your project root with:\n' +
    'VITE_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key-here\n\n' +
    'Get these from your Supabase dashboard: Settings > API'
  )
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)