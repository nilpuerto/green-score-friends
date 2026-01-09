import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: mostrar todas las variables de entorno que empiezan con VITE_
if (import.meta.env.DEV) {
  console.log('Environment variables:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
    allViteVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `
Missing Supabase environment variables!

Expected:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Please:
1. Create a .env file in the root directory (where package.json is)
2. Add the variables:
   VITE_SUPABASE_URL=https://iayyhkyxgugsusawxpox.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_zbSb2XZNVl9P5nTBCAHXZw_4G9MvzQ9
3. Restart the dev server (Ctrl+C and run 'npm run dev' again)
  `.trim();
  
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'OK' : 'MISSING',
    key: supabaseAnonKey ? 'OK' : 'MISSING',
    env: import.meta.env,
  });
  
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

