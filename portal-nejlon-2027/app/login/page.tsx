'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
export default function Login() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function enter(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy(true);setError('');
    try { const {error}=await createClient().auth.signInWithPassword({email:email.trim().toLowerCase(),password}); if(error)throw error; window.location.assign('/'); }
    catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar.'); setBusy(false);}
  }
  return <div className="login-wrap"><div className="login-card">
    <div className="eyebrow">Pé Vermelho • 2027</div><h1 style={{fontSize:'2.8rem',marginTop:12}}>NEJ<span style={{color:'var(--red)'}}>LON</span></h1>
    <p className="muted">Portal de Governança<br/>Juntos pela excelência.</p><hr/>
    <form onSubmit={enter} className="fieldset">
      <label>E-mail institucional<input type="email" autoComplete="username" placeholder="seuacesso@nejlondrina.com" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Senha<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="primary" disabled={busy} type="submit">{busy?'Entrando…':'Entrar no portal'}</button>
    </form><p className="small" style={{marginTop:20}}><Link className="link" href="/recuperar-senha">Esqueci minha senha</Link></p>
    <p className="muted small" style={{marginBottom:0}}>O perfil é identificado automaticamente pelo seu acesso. Não existe seleção manual de permissões.</p>
  </div></div>;
}
