import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Check if we have valid environment variables
const isConfigured = supabaseUrl.startsWith('https://') && 
                    !supabaseUrl.includes('placeholder') && 
                    !supabaseAnonKey.includes('placeholder')

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Admin client for server-side operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin = isConfigured && !supabaseServiceRoleKey.includes('placeholder')
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null
