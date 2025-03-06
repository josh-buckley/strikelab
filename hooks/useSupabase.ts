import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';

export function useSupabase() {
  const auth = useAuth();
  return { supabase, auth };
} 