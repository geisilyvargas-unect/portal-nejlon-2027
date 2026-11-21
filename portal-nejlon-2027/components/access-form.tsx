'use client';
import {useActionState,useState} from 'react';
import {changeMyPassword,createPortalUser,updatePortalUser,type AccessResult} from '@/app/actions';
import {ROLES,type Role,type Ej,type Profile} from '@/lib/constants';
import {ResetAccess} from '@/components/portal-reset';
const initial:AccessResult={ok:false,message:''};
export function PasswordForm(){
 const [state,action,pending]=useActionState(changeMyPassword,initial);
 return <form action={action} className="fieldset"><label>Nova senha (pelo menos 12 caracteres)<input type="password" name="password" minLength={12} autoComplete="new-password" required/></label><label>Confirme a senha<input type="password" name="confirmation" minLength={12} autoComplete="new-password" required/></label><button type="submit" disabled={pending} className="primary">{pending?'Alterando…':'Salvar nova senha'}</button>{state.message&&<div className={state.ok?'notice':'error'}>{state.message}</div>}{state.ok&&<a href="/painel" className="button lime">Acessar o portal</a>}</form>;
}
export function AccessCreate({ejs,enabled=true}:{ejs:Ej[];enabled?:boolean}){
 const [state,action,pending]=useActionState(createPortalUser,initial);
 const [role,setRole]=useState<Role>('counselor');
 const [ejId,setEjId]=useState('');
 const [password,setPassword]=useState('123456');
 const ej=ejs.find(item=>item.id===ejId);
 const email=role==='prescon'?'prescon@nejlondrina.com'
   :role==='nucleus_direx'?'direx@nejlondrina.com'
   :ej?(role==='counselor'?'conselho':'direx')+ej.slug+'@nejlondrina.com':null;
 return <form action={action} className="fieldset">
  <div className="form-grid">
   <label>Perfil de acesso
    <select name="role" value={role} onChange={event=>{setRole(event.target.value as Role);setEjId('');}} disabled={!enabled}>
     <option value="counselor">Conselho da EJ (pode deliberar)</option>
     <option value="ej_direx">DIREX da EJ (não vota)</option>
     <option value="nucleus_direx">DIREX do Núcleo</option>
     <option value="prescon">PRESCON (administrador)</option>
    </select>
   </label>
   <label>EJ vinculada
    <select name="ej_id" value={ejId} onChange={event=>setEjId(event.target.value)} disabled={!enabled||role==='prescon'||role==='nucleus_direx'} required={role==='counselor'||role==='ej_direx'}>
     <option value="">Selecione uma empresa júnior</option>
     {ejs.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
   </label>
  </div>
  <div className="access-email-preview" aria-live="polite">
   <span className="muted small">E-mail institucional que será cadastrado:</span>
   <strong>{email||'Selecione a EJ para gerar o e-mail'}</strong>
   <p className="muted small" style={{margin:0}}>Esse e-mail será um usuário independente no Supabase, com as permissões do perfil escolhido.</p>
  </div>
  <div className="form-grid">
   <label>Nome (opcional)
    <input name="full_name" maxLength={150} placeholder="Em branco: nome da EJ e do perfil" disabled={!enabled}/>
   </label>
   <label>Senha inicial
    <input name="password" type="password" autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} minLength={6} maxLength={72} required disabled={!enabled}/>
   </label>
  </div>
  <label>Telefone (opcional)<input name="phone" maxLength={40} placeholder="43 99999-9999" disabled={!enabled}/></label>
  <p className="muted small">Para os acessos demonstrativos das EJs, a senha padrão está preenchida como <strong>123456</strong>. Ela só será válida para contas realmente criadas. Para uma conta PRESCON, escolha uma senha exclusiva e forte.</p>
  <button className="primary" disabled={!enabled||pending||!email||password.length<6} type="submit">{pending?'Criando acesso…':'Criar acesso no Supabase'}</button>
  {state.message&&<div className={state.ok?'notice':'error'} role="status">
   {state.message}
   {state.ok&&<p style={{margin:'10px 0 0'}}>O usuário já pode entrar com o e-mail e a senha cadastrados, desde que a política de senhas do Supabase permita essa senha.</p>}
  </div>}
 </form>;
}

export function AccessEdit({user,ejs}:{user:Profile;ejs:Ej[]}){
 const [state,action,pending]=useActionState(updatePortalUser,initial);
 return <details><summary>{user.full_name} — {user.email} <span className={`badge ${user.active?'lime':'red'}`}>{user.active?'Ativo':'Inativo'}</span></summary><form action={action} className="fieldset" style={{marginTop:16}}><input type="hidden" name="id" value={user.id}/><div className="form-grid"><label>Nome<input name="full_name" defaultValue={user.full_name} required/></label><label>Perfil<select name="role" defaultValue={user.role}>{Object.entries(ROLES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>EJ<select name="ej_id" defaultValue={user.ej_id||''}><option value="">Nenhuma</option>{ejs.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label><label>Telefone<input name="phone" defaultValue={user.phone||''}/></label></div><label className="inline-check"><input type="checkbox" name="active" defaultChecked={user.active}/> Acesso ativo</label><button disabled={pending} className="primary">Salvar mudanças</button>{state.message&&<p className={state.ok?'notice':'error'}>{state.message}</p>}</form><div style={{marginTop:14}}><ResetAccess id={user.id}/></div></details>;
}
