'use client';
import {useState} from 'react';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/browser';
import {AccessGuide} from '@/components/access-guide';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function enter(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError('');
    try{
      const {error}=await createClient().auth.signInWithPassword({
        email:email.trim().toLowerCase(),password
      });
      if(error)throw error;
      window.location.assign('/');
    }catch(e){
      setError(e instanceof Error?e.message:'Não foi possível entrar.');
      setBusy(false);
    }
  }

  return <main className="landing">
    <div className="login-wrap login-top">
      <div className="login-card">
        <div className="eyebrow">Pé Vermelho • 2027</div>
        <h1 style={{fontSize:'2.8rem',marginTop:12}}>NEJ<span style={{color:'var(--red)'}}>LON</span></h1>
        <p className="muted">Portal de Governança<br/>Juntos pela excelência.</p>
        <div className="login-demo-note" role="note">
          <strong>Ambiente em configuração · acessos de demonstração</strong>
          <p>Senha padrão planejada para as contas demonstrativas: <code>123456</code>.</p>
          <p>Essa senha funcionará apenas nos e-mails que forem cadastrados com ela. As contas da PRESCON já existentes continuam usando a senha configurada no Supabase. Para recuperar uma senha, use <strong>Esqueci minha senha</strong>.</p>
        </div>
        <div className="access-pdf-link">
          <a className="button outline" href="/acessos-demonstracao.pdf" target="_blank" rel="noopener noreferrer">
            Abrir PDF com a relação de e-mails e senhas de teste
          </a>
          <p className="muted small">Os acessos das EJs listados no PDF ainda não foram ativados no Supabase.</p>
        </div>
        <p className="login-pdf-link"><a href="/guia-acessos.pdf" target="_blank" rel="noopener noreferrer" className="button outline">Abrir PDF com todos os 59 e-mails de teste e a senha prevista</a></p>
        <form onSubmit={enter} className="fieldset">
          <label>E-mail institucional<input type="email" autoComplete="username" placeholder="seuacesso@nejlondrina.com" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
          <label>Senha<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
          {error&&<div className="error" role="alert">{error}</div>}
          <button className="primary" disabled={busy} type="submit">{busy?'Entrando…':'Entrar no portal'}</button>
        </form>
        <p className="small" style={{marginTop:18}}><Link className="link" href="/recuperar-senha">Esqueci minha senha</Link></p>
        <p className="muted small">Não é possível escolher a visão ao entrar: o sistema identifica a EJ e o perfil pelo e-mail autenticado.</p>
      </div>
    </div>
    <div className="landing-access-guide"><AccessGuide/></div>
  </main>;
}
