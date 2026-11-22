import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/auth';
export default async function Home() {
  const viewer=await getViewer();
  redirect(viewer ? (viewer.must_change_password?'/alterar-senha':'/painel') : '/demonstracao');
}
