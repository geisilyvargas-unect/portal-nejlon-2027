import 'server-only';
import { createClient } from '@supabase/supabase-js';
/** Nunca importar em um Client Component. Service role ignora RLS. */
export function adminClient() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!secret || !url) throw new Error('Variáveis de ambiente do Supabase não configuradas.');
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}
