
import { createClient } from '@supabase/supabase-js';

// Função auxiliar para acesso seguro ao ambiente Vite
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    return (import.meta && import.meta.env && import.meta.env[key]) || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const url = supabaseUrl && supabaseUrl.length > 0 ? supabaseUrl : 'https://placeholder.supabase.co';
const key = supabaseAnonKey && supabaseAnonKey.length > 0 ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url, key);
