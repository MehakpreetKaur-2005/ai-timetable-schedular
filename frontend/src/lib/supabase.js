import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

// Only create the client if valid credentials are provided
if (
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'enter_supbase_url' &&
  supabaseAnonKey !== 'enter_supabase_anon_key'
) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err.message)
  }
} else {
  console.warn(
    'Supabase credentials not configured. Auth features will be unavailable. ' +
    'Update .env with valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export { supabase }
