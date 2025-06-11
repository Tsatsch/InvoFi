import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// DEBUGGING: Log environment variables (remove in production)
console.log('[DEBUG] Supabase URL:', supabaseUrl);
console.log('[DEBUG] Supabase Anon Key:', supabaseAnonKey ? 'Loaded' : 'MISSING OR EMPTY');

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

const options = {
  // db: {
  //   schema: 'public',
  // },
  // auth: {
  //   autoRefreshToken: true,
  //   persistSession: true,
  //   detectSessionInUrl: true,
  // },
  global: { 
    headers: {
    'Access-Control-Allow-Origin': '*', //:TODO REMOVE
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  }
  }
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options); 

// TODO https://supabase.com/docs/reference/javascript/installing 
// инициализация с Options