import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Untyped client — all hooks use explicit casts (as Student[], as Payment[], etc.)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
