import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Profile, Role } from '@/lib/constants';
export async function getViewer(): Promise<Profile | null> {
  const supabase = await createClient();
  // getUser consulta servidor de Auth: não confia no JSON da sessão.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase.from('profiles')
    .select('id,email,full_name,role,ej_id,active,phone,must_change_password')
    .eq('id', user.id).maybeSingle();
  if (!profile || !profile.active) return null;
  return profile as Profile;
}
export async function requireViewer(): Promise<Profile> {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  return viewer;
}
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const viewer = await requireViewer();
  if (!allowed.includes(viewer.role)) redirect('/');
  return viewer;
}
