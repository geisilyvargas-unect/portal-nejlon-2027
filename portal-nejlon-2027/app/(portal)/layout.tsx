import { redirect } from 'next/navigation';
import { requireViewer } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { SideNav } from '@/components/side-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from '@/app/actions';
export default async function PortalLayout({children}:{children:React.ReactNode}) {
  const viewer=await requireViewer();
  if(viewer.must_change_password) redirect('/alterar-senha');
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">NEJ<span>LON</span><small>JUNTOS PELA EXCELÊNCIA</small></div>
      <SideNav role={viewer.role}/><div className="sidebar-theme"><ThemeToggle/></div>
      <div className="profile-box"><strong>{viewer.full_name}</strong><div className="muted">{ROLES[viewer.role]}</div><div className="small">{viewer.email}</div></div>
      <form action={signOut}><button type="submit" className="outline" style={{width:'100%'}}>Sair da conta</button></form>
    </aside>
    <div style={{flex:1,minWidth:0}}>
      <div className="mobile-header"><strong>NEJLON <span style={{color:'var(--red)'}}>2027</span></strong><ThemeToggle/><form action={signOut}><button type="submit" className="outline">Sair</button></form></div>
      <div className="mobile-nav-wrap"><SideNav role={viewer.role} mobile/></div>
      <main className="main">{children}</main>
    </div>
  </div>;
}
