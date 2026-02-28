import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

console.log('[v0] Supabase URL:', supabaseUrl ? 'SET' : 'NOT SET')
console.log('[v0] Supabase Key:', supabaseAnonKey ? 'SET' : 'NOT SET')
console.log('[v0] Supabase configured:', isSupabaseConfigured)

if (!isSupabaseConfigured) {
  console.warn('[v0] Supabase credentials not found. Using mock data fallback.')
}
