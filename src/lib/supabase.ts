import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage for flexible configuration
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('fisgai_supabase_url');
  const localKey = localStorage.getItem('fisgai_supabase_anon_key');

  const url = localUrl || (envUrl && envUrl !== 'https://your-project.supabase.co' ? envUrl : '');
  const key = localKey || (envKey && envKey !== 'your-anon-key' ? envKey : '');

  return { url: url.trim(), key: key.trim() };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('fisgai_supabase_url', url.trim());
  localStorage.setItem('fisgai_supabase_anon_key', key.trim());
  _supabaseClient = null; // Reset cached client
};

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http'));
};

let _supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (_supabaseClient) return _supabaseClient;

  const { url, key } = getSupabaseConfig();
  if (url && key && url.startsWith('http')) {
    try {
      _supabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return _supabaseClient;
    } catch (e) {
      console.error('Erro ao inicializar Supabase:', e);
      return null;
    }
  }

  return null;
};
