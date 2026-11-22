'use client';
import {useState} from 'react';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/browser';
import {AccessGuide} from '@/components/access-guide';
import {ThemeToggle} from '@/components/theme-toggle';

export default function Login(){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function enter(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError('');
    try{
      const normalized=username.trim().toLowerCase();
      const loginEmail=normalized.includes('@')?normalized:normalized+'@nejlondrina.com';
      if(!/^[a-z0-9][a-z0-9._-]*@nejlondrina\.com$/.test(loginEmail)){
        throw new Error('Use seu nome de usuário institucional, como conselhounect ou direxunect.');
      }
      const {error}=await createClient().auth.signInWithPassword({email:loginEmail,password});
      if(error)throw error;
      window.location.assign('/');
    }catch(e){
      const original=e instanceof Error?e.message:'Não foi possível entrar.';
      setError(/invalid login credentials/i.test(original)
        ?'Usuário ou senha incorretos, ou conta ainda não cadastrada. As contas das EJs estão em preparação; para conhecer o portal, use a demonstração sem login.'
        :original);
      setBusy(false);
    }
  }

  return <main className="landing">
    <div className="login-wrap login-top">
      <div className="login-card">
        <div className="login-theme"><ThemeToggle/></div><div className="eyebrow">Pé Vermelho • 2027</div>
        <h1 style={{fontSize:'2.8rem',marginTop:12}}>NEJ<span style={{color:'var(--red)'}}>LON</span></h1>
        <p className="muted">Portal de Governança<br/>Juntos pela excelência.</p>
        <div className="demo-entry-link">
          <strong>Vai conhecer o portal para avaliar a proposta?</strong>
          <p className="muted small">Veja todas as visões sem criar conta, usando dados fictícios.</p>
          <Link href="/demonstracao" className="button demo-entry-button">Explorar demonstração sem senha</Link>
        </div>
        <div className="login-demo-note" role="note">
          <strong>Ambiente em configuração · acessos de demonstração</strong>
          <p>Senha padrão planejada para as contas demonstrativas: <code>123456</code>.</p>
          <p>A senha <code>123456</code> funcionará apenas depois que cada conta de EJ for ativada. A PRESCON usa sua própria senha. Para conhecer o portal agora, abra a demonstração sem login.</p>
        </div>
        <div className="access-pdf-link">
          <a className="button outline" href="/acessos-demonstracao.pdf" target="_blank" rel="noopener noreferrer">
            Abrir PDF com a relação de e-mails e senhas de teste
          </a>
          <p className="muted small">Os acessos das EJs listados no PDF ainda não foram ativados no Supabase.</p>
        </div>
        <form onSubmit={enter} className="fieldset">
          <label>Usuário institucional<input type="text" autoCapitalize="none" autoCorrect="off" autoComplete="username" spellCheck={false} placeholder="Ex.: conselhounect ou direxunect" required value={username} onChange={e=>setUsername(e.target.value)} maxLength={100}/></label>
          <p className="muted small" style={{margin:'-7px 0 0'}}>Pode digitar só o usuário (sem @nejlondrina.com) ou o e-mail completo. Para PRESCON, use <code>presconteste</code> e sua senha atual.</p>
          <label>Senha<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
          {error&&<div className="error" role="alert">{error}</div>}
          <button className="primary" disabled={busy} type="submit">{busy?'Entrando…':'Entrar no portal'}</button>
        </form>
        <p className="small" style={{marginTop:18}}><Link className="link" href="/recuperar-senha">Esqueci minha senha</Link></p>
        <p className="muted small">No acesso real, a visão é definida pelas permissões do usuário no Supabase, mesmo quando você entra só com o nome de usuário.</p>
      </div>
    </div>
    <div className="landing-access-guide"><AccessGuide/></div>
  </main>;
}
