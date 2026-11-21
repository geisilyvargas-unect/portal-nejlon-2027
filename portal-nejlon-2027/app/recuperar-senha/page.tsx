'use client';
import {useState} from 'react';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/browser';
export default function Recover(){
 const [email,setEmail]=useState(''); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true); const {error}=await createClient().auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/callback?next=/alterar-senha`}); setMessage(error?error.message:'Se houver uma caixa de e-mail funcional para esta conta, ela receberá instruções. Caso contrário, peça à PRESCON a emissão de uma nova senha temporária.');setBusy(false);}
 return <div className="login-wrap"><div className="login-card"><div className="eyebrow">Recuperação de acesso</div><h1>Redefinir senha</h1><p className="muted">O envio depende da configuração de e-mail do seu domínio.</p><form onSubmit={submit} className="fieldset"><label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><button disabled={busy} className="primary">Enviar instruções</button>{message&&<p role="status" className="notice">{message}</p>}</form><p><Link className="link" href="/login">Voltar ao login</Link></p></div></div>;
}
